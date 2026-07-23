import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError, periodoAnterior } from "@/lib/fiscal-filters";
import {
  construirBase,
  parseFolhaFiltrosSel,
  EXPR_FAIXA_ETARIA,
  EXPR_ESCOLARIDADE,
  EXPR_ESTADOCIVIL,
} from "@/lib/folha-turnover";
import type {
  TurnoverContagem,
  TurnoverGrupo,
  TurnoverPonto,
  TurnoverResp,
} from "@/lib/types";

interface GrupoRaw {
  grupo: string;
  ativos: number;
  adm: number;
  dem: number;
}
interface SerieRaw {
  mes: string;
  adm: number;
  dem: number;
  ativos: number;
}
interface MegaRaw {
  adm: number;
  dem: number;
  ativos: number;
  voluntarios: number;
  involuntarios: number;
  tempomedio: number | null;
  prevadm: number;
  prevdem: number;
  prevativos: number;
  serie: SerieRaw[];
  organogramas: GrupoRaw[];
  cargos: GrupoRaw[];
  estabs: GrupoRaw[];
  sexo: GrupoRaw[];
  idade: GrupoRaw[];
  escolaridade: GrupoRaw[];
  estadocivil: GrupoRaw[];
  motivos: TurnoverContagem[];
  tenure: TurnoverContagem[];
}

/**
 * Turnover = ((admissões + desligamentos) / 2) ÷ colaboradores ativos × 100.
 * "Ativos" é o efetivo no fim do intervalo (o denominador do DP). Zero quando
 * não há ativos (evita dividir por zero).
 */
function indice(adm: number, dem: number, ativos: number): number {
  return ativos > 0 ? ((adm + dem) / 2 / ativos) * 100 : 0;
}

function paraGrupo(r: GrupoRaw): TurnoverGrupo {
  return {
    grupo: r.grupo,
    ativos: r.ativos,
    admissoes: r.adm,
    desligamentos: r.dem,
    turnover: indice(r.adm, r.dem, r.ativos),
  };
}

/**
 * Rotatividade de pessoal por empresa — tudo numa consulta só sobre a base
 * (view `funcionario` + joins), com os filtros avançados aplicados. Devolve o
 * consolidado (com saldo, voluntário/involuntário e tempo médio de casa), a
 * série mensal e as quebras por setor, cargo, estabelecimento, sexo, faixa
 * etária, motivo e tempo de casa. Ver [[Módulo de folha e eSocial do Questor]].
 */
