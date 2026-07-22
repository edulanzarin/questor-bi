import { PoolClient } from "pg";
import { planoQuestor } from "./plano-contabil";
import { aplicarOverrides, listarOverrides } from "./plano-override";
import { aprenderContabilizacao, buscarAutoContabiliza } from "./aprender-contabilizacao";
import { avaliarRegra, type ValoresNota } from "./divergencias";

/**
 * Balancete FISCAL (hipotético): a movimentação de débito/crédito que as notas
 * DEVERIAM gerar segundo as regras de contabilização — independente de onde o
 * contábil de fato lançou. Serve para comparar com a movimentação real do
 * contábil e achar valor que foi parar na conta errada.
 *
 * Não é saldo: é MOVIMENTO do período (o saldo é consequência). Para cada nota,
 * "replaya" o plano de contabilização (mesmo motor da Conferência) avaliando as
 * fórmulas com os valores da nota, e soma por conta.
 *
 * Versão atual = PARTIDA PRINCIPAL: cobre os componentes cujos valores são
 * sourceáveis com segurança (valor contábil e ICMS/IPI/Funrural). Componentes
 * de serviço/retenção (ISS, PIS/COFINS, retenções, duplicatas) usam tokens de
 * outras tabelas e ficam para a fase 2 — são contados em `pulados` para a tela
 * mostrar a cobertura. Contas variáveis (fornecedor/cliente) caem num balde
 * único de contrapartida, já que o sub-razão de cada pessoa não é reproduzível.
 */

/** Conta virtual da contrapartida variável (fornecedor no débito, cliente no crédito). */
export const CONTA_CONTRAPARTIDA = -1;

export interface MovConta {
  debito: number;
  credito: number;
}

export interface BalanceteFiscalMov {
  /** Movimento hipotético por conta contábil (contactb). */
  porConta: Map<number, MovConta>;
  notas: number;
  /** Componentes do plano pulados por não ter como avaliar a fórmula (fase 2). */
  pulados: number;
}

interface NotaRow {
  chave: number;
  estab: number;
  numero: number | null;
  especie: string;
  data: string;
  contraparte: string | null;
  vlrcontabil: number;
  vlripi: number;
  vlrfunrural: number;
}

/** Contribuição de uma nota (pelo motor) ao movimento fiscal de uma conta. */
export interface FiscalDetalheNota {
  chave: number;
  numero: number | null;
  especie: string;
  data: string;
  contraparte: string | null;
  origem: "ME" | "MS";
  valor: number;
  /** Conta alvo onde o motor esperou a maior parte do valor (para o detalhe da diferença). */
  conta: number | null;
}

/**
 * Coletor do drill-down do lado Fiscal: quando presente, o motor registra, por
 * nota, quanto gerou nas `contas` alvo na `natureza` alvo — é a lista de notas
 * por trás do valor hipotético. `regradas` marca as contas que o motor de fato
 * movimentou (o chamador usa para decidir o que espelhar do real).
 */
export interface DetalheFiscal {
  contas: Set<number>;
  natureza: 1 | -1;
  /**
   * Modo LÍQUIDO (auditoria de diferença): coleta débito − crédito por nota nas
   * `contas`, ignorando `natureza`. Sem isto, coleta só a `natureza` pedida (o
   * drill-down de uma célula débito ou crédito).
   */
  net?: boolean;
  porNota: Map<number, FiscalDetalheNota>;
  regradas: Set<number>;
}

const LADO = {
  ent: { tabela: "lctofisent", chave: "chavelctofisent", cfopTab: "lctofisentcfop", prod: "lctofisentproduto", funrural: "coalesce(f.valorfunrural,0)" },
  sai: { tabela: "lctofissai", chave: "chavelctofissai", cfopTab: "lctofissaicfop", prod: "lctofissaiproduto", funrural: "0" },
} as const;

