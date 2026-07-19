"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import type { ConfNotaPendente } from "@/lib/types";
import { brl, dataBR, documento, num } from "@/lib/format";

interface Props {
  notas: ConfNotaPendente[] | undefined;
  carregando: boolean;
  recarregando: boolean;
  truncado: boolean;
  rotuloContraparte: string;
}

export function ConferenciaTabela({
  notas,
  carregando,
  recarregando,
  truncado,
  rotuloContraparte,
}: Props) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    if (!notas) return undefined;
    const q = busca.trim().toLowerCase();
    if (!q) return notas;
    return notas.filter(
      (n) =>
        String(n.numero).includes(q) ||
        (n.contraparte ?? "").toLowerCase().includes(q) ||
        (n.cfops ?? "").includes(q)
    );
  }, [notas, busca]);

  return (
    <section className="card anim-fade-up p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Notas pendentes de contabilização</h2>
          <p className="mt-0.5 text-xs text-muted">
            Notas que deveriam estar no contábil (origem FI) e não estão
            {truncado && " · mostrando as 500 de maior valor"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
          <Search className="size-4 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nº, contraparte ou CFOP…"
            className="w-44 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
          />
        </div>
      </header>

      {carregando || !filtradas ? (
        <div className="skeleton h-80 w-full" />
      ) : filtradas.length === 0 ? (
        <p className="grid h-32 place-items-center text-sm text-muted">
          {busca ? "Nenhuma nota encontrada" : "Nenhuma pendência 🎉"}
        </p>
      ) : (
        <div className={clsx("max-h-[32rem] overflow-auto", recarregando && "refetching")}>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-hairline text-xs text-muted">
                <th className="py-2 pr-3 text-left font-medium">Nº / Série</th>
                <th className="py-2 pr-3 text-left font-medium">Espécie</th>
                <th className="py-2 pr-3 text-left font-medium">Data</th>
                <th className="py-2 pr-3 text-left font-medium">{rotuloContraparte}</th>
                <th className="py-2 pr-3 text-left font-medium">CFOP</th>
                <th className="py-2 pl-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((n) => (
                <tr
                  key={n.chave}
                  className="border-b border-hairline/60 last:border-0 hover:bg-surface-2/50"
                >
                  <td className="py-2.5 pr-3 tabular-nums">
                    {num(n.numero)}
                    {n.serie && <span className="text-muted"> / {n.serie}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-ink-2">{n.especie}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-ink-2">{dataBR(n.data)}</td>
                  <td className="max-w-[240px] py-2.5 pr-3">
                    <span className="block truncate text-ink" title={n.contraparte ?? ""}>
                      {n.contraparte ?? "—"}
                    </span>
                    <span className="text-[11px] text-muted">
                      {[documento(n.doc), n.uf].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="max-w-[140px] truncate py-2.5 pr-3 text-xs text-muted" title={n.cfops ?? ""}>
                    {n.cfops ?? "—"}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-semibold tabular-nums text-ink">
                    {brl(n.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
