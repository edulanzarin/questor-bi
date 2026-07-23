import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { construirBase, parseFolhaFiltrosSel } from "@/lib/folha-turnover";
import type { FolhaMovimentacao } from "@/lib/types";

interface Row {
  contrato: number;
  nome: string;
  dataadm: string | null;
  datadem: string | null;
  cargo: string;
  setor: string;
  motivo: string | null;
  tempocasadias: number | null;
  admitido: boolean;
  desligado: boolean;
}

/**
 * Quem foi admitido ou desligado no período (respeitando os mesmos filtros do
 * painel). É a ponte dos números para as pessoas — cada linha abre a ficha.
 */
export const GET = apiRoute(async (req) => {
  const f = parseFilters(req.nextUrl.searchParams);
  if (f.empresas.length === 0) {
    throw new FilterError("Selecione a empresa");
  }
  const sel = parseFolhaFiltrosSel(req.nextUrl.searchParams);
  const { cte, params } = construirBase(f, sel);

  // escopo=efetivo → todos os ativos no fim do período; senão, quem se moveu.
  const efetivo = req.nextUrl.searchParams.get("escopo") === "efetivo";
  const filtro = efetivo
    ? `dataadm <= $3 and (datadem is null or datadem >= $3)`
    : `dataadm between $2 and $3 or datadem between $2 and $3`;
  const ordem = efetivo ? "nome" : "coalesce(datadem, dataadm) desc, nome";

  const rows = await query<Row>(
    `${cte}
     select codigofunccontr as contrato, nome,
            to_char(dataadm, 'YYYY-MM-DD') as dataadm,
            to_char(datadem, 'YYYY-MM-DD') as datadem,
            cargo, setor, descrcausa as motivo,
            case when dataadm is null then null
                 when datadem is not null then (datadem - dataadm)
                 else (current_date - dataadm) end as tempocasadias,
            (dataadm is not null and dataadm between $2 and $3) as admitido,
            (datadem is not null and datadem between $2 and $3) as desligado
       from fbase
      where ${filtro}
      order by ${ordem}`,
    params
  );

  return rows.map(
    (r): FolhaMovimentacao => ({
      contrato: r.contrato,
      nome: r.nome,
      dataadm: r.dataadm,
      datadem: r.datadem,
      cargo: r.cargo,
      setor: r.setor,
      motivo: r.motivo,
      tempoCasaDias: r.tempocasadias,
      admitido: r.admitido,
      desligado: r.desligado,
    })
  );
});
