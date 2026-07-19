import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ProdutividadeSerie } from "@/lib/types";

interface BucketRow {
  bucket: string;
  qtd: number;
}

/** Notas lançadas por dia (ou mês), separadas por entrada e saída — throughput da equipe. */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const dias = (Date.parse(filters.fim) - Date.parse(filters.inicio)) / 86_400_000 + 1;
  const granularidade: ProdutividadeSerie["granularidade"] = dias > 92 ? "mes" : "dia";
  const bucketExpr =
    granularidade === "mes"
      ? `to_char(date_trunc('month', datalctofis), 'YYYY-MM-DD')`
      : `to_char(datalctofis, 'YYYY-MM-DD')`;

  const { sql, params } = buildWhere(filters, { incluirCanceladas: true });
  const serie = (tabela: string) =>
    query<BucketRow>(
      `select ${bucketExpr} as bucket, count(*)::int as qtd
         from ${tabela}
        where ${sql}
        group by 1
        order by 1`,
      params
    );

  const [ent, sai] = await Promise.all([serie("lctofisent"), serie("lctofissai")]);

  const porBucket = new Map<string, { bucket: string; ent: number; sai: number }>();
  const ponto = (bucket: string) => {
    let p = porBucket.get(bucket);
    if (!p) {
      p = { bucket, ent: 0, sai: 0 };
      porBucket.set(bucket, p);
    }
    return p;
  };
  for (const r of ent) ponto(r.bucket).ent = r.qtd;
  for (const r of sai) ponto(r.bucket).sai = r.qtd;

  const pontos = [...porBucket.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  return { granularidade, pontos } satisfies ProdutividadeSerie;
});
