"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useNotaItens } from "@/hooks/use-api";
import { brl } from "@/lib/format";

/**
 * Itens (produtos) de uma nota, com filtro de produto e somatória (total, ICMS,
 * IPI) da seleção. Reusada nos modais de detalhe do explorador (Fiscal/Contábil)
 * e da Conferência — `modulo` só troca a rota. Os totais respeitam o filtro:
 * filtrar por produto soma só o que ficou à vista.
 */
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
  const [filtro, setFiltro] = useState("");

  const itens = useMemo(() => data ?? [], [data]);
  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return itens;
    return itens.filter(
      (it) => String(it.produto).includes(q) || (it.descricao ?? "").toLowerCase().includes(q)
    );
  }, [itens, filtro]);
  const totais = useMemo(
    () =>
      filtrados.reduce(
        (a, it) => {
          a.total += it.valorTotal;
          a.icms += it.icms;
          a.ipi += it.ipi;
          return a;
        },
        { total: 0, icms: 0, ipi: 0 }
      ),
    [filtrados]
  );

  if (isLoading)
    return (
      <div className="flex items-center gap-2 px-6 py-3 text-xs text-muted">
        <Loader2 className="size-3.5 animate-spin" /> Carregando itens…
      </div>
    );
  if (itens.length === 0)
    return <div className="px-6 py-3 text-xs text-muted">Sem itens de produto nesta nota.</div>;

  const filtrando = filtrados.length !== itens.length;

  return (
    <div className="px-6 pb-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {filtrando
            ? `${filtrados.length} de ${itens.length} itens`
            : `${itens.length} ${itens.length === 1 ? "item" : "itens"}`}
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
          <Search className="size-3.5 text-muted" />
          <input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar produto…"
            className="w-44 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
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
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-muted">
                  Nenhum item com esse filtro.
                </td>
              </tr>
            )}
            {filtrados.map((it) => (
              <tr key={it.seq} className="border-t border-hairline/60">
                <td className="max-w-[280px] truncate py-1.5 pr-3" title={it.descricao ?? ""}>
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
          {filtrados.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-hairline font-semibold text-ink">
                <td className="py-2 pr-3" colSpan={4}>
                  Soma{filtrando ? " (filtro)" : ""}
                </td>
                <td className="tnum py-2 pr-3 text-right">{brl(totais.total)}</td>
                <td className="tnum py-2 pr-3 text-right">{brl(totais.icms)}</td>
                <td className="tnum py-2 text-right">{brl(totais.ipi)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
