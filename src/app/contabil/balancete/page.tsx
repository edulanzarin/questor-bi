"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Layers } from "lucide-react";
import clsx from "clsx";
import { useFiltros } from "@/hooks/use-filters";
import { useBalanceteFiscal } from "@/hooks/use-api";
import {
  BalanceteLancamentosModal,
  type AlvoBalancete,
} from "@/components/balancete-lancamentos-modal";
import { brl, num } from "@/lib/format";
import type { BalanceteLinha } from "@/lib/types";

/** Valor de coluna: em branco quando zero, pra não poluir. */
function Val({ v, forte }: { v: number; forte?: boolean }) {
  if (Math.abs(v) < 0.005) return <span className="text-muted/40">—</span>;
  return <span className={clsx("tabular-nums", forte && "font-medium")}>{brl(v)}</span>;
}

export default function BalanceteFiscalPage() {
  const { filtros, qs } = useFiltros();
  const temEmpresa = filtros.empresas.length === 1;
  const [nivel, setNivel] = useState(3);
  const [alvo, setAlvo] = useState<AlvoBalancete | null>(null);

  const bal = useBalanceteFiscal(qs, temEmpresa);
  const dados = bal.data;
  const nivelMax = dados?.nivelMax ?? 5;

  const linhas = useMemo(
    () => (dados?.linhas ?? []).filter((l) => l.nivel <= nivel),
    [dados, nivel]
  );

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">Escolha a empresa e o período no filtro acima.</p>
      </section>
    );
  }

  return (
    <section className="card anim-fade-up p-5">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Balancete fiscal × contábil</h2>
            <p className="mt-0.5 text-xs text-muted">
              {dados
                ? `${num(dados.cobertura.notas)} notas · movimento hipotético pelas regras vs o real do contábil`
                : "…"}
              {dados && dados.cobertura.componentesPulados > 0 && (
                <span className="ml-1 text-warn">
                  · {num(dados.cobertura.componentesPulados)} componentes fora da cobertura
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Layers className="size-3.5" /> Nível
            </span>
            <div className="flex rounded-lg border border-hairline bg-surface-2 p-0.5 text-xs">
              {Array.from({ length: nivelMax }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setNivel(n)}
                  className={clsx(
                    "rounded-md px-2.5 py-1 tabular-nums transition-colors",
                    nivel === n
                      ? "bg-surface font-medium text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {bal.isLoading || !dados ? (
        <div className="skeleton h-96 w-full" />
      ) : linhas.length === 0 ? (
        <p className="grid h-32 place-items-center text-sm text-muted">Sem movimento no período.</p>
      ) : (
        <div className={clsx(bal.isFetching && !bal.isLoading && "refetching")}>
          <div className="max-h-[38rem] overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="py-2 pr-3 text-left font-medium">Conta</th>
                  <th className="border-l border-hairline py-2 pl-3 pr-3 text-right font-medium" colSpan={2}>
                    Fiscal (deveria)
                  </th>
                  <th className="border-l border-hairline py-2 pl-3 pr-3 text-right font-medium" colSpan={2}>
                    Contábil (real)
                  </th>
                  <th className="border-l border-hairline py-2 pl-3 text-right font-medium">Diferença</th>
                </tr>
                <tr className="border-b border-hairline text-[10px] uppercase tracking-wide text-muted">
                  <th />
                  <th className="border-l border-hairline py-1 pl-3 pr-3 text-right font-medium">Débito</th>
                  <th className="py-1 pr-3 text-right font-medium">Crédito</th>
                  <th className="border-l border-hairline py-1 pl-3 pr-3 text-right font-medium">Débito</th>
                  <th className="py-1 pr-3 text-right font-medium">Crédito</th>
                  <th className="border-l border-hairline" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <Linha
                    key={`${l.classif}-${l.conta}`}
                    l={l}
                    onDrill={(natureza) =>
                      setAlvo({ classif: l.classif, natureza, descricao: `${l.conta} · ${l.descricao}` })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BalanceteLancamentosModal qs={qs} alvo={alvo} onFechar={() => setAlvo(null)} />
    </section>
  );
}

/** Valor real clicável (drill-down) quando não é zero. */
function ValReal({ v, natureza, onDrill }: { v: number; natureza: 1 | -1; onDrill: (n: 1 | -1) => void }) {
  if (Math.abs(v) < 0.005) return <span className="text-muted/40">—</span>;
  return (
    <button
      onClick={() => onDrill(natureza)}
      className="tabular-nums text-ink transition-colors hover:text-ent hover:underline"
    >
      {brl(v)}
    </button>
  );
}

function Linha({ l, onDrill }: { l: BalanceteLinha; onDrill: (natureza: 1 | -1) => void }) {
  const difNet = l.fiscalDeb - l.fiscalCred - (l.realDeb - l.realCred);
  const temDif = Math.abs(difNet) > 0.5;
  const grande = Math.abs(difNet) > 100;
  return (
    <tr
      className={clsx(
        "border-b border-hairline/50 last:border-0",
        l.sintetica ? "bg-surface-2/40 font-medium" : "hover:bg-surface-2/40"
      )}
    >
      <td className="py-1.5 pr-3" style={{ paddingLeft: `${(l.nivel - 1) * 16 + 4}px` }}>
        <span className="tabular-nums text-muted">{l.conta}</span>{" "}
        <span className={clsx("truncate", l.sintetica ? "text-ink" : "text-ink-2")}>
          {l.descricao}
        </span>
      </td>
      <td className="border-l border-hairline/50 py-1.5 pl-3 pr-3 text-right">
        <Val v={l.fiscalDeb} forte={l.sintetica} />
      </td>
      <td className="py-1.5 pr-3 text-right">
        <Val v={l.fiscalCred} forte={l.sintetica} />
      </td>
      <td className="border-l border-hairline/50 py-1.5 pl-3 pr-3 text-right">
        <ValReal v={l.realDeb} natureza={1} onDrill={onDrill} />
      </td>
      <td className="py-1.5 pr-3 text-right">
        <ValReal v={l.realCred} natureza={-1} onDrill={onDrill} />
      </td>
      <td
        className={clsx(
          "border-l border-hairline/50 py-1.5 pl-3 pr-1 text-right tabular-nums",
          !temDif && "text-good",
          temDif && (grande ? "font-semibold text-critical" : "text-warn")
        )}
      >
        {temDif ? (
          <span className="inline-flex items-center gap-1">
            {grande && <AlertTriangle className="size-3" />}
            {brl(difNet)}
          </span>
        ) : (
          "ok"
        )}
      </td>
    </tr>
  );
}
