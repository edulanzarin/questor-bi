import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listarTodasEmpresas } from "../../dados";
import { GrupoForm } from "../grupo-form";

export default async function NovoGrupo() {
  const empresas = await listarTodasEmpresas();
  return (
    <div>
      <Link
        href="/admin/grupos"
        className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-3.5" /> Grupos
      </Link>
      <h1 className="mt-2 mb-6 text-xl font-semibold tracking-tight">Novo grupo</h1>
      <GrupoForm grupo={null} empresas={empresas} />
    </div>
  );
}
