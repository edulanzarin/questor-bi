import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import type { TurnoverOrganograma, TurnoverPonto, TurnoverResp } from "@/lib/types";

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
interface OrgRow {
  setor: string;
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

/**
 * Rotatividade de pessoal por empresa. Vínculo mora em `funccontrato` (uma linha
 * por contrato), com `dataadm`/`datadem`; o efetivo numa data é "admitido até
 * ela e ainda não desligado". A quebra por setor usa a lotação vigente do
 * contrato (`funclocal`, maior `datatransf`) → `organograma.descrorgan`.
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
  const organogramas = query<OrgRow>(
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
     select coalesce(nullif(btrim(o.descrorgan), ''), '(sem setor)') as setor,
            count(*) filter (where c.dataadm <= $3 and (c.datadem is null or c.datadem >= $3))::int as ativos,
            count(*) filter (where c.dataadm between $2 and $3)::int as adm,
            count(*) filter (where c.datadem between $2 and $3)::int as dem
       from c
       left join organograma o
         on o.codigoempresa = c.codigoempresa
        and o.codigoestab = c.codigoestab
        and o.classiforgan = c.classiforgan
      group by 1
      order by ativos desc, setor`,
    params
  );

  const [cons, meses, orgs] = await Promise.all([consolidado, serie, organogramas]);

  const serieResp: TurnoverPonto[] = meses.map((r) => ({
    mes: r.mes,
    admissoes: r.adm,
    desligamentos: r.dem,
    ativos: r.ativos,
    turnover: indice(r.adm, r.dem, r.ativos),
  }));

  const organogramasResp: TurnoverOrganograma[] = orgs.map((r) => ({
    setor: r.setor,
    ativos: r.ativos,
    admissoes: r.adm,
    desligamentos: r.dem,
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
    organogramas: organogramasResp,
  };
  return resp;
});
