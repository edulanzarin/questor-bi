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
  data: string;
  contraparte: string | null;
  vlrcontabil: number;
  vlripi: number;
  vlrfunrural: number;
  vlrconticms: number;
  vlricms: number;
}

/** Contribuição de uma nota (pelo motor) ao movimento fiscal de uma conta. */
export interface FiscalDetalheNota {
  chave: number;
  numero: number | null;
  data: string;
  contraparte: string | null;
  origem: "ME" | "MS";
  valor: number;
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
  porNota: Map<number, FiscalDetalheNota>;
  regradas: Set<number>;
}

const LADO = {
  ent: { tabela: "lctofisent", chave: "chavelctofisent", cfopTab: "lctofisentcfop", prod: "lctofisentproduto", funrural: "coalesce(f.valorfunrural,0)" },
  sai: { tabela: "lctofissai", chave: "chavelctofissai", cfopTab: "lctofissaicfop", prod: "lctofissaiproduto", funrural: "0" },
} as const;

/**
 * Monta o dicionário de valores da nota que o `avaliarRegra` consome. As chaves
 * são os tokens das fórmulas do Questor. Tokens ausentes fazem a fórmula não ser
 * avaliada (o componente é pulado) — é assim que os itens de fase 2 se auto-excluem.
 */
function valoresDaNota(n: NotaRow): ValoresNota {
  return {
    vlrContabil: n.vlrcontabil,
    vlrContICMS: n.vlrconticms || n.vlrcontabil, // sem ICMS destacado, é o contábil cheio
    vlrICMS: n.vlricms,
    vlrIPI: n.vlripi,
    vlrFunRural: n.vlrfunrural,
  } as ValoresNota;
}

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
  detalhe?: DetalheFiscal
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
              f.numeronf numero, to_char(f.datalctofis,'YYYY-MM-DD') data, p.nomepessoa contraparte,
              coalesce(f.valorcontabil,0)::float vlrcontabil,
              coalesce(f.valoripi,0)::float vlripi,
              ${c.funrural}::float vlrfunrural,
              coalesce((select sum(x.valorcontabilimposto) from ${c.cfopTab} x
                         where x.codigoempresa=f.codigoempresa and x.${c.chave}=f.${c.chave} and x.tipoimposto=1),0)::float vlrconticms,
              coalesce((select sum(x.valorimposto) from ${c.cfopTab} x
                         where x.codigoempresa=f.codigoempresa and x.${c.chave}=f.${c.chave} and x.tipoimposto=1),0)::float vlricms
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
    const valores = valoresDaNota(n);
    const cfops = cfopsPorNota.get(n.chave) ?? [];
    for (const cf of cfops) {
      const p = porChave.get(`${n.estab}:${cf}`);
      if (!p || !p.contabiliza) continue;
      for (const comp of p.componentes) {
        for (const linha of comp.linhas) {
          const valor = avaliarRegra(linha.regraValor, valores);
          if (valor == null) {
            pulados += 1; // token de fase 2 (serviço/retenção) — não sei o valor ainda
            continue;
          }
          if (Math.abs(valor) < 0.005) continue;
          const conta = linha.contaVariavel ? CONTA_CONTRAPARTIDA : linha.conta;
          if (conta == null) continue;
          // Conta que não é lançada nota a nota (vai na apuração mensal): não é ME.
          if (observadas && conta !== CONTA_CONTRAPARTIDA && !observadas.has(`${linha.natureza}:${conta}`)) {
            continue;
          }
          add(conta, linha.natureza, valor);
          // Drill-down do Fiscal: registra a contribuição desta nota à conta alvo.
          if (
            detalhe &&
            conta !== CONTA_CONTRAPARTIDA &&
            linha.natureza === detalhe.natureza &&
            detalhe.contas.has(conta)
          ) {
            detalhe.regradas.add(conta);
            const ex = detalhe.porNota.get(n.chave);
            if (ex) ex.valor += valor;
            else
              detalhe.porNota.set(n.chave, {
                chave: n.chave,
                numero: n.numero,
                data: n.data,
                contraparte: n.contraparte,
                origem: tipo === "ent" ? "ME" : "MS",
                valor,
              });
          }
        }
      }
    }
  }

  return { porConta, notas: notas.length, pulados };
}
