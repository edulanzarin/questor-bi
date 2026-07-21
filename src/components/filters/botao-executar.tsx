"use client";

import { Play } from "lucide-react";
import clsx from "clsx";

/**
 * Botão que aplica os filtros e dispara a consulta. É o único gatilho de
 * execução — nada roda ao mudar empresa/data ([[executar-com-botao]]).
 * Enfatizado quando há mudança pendente (`dirty`); segue clicável sem mudança
 * para reexecutar (atualizar). `disabled` bloqueia quando falta algo obrigatório.
 */
export function BotaoExecutar({
  onClick,
  dirty,
  disabled = false,
  title,
}: {
  onClick: () => void;
  dirty: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        "flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors",
        disabled
          ? "cursor-not-allowed bg-surface-2 text-muted"
          : dirty
            ? "bg-ent text-white hover:opacity-90"
            : "border border-hairline bg-surface-2 text-ink-2 hover:text-ink"
      )}
    >
      <Play className="size-4" />
      Executar
    </button>
  );
}
