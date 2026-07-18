"use client";

import { useMemo, useState } from "react";
import { KpiCards } from "@/components/kpi-cards";
import { StatTiles, type Stat } from "@/components/stat-tiles";
import { ImpostosCard } from "@/components/impostos-card";
import { TimeseriesChart } from "@/components/charts/timeseries-chart";
import { EspecieDonut } from "@/components/charts/especie-donut";
import { TopBarChart } from "@/components/charts/top-bar-chart";
import { EstadosChart } from "@/components/charts/estados-chart";
import { useFiltros } from "@/hooks/use-filters";
import {
  useCancelamentosResumo,
  useCfops,
  useDevolucoesResumo,
  useEspecies,
  useEstados,
  useFrete,
  useImpostos,
  useMunicipios,
  useOverview,
  useProdutos,
  useTimeseries,
  useTopEmpresas,
  useTopPessoas,
} from "@/hooks/use-api";
import { brl, num } from "@/lib/format";
import type { TopItem } from "@/lib/types";

type Tipo = "ent" | "sai";

function pct(parte: number, base: number): string {
  if (base <= 0) return "0%";
  return `${((parte / base) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export default function PainelPage() {
  const { filtros, qs } = useFiltros();
  const [tipoImpostos, setTipoImpostos] = useState<Tipo>("sai");
  const [tipoEmpresas, setTipoEmpresas] = useState<Tipo>("sai");
  const [tipoPessoas, setTipoPessoas] = useState<Tipo>("ent");
  const [tipoProdutos, setTipoProdutos] = useState<Tipo>("sai");
  const [tipoCfops, setTipoCfops] = useState<Tipo>("sai");
  const [tipoEstados, setTipoEstados] = useState<Tipo>("sai");
  const [tipoMunic, setTipoMunic] = useState<Tipo>("sai");
  const [tipoFrete, setTipoFrete] = useState<Tipo>("sai");

  const overview = useOverview(qs);
  const timeseries = useTimeseries(qs);
  const especies = useEspecies(qs);
  const devol = useDevolucoesResumo(qs);
  const cancel = useCancelamentosResumo(qs);
  const impostos = useImpostos(qs, tipoImpostos);
  const topEmpresas = useTopEmpresas(qs, tipoEmpresas, filtros.metrica);
  const topPessoas = useTopPessoas(qs, tipoPessoas, filtros.metrica);
  const produtos = useProdutos(qs, tipoProdutos, filtros.metrica);
  const cfops = useCfops(qs, tipoCfops, filtros.metrica);
  const estados = useEstados(qs, tipoEstados);
  const municipios = useMunicipios(qs, tipoMunic, filtros.metrica);
  const frete = useFrete(qs, tipoFrete, filtros.metrica);

  const mostraTopEmpresas = filtros.empresas.length !== 1;

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

  const produtosItems = useMemo<TopItem[] | undefined>(
    () =>
      produtos.data?.map((p) => ({
        codigo: p.codigoProduto,
        nome: p.descricao ?? `Produto ${p.codigoProduto}`,
        valor: p.valor,
        qtd: p.qtd,
        detalhe: [p.unidade ? `Unid. ${p.unidade}` : null, mostraTopEmpresas ? p.nomeEmpresa : null]
          .filter(Boolean)
          .join(" · "),
      })),
    [produtos.data, mostraTopEmpresas]
  );

  const cfopItems = useMemo<TopItem[] | undefined>(
    () =>
      cfops.data?.map((c) => ({
        codigo: c.cfop,
        nome: `${c.cfop} · ${c.descricao ?? "—"}`,
        valor: c.valor,
        qtd: c.itens,
        detalhe: null,
      })),
    [cfops.data]
  );

  return (
    <>
      {/* Panorama */}
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

      {/* Tendência e composição */}
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

      {/* Impostos */}
      <ImpostosCard
        dados={impostos.data}
        carregando={impostos.isLoading}
        recarregando={impostos.isFetching && !impostos.isLoading}
        tipo={tipoImpostos}
        onTipo={setTipoImpostos}
      />

      {/* Rankings — movimentação */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {mostraTopEmpresas && (
          <TopBarChart
            titulo="Top 10 empresas"
            subtituloEnt="Maiores volumes de entrada"
            subtituloSai="Maiores volumes de saída"
            dados={topEmpresas.data}
            carregando={topEmpresas.isLoading}
            recarregando={topEmpresas.isFetching && !topEmpresas.isLoading}
            tipo={tipoEmpresas}
            onTipo={setTipoEmpresas}
            metrica={filtros.metrica}
          />
        )}
        <TopBarChart
          titulo={tipoPessoas === "ent" ? "Top 10 fornecedores" : "Top 10 clientes"}
          subtituloEnt="Contrapartes das notas de entrada (inclui devoluções)"
          subtituloSai="Contrapartes das notas de saída"
          dados={topPessoas.data}
          carregando={topPessoas.isLoading}
          recarregando={topPessoas.isFetching && !topPessoas.isLoading}
          tipo={tipoPessoas}
          onTipo={setTipoPessoas}
          metrica={filtros.metrica}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopBarChart
          titulo="Top 10 produtos"
          subtituloEnt="Itens mais recebidos nas entradas"
          subtituloSai="Itens mais vendidos nas saídas"
          dados={produtosItems}
          carregando={produtos.isLoading}
          recarregando={produtos.isFetching && !produtos.isLoading}
          tipo={tipoProdutos}
          onTipo={setTipoProdutos}
          metrica={filtros.metrica}
          rotuloQtd="Quantidade"
          qtdFisica
        />
        <TopBarChart
          titulo="Top CFOPs"
          subtituloEnt="Naturezas de operação nas entradas"
          subtituloSai="Naturezas de operação nas saídas"
          dados={cfopItems}
          carregando={cfops.isLoading}
          recarregando={cfops.isFetching && !cfops.isLoading}
          tipo={tipoCfops}
          onTipo={setTipoCfops}
          metrica={filtros.metrica}
          rotuloQtd="Itens"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EstadosChart
          dados={estados.data}
          carregando={estados.isLoading}
          recarregando={estados.isFetching && !estados.isLoading}
          tipo={tipoEstados}
          onTipo={setTipoEstados}
          metrica={filtros.metrica}
        />
        <TopBarChart
          titulo="Top municípios"
          subtituloEnt="Cidades das contrapartes (entradas)"
          subtituloSai="Cidades das contrapartes (saídas)"
          dados={municipios.data}
          carregando={municipios.isLoading}
          recarregando={municipios.isFetching && !municipios.isLoading}
          tipo={tipoMunic}
          onTipo={setTipoMunic}
          metrica={filtros.metrica}
        />
      </div>
      <TopBarChart
        titulo="Modalidade de frete"
        subtituloEnt="Quem responde pelo frete (entradas)"
        subtituloSai="Quem responde pelo frete (saídas)"
        dados={frete.data}
        carregando={frete.isLoading}
        recarregando={frete.isFetching && !frete.isLoading}
        tipo={tipoFrete}
        onTipo={setTipoFrete}
        metrica={filtros.metrica}
        rotuloQtd="Notas"
      />
    </>
  );
}
