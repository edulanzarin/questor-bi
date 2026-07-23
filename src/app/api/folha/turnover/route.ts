import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import type { TurnoverPonto, TurnoverResp } from "@/lib/types";

interface SerieRow {
  mes: string;
  adm: number;
  dem: number;
  hc_ini: number;
  hc_fim: number;
}

interface ConsRow {
  adm: number;
  dem: number;
  hc_ini: number;
  hc_fim: number;
}

/**
 * Turnover clássico = ((admissões + desligamentos) / 2) ÷ efetivo médio × 100,
 * onde efetivo médio = (efetivo no início + efetivo no fim) / 2. Quando não há
 * efetivo, o índice é 0 (não faz sentido, e evita dividir por zero).
 */
function indicar(adm: number, dem: number, hcIni: number, hcFim: number) {
  const efetivoMedio = (hcIni + hcFim) / 2;
  const turnover = efetivoMedio > 0 ? ((adm + dem) / 2 / efetivoMedio) * 100 : 0;
  return { efetivoMedio, turnover };
}

/**
 * Rotatividade de pessoal por empresa. A folha guarda vínculo em `funccontrato`
 * (uma linha por contrato), com `dataadm`/`datadem`; admissão e desligamento
 * saem dessas datas e o efetivo numa data é "admitido até ela e ainda não
 * desligado". Conta no nível de contrato — o padrão de RH.
 */
export const GET = apiRoute(async (req) => {
  const f = parseFilters(req.nextUrl.searchParams);
  if (f.empresas.length === 0) {
    throw new FilterError("Selecione a empresa para calcular a rotatividade");
  }

  // $1 empresas[], $2 inicio, $3 fim — compartilhados pelas duas consultas.
  const params: unknown[] = [f.empresas, f.inicio, f.fim];

  // Consolidado do período inteiro: um registro só.
  const consolidado = query<ConsRow>(
    `select
       count(*) filter (where dataadm between $2 and $3)::int as adm,
       count(*) filter (where datadem between $2 and $3)::int as dem,
       count(*) filter (where dataadm <= $2 and (datadem is null or datadem >= $2))::int as hc_ini,
       count(*) filter (where dataadm <= $3 and (datadem is null or datadem >= $3))::int as hc_fim
     from funccontrato
     where codigoempresa = any($1::int[])`,
    params
  );

  // Série mensal: gera os meses do intervalo e cruza com os contratos (a tabela
  // é pequena — ~21k linhas —, então o produto cartesiano é barato). O left join
  // "on true" garante que todo mês apareça mesmo sem contratos.
  const serie = query<SerieRow>(
    `with m as (
       select gs::date as mstart,
              (gs + interval '1 month' - interval '1 day')::date as mend
         from generate_series(date_trunc('month', $2::date),
                              date_trunc('month', $3::date),
                              interval '1 month') gs
     ),
     c as (
       select dataadm, datadem
         from funccontrato
        where codigoempresa = any($1::int[])
     )
     select to_char(m.mstart, 'YYYY-MM-DD') as mes,
            count(*) filter (where c.dataadm between m.mstart and m.mend)::int as adm,
            count(*) filter (where c.datadem between m.mstart and m.mend)::int as dem,
            count(*) filter (where c.dataadm <= m.mstart and (c.datadem is null or c.datadem >= m.mstart))::int as hc_ini,
            count(*) filter (where c.dataadm <= m.mend   and (c.datadem is null or c.datadem >= m.mend))::int   as hc_fim
       from m left join c on true
      group by m.mstart
      order by m.mstart`,
    params
  );

  const [cons, meses] = await Promise.all([consolidado, serie]);

  const pontos: TurnoverPonto[] = meses.map((r) => ({
    mes: r.mes,
    admissoes: r.adm,
    desligamentos: r.dem,
    efetivoInicio: r.hc_ini,
    efetivoFim: r.hc_fim,
    ...indicar(r.adm, r.dem, r.hc_ini, r.hc_fim),
  }));

  const c = cons[0] ?? { adm: 0, dem: 0, hc_ini: 0, hc_fim: 0 };
  const resp: TurnoverResp = {
    consolidado: {
      admissoes: c.adm,
      desligamentos: c.dem,
      efetivoInicio: c.hc_ini,
      efetivoFim: c.hc_fim,
      ...indicar(c.adm, c.dem, c.hc_ini, c.hc_fim),
    },
    serie: pontos,
  };
  return resp;
});
