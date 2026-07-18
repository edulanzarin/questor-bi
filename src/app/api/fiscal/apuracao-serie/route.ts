import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ApuracaoSerie } from "@/lib/types";

/** Débito (saídas) × crédito (entradas) de ICMS ao longo do período. */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const imposto = req.nextUrl.searchParams.get("imposto") === "ipi" ? "valoripi" : "valoricms";
  const dias = (Date.parse(filters.fim) - Date.parse(filters.inicio)) / 86_400_000 + 1;
  const granularidade: ApuracaoSerie["granularidade"] = dias > 92 ? "mes" : "dia";
  const bucketExpr =
    granularidade === "mes"
      ? `to_char(date_trunc('month', f.datalctofis), 'YYYY-MM-DD')`
      : `to_char(f.datalctofis, 'YYYY-MM-DD')`;
  const w = buildWhere({ ...filters, especies: [] }, { alias: "f", incluirCanceladas: true });

  const serie = (lado: "ent" | "sai") =>
    query<{ bucket: string; total: number }>(
      `select ${bucketExpr} as bucket, coalesce(sum(f.${imposto}), 0)::float as total
         from lctofis${lado}produto f where ${w.sql}
        group by 1 order by 1`,
      w.params
    );

  const [sai, ent] = await Promise.all([serie("sai"), serie("ent")]);

  const porBucket = new Map<string, { bucket: string; debito: number; credito: number }>();
  const ponto = (b: string) => {
    let p = porBucket.get(b);
    if (!p) {
      p = { bucket: b, debito: 0, credito: 0 };
      porBucket.set(b, p);
    }
    return p;
  };
  for (const r of sai) ponto(r.bucket).debito = r.total;
  for (const r of ent) ponto(r.bucket).credito = r.total;

  const pontos = [...porBucket.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  return { granularidade, pontos } satisfies ApuracaoSerie;
});
