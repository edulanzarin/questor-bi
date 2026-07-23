import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import {
  construirBase,
  parseFolhaFiltrosSel,
  sexoValor,
  EXPR_FAIXA_ETARIA,
  EXPR_TENURE_FAIXA,
  EXPR_ESCOLARIDADE,
  EXPR_ESTADOCIVIL,
} from "@/lib/folha-turnover";
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
 * Drill de qualquer quebra: as pessoas de um grupo (setor, cargo, estab,
 * vínculo, sexo, faixa etária, motivo, tempo de casa) que se movimentaram no
 * período. As dimensões que já são filtro (setor/cargo/estab/vínculo) entram na
 * própria base; as demográficas e de motivo/tempo viram um predicado à parte,
 * usando as MESMAS expressões da quebra ([[folha-turnover]]) para o recorte
 * bater exato com o número clicado.
 */
export const GET = apiRoute(async (req) => {
  const sp = req.nextUrl.searchParams;
  const f = parseFilters(sp);
  if (f.empresas.length === 0) throw new FilterError("Selecione a empresa");

  const sel = parseFolhaFiltrosSel(sp);
  const dim = sp.get("dim") ?? "";
  const valor = sp.get("valor") ?? "";

  // Dimensões que já são filtro da base: some à seleção e a base recorta.
  if (dim === "setor") sel.setores = [...sel.setores, valor];
  else if (dim === "cargo") sel.cargos = [...sel.cargos, valor];
  else if (dim === "estab") sel.estabs = [...sel.estabs, valor];
  else if (dim === "vinculo") sel.vinculos = [...sel.vinculos, valor];

  const { cte, params } = construirBase(f, sel);

  const conds = ["(dataadm between $2 and $3 or datadem between $2 and $3)"];
  if (dim === "sexo") {
    params.push(sexoValor(valor));
    conds.push(`sexo = $${params.length}`);
  } else if (dim === "faixaEtaria") {
    params.push(valor);
    conds.push(`(${EXPR_FAIXA_ETARIA}) = $${params.length}`);
  } else if (dim === "escolaridade") {
    params.push(valor);
    conds.push(`(${EXPR_ESCOLARIDADE}) = $${params.length}`);
  } else if (dim === "estadoCivil") {
    params.push(valor);
    conds.push(`(${EXPR_ESTADOCIVIL}) = $${params.length}`);
  } else if (dim === "motivo") {
    params.push(valor);
    conds.push(`datadem between $2 and $3`);
    conds.push(`coalesce(descrcausa, '(não informado)') = $${params.length}`);
  } else if (dim === "tempoCasa") {
    params.push(valor);
    conds.push(`datadem between $2 and $3 and dataadm is not null`);
    conds.push(`(${EXPR_TENURE_FAIXA}) = $${params.length}`);
  }

  const rows = await query<Row>(
    `${cte}
     select codigofunccontr as contrato, nome,
            to_char(dataadm, 'YYYY-MM-DD') as dataadm,
            to_char(datadem, 'YYYY-MM-DD') as datadem,
            cargo, setor, descrcausa as motivo,
            case when datadem is not null and dataadm is not null then (datadem - dataadm) end as tempocasadias,
            (dataadm is not null and dataadm between $2 and $3) as admitido,
            (datadem is not null and datadem between $2 and $3) as desligado
       from fbase
      where ${conds.join(" and ")}
      order by coalesce(datadem, dataadm) desc, nome`,
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
