"use client";

import { useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Empresa,
  Metrica,
  Overview,
  Timeseries,
  EspecieResumo,
  TopItem,
  EstadoResumo,
  ProdutoTop,
  CfopResumo,
  Impostos,
  ImpostosSerie,
  NotasListaResp,
  NotaItem,
  ContrapartesResp,
  DevolucoesResumo,
  CancelamentosResumo,
  PontoValorSerie,
  ColaboradorProd,
  ProdutividadeSerie,
  ProdutividadeCalendario,
  ConformidadeResumo,
  ConformidadeEmpresa,
  TributosCargaEmpresa,
} from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let mensagem = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) mensagem = body.error;
    } catch {}
    throw new Error(mensagem);
  }
  return res.json();
}

function useApiQuery<T>(chave: unknown[], url: string, enabled = true) {
  const q = useQuery<T>({
    queryKey: chave,
    queryFn: () => fetchJson<T>(url),
    placeholderData: keepPreviousData,
    enabled,
  });

  useEffect(() => {
    if (q.isError) {
      toast.error(q.error instanceof Error ? q.error.message : "Falha ao carregar dados");
    }
  }, [q.isError, q.error]);

  return q;
}

export const useEmpresas = () =>
  useApiQuery<Empresa[]>(["empresas"], "/api/empresas");

export const useOverview = (qs: string, enabled = true) =>
  useApiQuery<Overview>(["overview", qs], `/api/fiscal/overview?${qs}`, enabled);

export const useTimeseries = (qs: string, enabled = true) =>
  useApiQuery<Timeseries>(["timeseries", qs], `/api/fiscal/timeseries?${qs}`, enabled);

export const useEspecies = (qs: string, enabled = true) =>
  useApiQuery<EspecieResumo[]>(["especies", qs], `/api/fiscal/especies?${qs}`, enabled);

export const useTopEmpresas = (
  qs: string,
  tipo: "ent" | "sai",
  metrica: Metrica,
  enabled = true
) =>
  useApiQuery<TopItem[]>(
    ["top-empresas", qs, tipo, metrica],
    `/api/fiscal/top-empresas?${qs}&tipo=${tipo}&metrica=${metrica}`,
    enabled
  );

export const useTopPessoas = (
  qs: string,
  tipo: "ent" | "sai",
  metrica: Metrica,
  enabled = true
) =>
  useApiQuery<TopItem[]>(
    ["top-pessoas", qs, tipo, metrica],
    `/api/fiscal/top-pessoas?${qs}&tipo=${tipo}&metrica=${metrica}`,
    enabled
  );

export const useEstados = (qs: string, tipo: "ent" | "sai", enabled = true) =>
  useApiQuery<EstadoResumo[]>(
    ["estados", qs, tipo],
    `/api/fiscal/estados?${qs}&tipo=${tipo}`,
    enabled
  );

export const useProdutos = (
  qs: string,
  tipo: "ent" | "sai",
  metrica: Metrica,
  enabled = true
) =>
  useApiQuery<ProdutoTop[]>(
    ["produtos", qs, tipo, metrica],
    `/api/fiscal/produtos?${qs}&tipo=${tipo}&metrica=${metrica}`,
    enabled
  );

export const useCfops = (
  qs: string,
  tipo: "ent" | "sai",
  metrica: Metrica,
  enabled = true
) =>
  useApiQuery<CfopResumo[]>(
    ["cfops", qs, tipo, metrica],
    `/api/fiscal/cfops?${qs}&tipo=${tipo}&metrica=${metrica}`,
    enabled
  );

export const useImpostos = (qs: string, tipo: "ent" | "sai", enabled = true) =>
  useApiQuery<Impostos>(
    ["impostos", qs, tipo],
    `/api/fiscal/impostos?${qs}&tipo=${tipo}`,
    enabled
  );

export const useDevolucoes = (
  qs: string,
  tipo: "ent" | "sai",
  metrica: Metrica,
  enabled = true
) =>
  useApiQuery<TopItem[]>(
    ["devolucoes", qs, tipo, metrica],
    `/api/fiscal/devolucoes?${qs}&tipo=${tipo}&metrica=${metrica}`,
    enabled
  );

export const useImpostosSerie = (qs: string, tipo: "ent" | "sai", enabled = true) =>
  useApiQuery<ImpostosSerie>(
    ["impostos-serie", qs, tipo],
    `/api/fiscal/impostos-serie?${qs}&tipo=${tipo}`,
    enabled
  );

export const useNotasLista = (
  qs: string,
  tipo: "ent" | "sai",
  page: number,
  busca: string,
  situacao: "todas" | "normais" | "canceladas",
  pessoa: number | null,
  enabled = true
) =>
  useApiQuery<NotasListaResp>(
    ["notas-lista", qs, tipo, page, busca, situacao, pessoa],
    `/api/fiscal/notas-lista?${qs}&tipo=${tipo}&page=${page}&busca=${encodeURIComponent(busca)}&situacao=${situacao}${pessoa != null ? `&pessoa=${pessoa}` : ""}`,
    enabled
  );

export const useContrapartes = (
  qs: string,
  tipo: "ent" | "sai",
  q: string,
  page: number,
  enabled = true
) =>
  useApiQuery<ContrapartesResp>(
    ["contrapartes", qs, tipo, q, page],
    `/api/fiscal/contrapartes?${qs}&tipo=${tipo}&q=${encodeURIComponent(q)}&page=${page}`,
    enabled
  );

