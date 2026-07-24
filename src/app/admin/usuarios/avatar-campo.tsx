"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Avatar } from "@/components/avatar";

/**
 * Campo de foto de perfil: mostra a atual (ou iniciais), deixa escolher uma nova
 * com preview ao vivo, e oferece remover. Os nomes dos campos (`avatar`,
 * `remover_foto`) são lidos pela action `salvarUsuario`.
 */
export function AvatarCampo({
  id,
  nome,
  temFoto,
  versao,
}: {
  id: string;
  nome: string;
  temFoto: boolean;
  versao: number | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remover, setRemover] = useState(false);

  return (
    <div className="flex items-center gap-5">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="size-20 shrink-0 rounded-full object-cover" />
      ) : (
        <Avatar id={id} nome={nome || "?"} temFoto={temFoto && !remover} versao={versao} size={80} />
      )}

      <div className="flex flex-col gap-2">
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
          <Upload className="size-4" />
          {temFoto ? "Trocar foto" : "Enviar foto"}
          <input
            type="file"
            name="avatar"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
              if (f) setRemover(false);
            }}
          />
        </label>
        <p className="text-xs text-muted">PNG ou JPG, até 2 MB.</p>
        {temFoto && (
          <label className="flex items-center gap-2 text-xs text-ink-2">
            <input
              type="checkbox"
              name="remover_foto"
              checked={remover}
              onChange={(e) => {
                setRemover(e.target.checked);
                if (e.target.checked) setPreview(null);
              }}
              className="size-3.5 accent-[var(--critical)]"
            />
            Remover foto atual
          </label>
        )}
      </div>
    </div>
  );
}
