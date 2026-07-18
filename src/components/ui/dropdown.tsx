"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface DropdownProps {
  rotulo: React.ReactNode;
  icone?: React.ReactNode;
  ativo?: boolean;
  largura?: string;
  children: (fechar: () => void) => React.ReactNode;
}

export function Dropdown({ rotulo, icone, ativo, largura = "w-72", children }: DropdownProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className={clsx(
          "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
          ativo
            ? "border-ent/40 bg-ent/10 text-ink"
            : "border-hairline bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink"
        )}
      >
        {icone}
        <span className="max-w-44 truncate">{rotulo}</span>
        <ChevronDown
          className={clsx("size-4 text-muted transition-transform", aberto && "rotate-180")}
        />
      </button>
      {aberto && (
        <div
          className={clsx(
            "anim-scale-in absolute left-0 top-11 z-40 overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl shadow-black/20",
            largura
          )}
        >
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

export function ItemLista({
  selecionado,
  onClick,
  children,
}: {
  selecionado: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
        selecionado ? "font-medium text-ink" : "text-ink-2"
      )}
    >
      {children}
    </button>
  );
}
