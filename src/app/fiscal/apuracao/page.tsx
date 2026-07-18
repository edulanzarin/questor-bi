"use client";

import { ApuracaoTabela } from "@/components/apuracao-tabela";
import { ApuracaoSerieChart } from "@/components/charts/apuracao-serie-chart";
import { TopBarChart } from "@/components/charts/top-bar-chart";
import { useFiltros } from "@/hooks/use-filters";
import { useApuracao, useApuracaoEmpresas, useApuracaoSerie } from "@/hooks/use-api";

export default function ApuracaoPage() {
  const { qs } = useFiltros();
  const apuracao = useApuracao(qs);
  const serie = useApuracaoSerie(qs);
  const empresas = useApuracaoEmpresas(qs);

  return (
    <>
      <ApuracaoTabela
        dados={apuracao.data}
        carregando={apuracao.isLoading}
        recarregando={apuracao.isFetching && !apuracao.isLoading}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ApuracaoSerieChart
          dados={serie.data}
          carregando={serie.isLoading}
          recarregando={serie.isFetching && !serie.isLoading}
        />
        <TopBarChart
          titulo="Saldo de ICMS por empresa"
          subtituloEnt="Débito − crédito de ICMS"
          subtituloSai="Débito − crédito de ICMS"
          dados={empresas.data}
          carregando={empresas.isLoading}
          recarregando={empresas.isFetching && !empresas.isLoading}
          tipo="sai"
          onTipo={() => {}}
          metrica="valor"
          semSeletor
        />
      </div>
    </>
  );
}
