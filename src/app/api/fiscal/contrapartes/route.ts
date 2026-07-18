import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ContraparteBusca } from "@/lib/types";

/**
 * Busca contrapartes (pessoa) COM movimento no período/empresa, filtrando pelo nome.
 * Server-side: não carrega todas — só os que casam, ordenados A→Z, limitado a 50.
 * O front só chama com q >= 2 caracteres (evita agregar todas as pessoas do período).
 */
export const GET = apiRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const tipo = sp.get("tipo") === "ent" ? "ent" : "sai";
  const q = (sp.get("q") ?? "").trim();
  const tabela = tipo === "ent" ? "lctofisent" : "lctofissai";

  const w = buildWhere(filters, { alias: "f", incluirCanceladas: true });
  const conds = [w.sql];
  const params = [...w.params];
  if (q) {
    params.push(`%${q}%`);
    conds.push(`p.nomepessoa ilike $${params.length}`);
  }

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
      limit 50`,
    params
  );

  return rows;
});