export const useNotaItens = (
  tipo: "ent" | "sai",
  empresa: number | null,
  chave: string | null
) =>
  useApiQuery<NotaItem[]>(
    ["nota-itens", tipo, empresa, chave],
    `/api/fiscal/nota-itens?tipo=${tipo}&empresa=${empresa}&chave=${chave}`,
    empresa != null && chave != null
  );

export const useImpostosEmpresas = (qs: string, tipo: "ent" | "sai", enabled = true) =>
  useApiQuery<TopItem[]>(
    ["impostos-empresas", qs, tipo],
    `/api/fiscal/impostos-empresas?${qs}&tipo=${tipo}`,
    enabled
  );

export const useMunicipios = (qs: string, tipo: "ent" | "sai", metrica: Metrica) =>
  useApiQuery<TopItem[]>(
    ["municipios", qs, tipo, metrica],
    `/api/fiscal/municipios?${qs}&tipo=${tipo}&metrica=${metrica}`
  );

export const useFrete = (qs: string, tipo: "ent" | "sai", metrica: Metrica) =>
  useApiQuery<TopItem[]>(
    ["frete", qs, tipo, metrica],
    `/api/fiscal/frete?${qs}&tipo=${tipo}&metrica=${metrica}`
  );

export const useFaixasValor = (qs: string, tipo: "ent" | "sai", metrica: Metrica) =>
  useApiQuery<TopItem[]>(
    ["faixas-valor", qs, tipo, metrica],
    `/api/fiscal/faixas-valor?${qs}&tipo=${tipo}&metrica=${metrica}`
  );

export const useOrigem = (qs: string, tipo: "ent" | "sai", metrica: Metrica) =>
  useApiQuery<TopItem[]>(
    ["origem", qs, tipo, metrica],
    `/api/fiscal/origem?${qs}&tipo=${tipo}&metrica=${metrica}`
  );

export const useDevolucoesResumo = (qs: string, enabled = true) =>
  useApiQuery<DevolucoesResumo>(
    ["devolucoes-resumo", qs],
    `/api/fiscal/devolucoes-resumo?${qs}`,
    enabled
  );

export const useDevolucoesSerie = (qs: string, tipo: "ent" | "sai", enabled = true) =>
  useApiQuery<PontoValorSerie>(
    ["devolucoes-serie", qs, tipo],
    `/api/fiscal/devolucoes-serie?${qs}&tipo=${tipo}`,
    enabled
  );

export const useDevolucoesContrapartes = (
  qs: string,
  tipo: "ent" | "sai",
  metrica: Metrica,
  enabled = true
) =>
  useApiQuery<TopItem[]>(
    ["devolucoes-contrapartes", qs, tipo, metrica],
    `/api/fiscal/devolucoes-contrapartes?${qs}&tipo=${tipo}&metrica=${metrica}`,
    enabled
  );

export const useCancelamentosResumo = (qs: string, enabled = true) =>
  useApiQuery<CancelamentosResumo>(
    ["cancelamentos-resumo", qs],
    `/api/fiscal/cancelamentos-resumo?${qs}`,
    enabled
  );

export const useCancelamentosSerie = (qs: string, tipo: "ent" | "sai", enabled = true) =>
  useApiQuery<PontoValorSerie>(
    ["cancelamentos-serie", qs, tipo],
    `/api/fiscal/cancelamentos-serie?${qs}&tipo=${tipo}`,
    enabled
  );

export const useProdutividade = (qs: string, enabled = true) =>
  useApiQuery<ColaboradorProd[]>(
    ["produtividade", qs],
    `/api/fiscal/produtividade?${qs}`,
    enabled
  );

export const useProdutividadeSerie = (qs: string, enabled = true) =>
  useApiQuery<ProdutividadeSerie>(
    ["produtividade-serie", qs],
    `/api/fiscal/produtividade-serie?${qs}`,
    enabled
  );

export const useProdutividadeCalendario = (qs: string, enabled = true) =>
  useApiQuery<ProdutividadeCalendario>(
    ["produtividade-calendario", qs],
    `/api/fiscal/produtividade-calendario?${qs}`,
    enabled
  );

export const useTributosDifal = (qs: string, enabled = true) =>
  useApiQuery<TopItem[]>(["tributos-difal", qs], `/api/fiscal/tributos-difal?${qs}`, enabled);

export const useTributosCst = (qs: string, enabled = true) =>
  useApiQuery<TopItem[]>(["tributos-cst", qs], `/api/fiscal/tributos-cst?${qs}`, enabled);

export const useTributosCargaEmpresas = (qs: string, enabled = true) =>
  useApiQuery<TributosCargaEmpresa[]>(
    ["tributos-carga-empresas", qs],
    `/api/fiscal/tributos-carga-empresas?${qs}`,
    enabled
  );

export const useConformidade = (qs: string, enabled = true) =>
  useApiQuery<ConformidadeResumo>(
    ["conformidade", qs],
    `/api/fiscal/conformidade?${qs}`,
    enabled
  );

export const useConformidadeEmpresas = (qs: string, enabled = true) =>
  useApiQuery<ConformidadeEmpresa[]>(
    ["conformidade-empresas", qs],
    `/api/fiscal/conformidade-empresas?${qs}`,
    enabled
  );

export const useCancelamentosRanking = (
  qs: string,
  tipo: "ent" | "sai",
  por: "empresa" | "especie",
  enabled = true
) =>
  useApiQuery<TopItem[]>(
    ["cancelamentos-ranking", qs, tipo, por],
    `/api/fiscal/cancelamentos-ranking?${qs}&tipo=${tipo}&por=${por}`,
    enabled
  );
