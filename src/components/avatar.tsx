import clsx from "clsx";

/**
 * Foto de perfil do usuário, ou as iniciais num círculo quando não há foto.
 * Sem hooks e sem next/image (a foto vem de uma rota dinâmica), então serve
 * tanto em Server quanto em Client Component. `versao` vira cache-buster (?v=)
 * para a troca de foto aparecer na hora.
 */
export function Avatar({
  id,
  nome,
  temFoto = false,
  versao,
  size = 40,
  className,
}: {
  id: string;
  nome: string;
  temFoto?: boolean;
  versao?: number | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };

  if (temFoto) {
    const src = `/api/avatar/${id}${versao != null ? `?v=${versao}` : ""}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={dim}
        className={clsx("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const iniciais =
    nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.38) }}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-semibold text-ink-2",
        className
      )}
    >
      {iniciais}
    </span>
  );
}
