"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { CulpadosModal } from "@/components/balancete-culpados-modal";
import { useFiltros } from "@/hooks/use-filters";
import { useBalanceteFiscal } from "@/hooks/use-api";
import { brl, num } from "@/lib/format";
import type { BalanceteLinha } from "@/lib/types";

/** Diferença líquida da conta: (débito − crédito) esperado − o mesmo no real. */
const netDif = (l: BalanceteLinha) =>
  l.fiscalDeb - l.fiscalCred - (l.realDeb - l.realCred);
const TOL = 0.5;

export default function DiferencasPage() {
  const { filtros, qs } = useFiltros();
  const temEmpresa = filtros.empresas.length === 1;
  const bal = useBalanceteFiscal(qs, temEmpresa);
  const [alvo, setAlvo] = useState<BalanceteLinha | null>(null);

  // Só as ANALÍTICAS com diferença — as contas concretas onde algo não bate.
  // Sintética duplicaria (pai + filho); o valor específico mora na analítica.
  const linhas = useMemo(
    () =>
      (bal.data?.linhas ?? [])
        .filter((l) => !l.sintetica && Math.abs(netDif(l)) > TOL)
        .sort((a, b) => Math.abs(netDif(b)) - Math.abs(netDif(a))),
    [bal.data]
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
      <header className="mb-4">
        <h2 className="text-sm font-semibold">Contas com diferença</h2>
        <p className="mt-0.5 text-xs text-muted">
          {bal.data
            ? `${num(linhas.length)} ${linhas.length === 1 ? "conta onde" : "contas onde"} o esperado não bate com o real · clique para ver as notas`
            : "…"}
        </p>
      </header>

      {bal.isLoading || !bal.data ? (
        <div className="skeleton h-80 w-full" />
      ) : linhas.length === 0 ? (
        <div className="grid h-32 place-items-center gap-2 text-center">
          <CheckCircle2 className="mx-auto size-6 text-good" />
          <p className="text-sm text-muted">Tudo bate — nenhuma conta com diferença no período.</p>
        </div>
      ) : (
        <div className={clsx(bal.isFetching && !bal.isLoading && "refetching")}>
          <div className="max-h-[38rem] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="py-2 pr-3 text-left font-medium">Conta</th>
                  <th className="py-2 pr-3 text-right font-medium">Esperado</th>
                  <th className="py-2 pr-3 text-right font-medium">Real</th>
                  <th className="py-2 pr-3 text-right font-medium">Diferença</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const dif = netDif(l);
                  return (
                    <tr
                      key={`${l.classif}-${l.conta}`}
                      onClick={() => setAlvo(l)}
                      className="group cursor-pointer border-b border-hairline/60 transition-colors last:border-0 hover:bg-surface-2/60"
                    >
                      <td className="py-2 pr-3">
                        <span className="tabular-nums text-muted">{l.conta}</span>{" "}
                        <span className="text-ink-2">{l.descricao}</span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted">
                        {brl(l.fiscalDeb - l.fiscalCred)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted">
                        {brl(l.realDeb - l.realCred)}
                      </td>
                      <td
                        className={clsx(
                          "py-2 pr-3 text-right font-semibold tabular-nums",
                          Math.abs(dif) > 100 ? "text-critical" : "text-warn"
                        )}
                      >
                        <span className="inline-flex items-center gap-1">
                          {Math.abs(dif) > 100 && <AlertTriangle className="size-3" />}
                          {brl(dif)}
                        </span>
                      </td>
                      <td className="w-6 pl-1 text-muted">
                        <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CulpadosModal alvo={alvo} qs={qs} onFechar={() => setAlvo(null)} />
    </section>
  );
}
