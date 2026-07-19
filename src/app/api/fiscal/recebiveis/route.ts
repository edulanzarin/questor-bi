import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { RecebiveisResumo } from "@/lib/types";

const FAIXAS = [
  { faixa: "Vencido +30d", vencido: true },
  { faixa: "Vencido até 30d", vencido: true },
  { faixa: "Vence em 30d", vencido: false },
  { faixa: "Vence 31–60d", vencido: false },
  { faixa: "Vence +60d", vencido: false },
];

/**
 * Recebíveis das saídas: duplicatas (parcelas) das notas emitidas no período,
 * com aging (vencido × a vencer) e fluxo por mês de vencimento.
 * `duplicatasaiparcela` não tem especienf/cancelada — dropar espécie.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const w = buildWhere({ ...filters, especies: [] }, { alias: "f", incluirCanceladas: true });

  const [[tot], aging, fluxo] = await Promise.all([
    query<{ total: number; vencido: number; a_vencer: number; qtd: number }>(
      `select coalesce(sum(f.valorparcela), 0)::float as total,
              coalesce(sum(f.valorparcela) filter (where f.datavencimento < current_date), 0)::float as vencido,
              coalesce(sum(f.valorparcela) filter (where f.datavencimento >= current_date), 0)::float as a_vencer,
              count(*)::int as qtd
         from duplicatasaiparcela f
        where ${w.sql}`,
      w.params
    ),
    query<{ faixa: number; valor: number; qtd: number }>(
      `select faixa, coalesce(sum(valorparcela), 0)::float as valor, count(*)::int as qtd
         from (
           select f.valorparcela,
                  case
                    when f.datavencimento < current_date - 30 then 0
                    when f.datavencimento < current_date then 1
                    when f.datavencimento <= current_date + 30 then 2
                    when f.datavencimento <= current_date + 60 then 3
                    else 4
                  end as faixa
             from duplicatasaiparcela f
            where ${w.sql}
         ) t
        group by faixa
        order by faixa`,
      w.params
    ),
    query<{ bucket: string; valor: number }>(
      `select to_char(date_trunc('month', f.datavencimento), 'YYYY-MM-DD') as bucket,
              coalesce(sum(f.valorparcela), 0)::float as valor
         from duplicatasaiparcela f
        where ${w.sql}
        group by 1
        order by 1`,
      w.params
    ),
  ]);

  return {
    totalReceber: tot.total,
    vencido: tot.vencido,
    aVencer: tot.a_vencer,
    qtdParcelas: tot.qtd,
    aging: aging.map((a) => ({
      faixa: FAIXAS[a.faixa]?.faixa ?? `Faixa ${a.faixa}`,
      valor: a.valor,
      qtd: a.qtd,
      vencido: FAIXAS[a.faixa]?.vencido ?? false,
    })),
    fluxo,
  } satisfies RecebiveisResumo;
});
