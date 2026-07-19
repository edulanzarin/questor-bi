"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import clsx from "clsx";

interface Props {
  onArquivo: (arquivo: File) => void;
  /** Extensões aceitas, com ponto: [".ofx", ".pdf"]. */
  aceita: string[];
  desabilitado?: boolean;
  carregando?: boolean;
  /** Motivo de estar desabilitado, mostrado no lugar da instrução. */
  motivo?: string;
}

/**
 * Área de envio de arquivo. Substitui o `<input type="file">` nativo, que
 * aparece com a caixa crua do sistema operacional e destoa do resto do app —
 * o input continua existindo, escondido, para acessibilidade e para o clique.
 */
export function DropzoneArquivo({
  onArquivo,
  aceita,
  desabilitado,
  carregando,
  motivo,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  const bloqueado = desabilitado || carregando;

  function entregar(lista: FileList | null) {
    const arquivo = lista?.[0];
    if (!arquivo || bloqueado) return;
    onArquivo(arquivo);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!bloqueado) setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        entregar(e.dataTransfer.files);
      }}
      onClick={() => !bloqueado && inputRef.current?.click()}
      role="button"
      tabIndex={bloqueado ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-disabled={bloqueado}
      className={clsx(
        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors",
        bloqueado && "cursor-not-allowed opacity-60",
        sobre
          ? "border-ent bg-ent/8"
          : "border-hairline bg-surface-2/40 hover:border-ent/40 hover:bg-surface-2"
      )}
    >
      <span
        className={clsx(
          "grid size-10 place-items-center rounded-xl transition-colors",
          sobre ? "bg-ent/15 text-ent" : "bg-surface-2 text-muted"
        )}
      >
        {carregando ? (
          <Loader2 className="size-5 animate-spin" />
        ) : sobre ? (
          <FileText className="size-5" />
        ) : (
          <Upload className="size-5" />
        )}
      </span>

      {carregando ? (
        <p className="text-sm text-ink">Lendo o extrato…</p>
      ) : motivo ? (
        <p className="text-sm text-muted">{motivo}</p>
      ) : (
        <>
          <p className="text-sm text-ink">
            Arraste o arquivo aqui ou <span className="text-ent">clique para escolher</span>
          </p>
          <p className="text-xs text-muted">{aceita.join(" · ").toUpperCase()}</p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={aceita.join(",")}
        disabled={bloqueado}
        onChange={(e) => entregar(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
