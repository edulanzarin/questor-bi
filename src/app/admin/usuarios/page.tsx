import Link from "next/link";
import { Plus, ShieldCheck, Building2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { listarUsuarios } from "../dados";

function acessoLegivel(iso: string | null): string {
  if (!iso) return "nunca acessou";
  const d = new Date(iso.replace(" ", "T"));
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} ${hora}`;
}

export default async function UsuariosPage() {
  const usuarios = await listarUsuarios();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usuários</h1>
          <p className="mt-1 text-sm text-muted">
            {usuarios.length} {usuarios.length === 1 ? "pessoa" : "pessoas"} · acesso, permissões e empresas
          </p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-ent px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Novo usuário
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {usuarios.length === 0 && (
          <p className="card px-4 py-6 text-sm text-muted">Nenhum usuário ainda.</p>
        )}
        {usuarios.map((u) => (
          <Link
            key={u.id}
            href={`/admin/usuarios/${u.id}`}
            className="card group flex items-center gap-4 px-4 py-3 transition-colors hover:border-ent/40 hover:bg-surface-2"
          >
            <Avatar
              id={u.id}
              nome={u.nome}
              temFoto={u.avatarVersao != null}
              versao={u.avatarVersao}
              size={44}
              className={u.ativo ? "" : "opacity-50 grayscale"}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{u.nome}</p>
                {u.admin && (
                  <span className="flex shrink-0 items-center gap-1 rounded-md bg-ent/12 px-1.5 py-0.5 text-[10px] font-medium text-ent">
                    <ShieldCheck className="size-3" /> admin
                  </span>
                )}
                {!u.ativo && (
                  <span className="shrink-0 rounded-md bg-critical/12 px-1.5 py-0.5 text-[10px] font-medium text-critical">
                    inativo
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted">
                {[u.cargo, u.setor].filter(Boolean).join(" · ") || u.email}
              </p>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-0.5 text-xs text-muted sm:flex">
              <span className="flex items-center gap-1">
                {u.admin ? (
                  "acesso total"
                ) : (
                  <>
                    {u.secoes} {u.secoes === 1 ? "seção" : "seções"}
                    <span className="text-baseline">·</span>
                    <Building2 className="size-3" />
                    {u.todas_empresas ? "todas" : "restritas"}
                  </>
                )}
              </span>
              <span className="text-baseline">{acessoLegivel(u.ultimo_acesso)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
