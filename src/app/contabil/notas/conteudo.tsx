"use client";

import { NotasTabela } from "@/components/notas-tabela";
import { useFiltros } from "@/hooks/use-filters";

/**
 * Explorador de notas do Contábil — o mesmo do Fiscal (seção Dados), servido
 * pelo módulo Contábil. Aqui a empresa é única e obrigatória (barra de
 * conferência), então nunca mostra a coluna de empresa.
 */
export default function NotasContabilPage() {
  const { filtros, qs } = useFiltros();
  const temEmpresa = filtros.empresas.length === 1;
  return (
    <NotasTabela
      qs={qs}
      enabled={temEmpresa}
      mostraEmpresa={false}
      modulo="contabil"
    />
  );
}
