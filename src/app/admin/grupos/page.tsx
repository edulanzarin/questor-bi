import Link from "next/link";
import { Plus } from "lucide-react";
import { listarGrupos } from "../dados";

export default async function GruposPage() {
  const grupos = await listarGrupos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Grupos de empresa</h1>
          <p className="mt-1 text-sm text-muted">Carteiras reutilizáveis para atribuir aos usuários</p>
        </div>
        <Link
          href="/admin/grupos/novo"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-ent px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          Novo grupo
        </Link>
      </div>

      <div className="card mt-6 divide-y divide-hairline">
        {grupos.length === 0 && <p className="px-4 py-6 text-sm text-muted">Nenhum grupo ainda.</p>}
        {grupos.map((g) => (
          <Link
            key={g.id}
            href={`/admin/grupos/${g.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3 transition-colors first:rounded-t-[14px] last:rounded-b-[14px] hover:bg-surface-2"
          >
            <p className="text-sm font-medium">{g.nome}</p>
            <span className="text-xs text-muted">{g.empresas} empresas</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