export const GET = apiRoute(async (req) => {
  const f = parseFilters(req.nextUrl.searchParams);
  if (f.empresas.length === 0) {
    throw new FilterError("Selecione a empresa para calcular a rotatividade");
  }
  const sel = parseFolhaFiltrosSel(req.nextUrl.searchParams);
  const { cte, params } = construirBase(f, sel);

  // Período anterior (mesma duração) para os deltas — nos mesmos parâmetros.
  const prev = periodoAnterior(f);
  params.push(prev.inicio);
  const pIni = `$${params.length}`;
  params.push(prev.fim);
  const pFim = `$${params.length}`;

  // Agregado de grupo reutilizado por setor/cargo/estab/sexo/idade.
  const grupoAgg = (dim: string) =>
    `(select coalesce(json_agg(x order by x.ativos desc, x.grupo), '[]'::json) from (
        select ${dim} as grupo,
               count(*) filter (where at_fim)::int as ativos,
               count(*) filter (where dataadm between $2 and $3)::int as adm,
               count(*) filter (where datadem between $2 and $3)::int as dem
          from ativo group by grupo
      ) x)`;

  const [row] = await query<{ d: MegaRaw }>(
    `${cte}
     select json_build_object(
       'adm', (select count(*) filter (where dataadm between $2 and $3)::int from fbase),
       'dem', (select count(*) filter (where datadem between $2 and $3)::int from fbase),
       'ativos', (select count(*) filter (where at_fim)::int from ativo),
       'voluntarios', (select count(*) filter (where datadem between $2 and $3 and causa in (3,4,7,14))::int from fbase),
       'involuntarios', (select count(*) filter (where datadem between $2 and $3 and causa in (1,2,5,11,13))::int from fbase),
       'tempomedio', (select round(avg(datadem - dataadm) filter (where datadem between $2 and $3 and dataadm is not null))::int from fbase),
       'prevadm', (select count(*) filter (where dataadm between ${pIni} and ${pFim})::int from fbase),
       'prevdem', (select count(*) filter (where datadem between ${pIni} and ${pFim})::int from fbase),
       'prevativos', (select count(*) filter (where dataadm <= ${pFim} and (datadem is null or datadem >= ${pFim}))::int from fbase),
       'serie', (select coalesce(json_agg(s order by s.mes), '[]'::json) from (
           select to_char(m.ini, 'YYYY-MM-DD') as mes,
                  count(*) filter (where fb.dataadm between m.ini and m.fim)::int as adm,
                  count(*) filter (where fb.datadem between m.ini and m.fim)::int as dem,
                  count(*) filter (where fb.dataadm <= m.fim and (fb.datadem is null or fb.datadem >= m.fim))::int as ativos
             from (select gs::date as ini, (gs + interval '1 month' - interval '1 day')::date as fim
                     from generate_series(date_trunc('month', $2::date), date_trunc('month', $3::date), interval '1 month') gs) m
             left join fbase fb on true
            group by m.ini
         ) s),
       'organogramas', ${grupoAgg("setor")},
       'cargos', ${grupoAgg("cargo")},
       'estabs', ${grupoAgg("estab")},
       'sexo', ${grupoAgg("case when sexo=1 then 'Masculino' when sexo=2 then 'Feminino' else '(n/d)' end")},
       'idade', ${grupoAgg(EXPR_FAIXA_ETARIA)},
       'escolaridade', ${grupoAgg(EXPR_ESCOLARIDADE)},
       'estadocivil', ${grupoAgg(EXPR_ESTADOCIVIL)},
       'motivos', (select coalesce(json_agg(x order by x.valor desc), '[]'::json) from (
           select coalesce(descrcausa, '(não informado)') as rotulo, count(*)::int as valor
             from fbase where datadem between $2 and $3 group by rotulo
         ) x),
       'tenure', (select coalesce(json_agg(x order by x.ord), '[]'::json) from (
           select faixa as rotulo, ord, count(*)::int as valor from (
             select case
                      when (datadem - dataadm) < 90 then 'Menos de 3 meses'
                      when (datadem - dataadm) < 365 then '3 a 12 meses'
                      when (datadem - dataadm) < 1095 then '1 a 3 anos'
                      else 'Mais de 3 anos'
                    end as faixa,
                    case
                      when (datadem - dataadm) < 90 then 1
                      when (datadem - dataadm) < 365 then 2
                      when (datadem - dataadm) < 1095 then 3
                      else 4
                    end as ord
               from fbase where datadem between $2 and $3 and dataadm is not null
           ) t group by faixa, ord
         ) x)
     ) as d`,
    params
  );

  const d = row.d;
  const resp: TurnoverResp = {
    consolidado: {
      admissoes: d.adm,
      desligamentos: d.dem,
      ativos: d.ativos,
      turnover: indice(d.adm, d.dem, d.ativos),
      saldo: d.adm - d.dem,
      voluntarios: d.voluntarios,
      involuntarios: d.involuntarios,
      tempoMedioCasaDias: d.tempomedio,
    },
    anterior: {
      turnover: indice(d.prevadm, d.prevdem, d.prevativos),
      admissoes: d.prevadm,
      desligamentos: d.prevdem,
      ativos: d.prevativos,
    },
    serie: d.serie.map(
      (r): TurnoverPonto => ({
        mes: r.mes,
        admissoes: r.adm,
        desligamentos: r.dem,
        ativos: r.ativos,
        turnover: indice(r.adm, r.dem, r.ativos),
      })
    ),
    organogramas: d.organogramas.map(paraGrupo),
    cargos: d.cargos.map(paraGrupo),
    estabelecimentos: d.estabs.map(paraGrupo),
    sexo: d.sexo.map(paraGrupo),
    faixaEtaria: d.idade.map(paraGrupo),
    escolaridade: d.escolaridade.map(paraGrupo),
    estadoCivil: d.estadocivil.map(paraGrupo),
    motivos: d.motivos,
    tenure: d.tenure,
  };
  return resp;
});
