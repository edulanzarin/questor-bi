"use client";

import { useMemo, useState } from "react";
import { StatTiles, type Stat } from "@/components/stat-tiles";
import { SerieChart } from "@/components/charts/serie-chart";
import { TopBarChart } from "@/components/charts/top-bar-chart";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { useFiltros } from "@/hooks/use-filters";
import {
  useDevolucoes,
  useDevolucoesContrapartes,
  useDevolucoesResumo,
  useDevolucoesSerie,
} from "@/hooks/use-api";
import { brl, num } from "@/lib/format";

type Tipo = "ent" | "sai";

function pct(parte: number, base: number): string {
  if (base <= 0) return "0%";
  return `${((parte / base) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export default function DevolucoesPage() {
  const { filtros, qs } = useFiltros();
  const [tipoSerie, setTipoSerie] = useState<Tipo>("sai");
  const [tipoCfop, setTipoCfop] = useState<Tipo>("sai");
  const [tipoContra, setTipoContra] = useState<Tipo>("sai");

  const resumo = useDevolucoesResumo(qs);
  const serie = useDevolucoesSerie(qs, tipoSerie);
  const cfops = useDevolucoes(qs, tipoCfop, filtros.metrica);
  const contrapartes = useDevolucoesContrapartes(qs, tipoContra, filtros.metrica);

  const stats = useMemo<Stat[] | undefined>(() => {
    const d = resumo.data;
    if (!d) return undefined;
    return [
      {
        rotulo: "Devolução de venda (entra)",
        valor: brl(d.ent.valor),
        sub: `${num(d.ent.qtd)} notas · ${pct(d.ent.valor, d.faturamentoEnt)} das entradas`,
        cor: "var(--ent)",
      },
      {
        rotulo: "Devolução de compra (sai)",
        valor: brl(d.sai.valor),
        sub: `${num(d.sai.qtd)} notas · ${pct(d.sai.valor, d.faturamentoSai)} das saídas`,
        cor: "var(--sai)",
      },
      {
        rotulo: "Total devolvido",
        valor: brl(d.ent.valor + d.sai.valor),
        sub: `${num(d.ent.qtd + d.sai.qtd)} notas com devolução`,
      },
    ];
  }, [resumo.data]);

  return (
    <>
      <StatTiles stats={stats} carregando={resumo.isLoading} colunas={3} />

      <SerieChart
        titulo="Devoluções no período"
        subtitulo={`Valor devolvido por ${serie.data?.granularidade === "mes" ? "mês" : "dia"} · ${tipoSerie === "ent" ? "de venda" : "de compra"}`}
        dados={serie.data?.pontos}
        granularidade={serie.data?.granularidade ?? "dia"}
        cor={tipoSerie === "ent" ? "var(--ent)" : "var(--sai)"}
        formato="valor"
        nomeSerie="Devolvido"
        carregando={serie.isLoading}
        recarregando={serie.isFetching && !serie.isLoading}
        acao={<SeletorTipo tipo={tipoSerie} onTipo={setTipoSerie} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopBarChart
          titulo="Devoluções por CFOP"
          subtituloEnt="Naturezas de devolução (entradas)"
          subtituloSai="Naturezas de devolução (saídas)"
          dados={cfops.data}
          carregando={cfops.isLoading}
          recarregando={cfops.isFetching && !cfops.isLoading}
          tipo={tipoCfop}
          onTipo={setTipoCfop}
          metrica={filtros.metrica}
          rotuloQtd="Notas"
        />
        <TopBarChart
          titulo="Quem mais devolve"
          subtituloEnt="Contrapartes das devoluções de venda"
          subtituloSai="Contrapartes das devoluções de compra"
          dados={contrapartes.data}
          carregando={contrapartes.isLoading}
          recarregando={contrapartes.isFetching && !contrapartes.isLoading}
          tipo={tipoContra}
          onTipo={setTipoContra}
          metrica={filtros.metrica}
          rotuloQtd="Notas"
        />
      </div>
    </>
  );
}
