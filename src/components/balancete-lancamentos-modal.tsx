"use client";

import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useBalanceteLancamentos } from "@/hooks/use-api";
import { brl, dataBR, num } from "@/lib/format";

export interface AlvoBalancete {
  classif: string;
  natureza: 1 | -1;
  descricao: string;
}

const ORIGEM: Record<string, string> = {
  ME: "Nota entrada",
  MS: "Nota saída",
  IM: "Apuração",
  RE: "Retenção",
};

/**
 * Drill-down de uma conta do balancete: os lançamentos reais (origem fiscal)
 * que compõem aquele valor, com a nota de origem e busca. Abre ao clicar num
 * valor da coluna Contábil.
 */
export function BalanceteLancamentosModal({
  qs,
  alvo,
  onFechar,
}: {
  qs: string;
  alvo: AlvoBalancete | null;
  onFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const { data, isLoading } = useBalanceteLancamentos(
    qs,
    alvo?.classif ?? null,
    alvo?.natureza ?? 1
  );

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const l = data?.lancamentos ?? [];
    if (!q) return l;
    return l.filter(
      (x) =>
        String(x.numero ?? "").includes(q) ||
        (x.contraparte ?? "").toLowerCase().includes(q)
    );
  }, [data, busca]);

  const total = linhas.reduce((s, l) => s + l.valor, 0);

  return (
    <Modal
      aberto={alvo != null}
      onFechar={onFechar}
      largura="max-w-3xl"
      ariaLabel="Lançamentos da conta"
      titulo={
        <h3 className="truncate text-lg font-semibold" title={alvo?.descricao}>
          {alvo?.descricao}
        </h3>
      }
      subtitulo={`Lançamentos ${alvo?.natureza === 1 ? "a débito" : "a crédito"} · origem fiscal`}
    >
      <div className="flex items-center gap-2 border-b border-hairline px-6 py-3">
        <Search className="size-4 text-muted" />
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nº da nota ou contraparte…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6">
            <div className="skeleton h-40 w-full" />
          </div>
        ) : linhas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nenhum lançamento.</p>
        ) : (
          <table className="w-full min-w-[600px] text-xs">
            <thead className="sticky top-0 bg-surface text-left text-muted">
              <tr className="border-b border-hairline">
                <th className="py-2 pl-6 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Origem</th>
                <th className="py-2 pr-3 font-medium">Nº</th>
                <th className="py-2 pr-3 font-medium">Contraparte</th>
                <th className="py-2 pr-6 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={i} className="border-b border-hairline/50 last:border-0">
                  <td className="tnum py-1.5 pl-6 pr-3 whitespace-nowrap">{dataBR(l.data)}</td>
                  <td className="py-1.5 pr-3 text-muted">{ORIGEM[l.origem] ?? l.origem}</td>
                  <td className="tnum py-1.5 pr-3">{l.numero ?? "—"}</td>
                  <td className="max-w-[240px] truncate py-1.5 pr-3" title={l.contraparte ?? ""}>
                    {l.contraparte ?? (l.historico || "—")}
                  </td>
                  <td className="tnum py-1.5 pr-6 text-right font-medium">{brl(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-hairline px-6 py-3 text-xs text-muted">
        <span>{num(linhas.length)} lançamentos</span>
        <span className="tnum font-medium text-ink">{brl(total)}</span>
      </footer>
    </Modal>
  );
}
