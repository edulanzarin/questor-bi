import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import type {
  TurnoverFaixaTempo,
  TurnoverGrupo,
  TurnoverMotivo,
  TurnoverPonto,
  TurnoverResp,
} from "@/lib/types";

interface SerieRow {
  mes: string;
  adm: number;
  dem: number;
  ativos: number;
}
interface ConsRow {
  adm: number;
  dem: number;
  ativos: number;
}
interface GrupoRow {
  grupo: string;
  ativos: number;
  adm: number;
  dem: number;
}

/**
 * Turnover = ((admissões + desligamentos) / 2) ÷ colaboradores ativos × 100.
 * "Ativos" é o efetivo no fim do intervalo — o denominador do relatório de RH
 * de referência (bate com ele). Zero quando não há ativos (evita dividir por 0).
 */
function indice(adm: number, dem: number, ativos: number): number {
  return ativos > 0 ? ((adm + dem) / 2 / ativos) * 100 : 0;
}

function paraGrupo(r: GrupoRow): TurnoverGrupo {
  return {
    grupo: r.grupo,
    ativos: r.ativos,
    admissoes: r.adm,
    desligamentos: r.dem,
    turnover: indice(r.adm, r.dem, r.ativos),
  };
}

/**
 * Rotatividade de pessoal por empresa. Vínculo mora em `funccontrato` (uma linha
 * por contrato), com `dataadm`/`datadem`; o efetivo numa data é "admitido até
 * ela e ainda não desligado". As quebras usam a vigência atual do contrato:
 * lotação (`funclocal.classiforgan` → `organograma`) e cargo (`funccargo` →
 * `cargo`). Motivo do desligamento vem de `rescisao` → `causademissao`.
 * Ver [[Módulo de folha e eSocial do Questor]].
 */
