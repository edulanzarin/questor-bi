import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ConformidadeResumo } from "@/lib/types";

/** NCM ausente ou genérico/placeholder (com ou sem pontuação). */
const NCM_INVALIDO =
  "(p.codigoncm is null or btrim(p.codigoncm) in ('', '99999999', '9999.99.99', '00000000', '0000.00.00'))";

const SITUACAO: Record<number, string> = {
  0: "Normal",
  1: "Normal",
  2: "Cancelada",
  5: "Denegada",
  6: "Inutilizada",
  8: "Denegada/inutilizada",
};

interface NotasRow {
  total: number;
  canceladas: number;
  denegadas: number;
  sem_chave: number;
}
interface TotalItensRow {
  total_itens: number;
}
interface NcmRow {
  ncm_inv_itens: number;
  ncm_inv_prod: number;
}
interface SitRow {
  codigo: number;
  qtd: number;
}

/** Resumo de conformidade fiscal das saídas no período. */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const wNotas = buildWhere(filters, { alias: "f", incluirCanceladas: true });
  // itens não têm especienf nem cancelada — dropar espécie e não filtrar cancelada
  const wItens = buildWhere({ ...filters, especies: [] }, { alias: "i", incluirCanceladas: true });

  const [[notas], [totItens], [ncm], situacoes] = await Promise.all([
    query<NotasRow>(
      `select count(*)::int as total,
              count(*) filter (where f.cancelada = '1')::int as canceladas,
              count(*) filter (where f.cdsituacao <> 0 and f.cancelada <> '1')::int as denegadas,
              count(*) filter (where f.cdmodelo in ('55','65','57')
                                 and (f.chavenfesai is null or length(btrim(f.chavenfesai)) <> 44))::int as sem_chave
         from lctofissai f
        where ${wNotas.sql}`,
      wNotas.params
    ),
    // total de itens: sem join, rápido
    query<TotalItensRow>(
      `select count(*)::int as total_itens from lctofissaiproduto i where ${wItens.sql}`,
      wItens.params
    ),
    // NCM inválido: filtro no WHERE deixa o planner reduzir por produto antes (rápido)
    query<NcmRow>(
      `select count(*)::int as ncm_inv_itens,
              count(distinct (i.codigoempresa, i.codigoproduto))::int as ncm_inv_prod
         from lctofissaiproduto i
         join produto p on p.codigoempresa = i.codigoempresa and p.codigoproduto = i.codigoproduto
        where ${wItens.sql} and ${NCM_INVALIDO}`,
      wItens.params
    ),
    query<SitRow>(
      `select f.cdsituacao as codigo, count(*)::int as qtd
         from lctofissai f
        where ${wNotas.sql}
        group by 1
        order by 2 desc`,
      wNotas.params
    ),
  ]);

  return {
    totalNotas: notas.total,
    totalItens: totItens.total_itens,
    canceladas: notas.canceladas,
    denegadas: notas.denegadas,
    semChave: notas.sem_chave,
    ncmInvalidoItens: ncm.ncm_inv_itens,
    ncmInvalidoProdutos: ncm.ncm_inv_prod,
    situacoes: situacoes.map((s) => ({
      codigo: s.codigo,
      nome: SITUACAO[s.codigo] ?? `Situação ${s.codigo}`,
      qtd: s.qtd,
    })),
  } satisfies ConformidadeResumo;
});
