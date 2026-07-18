"use client";

import { useMemo, useState } from "react";
import { KpiCards } from "@/components/kpi-cards";
import { StatTiles, type Stat } from "@/components/stat-tiles";
import { ImpostosCard } from "@/components/impostos-card";
import { TimeseriesChart } from "@/components/charts/timeseries-chart";
import { EspecieDonut } from "@/components/charts/especie-donut";
import { useFiltros } from "@/hooks/use-filters";
import {
  useCancelamentosResumo,
  useDevolucoesResumo,
  useEspecies,
  useImpostos,
  useOverview,
  useTimeseries,
} from "@/hooks/use-api";
import { brl, num } from "@/lib/format";

type Tipo = "ent" | "sai";

function pct(parte: number, base: number): string {
  if (base <= 0) return "0%";
  return `${((parte / base) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export default function PainelPage() {
  const { filtros, qs } = useFiltros();
  const [tipoImpostos, setTipoImpostos] = useState<Tipo>("sai");

  const overview = useOverview(qs);
  const timeseries = useTimeseries(qs);
  const especies = useEspecies(qs);
  const devol = useDevolucoesResumo(qs);
  const cancel = useCancelamentosResumo(qs);
  const impostos = useImpostos(qs, tipoImpostos);

  const resumoStats = useMemo<Stat[] | undefined>(() => {
    const d = devol.data;
    const c = cancel.data;
    if (!d || !c) return undefined;
    const totalDevol = d.ent.valor + d.sai.valor;
    const fatTotal = d.faturamentoEnt + d.faturamentoSai;
    const totalCancel = c.ent.canceladas + c.sai.canceladas;
    const totalNotas = c.ent.total + c.sai.total;
    return [
      {
        rotulo: "Total devolvido",
        valor: brl(totalDevol),
        sub: `${num(d.ent.qtd + d.sai.qtd)} notas · ${pct(totalDevol, fatTotal)} do movimento`,
      },
      {
        rotulo: "Taxa de cancelamento",
        valor: pct(totalCancel, totalNotas),
        sub: `${num(totalCancel)} de ${num(totalNotas)} notas`,
      },
    ];
  }, [devol.data, cancel.data]);

  return (
    <>
      <KpiCards
        overview={overview.data}
        carregando={overview.isLoading}
        recarregando={overview.isFetching && !overview.isLoading}
        metrica={filtros.metrica}
      />
      <StatTiles
        stats={resumoStats}
        carregando={devol.isLoading || cancel.isLoading}
        colunas={3}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TimeseriesChart
            dados={timeseries.data}
            carregando={timeseries.isLoading}
            recarregando={timeseries.isFetching && !timeseries.isLoading}
            metrica={filtros.metrica}
          />
        </div>
        <EspecieDonut
          dados={especies.data}
          carregando={especies.isLoading}
          recarregando={especies.isFetching && !especies.isLoading}
          metrica={filtros.metrica}
        />
      </div>
      <ImpostosCard
        dados={impostos.data}
        carregando={impostos.isLoading}
        recarregando={impostos.isFetching && !impostos.isLoading}
        tipo={tipoImpostos}
        onTipo={setTipoImpostos}
      />
    </>
  );
}
