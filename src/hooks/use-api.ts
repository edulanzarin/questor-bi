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
  DevolucoesResumo,
  CancelamentosResumo,
  PontoValorSerie,
  ApuracaoLinha,
  ApuracaoSerie,
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
  enabled = true
) =>
  useApiQuery<NotasListaResp>(
    ["notas-lista", qs, tipo, page, busca],
    `/api/fiscal/notas-lista?${qs}&tipo=${tipo}&page=${page}&busca=${encodeURIComponent(busca)}`,
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

export const useApuracao = (qs: string) =>
  useApiQuery<ApuracaoLinha[]>(["apuracao", qs], `/api/fiscal/apuracao?${qs}`);

export const useApuracaoSerie = (qs: string) =>
  useApiQuery<ApuracaoSerie>(["apuracao-serie", qs], `/api/fiscal/apuracao-serie?${qs}`);

export const useApuracaoEmpresas = (qs: string) =>
  useApiQuery<TopItem[]>(["apuracao-empresas", qs], `/api/fiscal/apuracao-empresas?${qs}`);
