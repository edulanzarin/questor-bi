"use client";

import { useMemo, useState } from "react";
import { TopBarChart } from "@/components/charts/top-bar-chart";
import { EstadosChart } from "@/components/charts/estados-chart";
import { useFiltros } from "@/hooks/use-filters";
import {
  useCfops,
  useEstados,
  useFrete,
  useMunicipios,
  useProdutos,
  useTopEmpresas,
  useTopPessoas,
} from "@/hooks/use-api";
import type { TopItem } from "@/lib/types";

type Tipo = "ent" | "sai";

export default function AnalisesPage() {
  const { filtros, qs } = useFiltros();
  const [tipoEmpresas, setTipoEmpresas] = useState<Tipo>("sai");
  const [tipoPessoas, setTipoPessoas] = useState<Tipo>("ent");
  const [tipoProdutos, setTipoProdutos] = useState<Tipo>("sai");
  const [tipoCfops, setTipoCfops] = useState<Tipo>("sai");
  const [tipoEstados, setTipoEstados] = useState<Tipo>("sai");
  const [tipoMunic, setTipoMunic] = useState<Tipo>("sai");
  const [tipoFrete, setTipoFrete] = useState<Tipo>("sai");

  const topEmpresas = useTopEmpresas(qs, tipoEmpresas, filtros.metrica);
  const topPessoas = useTopPessoas(qs, tipoPessoas, filtros.metrica);
  const produtos = useProdutos(qs, tipoProdutos, filtros.metrica);
  const cfops = useCfops(qs, tipoCfops, filtros.metrica);
  const estados = useEstados(qs, tipoEstados);
  const municipios = useMunicipios(qs, tipoMunic, filtros.metrica);
  const frete = useFrete(qs, tipoFrete, filtros.metrica);

  const mostraTopEmpresas = filtros.empresas.length !== 1;

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
