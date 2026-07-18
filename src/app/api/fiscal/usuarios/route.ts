import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { TopItem } from "@/lib/types";

/** Quem lançou as notas: ranking por usuário (codigousuario → nomeusuario). */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const tipo = req.nextUrl.searchParams.get("tipo") === "ent" ? "ent" : "sai";
  const metrica = req.nextUrl.searchParams.get("metrica") === "qtd" ? "qtd" : "valor";
  const tabela = tipo === "ent" ? "lctofisent" : "lctofissai";
  const w = buildWhere(filters, { alias: "f", incluirCanceladas: true });

  const rows = await query<TopItem>(
    `with topn as (
       select f.codigousuario,
              coalesce(sum(f.valorcontabil), 0)::float as valor,
              count(*)::int as qtd
         from ${tabela} f
        where ${w.sql}
        group by f.codigousuario
        order by ${metrica} desc
        limit 10
     )
     select t.codigousuario as codigo,
            coalesce(u.nomeusuario, 'Usuário ' || t.codigousuario) as nome,
            t.valor, t.qtd
       from topn t
       left join usuario u on u.codigousuario = t.codigousuario
      order by ${metrica} desc`,
    w.params
  );

  return rows.map((r) => ({ ...r, detalhe: null }));
});
