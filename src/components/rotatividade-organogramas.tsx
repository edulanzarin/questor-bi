"use client";

import { useMemo, useState } from "react";
import { ArrowDown, Search } from "lucide-react";
import clsx from "clsx";
import type { TurnoverOrganograma } from "@/lib/types";
import { num } from "@/lib/format";

type Coluna = "ativos" | "admissoes" | "desligamentos" | "turnover";
type Faixa = "todos" | "movimento" | "alto" | "medio" | "baixo";

const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** Faixa de turnover → cor do badge. Zero (sem movimento) fica neutro. */
function nivel(t: number): { classe: string; faixa: Exclude<Faixa, "todos" | "movimento"> | "zero" } {
  if (t > 10) return { classe: "bg-critical/12 text-critical", faixa: "alto" };
  if (t >= 2) return { classe: "bg-warning/15 text-warning", faixa: "medio" };
  if (t > 0) return { classe: "bg-good/12 text-good", faixa: "baixo" };
  return { classe: "text-muted", faixa: "zero" };
}

const FILTROS: { id: Faixa; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "movimento", rotulo: "Com movimentação" },
  { id: "alto", rotulo: "Alto (>10%)" },
  { id: "medio", rotulo: "Médio (2–10%)" },
  { id: "baixo", rotulo: "Baixo (<2%)" },
];

const CABECALHOS: { key: Coluna; rotulo: string }[] = [
  { key: "ativos", rotulo: "Colab. ativos" },
  { key: "admissoes", rotulo: "Admissões" },
  { key: "desligamentos", rotulo: "Desligamentos" },
  { key: "turnover", rotulo: "Turnover" },
];

interface Props {
  dados: TurnoverOrganograma[] | undefined;
  /** Linha de total (bate com os KPIs) — o consolidado da empresa. */
  total: { ativos: number; admissoes: number; desligamentos: number; turnover: number } | undefined;
  carregando: boolean;
  recarregando: boolean;
}

export function RotatividadeOrganogramas({ dados, total, carregando, recarregando }: Props) {
  const [ordenar, setOrdenar] = useState<Coluna>("ativos");
  const [faixa, setFaixa] = useState<Faixa>("todos");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    if (!dados) return undefined;
    const q = busca.trim().toLowerCase();
    return [...dados]
      .filter((o) => {
        if (q && !o.setor.toLowerCase().includes(q)) return false;
        if (faixa === "todos") return true;
        if (faixa === "movimento") return o.admissoes + o.desligamentos > 0;
        return nivel(o.turnover).faixa === faixa;
      })
      .sort((a, b) => b[ordenar] - a[ordenar] || a.setor.localeCompare(b.setor));
  }, [dados, busca, faixa, ordenar]);

  return (
    <section className="card anim-fade-up p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Turnover por organograma</h2>
          <p className="mt-0.5 text-xs text-muted">
            Cada setor com seu efetivo e movimentação · clique num cabeçalho para ordenar
          </p>
        </div>
        {visiveis && (
          <span className="text-xs text-muted">
            {num(visiveis.length)} {visiveis.length === 1 ? "setor" : "setores"}
          </span>
        )}
      </header>

      {/* Filtros por faixa + busca */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTROS.map((ff) => (
          <button
            key={ff.id}
            onClick={() => setFaixa(ff.id)}
            className={clsx(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              faixa === ff.id
                ? "border-ent/30 bg-ent/12 font-medium text-ent"
                : "border-hairline bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {ff.rotulo}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 py-1.5">
          <Search className="size-3.5 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar setor…"
            className="w-40 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
          />
        </label>
      </div>

      {carregando || !visiveis ? (
        <div className="skeleton h-96 w-full" />
      ) : (
        <div className={clsx("max-h-[34rem] overflow-y-auto overflow-x-auto", recarregando && "refetching")}>
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-hairline text-xs text-muted">
                <th className="py-2 pr-3 text-left font-medium">Organograma</th>
                {CABECALHOS.map((h) => {
                  const ativo = ordenar === h.key;
                  return (
                    <th key={h.key} className="py-2 pl-3 text-right font-medium">
                      <button
                        onClick={() => setOrdenar(h.key)}
                        className={clsx(
                          "inline-flex items-center gap-1 transition-colors hover:text-ink",
                          ativo && "text-ink"
                        )}
                      >
                        {h.rotulo}
                        <ArrowDown className={clsx("size-3", !ativo && "opacity-0")} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visiveis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted">
                    Nenhum setor nesta faixa
                  </td>
                </tr>
              ) : (
                visiveis.map((o) => {
                  const n = nivel(o.turnover);
                  return (
                    <tr
                      key={o.setor}
                      className="border-b border-hairline/60 last:border-0 hover:bg-surface-2/50"
                    >
                      <td className="py-2.5 pr-3 font-medium text-ink">{o.setor}</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums text-ink-2">{num(o.ativos)}</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">
                        <span className={o.admissoes > 0 ? "text-good" : "text-muted"}>
                          {num(o.admissoes)}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">
                        <span className={o.desligamentos > 0 ? "text-critical" : "text-muted"}>
                          {num(o.desligamentos)}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <span
                          className={clsx(
                            "inline-block rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
                            n.classe
                          )}
                        >
                          {pct(o.turnover)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {total && faixa === "todos" && !busca && (
              <tfoot className="sticky bottom-0 bg-surface">
                <tr className="border-t border-hairline text-sm font-semibold">
                  <td className="py-2.5 pr-3">Total da empresa</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">{num(total.ativos)}</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums text-good">{num(total.admissoes)}</td>
                  <td className="py-2.5 pl-3 text-right tabular-nums text-critical">
                    {num(total.desligamentos)}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums">{pct(total.turnover)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  );
}
