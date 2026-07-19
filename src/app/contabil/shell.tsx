"use client";

import { usePathname } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { useIsFetching } from "@tanstack/react-query";
import { ConfFilterBar } from "@/components/filters/conf-filter-bar";
import { useFiltros } from "@/hooks/use-filters";
import { secaoContabilAtual } from "@/lib/contabil-secoes";
import { dataBR } from "@/lib/format";

export function ContabilShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { filtros } = useFiltros();
  const secao = secaoContabilAtual(pathname);
  const carregando = useIsFetching() > 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-ent/12 text-ent">
            <BookOpen className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Contábil</p>
            <h1 className="text-xl font-semibold tracking-tight">{secao?.rotulo ?? "Contábil"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {carregando && (
            <span className="anim-fade-in flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-4 animate-spin" />
              Atualizando…
            </span>
          )}
          <p className="hidden text-xs text-muted sm:block">
            {dataBR(filtros.inicio)} – {dataBR(filtros.fim)}
          </p>
        </div>
      </header>

      <ConfFilterBar />

      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}
