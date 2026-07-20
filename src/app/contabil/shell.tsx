"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";
import clsx from "clsx";
import { ConfFilterBar } from "@/components/filters/conf-filter-bar";
import { useFiltros } from "@/hooks/use-filters";
import {
  abaContabilAtual,
  abasDaSecao,
  abaUsaPeriodo,
  secaoContabilAtual,
} from "@/lib/contabil-secoes";
import { limparEstadoSecao } from "@/lib/estado-secao";
import { dataBR } from "@/lib/format";

export function ContabilShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const { filtros } = useFiltros();
  const secao = secaoContabilAtual(pathname);
  const aba = abaContabilAtual(pathname);
  const abas = abasDaSecao(pathname);
  const carregando = useIsFetching() > 0;

  // Busca, filtros e extrato carregado valem enquanto se está na seção (trocar
  // de aba mantém). Sair da seção — ou do módulo — libera tudo.
  const secaoPath = secao?.path;
  useEffect(() => {
    return () => {
      if (secaoPath) limparEstadoSecao(secaoPath);
    };
  }, [secaoPath]);
  const usaPeriodo = abaUsaPeriodo(pathname);

  // Os filtros seguem na URL ao trocar de aba.
  const qs = sp.toString();
  const suffix = qs ? `?${qs}` : "";

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
            {aba && <p className="text-xs text-muted">{aba.descricao}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {carregando && (
            <span className="anim-fade-in flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-4 animate-spin" />
              Atualizando…
            </span>
          )}
          {usaPeriodo && (
            <p className="hidden text-xs text-muted sm:block">
              {dataBR(filtros.inicio)} – {dataBR(filtros.fim)}
            </p>
          )}
        </div>
      </header>

      {aba && abas.length > 1 && (
        <nav className="mb-4 flex gap-1 border-b border-hairline" aria-label={secao?.rotulo}>
          {abas.map((a) => {
            const ativa = a.id === aba.id;
            return (
              <Link
                key={a.id}
                href={`${a.path}${suffix}`}
                aria-current={ativa ? "page" : undefined}
                className={clsx(
                  "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                  ativa
                    ? "border-ent font-medium text-ent"
                    : "border-transparent text-muted hover:border-hairline hover:text-ink"
                )}
              >
                {a.rotulo}
              </Link>
            );
          })}
        </nav>
      )}

      <ConfFilterBar mostrarPeriodo={abaUsaPeriodo(pathname)} />

      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}
