"use client";

import { KpiCards } from "@/components/kpi-cards";
import { TimeseriesChart } from "@/components/charts/timeseries-chart";
import { EspecieDonut } from "@/components/charts/especie-donut";
import { useFiltros } from "@/hooks/use-filters";
import { useEspecies, useOverview, useTimeseries } from "@/hooks/use-api";

export default function PainelPage() {
  const { filtros, qs } = useFiltros();
  const overview = useOverview(qs);
  const timeseries = useTimeseries(qs);
  const especies = useEspecies(qs);

  return (
    <>
      <KpiCards
        overview={overview.data}
        carregando={overview.isLoading}
        recarregando={overview.isFetching && !overview.isLoading}
        metrica={filtros.metrica}
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
    </>
  );
}
