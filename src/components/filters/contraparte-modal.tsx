"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search, X } from "lucide-react";
import { useContrapartes } from "@/hooks/use-api";
import { documento, num } from "@/lib/format";

export interface PessoaSel {
  codigo: number;
  nome: string;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  qs: string;
  tipo: "ent" | "sai";
  selecionado: PessoaSel | null;
  onSelecionar: (p: PessoaSel | null) => void;
  /** Módulo que serve a busca — cada um pela sua rota, gateada pelo módulo. */
  modulo?: "fiscal" | "contabil";
}

export function ContraparteModal({
  aberto,
  onFechar,
  qs,
  tipo,
  selecionado,
  onSelecionar,
  modulo = "fiscal",
}: Props) {
  const [q, setQ] = useState("");
  const [qDeb, setQDeb] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setQDeb(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [qDeb, tipo, qs]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  const { data, isFetching } = useContrapartes(qs, tipo, qDeb, page, aberto, modulo);

  if (!aberto) return null;

  const rows = data?.rows ?? [];

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="anim-scale-in card flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filtrar por contraparte"
      >
        <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Contraparte</h3>
            <p className="mt-0.5 text-xs text-muted">
              Fornecedores e clientes com movimento no período
            </p>
          </div>
          <button
            onClick={onFechar}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex items-center gap-2 border-b border-hairline px-6 py-3">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          {isFetching && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
        </div>

        {selecionado && (
          <div className="flex items-center justify-between gap-2 border-b border-hairline bg-ent/8 px-6 py-2 text-sm">
            <span className="truncate">
              Filtrando por <span className="font-medium">{selecionado.nome}</span>
            </span>
            <button
              onClick={() => {
                onSelecionar(null);
                onFechar();
              }}
              className="shrink-0 text-xs text-ent hover:underline"
            >
              Limpar filtro
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {!isFetching && rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              Nenhuma contraparte encontrada.
            </p>
          )}
          <ul>
            {rows.map((c) => (
              <li key={c.codigo}>
                <button
                  onClick={() => {
                    onSelecionar({ codigo: c.codigo, nome: c.nome });
                    onFechar();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{c.nome}</span>
                    <span className="tnum block text-xs text-muted">
                      {documento(c.doc)}
                      {c.uf ? ` · ${c.uf}` : ""}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-xs text-muted">
                    {num(c.qtd)} {c.qtd === 1 ? "nota" : "notas"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <footer className="flex items-center justify-between border-t border-hairline px-6 py-3 text-xs text-muted">
          <span>Página {page}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="rounded-md border border-hairline px-2.5 py-1 transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.temMais || isFetching}
              className="rounded-md border border-hairline px-2.5 py-1 transition-colors hover:bg-surface-2 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
