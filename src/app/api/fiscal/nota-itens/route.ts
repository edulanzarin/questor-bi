import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { FilterError } from "@/lib/fiscal-filters";
import type { NotaItem } from "@/lib/types";

/** Itens (produtos) de uma nota específica — drill-down do explorador. */
export const GET = apiRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const tipo = sp.get("tipo") === "ent" ? "ent" : "sai";
  const empresa = Number(sp.get("empresa"));
  const chave = sp.get("chave") ?? "";
  if (!Number.isInteger(empresa) || !/^\d+$/.test(chave)) {
    throw new FilterError("empresa e chave são obrigatórios");
  }
  const tabela = `lctofis${tipo}produto`;
  const chaveCol = tipo === "ent" ? "chavelctofisent" : "chavelctofissai";

  const rows = await query<NotaItem>(
    `select f.seq as seq,
            f.codigoproduto as produto,
            pr.descrproduto as descricao,
            f.codigocfop as cfop,
            cf.descrcfop as "cfopDescr",
            nullif(btrim(f.unidademedida), '') as unidade,
            f.quantidade::float as quantidade,
            f.valorunitario::float as "valorUnitario",
            f.valortotal::float as "valorTotal",
            coalesce(f.valoricms, 0)::float as icms,
            coalesce(f.valoripi, 0)::float as ipi
       from ${tabela} f
       left join produto pr on pr.codigoempresa = f.codigoempresa
                           and pr.codigoproduto = f.codigoproduto
       left join cfop cf on cf.codigoempresa = f.codigoempresa
                        and cf.codigoestab = f.codigoestab
                        and cf.codigocfop = f.codigocfop
      where f.codigoempresa = $1 and f.${chaveCol} = $2
      order by f.seq`,
    [empresa, chave]
  );

  return rows;
});
