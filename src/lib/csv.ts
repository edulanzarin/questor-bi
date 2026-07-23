/**
 * Exporta uma tabela como CSV e dispara o download no navegador. Separador `;` e
 * BOM UTF-8 para o Excel pt-BR abrir com acentos e colunas certas.
 */
export function baixarCSV(
  nome: string,
  cabecalhos: string[],
  linhas: (string | number | null | undefined)[][]
): void {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corpo = [cabecalhos, ...linhas].map((l) => l.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + corpo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome.endsWith(".csv") ? nome : `${nome}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
