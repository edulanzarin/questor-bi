"use client";

import { NotasTabela } from "@/components/notas-tabela";
import { useFiltros } from "@/hooks/use-filters";

export default function AnalisesPage() {
  const { filtros, qs } = useFiltros();
  return <NotasTabela qs={qs} enabled mostraEmpresa={filtros.empresas.length !== 1} />;
}
