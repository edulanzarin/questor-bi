import Link from "next/link";
import { Plus } from "lucide-react";
import { appQuery } from "@/lib/app-db";

interface Row {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  admin: boolean;
  todas_empresas: boolean;
  secoes: number;
}

export default async function UsuariosPage() {
  const usuarios = await appQuery<Row>(
    `select u.id, u.nome, u.email, u.ativo, u.admin, u.todas_empresas,
            count(s.secao)::int as secoes
       from usuario u
       left join usuario_secao s on s.usuario_id = u.id
      group by u.id
      order by u.nome`
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usuários</h1>
          <p className="mt-1 text-sm text-muted">Quem entra, o que acessa e quais empresas vê</p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-ent px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Novo usuário
        </Link>
      </div>

      <div className="card mt-6 divide-y divide-hairline">
        {usuarios.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted">Nenhum usuário ainda.</p>
        )}
        {usuarios.map((u) => (
          <Link
            key={u.id}
            href={`/admin/usuarios/${u.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors first:rounded-t-[14px] last:rounded-b-[14px] hover:bg-surface-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {u.nome}
                {!u.ativo && <span className="ml-2 text-[11px] font-normal text-critical">inativo</span>}
              </p>
              <p className="truncate text-xs text-muted">{u.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
              {u.admin ? (
                <span className="rounded-md bg-ent/12 px-2 py-0.5 font-medium text-ent">admin</span>
              ) : (
                <span>{u.secoes} {u.secoes === 1 ? "seção" : "seções"}</span>
              )}
              <span>· {u.todas_empresas ? "todas empresas" : "empresas restritas"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
