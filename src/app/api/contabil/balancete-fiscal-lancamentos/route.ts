import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { balanceteFiscal, type DetalheFiscal } from "@/lib/balancete-fiscal";
import { contasDoAlvo } from "@/lib/plano-contabil";
import type { BalanceteLancamento, BalanceteLancamentosResp } from "@/lib/types";

/**
 * Drill-down do lado FISCAL do balancete — o que compõe o valor ESPERADO (pelas
 * regras) de uma conta. Diferente do lado real, aqui não há lançamento pronto:
 * a lista mistura, somando exatamente a célula fiscal,
 * - `regra`: as notas que o motor usou, com o valor hipotético de cada uma;
 * - `espelho`: o movimento real que o balancete espelha (consolidação MOV,
 *   apuração IM, retenção RE, ou nota em conta sem regra) — igual ao real.
 *
 * A composição é a MESMA da rota do balancete: para a conta que o motor movimenta
 * (regrada), a nota entra pelo motor e o real de nota é ignorado; todo o resto do
 * real é espelhado.
 */
export const GET = apiRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const f = parseFilters(sp);
  if (f.empresas.length !== 1) throw new FilterError("Selecione uma empresa");
  const empresa = f.empresas[0];
  const classif = (sp.get("classif") ?? "").trim();
  if (!classif) throw new FilterError("classif é obrigatório");
  const natureza = sp.get("natureza") === "-1" ? -1 : 1;
  const natCol = natureza === 1 ? "contactbdeb" : "contactbcred";
  const conta = Number(sp.get("conta") ?? 0);
  const sintetica = sp.get("sintetica") === "1";

  const client = await pool.connect();
  try {
    const contas = await contasDoAlvo(client, empresa, classif, sintetica, conta);
    if (!contas.length) {
      return { lancamentos: [], total: 0 } satisfies BalanceteLancamentosResp;
    }
    const contasSet = new Set(contas);
    const p3 = [empresa, f.inicio, f.fim, contas] as const;

    // Contas (na natureza alvo) que RECEBEM lançamento por nota (ME/MS) — calibra
    // o motor: componente cuja conta não aparece aqui vai na apuração, não na nota.
    const notaContas = (
      await client.query<{ conta: number }>(
        `select ${natCol} conta from lctoctb
          where codigoempresa=$1 and codigooriglctoctb='FI' and datalctoctb between $2 and $3
            and ${natCol} = any($4::bigint[]) and chaveorigem ~ '^M[ES][0-9]+$'
          group by ${natCol}`,
        [...p3]
      )
    ).rows;
    const observadas = new Set(notaContas.map((r) => `${natureza}:${r.conta}`));

    // Lançamentos REAIS (itemizados) da conta, para o espelho e a origem.
    const realRows = (
      await client.query<BalanceteLancamento>(
        `with lc as (
           select to_char(l.datalctoctb,'YYYY-MM-DD') data,
                  case when l.chaveorigem like 'MOV%' then 'MOV'
                       else substring(l.chaveorigem from 1 for 2) end origem,
                  case when l.chaveorigem ~ '^M[ES][0-9]+$'
                       then substring(l.chaveorigem from 3)::bigint end chave,
                  l.valorlctoctb::float valor, l.complhist hist, l.${natCol} conta
             from lctoctb l
            where l.codigoempresa=$1 and l.codigooriglctoctb='FI'
              and l.datalctoctb between $2 and $3 and l.${natCol} = any($4::bigint[])
         )
         select lc.data, lc.origem, lc.chave, lc.valor, lc.conta,
                coalesce(nullif(lc.hist,''), '') historico,
                coalesce(e.numeronf, s.numeronf) numero,
                coalesce(pe.nomepessoa, ps.nomepessoa) contraparte
           from lc
           left join lctofisent e on lc.origem='ME' and e.codigoempresa=$1 and e.chavelctofisent=lc.chave
           left join lctofissai s on lc.origem='MS' and s.codigoempresa=$1 and s.chavelctofissai=lc.chave
           left join pessoa pe on pe.codigopessoa=e.codigopessoa
           left join pessoa ps on ps.codigopessoa=s.codigopessoa
          order by lc.valor desc
          limit 2000`,
        [...p3]
      )
    ).rows;

    // Lado ESPERADO: o motor "replaya" cada nota; coleta a contribuição por nota.
    const detEnt: DetalheFiscal = { contas: contasSet, natureza, porNota: new Map(), regradas: new Set() };
    const detSai: DetalheFiscal = { contas: contasSet, natureza, porNota: new Map(), regradas: new Set() };
    await balanceteFiscal(client, empresa, f.inicio, f.fim, "ent", undefined, observadas, detEnt);
    await balanceteFiscal(client, empresa, f.inicio, f.fim, "sai", undefined, observadas, detSai);
    const regradas = new Set<number>([...detEnt.regradas, ...detSai.regradas]);

    const regra: BalanceteLancamento[] = [...detEnt.porNota.values(), ...detSai.porNota.values()].map(
      (n) => ({
        tipo: "regra",
        data: n.data,
        origem: n.origem,
        chave: n.chave,
        conta: 0,
        valor: n.valor,
        historico: "",
        numero: n.numero,
        contraparte: n.contraparte,
      })
    );

    // Espelho: real que o balancete NÃO substitui pelo motor — nota em conta
    // regrada é coberta pelo motor (não espelha); o resto (MOV/IM/RE, e nota em
    // conta sem regra) espelha.
    const ehNota = (o: string) => o === "ME" || o === "MS";
    const espelho: BalanceteLancamento[] = realRows
      .filter((r) => !(ehNota(r.origem) && regradas.has(r.conta)))
      .map((r) => ({ ...r, tipo: "espelho" as const }));

    const todos = [...regra, ...espelho].sort((a, b) => b.valor - a.valor);

    // Teto de linhas na resposta — o esperado por nota pode render muitas linhas
    // (uma por nota); acima disso a lista (e a soma) fica parcial, sinalizada por
    // `total > lancamentos.length`.
    return {
      lancamentos: todos.slice(0, 2000),
      total: todos.length,
    } satisfies BalanceteLancamentosResp;
  } finally {
    client.release();
  }
});
