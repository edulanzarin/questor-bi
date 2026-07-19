import { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import type { ConfLado, ConfNotaPendente, ConferenciaResp } from "@/lib/types";

const LIMITE = 500;

interface LadoCfg {
  tabela: string;
  chave: string;
  itens: string;
  prefix: "ME" | "MS";
}
const ENT: LadoCfg = { tabela: "lctofisent", chave: "chavelctofisent", itens: "lctofisentproduto", prefix: "ME" };
const SAI: LadoCfg = { tabela: "lctofissai", chave: "chavelctofissai", itens: "lctofissaiproduto", prefix: "MS" };

/**
 * Monta o CTE de reconciliação nota↔contábil para um lado.
 * Vínculo: lctoctb origem FI, chaveorigem = 'ME'/'MS' + lpad(chave,10). Uma nota
 * "deve contabilizar" (esperada) se tem CFOP contabilizável (≥1 nota daquele CFOP
 * foi lançada no período) ou é nota de serviço sem item; senão é remessa/retorno.
 */
function cte(c: LadoCfg): string {
  return `
    with ctb as (
      select distinct substring(chaveorigem from 3)::bigint chave
        from lctoctb
       where codigoempresa = $1 and datalctoctb between $2 and $3
         and codigooriglctoctb = 'FI' and chaveorigem like '${c.prefix}%'
    ),
    hdr as (
      select s.${c.chave} chave, s.numeronf, s.serienf, upper(btrim(s.especienf)) especie,
             s.datalctofis, s.valorcontabil, (s.cancelada = '1') cancelada, s.codigopessoa,
             (ctb.chave is not null) contab
        from ${c.tabela} s
        left join ctb on ctb.chave = s.${c.chave}
       where s.codigoempresa = $1 and s.datalctofis between $2 and $3
    ),
    nc as (
      select ${c.chave} chave, codigocfop cfop from ${c.itens}
       where codigoempresa = $1 and datalctofis between $2 and $3 group by 1, 2
    ),
    cfok as (select distinct nc.cfop from nc join hdr h on h.chave = nc.chave where h.contab),
    agg as (
      select h.chave,
             string_agg(distinct nc.cfop::text, ', ' order by nc.cfop::text) cfops,
             bool_or(nc.cfop in (select cfop from cfok)) tem_ok,
             bool_and(nc.cfop is null) sem_item
        from hdr h left join nc on nc.chave = h.chave group by h.chave
    ),
    nota as (
      select h.*, a.cfops,
             (coalesce(a.tem_ok, false) or coalesce(a.sem_item, true)) esperada
        from hdr h join agg a on a.chave = h.chave
    )`;
}

async function conferir(client: PoolClient, c: LadoCfg, params: unknown[]): Promise<ConfLado> {
  const base = cte(c);
  const [resumoRes, notasRes] = await Promise.all([
    client.query(
      `${base}
       select count(*)::int total,
              count(*) filter (where contab)::int contabilizadas,
              count(*) filter (where esperada and not contab and not cancelada)::int pendentes,
              count(*) filter (where not esperada and not contab and not cancelada)::int ignoradas,
              count(*) filter (where cancelada)::int canceladas,
              coalesce(sum(valorcontabil) filter (where esperada and not contab and not cancelada), 0)::float valor_pendente
         from nota`,
      params
    ),
    client.query(
      `${base}
       select n.chave::text chave, n.numeronf numero, n.serienf serie, n.especie,
              n.datalctofis data, n.valorcontabil valor, n.cfops,
              p.nomepessoa contraparte, p.inscrfederal doc, p.siglaestado uf
         from nota n
         left join pessoa p on p.codigopessoa = n.codigopessoa
        where n.esperada and not n.contab and not n.cancelada
        order by n.valorcontabil desc
        limit ${LIMITE}`,
      params
    ),
  ]);

  const r = resumoRes.rows[0];
  const notas = notasRes.rows as ConfNotaPendente[];
  return {
    total: r.total,
    contabilizadas: r.contabilizadas,
    pendentes: r.pendentes,
    ignoradas: r.ignoradas,
    canceladas: r.canceladas,
    valorPendente: r.valor_pendente,
    notas,
    truncado: r.pendentes > notas.length,
  };
}

/** Conferência Fiscal: notas fiscais pendentes de contabilização (1 empresa, período ≤ 1 ano). */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  if (filters.empresas.length !== 1) {
    throw new FilterError("Selecione uma empresa para a conferência");
  }
  const params = [filters.empresas[0], filters.inicio, filters.fim];

  const client = await pool.connect();
  try {
    const [ent, sai] = await Promise.all([
      conferir(client, ENT, params),
      conferir(client, SAI, params),
    ]);
    return { ent, sai } satisfies ConferenciaResp;
  } finally {
    client.release();
  }
});
