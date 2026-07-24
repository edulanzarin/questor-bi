import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { carregarGrupo, listarTodasEmpresas } from "../../dados";
import { GrupoForm } from "../grupo-form";

export default async function EditarGrupo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [grupo, empresas] = await Promise.all([carregarGrupo(Number(id)), listarTodasEmpresas()]);
  if (!grupo) notFound();

  return (
    <div>
      <Link
        href="/admin/grupos"
        className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-3.5" /> Grupos
      </Link>
      <h1 className="mt-2 mb-6 text-xl font-semibold tracking-tight">{grupo.nome}</h1>
      <GrupoForm grupo={grupo} empresas={empresas} />
    </div>
  );
}
