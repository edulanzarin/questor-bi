import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ContraparteBusca, ContrapartesResp } from "@/lib/types";

const PAGE_SIZE = 20;

/**
 * Contrapartes (pessoa) COM movimento no período/empresa, com busca por nome.
 * Server-side e paginado (20/página): não carrega todas — só a página pedida,
 * ordenadas A→Z. Usado pelo modal de filtro do explorador.
 */
export const GET = apiRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const tipo = sp.get("tipo") === "ent" ? "ent" : "sai";
  const q = (sp.get("q") ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const tabela = tipo === "ent" ? "lctofisent" : "lctofissai";

  const w = buildWhere(filters, { alias: "f", incluirCanceladas: true });
  const conds = [w.sql];
  const params = [...w.params];
  if (q) {
    params.push(`%${q}%`);
    conds.push(`p.nomepessoa ilike $${params.length}`);
  }

  // pede PAGE_SIZE+1 pra saber se há próxima página sem um count caro
  const rows = await query<ContraparteBusca>(
    `select f.codigopessoa as codigo,
            max(p.nomepessoa) as nome,
            max(p.inscrfederal) as doc,
            max(p.siglaestado) as uf,
            count(*)::int as qtd
       from ${tabela} f
       join pessoa p on p.codigopessoa = f.codigopessoa
      where ${conds.join(" and ")}
      group by f.codigopessoa
      order by max(p.nomepessoa)
      limit ${PAGE_SIZE + 1} offset ${(page - 1) * PAGE_SIZE}`,
    params
  );

  return {
    rows: rows.slice(0, PAGE_SIZE),
    page,
    temMais: rows.length > PAGE_SIZE,
  } satisfies ContrapartesResp;
});
