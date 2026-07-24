"use client";

import { useState } from "react";
import { KpiCards } from "@/components/kpi-cards";
import { ResumoMovimento } from "@/components/resumo-movimento";
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

type Tipo = "ent" | "sai";

export default function PainelPage() {
  const { filtros, qs } = useFiltros();
  const [tipoImpostos, setTipoImpostos] = useState<Tipo>("sai");

  const overview = useOverview(qs);
  const timeseries = useTimeseries(qs);
  const especies = useEspecies(qs);
  const devol = useDevolucoesResumo(qs);
  const cancel = useCancelamentosResumo(qs);
  const impostos = useImpostos(qs, tipoImpostos);

  return (
    <>
      <KpiCards
        overview={overview.data}
        carregando={overview.isLoading}
        recarregando={overview.isFetching && !overview.isLoading}
        metrica={filtros.metrica}
      />
      <ResumoMovimento
        devol={devol.data}
        cancel={cancel.data}
        carregando={devol.isLoading || cancel.isLoading}
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
