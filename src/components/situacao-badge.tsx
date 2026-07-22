import clsx from "clsx";
import type { SituacaoNota } from "@/lib/types";

export const SIT_ROTULO: Record<SituacaoNota, string> = {
  ok: "Correta",
  divergente: "Conta errada",
  duplicada: "Duplicada",
  consolidada: "Consolidada",
  pendente: "Não contabilizada",
  nao_exige: "Não exige lançamento",
  cancelada: "Cancelada",
};

const SIT_COR: Record<SituacaoNota, string> = {
  ok: "bg-good/12 text-good",
  divergente: "bg-critical/12 text-critical",
  duplicada: "bg-sai/12 text-sai",
  consolidada: "bg-ent/12 text-ent",
  pendente: "bg-warn/12 text-warn",
  nao_exige: "bg-surface-2 text-muted",
  cancelada: "bg-surface-2 text-muted",
};

/** Etiqueta da situação de uma nota na Conferência. Uma fonte só para a linha
 *  da tabela e o modal de detalhe. */
export function SituacaoBadge({ situacao }: { situacao: SituacaoNota }) {
  return (
    <span
      className={clsx(
        "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
        SIT_COR[situacao]
      )}
    >
      {SIT_ROTULO[situacao]}
    </span>
  );
}