export const GET = apiRoute(async (req) => {
  const f = parseFilters(req.nextUrl.searchParams);
  if (f.empresas.length === 0) {
    throw new FilterError("Selecione a empresa para calcular a rotatividade");
  }

  // $1 empresas[], $2 inicio, $3 fim — compartilhados pelas consultas.
  const params: unknown[] = [f.empresas, f.inicio, f.fim];

  // Consolidado do período inteiro: um registro só (ativos = efetivo no fim).
  const consolidado = query<ConsRow>(
    `select
       count(*) filter (where dataadm between $2 and $3)::int as adm,
       count(*) filter (where datadem between $2 and $3)::int as dem,
       count(*) filter (where dataadm <= $3 and (datadem is null or datadem >= $3))::int as ativos
     from funccontrato
     where codigoempresa = any($1::int[])`,
    params
  );

  // Série mensal: gera os meses e cruza com os contratos (tabela pequena, ~21k;
  // o produto cartesiano é barato). Left join "on true" mantém mês vazio.
  const serie = query<SerieRow>(
    `with m as (
       select gs::date as ini,
              (gs + interval '1 month' - interval '1 day')::date as fim
         from generate_series(date_trunc('month', $2::date),
                              date_trunc('month', $3::date),
                              interval '1 month') gs
     ),
     c as (
       select dataadm, datadem from funccontrato where codigoempresa = any($1::int[])
     )
     select to_char(m.ini, 'YYYY-MM-DD') as mes,
            count(*) filter (where c.dataadm between m.ini and m.fim)::int as adm,
            count(*) filter (where c.datadem between m.ini and m.fim)::int as dem,
            count(*) filter (where c.dataadm <= m.fim and (c.datadem is null or c.datadem >= m.fim))::int as ativos
       from m left join c on true
      group by m.ini
      order by m.ini`,
    params
  );

  // Quebra por organograma (setor): cada contrato pela sua lotação vigente.
  const organogramas = query<GrupoRow>(
    `with loc as (
       select distinct on (codigoempresa, codigofunccontr)
              codigoempresa, codigofunccontr, codigoestab, classiforgan
         from funclocal
        where codigoempresa = any($1::int[])
        order by codigoempresa, codigofunccontr, datatransf desc nulls last
     ),
     c as (
       select fc.codigoempresa, fc.dataadm, fc.datadem, l.codigoestab, l.classiforgan
         from funccontrato fc
         left join loc l
           on l.codigoempresa = fc.codigoempresa and l.codigofunccontr = fc.codigofunccontr
        where fc.codigoempresa = any($1::int[])
     )
     select coalesce(nullif(btrim(o.descrorgan), ''), '(sem setor)') as grupo,
            count(*) filter (where c.dataadm <= $3 and (c.datadem is null or c.datadem >= $3))::int as ativos,
            count(*) filter (where c.dataadm between $2 and $3)::int as adm,
            count(*) filter (where c.datadem between $2 and $3)::int as dem
       from c
       left join organograma o
         on o.codigoempresa = c.codigoempresa
        and o.codigoestab = c.codigoestab
        and o.classiforgan = c.classiforgan
      group by 1
      order by ativos desc, grupo`,
    params
  );

  // Quebra por cargo: cada contrato pelo seu cargo vigente (maior datainicial).
  const cargos = query<GrupoRow>(
    `with cg as (
       select distinct on (codigoempresa, codigofunccontr) codigoempresa, codigofunccontr, codigocargo
         from funccargo
        where codigoempresa = any($1::int[])
        order by codigoempresa, codigofunccontr, datainicial desc nulls last
     ),
     c as (
       select fc.dataadm, fc.datadem, ca.descrcargo
         from funccontrato fc
         left join cg on cg.codigoempresa = fc.codigoempresa and cg.codigofunccontr = fc.codigofunccontr
         left join cargo ca on ca.codigocargo = cg.codigocargo
        where fc.codigoempresa = any($1::int[])
     )
     select coalesce(nullif(btrim(descrcargo), ''), '(sem cargo)') as grupo,
            count(*) filter (where dataadm <= $3 and (datadem is null or datadem >= $3))::int as ativos,
            count(*) filter (where dataadm between $2 and $3)::int as adm,
            count(*) filter (where datadem between $2 and $3)::int as dem
       from c
      group by 1
      order by ativos desc, grupo`,
    params
  );

  // Desligamentos por motivo: a causa da rescisão (uma por contrato; a base usa
  // complementar=1, então não fixamos o valor — pegamos a de menor complementar).
  const motivos = query<TurnoverMotivo>(
    `with resc as (
       select distinct on (codigoempresa, codigofunccontr) codigoempresa, codigofunccontr, codigocausa
         from rescisao
        where codigoempresa = any($1::int[])
        order by codigoempresa, codigofunccontr, complementar
     )
     select coalesce(cd.descrcausa, '(não informado)') as motivo,
            count(*)::int as desligamentos
       from funccontrato fc
       left join resc r on r.codigoempresa = fc.codigoempresa and r.codigofunccontr = fc.codigofunccontr
       left join causademissao cd on cd.codigocausa = r.codigocausa
      where fc.codigoempresa = any($1::int[]) and fc.datadem between $2 and $3
      group by 1
      order by 2 desc`,
    params
  );

  // Desligamentos por tempo de casa (dias entre admissão e desligamento).
  const tenure = query<TurnoverFaixaTempo>(
    `select faixa, count(*)::int as desligamentos
       from (
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
           from funccontrato
          where codigoempresa = any($1::int[])
            and datadem between $2 and $3
            and dataadm is not null
       ) t
      group by faixa, ord
      order by ord`,
    params
  );

  const [cons, meses, orgs, cgs, mots, tens] = await Promise.all([
    consolidado,
    serie,
    organogramas,
    cargos,
    motivos,
    tenure,
  ]);

  const serieResp: TurnoverPonto[] = meses.map((r) => ({
    mes: r.mes,
    admissoes: r.adm,
    desligamentos: r.dem,
    ativos: r.ativos,
    turnover: indice(r.adm, r.dem, r.ativos),
  }));

  const c = cons[0] ?? { adm: 0, dem: 0, ativos: 0 };
  const resp: TurnoverResp = {
    consolidado: {
      admissoes: c.adm,
      desligamentos: c.dem,
      ativos: c.ativos,
      turnover: indice(c.adm, c.dem, c.ativos),
    },
    serie: serieResp,
    organogramas: orgs.map(paraGrupo),
    cargos: cgs.map(paraGrupo),
    motivos: mots,
    tenure: tens,
  };
  return resp;
});
