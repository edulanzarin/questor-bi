"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { hojeISO, inicioDoMesISO } from "@/lib/format";
import type { Metrica } from "@/lib/types";

export interface FiltrosState {
  inicio: string;
  fim: string;
  empresas: number[];
  especies: string[];
  metrica: Metrica;
}

export function useFiltros() {
  const pathname = usePathname();
  const sp = useSearchParams();

  const filtros = useMemo<FiltrosState>(
    () => ({
      inicio: sp.get("inicio") ?? inicioDoMesISO(),
      fim: sp.get("fim") ?? hojeISO(),
      empresas: (sp.get("empresas") ?? "").split(",").filter(Boolean).map(Number),
      especies: (sp.get("especies") ?? "").split(",").filter(Boolean),
      metrica: sp.get("metrica") === "qtd" ? "qtd" : "valor",
    }),
    [sp]
  );

  const atualizar = useCallback(
    (mudancas: Partial<FiltrosState>) => {
      const novo = { ...filtros, ...mudancas };
      const params = new URLSearchParams();
      params.set("inicio", novo.inicio);
      params.set("fim", novo.fim);
      if (novo.empresas.length) params.set("empresas", novo.empresas.join(","));
      if (novo.especies.length) params.set("especies", novo.especies.join(","));
      if (novo.metrica !== "valor") params.set("metrica", novo.metrica);
      // replaceState nativo: o Next sincroniza useSearchParams e não refaz RSC
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    },
    [filtros, pathname]
  );

  /** Query string dos filtros de dados enviada às APIs. */
  const qs = useMemo(() => {
    const params = new URLSearchParams({ inicio: filtros.inicio, fim: filtros.fim });
    if (filtros.empresas.length) params.set("empresas", filtros.empresas.join(","));
    if (filtros.especies.length) params.set("especies", filtros.especies.join(","));
    return params.toString();
  }, [filtros]);

  return { filtros, atualizar, qs };
}
