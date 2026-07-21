"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ItensNota } from "@/components/itens-nota";
import { brl, dataBR, documento, num } from "@/lib/format";
import type { NotaLista } from "@/lib/types";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{rotulo}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}

/**
 * Detalhe de uma nota do explorador (Fiscal → Dados, Contábil → Notas). Abre ao
 * clicar na linha — que fica enxuta, com o detalhe completo aqui: cabeçalho,
 * campos que não cabem na tabela (documento, modelo, chave de acesso de 44
 * dígitos) e os itens/produtos, buscados sob demanda pela rota do módulo.
 */
export function NotaExploradorModal({
  nota,
  tipo,
  modulo,
  mostraEmpresa,
  onFechar,
}: {
  nota: NotaLista | null;
  tipo: "ent" | "sai";
  modulo: "fiscal" | "contabil";
  mostraEmpresa: boolean;
  onFechar: () => void;
}) {
  useEffect(() => {
    if (!nota) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [nota, onFechar]);

  if (!nota) return null;

  const legenda = [
    nota.especie,
    `${num(nota.numero)}${nota.serie ? ` / ${nota.serie}` : ""}`,
    dataBR(nota.data),
    nota.uf,
  ]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="anim-scale-in card flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Nota ${num(nota.numero)}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold" title={nota.contraparte ?? ""}>
                {nota.contraparte ?? "Nota sem contraparte"}
              </h3>
              {nota.cancelada && (
                <span className="shrink-0 rounded bg-sai/12 px-1.5 py-0.5 text-xs text-sai">
                  cancelada
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">{legenda}</p>
          </div>
          <button
            onClick={onFechar}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-hairline px-6 py-4 sm:grid-cols-4">
            <Campo rotulo="Valor">
              <span className={nota.cancelada ? "font-semibold tabular-nums line-through" : "font-semibold tabular-nums"}>
                {brl(nota.valor)}
              </span>
            </Campo>
            <Campo rotulo="Documento">
              <span className="tabular-nums">{nota.contraparteDoc ? documento(nota.contraparteDoc) : "—"}</span>
            </Campo>
            <Campo rotulo="Modelo">
              <span className="tabular-nums">{nota.modelo ?? "—"}</span>
            </Campo>
            {mostraEmpresa && (
              <Campo rotulo="Empresa">
                <span className="block truncate" title={nota.empresaNome ?? ""}>
                  {nota.empresaNome ?? `Empresa ${nota.empresa}`}
                </span>
              </Campo>
            )}
          </div>

          {nota.chaveNfe && (
            <div className="border-b border-hairline px-6 py-4">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                Chave de acesso
              </p>
              <p className="mt-0.5 break-all font-mono text-xs text-ink-2 select-all">
                {nota.chaveNfe}
              </p>
            </div>
          )}

          <div className="py-2">
            <p className="px-6 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted">
              Itens da nota
            </p>
            <ItensNota tipo={tipo} empresa={nota.empresa} chave={nota.chave} modulo={modulo} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
