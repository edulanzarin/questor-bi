import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ProdutividadeCalendario } from "@/lib/types";

interface CelulaRow {
  d: string;
  n: number;
}

/**
 * Calendário de atividade (estilo GitHub): notas lançadas por dia no período.
 * Sempre diário — o período é limitado a no máximo 1 ano no `parseFilters`, então
 * a grade nunca fica pesada. Conta entradas + saídas de todos os usuários
 * (inclui o automático), por `datalctofis`.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const w = buildWhere(filters, { incluirCanceladas: true });
  const celulas = await query<CelulaRow>(
    `select to_char(datalctofis, 'YYYY-MM-DD') as d, count(*)::int as n
       from (
         select datalctofis from lctofissai where ${w.sql}
         union all
         select datalctofis from lctofisent where ${w.sql}
       ) t
      group by 1
      order by 1`,
    w.params
  );

  let total = 0;
  let pico: ProdutividadeCalendario["pico"] = null;
  for (const c of celulas) {
    total += c.n;
    if (!pico || c.n > pico.n) pico = { d: c.d, n: c.n };
  }

  return { inicio: filters.inicio, fim: filters.fim, celulas, total, pico } satisfies ProdutividadeCalendario;
});
