"use client";

import { useMemo, useState } from "react";
import { StatTiles, type Stat } from "@/components/stat-tiles";
import { SerieChart } from "@/components/charts/serie-chart";
import { TopBarChart, SeletorTipo } from "@/components/charts/top-bar-chart";
import { useFiltros } from "@/hooks/use-filters";
import {
  useCancelamentosRanking,
  useCancelamentosResumo,
  useCancelamentosSerie,
} from "@/hooks/use-api";
import { num } from "@/lib/format";

type Tipo = "ent" | "sai";

function taxa(canceladas: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((canceladas / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

export default function CancelamentosPage() {
  const { qs } = useFiltros();
  const [tipoSerie, setTipoSerie] = useState<Tipo>("sai");
  const [tipoEmp, setTipoEmp] = useState<Tipo>("sai");
  const [tipoEsp, setTipoEsp] = useState<Tipo>("sai");

  const resumo = useCancelamentosResumo(qs);
  const serie = useCancelamentosSerie(qs, tipoSerie);
  const porEmpresa = useCancelamentosRanking(qs, tipoEmp, "empresa");
  const porEspecie = useCancelamentosRanking(qs, tipoEsp, "especie");

  const stats = useMemo<Stat[] | undefined>(() => {
    const d = resumo.data;
    if (!d) return undefined;
    return [
      {
        rotulo: "Canceladas nas entradas",
        valor: num(d.ent.canceladas),
        sub: `${taxa(d.ent.canceladas, d.ent.total)} das ${num(d.ent.total)} entradas`,
        cor: "var(--ent)",
      },
      {
        rotulo: "Canceladas nas saídas",
        valor: num(d.sai.canceladas),
        sub: `${taxa(d.sai.canceladas, d.sai.total)} das ${num(d.sai.total)} saídas`,
        cor: "var(--sai)",
      },
      {
        rotulo: "Total cancelado",
        valor: num(d.ent.canceladas + d.sai.canceladas),
        sub: `${taxa(d.ent.canceladas + d.sai.canceladas, d.ent.total + d.sai.total)} do total de notas`,
      },
    ];
  }, [resumo.data]);

  return (
    <>
      <StatTiles stats={stats} carregando={resumo.isLoading} colunas={3} />

      <SerieChart
        titulo="Cancelamentos no período"
        subtitulo={`Notas canceladas por ${serie.data?.granularidade === "mes" ? "mês" : "dia"} · ${tipoSerie === "ent" ? "entradas" : "saídas"}`}
        dados={serie.data?.pontos}
        granularidade={serie.data?.granularidade ?? "dia"}
        cor="var(--sai)"
        formato="qtd"
        nomeSerie="Canceladas"
        carregando={serie.isLoading}
        recarregando={serie.isFetching && !serie.isLoading}
        acao={<SeletorTipo tipo={tipoSerie} onTipo={setTipoSerie} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopBarChart
          titulo="Canceladas por empresa"
          subtituloEnt="Empresas com mais cancelamentos (entradas)"
          subtituloSai="Empresas com mais cancelamentos (saídas)"
          dados={porEmpresa.data}
          carregando={porEmpresa.isLoading}
          recarregando={porEmpresa.isFetching && !porEmpresa.isLoading}
          tipo={tipoEmp}
          onTipo={setTipoEmp}
          metrica="qtd"
          rotuloQtd="Canceladas"
        />
        <TopBarChart
          titulo="Canceladas por espécie"
          subtituloEnt="Tipos de documento cancelados (entradas)"
          subtituloSai="Tipos de documento cancelados (saídas)"
          dados={porEspecie.data}
          carregando={porEspecie.isLoading}
          recarregando={porEspecie.isFetching && !porEspecie.isLoading}
          tipo={tipoEsp}
          onTipo={setTipoEsp}
          metrica="qtd"
          rotuloQtd="Canceladas"
        />
      </div>
    </>
  );
}