export async function balanceteFiscal(
  client: PoolClient,
  empresa: number,
  inicio: string,
  fim: string,
  tipo: "ent" | "sai",
  /** Restringe a estas chaves (para validar reprodução só nas notas contabilizadas). */
  chavesFiltro?: number[],
  /**
   * Contas que de fato recebem lançamento nota a nota no ME ("natureza:conta").
   * Componente do plano cuja conta não está aqui NÃO é lançada por nota — vai na
   * apuração mensal (IM). Sem este filtro o motor super-gera imposto no ME.
   * A contrapartida variável (fornecedor/cliente) é sempre aceita.
   */
  observadas?: Set<string>,
  /** Coletor do drill-down do lado Fiscal (opcional) — ver DetalheFiscal. */
  detalhe?: DetalheFiscal,
  /**
   * Se presente, registra "origem:chave" de toda nota que o motor produziu em
   * ALGUMA conta fixa (não a contrapartida). Serve para distinguir, no detalhe da
   * diferença, "conta errada" (a nota foi reproduzida em outra conta) de "sem
   * plano" (o motor não reproduz de jeito nenhum).
   *
   * Além disso registra "origem:chave:natureza" quando o motor DE FATO somou em
   * conta fixa (pós-gate). O chamador usa para o espelho por NOTA: o real de uma
   * nota reproduzida não é espelhado — a versão do motor a substitui — e é isso
   * que faz conta errada aparecer no balancete (a conta certa fica com a nota a
   * mais, a errada com a nota a menos), sem dobrar o valor.
   */
  produzidas?: Set<string>,
  /**
   * Chaves ("ME:chave"/"MS:chave") das notas que TÊM lançamento nota a nota no
   * real. Para elas o componente PRINCIPAL (valor contábil) fura o gate
   * `observadas`: a despesa/receita de uma nota lançada por nota existe em
   * algum lugar do contábil — se a conta do plano nunca é usada, é porque foi
   * pra conta errada, e o motor precisa produzir a conta certa pra diferença
   * aparecer. Nota consolidada (MOV) ou pendente fica de fora (o espelho cuida).
   */
  lancadas?: Set<string>
): Promise<BalanceteFiscalMov> {
  const c = LADO[tipo];

  // Notas do período, com os valores que alimentam as fórmulas.
  const params: unknown[] = [empresa, inicio, fim];
  let filtroChaves = "";
  if (chavesFiltro) {
    params.push(chavesFiltro);
    filtroChaves = `and f.${c.chave} = any($${params.length}::bigint[])`;
  }
  const notas = (
    await client.query<NotaRow>(
      `select f.${c.chave} chave, f.codigoestab estab,
              f.numeronf numero, upper(btrim(f.especienf)) especie,
              to_char(f.datalctofis,'YYYY-MM-DD') data, p.nomepessoa contraparte,
              coalesce(f.valorcontabil,0)::float vlrcontabil,
              coalesce(f.valoripi,0)::float vlripi,
              ${c.funrural}::float vlrfunrural
         from ${c.tabela} f
         left join pessoa p on p.codigopessoa = f.codigopessoa
        where f.codigoempresa=$1 and f.datalctofis between $2 and $3 and f.cancelada <> '1' ${filtroChaves}`,
      params
    )
  ).rows;
  if (!notas.length) return { porConta: new Map(), notas: 0, pulados: 0 };

  const chaves = notas.map((n) => n.chave);

  // CFOPs de cada nota.
  const cfopsRes = await client.query<{ chave: number; cfop: number }>(
    `select distinct ${c.chave} chave, codigocfop cfop from ${c.prod}
      where codigoempresa=$1 and datalctofis between $2 and $3 and ${c.chave}=any($4::bigint[])`,
    [empresa, inicio, fim, chaves]
  );
  const cfopsPorNota = new Map<number, number[]>();
  const todosCfops = new Set<number>();
  for (const r of cfopsRes.rows) {
    todosCfops.add(r.cfop);
    const l = cfopsPorNota.get(r.chave);
    if (l) l.push(r.cfop);
    else cfopsPorNota.set(r.chave, [r.cfop]);
  }

  // Valores POR CFOP — uma nota se reparte por CFOP no `lctofis*cfop` (cada CFOP
  // com a sua parcela do valor contábil), então usar o total da nota em cada CFOP
  // dobra/tripa o esperado em nota multi-CFOP. `valorcontabilimposto` do ICMS
  // (tipoimposto 1) é a parcela contábil de cada CFOP; some ao total da nota.
  // Nulo quando o CFOP não tem ICMS destacado — aí cai no total (nota de 1 CFOP).
  const valoresCfop = new Map<string, { cont: number | null; icms: number; ipi: number }>();
  const vcRes = await client.query<{ chave: number; cfop: number; cont: number | null; icms: number; ipi: number }>(
    `select ${c.chave} chave, codigocfop cfop,
            sum(valorcontabilimposto) filter (where tipoimposto=1)::float cont,
            coalesce(sum(valorimposto) filter (where tipoimposto=1),0)::float icms,
            coalesce(sum(valorimposto) filter (where tipoimposto=2),0)::float ipi
       from ${c.cfopTab}
      where codigoempresa=$1 and datalctofis between $2 and $3 and ${c.chave}=any($4::bigint[])
      group by ${c.chave}, codigocfop`,
    [empresa, inicio, fim, chaves]
  );
  for (const r of vcRes.rows) valoresCfop.set(`${r.chave}:${r.cfop}`, { cont: r.cont, icms: r.icms, ipi: r.ipi });

  // (chave:cfop) que têm ICMS-ST na nota (valorsubtribut no produto — no cfopTab
  // só existe ICMS/IPI). O componente de ST do plano só deve gerar lançamento
  // quando a nota TEM ST; sem isto o motor dispara a ST pelo flag `apurasubtribut`
  // do CFOP mesmo sem ST na nota e, como a tabela de ST costuma ser cópia da de
  // mercadoria (mesma conta, mesmo vlrContICMS), DOBRA o valor contábil.
  const temSt = new Set<string>();
  const stRes = await client.query<{ chave: number; cfop: number }>(
    `select ${c.chave} chave, codigocfop cfop from ${c.prod}
      where codigoempresa=$1 and datalctofis between $2 and $3 and ${c.chave}=any($4::bigint[])
      group by ${c.chave}, codigocfop having coalesce(sum(valorsubtribut),0) > 0.005`,
    [empresa, inicio, fim, chaves]
  );
  for (const r of stRes.rows) temSt.add(`${r.chave}:${r.cfop}`);

  // Plano de contabilização (Questor + override + aprendido), igual à Conferência.
  const [planoBruto, overrides] = await Promise.all([
    planoQuestor(client, empresa, { cfops: [...todosCfops] }),
    listarOverrides(empresa),
  ]);
  const plano = aplicarOverrides(planoBruto, overrides);
  let auto = await buscarAutoContabiliza(empresa);
  if (auto.size === 0) {
    await aprenderContabilizacao(client, empresa);
    auto = await buscarAutoContabiliza(empresa);
  }
  const porChave = new Map<string, (typeof plano)[number]>();
  for (const p of plano) {
    if (p.origem !== "override") {
      const a = auto.get(`${p.estab}:${p.cfop}`);
      if (a) p.contabiliza = a.contabiliza;
    }
    porChave.set(`${p.estab}:${p.cfop}`, p);
  }

  const porConta = new Map<number, MovConta>();
  let pulados = 0;
  const add = (conta: number, natureza: 1 | -1, valor: number) => {
    let m = porConta.get(conta);
    if (!m) {
      m = { debito: 0, credito: 0 };
      porConta.set(conta, m);
    }
    if (natureza === 1) m.debito += valor;
    else m.credito += valor;
  };

  for (const n of notas) {
    const cfops = cfopsPorNota.get(n.chave) ?? [];
    const umCfop = cfops.length === 1;
    for (const cf of cfops) {
      const p = porChave.get(`${n.estab}:${cf}`);
      if (!p || !p.contabiliza) continue;
      // Valores da PARCELA deste CFOP (não o total da nota — senão dobra em multi-CFOP).
      const vc = valoresCfop.get(`${n.chave}:${cf}`);
      const cont = vc?.cont ?? (umCfop ? n.vlrcontabil : 0);
      const valores = {
        vlrContabil: cont,
        vlrContICMS: cont,
        // vlrContISS (líquido de ISS) só faz sentido em SERVIÇO (só NFSE tem ISS).
        // Gateado por espécie: uma NFE de mercadoria pode ter CFOP cujo componente
        // usa vlrContISS e, sem o gate, o motor gera despesa de serviço pra ela.
        ...(n.especie === "NFSE" ? { vlrContISS: cont } : {}),
        vlrICMS: vc?.icms ?? 0,
        vlrIPI: vc?.ipi ?? (umCfop ? n.vlripi : 0),
        vlrFunRural: umCfop ? n.vlrfunrural : 0,
      } as ValoresNota;
      for (const comp of p.componentes) {
        // ST só gera lançamento se a nota realmente tem ST — senão dobra a mercadoria.
        if (comp.id === "st" && !temSt.has(`${n.chave}:${cf}`)) continue;
        for (const linha of comp.linhas) {
          const valor = avaliarRegra(linha.regraValor, valores);
          if (valor == null) {
            pulados += 1; // token de fase 2 (serviço/retenção) — não sei o valor ainda
            continue;
          }
          if (Math.abs(valor) < 0.005) continue;
          const conta = linha.contaVariavel ? CONTA_CONTRAPARTIDA : linha.conta;
          if (conta == null) continue;
          const origem = tipo === "ent" ? "ME" : "MS";
          // Registra ANTES do gate `observadas`: a nota tem plano que gera esta
          // conta fixa, mesmo que essa conta não receba lançamento por nota (aí o
          // motor não a soma, mas ela É reproduzível — é o que separa conta errada
          // de sem-plano no detalhe da diferença).
          if (produzidas && conta !== CONTA_CONTRAPARTIDA) {
            produzidas.add(`${origem}:${n.chave}`);
          }
          // Conta que não é lançada nota a nota (vai na apuração mensal): não é ME.
          // Exceção: o componente PRINCIPAL de nota lançada por nota fura o gate —
          // a despesa/receita dela existe no contábil; se a conta do plano nunca é
          // usada, foi pra conta errada, e produzir a certa expõe a diferença.
          if (observadas && conta !== CONTA_CONTRAPARTIDA && !observadas.has(`${linha.natureza}:${conta}`)) {
            const notaLancada = lancadas?.has(`${origem}:${n.chave}`) ?? false;
            if (!(comp.id === "vlrcontabil" && notaLancada)) continue;
            // Bypass disparou: a nota foi lançada, mas a conta do plano nunca
            // recebe nota — o lançamento real dela (nesta natureza) está em conta
            // errada e sai do espelho (a versão do motor o substitui). SÓ no
            // bypass: quando o principal cai em conta observada, a comparação por
            // conta já cuida, e excluir aqui varreria componentes irmãos que o
            // motor não reproduz (PIS/COFINS a recuperar etc.) → fantasma.
            if (produzidas) {
              produzidas.add(`${origem}:${n.chave}:${linha.natureza}`);
            }
          }
          add(conta, linha.natureza, valor);
          // Drill-down do Fiscal: registra a contribuição desta nota à conta alvo.
          if (
            detalhe &&
            conta !== CONTA_CONTRAPARTIDA &&
            detalhe.contas.has(conta) &&
            (detalhe.net || linha.natureza === detalhe.natureza)
          ) {
            detalhe.regradas.add(conta);
            // No modo líquido, débito soma e crédito subtrai; senão o valor cru.
            const v = detalhe.net && linha.natureza === -1 ? -valor : valor;
            const ex = detalhe.porNota.get(n.chave);
            if (ex) ex.valor += v;
            else
              detalhe.porNota.set(n.chave, {
                chave: n.chave,
                numero: n.numero,
                especie: n.especie,
                data: n.data,
                contraparte: n.contraparte,
                origem: tipo === "ent" ? "ME" : "MS",
                valor: v,
                conta,
              });
          }
        }
      }
    }
  }

  return { porConta, notas: notas.length, pulados };
}
