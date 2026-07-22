"use client";

import { Loader2, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";

/**
 * Base comum dos modais de LISTA (tabela de notas/lançamentos): a casca `Modal` +
 * barra de busca + região rolável + rodapé. Cada modal (drill-down, culpados da
 * diferença…) monta a sua tabela como `children` e o seu rodapé em `rodape`, mas
 * a moldura, a busca e o scroll são os mesmos. Ver [[reaproveitar-primitivos]].
 */
export function ListaModal({
  aberto,
  onFechar,
  titulo,
  subtitulo,
  largura = "max-w-4xl",
  ariaLabel,
  busca,
  onBusca,
  buscaPlaceholder = "Nº da nota ou contraparte…",
  carregando,
  rodape,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  largura?: string;
  ariaLabel?: string;
  /** Se `onBusca` vier, mostra a barra de busca controlada por `busca`. */
  busca?: string;
  onBusca?: (v: string) => void;
  buscaPlaceholder?: string;
  carregando?: boolean;
  rodape?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={titulo}
      subtitulo={subtitulo}
      largura={largura}
      ariaLabel={ariaLabel}
    >
      {onBusca && (
        <div className="flex items-center gap-2 border-b border-hairline px-6 py-3">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            value={busca ?? ""}
            onChange={(e) => onBusca(e.target.value)}
            placeholder={buscaPlaceholder}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
          {carregando && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {rodape && (
        <footer className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-3 text-xs text-muted">
          {rodape}
        </footer>
      )}
    </Modal>
  );
}
