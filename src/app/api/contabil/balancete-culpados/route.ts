import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { balanceteFiscal, type DetalheFiscal } from "@/lib/balancete-fiscal";
import { contasDoAlvo } from "@/lib/plano-contabil";
import type { BalanceteCulpado, BalanceteCulpadosResp } from "@/lib/types";

/** Centavos de tolerância — rateio/arredondamento não é diferença de verdade. */
const TOL = 0.5;

/**
 * Notas por trás da diferença de uma conta no balancete (aba Diferenças): por
 * nota, o líquido (débito − crédito) que o motor ESPERAVA na conta × o que o
 * contábil de fato lançou. Quem tem `esperado ≠ real` puxa a diferença; a soma
 * das diferenças fecha com a coluna Diferença da conta.
 *
 * Só faz sentido em conta com regra (o motor movimenta) — que é justamente onde
 * pode haver diferença: conta sem regra espelha o real e nunca diverge.
 */
export const GET = apiRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const f = parseFilters(sp);
  if (f.empresas.length !== 1) throw new FilterError("Selecione uma empresa");
  const empresa = f.empresas[0];
  const classif = (sp.get("classif") ?? "").trim();
  if (!classif) throw new FilterError("classif é obrigatório");
  const conta = Number(sp.get("conta") ?? 0);
  const sintetica = sp.get("sintetica") === "1";

  const client = await pool.connect();
  try {
    const contas = await contasDoAlvo(client, empresa, classif, sintetica, conta);
    if (!contas.length) return { culpados: [], total: 0 } satisfies BalanceteCulpadosResp;
    const p = [empresa, f.inicio, f.fim, contas] as const;

    // Contas (por natureza) que recebem lançamento por nota — calibra o motor.
    const obsRows = await client.query<{ conta: number; nat: number }>(
      `select contactbdeb conta, 1 nat from lctoctb
         where codigoempresa=$1 and codigooriglctoctb='FI' and datalctoctb between $2 and $3
           and contactbdeb = any($4::bigint[]) and chaveorigem ~ '^M[ES][0-9]+$'
        group by contactbdeb
       union
       select contactbcred, -1 from lctoctb
         where codigoempresa=$1 and codigooriglctoctb='FI' and datalctoctb between $2 and $3
           and contactbcred = any($4::bigint[]) and chaveorigem ~ '^M[ES][0-9]+$'
        group by contactbcred`,
      [...p]
    );
    const observadas = new Set(obsRows.rows.map((r) => `${r.nat}:${r.conta}`));

    // ESPERADO (líquido, por nota) — o motor replaya cada nota nas contas alvo.
    const contasSet = new Set(contas);
    const mk = (): DetalheFiscal => ({
      contas: contasSet,
      natureza: 1,
      net: true,
      porNota: new Map(),
      regradas: new Set(),
    });
    const detEnt = mk();
    const detSai = mk();
    await balanceteFiscal(client, empresa, f.inicio, f.fim, "ent", undefined, observadas, detEnt);
    await balanceteFiscal(client, empresa, f.inicio, f.fim, "sai", undefined, observadas, detSai);

    // REAL (líquido, por nota) — débito − crédito lançado nas contas alvo pelas notas.
    const realRows = (
      await client.query<{ origem: string; chave: number; numero: number | null; contraparte: string | null; net: number }>(
        `with r as (
           select substring(l.chaveorigem for 2) origem,
                  substring(l.chaveorigem from 3)::bigint chave,
                  (case when l.contactbdeb = any($4::bigint[]) then coalesce(l.valorlctoctb,0) else 0 end
                 - case when l.contactbcred = any($4::bigint[]) then coalesce(l.valorlctoctb,0) else 0 end)::float net
             from lctoctb l
            where l.codigoempresa=$1 and l.codigooriglctoctb='FI' and l.datalctoctb between $2 and $3
              and l.chaveorigem ~ '^M[ES][0-9]+$'
              and (l.contactbdeb = any($4::bigint[]) or l.contactbcred = any($4::bigint[]))
         )
         select r.origem, r.chave, sum(r.net)::float net,
                coalesce(e.numeronf, s.numeronf) numero,
                coalesce(pe.nomepessoa, ps.nomepessoa) contraparte
           from r
           left join lctofisent e on r.origem='ME' and e.codigoempresa=$1 and e.chavelctofisent=r.chave
           left join lctofissai s on r.origem='MS' and s.codigoempresa=$1 and s.chavelctofissai=r.chave
           left join pessoa pe on pe.codigopessoa=e.codigopessoa
           left join pessoa ps on ps.codigopessoa=s.codigopessoa
          group by r.origem, r.chave, e.numeronf, s.numeronf, pe.nomepessoa, ps.nomepessoa`,
        [...p]
      )
    ).rows;

    // Junta esperado × real por (origem, chave).
    type Ac = { origem: string; chave: number; numero: number | null; contraparte: string | null; esperado: number; real: number };
    const mapa = new Map<string, Ac>();
    const pega = (origem: string, chave: number, numero: number | null, contraparte: string | null) => {
      const k = `${origem}:${chave}`;
      let a = mapa.get(k);
      if (!a) {
        a = { origem, chave, numero, contraparte, esperado: 0, real: 0 };
        mapa.set(k, a);
      }
      if (a.numero == null && numero != null) a.numero = numero;
      if (!a.contraparte && contraparte) a.contraparte = contraparte;
      return a;
    };
    for (const det of [detEnt, detSai]) {
      for (const n of det.porNota.values()) pega(n.origem, n.chave, n.numero, n.contraparte).esperado += n.valor;
    }
    for (const r of realRows) pega(r.origem, r.chave, r.numero, r.contraparte).real += r.net;

    const culpados: BalanceteCulpado[] = [];
    for (const a of mapa.values()) {
      const diferenca = a.esperado - a.real;
      if (Math.abs(diferenca) <= TOL) continue;
      const temEsp = Math.abs(a.esperado) > TOL;
      const temReal = Math.abs(a.real) > TOL;
      culpados.push({
        chave: a.chave,
        origem: a.origem,
        numero: a.numero,
        contraparte: a.contraparte,
        esperado: a.esperado,
        real: a.real,
        diferenca,
        tipo: temEsp && temReal ? "valor" : temEsp ? "faltando" : "extra",
      });
    }
    culpados.sort((x, y) => Math.abs(y.diferenca) - Math.abs(x.diferenca));

    return {
      culpados: culpados.slice(0, 500),
      total: culpados.length,
    } satisfies BalanceteCulpadosResp;
  } finally {
    client.release();
  }
});
