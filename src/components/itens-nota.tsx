"use client";

import { Loader2 } from "lucide-react";
import { useNotaItens } from "@/hooks/use-api";
import { brl } from "@/lib/format";

/** Tabela de itens (produtos) de uma nota. Reusada nos modais de detalhe do
 *  explorador (Fiscal/Contábil) e da Conferência — `modulo` só troca a rota. */
export function ItensNota({
  tipo,
  empresa,
  chave,
  modulo = "fiscal",
}: {
  tipo: "ent" | "sai";
  empresa: number;
  chave: string;
  modulo?: "fiscal" | "contabil";
}) {
  const { data, isLoading } = useNotaItens(tipo, empresa, chave, modulo);
  if (isLoading)
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted">
        <Loader2 className="size-3.5 animate-spin" /> Carregando itens…
      </div>
    );
  if (!data || data.length === 0)
    return <div className="px-4 py-3 text-xs text-muted">Sem itens de produto nesta nota.</div>;
  return (
    <div className="overflow-x-auto px-4 py-3">
      <table className="w-full min-w-[680px] text-xs">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-1 pr-3 font-medium">Produto</th>
            <th className="py-1 pr-3 font-medium">CFOP</th>
            <th className="py-1 pr-3 text-right font-medium">Qtd</th>
            <th className="py-1 pr-3 text-right font-medium">V. unit.</th>
            <th className="py-1 pr-3 text-right font-medium">Total</th>
            <th className="py-1 pr-3 text-right font-medium">ICMS</th>
            <th className="py-1 text-right font-medium">IPI</th>
          </tr>
        </thead>
        <tbody>
          {data.map((it) => (
            <tr key={it.seq} className="border-t border-hairline/60">
              <td className="max-w-[240px] truncate py-1.5 pr-3" title={it.descricao ?? ""}>
                <span className="text-muted">{it.produto}</span> · {it.descricao ?? "—"}
              </td>
              <td className="py-1.5 pr-3 text-muted" title={it.cfopDescr ?? ""}>{it.cfop}</td>
              <td className="tnum py-1.5 pr-3 text-right">
                {it.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                {it.unidade ? <span className="text-muted"> {it.unidade}</span> : null}
              </td>
              <td className="tnum py-1.5 pr-3 text-right">{brl(it.valorUnitario)}</td>
              <td className="tnum py-1.5 pr-3 text-right font-medium">{brl(it.valorTotal)}</td>
              <td className="tnum py-1.5 pr-3 text-right text-muted">{brl(it.icms)}</td>
              <td className="tnum py-1.5 text-right text-muted">{brl(it.ipi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
