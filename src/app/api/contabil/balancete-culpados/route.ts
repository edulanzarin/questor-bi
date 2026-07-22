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
    // `produzidas` acumula "origem:chave" de nota reproduzida em qualquer conta.
    const contasSet = new Set(contas);
    const produzidas = new Set<string>();
    const mk = (): DetalheFiscal => ({
      contas: contasSet,
      natureza: 1,
      net: true,
      porNota: new Map(),
      regradas: new Set(),
    });
    const detEnt = mk();
    const detSai = mk();
    await balanceteFiscal(client, empresa, f.inicio, f.fim, "ent", undefined, observadas, detEnt, produzidas);
    await balanceteFiscal(client, empresa, f.inicio, f.fim, "sai", undefined, observadas, detSai, produzidas);

    // Só as contas que o motor de fato REGRA entram na comparação: conta sem
    // regra espelha o real (fiscal = real), então não tem diferença — incluí-la
    // (numa sintética, p.ex.) contaria o real dela como falsa diferença.
    const regradas = [...new Set<number>([...detEnt.regradas, ...detSai.regradas])];

    // REAL (líquido, por nota) — débito − crédito lançado nas contas REGRADAS.
    const realRows = !regradas.length
      ? []
      : (
          await client.query<{ origem: string; chave: number; conta: number; numero: number | null; especie: string | null; contraparte: string | null; net: number }>(
            `with r as (
               select substring(l.chaveorigem for 2) origem,
                      substring(l.chaveorigem from 3)::bigint chave,
                      case when l.contactbdeb = any($4::bigint[]) then l.contactbdeb else l.contactbcred end conta,
                      (case when l.contactbdeb = any($4::bigint[]) then coalesce(l.valorlctoctb,0) else 0 end
                     - case when l.contactbcred = any($4::bigint[]) then coalesce(l.valorlctoctb,0) else 0 end)::float net
                 from lctoctb l
                where l.codigoempresa=$1 and l.codigooriglctoctb='FI' and l.datalctoctb between $2 and $3
                  and l.chaveorigem ~ '^M[ES][0-9]+$'
                  and (l.contactbdeb = any($4::bigint[]) or l.contactbcred = any($4::bigint[]))
             )
             select r.origem, r.chave, r.conta, sum(r.net)::float net,
                    coalesce(e.numeronf, s.numeronf) numero,
                    upper(btrim(coalesce(e.especienf, s.especienf))) especie,
                    coalesce(pe.nomepessoa, ps.nomepessoa) contraparte
               from r
               left join lctofisent e on r.origem='ME' and e.codigoempresa=$1 and e.chavelctofisent=r.chave
               left join lctofissai s on r.origem='MS' and s.codigoempresa=$1 and s.chavelctofissai=r.chave
               left join pessoa pe on pe.codigopessoa=e.codigopessoa
               left join pessoa ps on ps.codigopessoa=s.codigopessoa
              group by r.origem, r.chave, r.conta, e.numeronf, s.numeronf, e.especienf, s.especienf, pe.nomepessoa, ps.nomepessoa`,
            [empresa, f.inicio, f.fim, regradas]
          )
        ).rows;

    // Junta esperado × real por (origem, chave). `contaReal` = conta analítica onde
    // a nota mais bate no real; `contaEsp` = onde o motor a esperou. Uma delas
    // representa a nota no detalhe (útil ao abrir uma sintética).
    type Ac = {
      origem: string;
      chave: number;
      numero: number | null;
      especie: string | null;
      contraparte: string | null;
      esperado: number;
      real: number;
      contaReal: number | null;
      contaRealAbs: number;
      contaEsp: number | null;
    };
    const mapa = new Map<string, Ac>();
    const pega = (
      origem: string,
      chave: number,
      numero: number | null,
      especie: string | null,
      contraparte: string | null
    ) => {
      const k = `${origem}:${chave}`;
      let a = mapa.get(k);
      if (!a) {
        a = { origem, chave, numero, especie, contraparte, esperado: 0, real: 0, contaReal: null, contaRealAbs: 0, contaEsp: null };
        mapa.set(k, a);
      }
      if (a.numero == null && numero != null) a.numero = numero;
      if (!a.especie && especie) a.especie = especie;
      if (!a.contraparte && contraparte) a.contraparte = contraparte;
      return a;
    };
    for (const det of [detEnt, detSai]) {
      for (const n of det.porNota.values()) {
        const a = pega(n.origem, n.chave, n.numero, n.especie, n.contraparte);
        a.esperado += n.valor;
        if (a.contaEsp == null) a.contaEsp = n.conta;
      }
    }
    for (const r of realRows) {
      const a = pega(r.origem, r.chave, r.numero, r.especie, r.contraparte);
      a.real += r.net;
      if (Math.abs(r.net) > a.contaRealAbs) {
        a.contaRealAbs = Math.abs(r.net);
        a.contaReal = r.conta;
      }
    }

    const culpados: BalanceteCulpado[] = [];
    for (const a of mapa.values()) {
      const diferenca = a.esperado - a.real;
      if (Math.abs(diferenca) <= TOL) continue;
      const temEsp = Math.abs(a.esperado) > TOL;
      const temReal = Math.abs(a.real) > TOL;
      // esp=0 aqui: se o motor reproduziu a nota em ALGUMA conta, é conta errada
      // (foi lançada aqui, mas o plano manda outra); senão, sem plano reproduzível.
      const tipo = temEsp
        ? temReal
          ? "valor"
          : "faltando"
        : produzidas.has(`${a.origem}:${a.chave}`)
          ? "conta_errada"
          : "extra";
      culpados.push({
        chave: a.chave,
        origem: a.origem,
        numero: a.numero,
        especie: a.especie,
        conta: a.contaReal ?? a.contaEsp,
        contraparte: a.contraparte,
        esperado: a.esperado,
        real: a.real,
        diferenca,
        tipo,
      });
    }
    // Primeiro as diferenças de verdade (valor/faltando/conta errada), depois as
    // "sem regra" (NFSE/serviço que o motor não reproduz — provável não-erro).
    const prio = (t: string) => (t === "extra" ? 2 : t === "valor" ? 0 : 1);
    culpados.sort(
      (x, y) => prio(x.tipo) - prio(y.tipo) || Math.abs(y.diferenca) - Math.abs(x.diferenca)
    );

    return {
      culpados: culpados.slice(0, 500),
      total: culpados.length,
    } satisfies BalanceteCulpadosResp;
  } finally {
    client.release();
  }
});
