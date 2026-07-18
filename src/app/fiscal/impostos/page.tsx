"use client";

import { useState } from "react";
import { ImpostosCard } from "@/components/impostos-card";
import { ImpostosSerieChart } from "@/components/charts/impostos-serie-chart";
import { TopBarChart } from "@/components/charts/top-bar-chart";
import { useFiltros } from "@/hooks/use-filters";
import { useImpostos, useImpostosEmpresas, useImpostosSerie } from "@/hooks/use-api";

export default function ImpostosPage() {
  const { qs } = useFiltros();
  const [tipo, setTipo] = useState<"ent" | "sai">("sai");
  const impostos = useImpostos(qs, tipo);
  const serie = useImpostosSerie(qs, tipo);
  const empresas = useImpostosEmpresas(qs, tipo);

  return (
    <>
      <ImpostosCard
        dados={impostos.data}
        carregando={impostos.isLoading}
        recarregando={impostos.isFetching && !impostos.isLoading}
        tipo={tipo}
        onTipo={setTipo}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ImpostosSerieChart
          dados={serie.data}
          carregando={serie.isLoading}
          recarregando={serie.isFetching && !serie.isLoading}
          tipo={tipo}
        />
        <TopBarChart
          titulo="Top empresas por imposto"
          subtituloEnt="Total de tributos de item (entradas)"
          subtituloSai="Total de tributos de item (saídas)"
          dados={empresas.data}
          carregando={empresas.isLoading}
          recarregando={empresas.isFetching && !empresas.isLoading}
          tipo={tipo}
          onTipo={setTipo}
          metrica="valor"
        />
      </div>
    </>
  );
}
