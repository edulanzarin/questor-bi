"use client";

import { Scale, Info } from "lucide-react";
import clsx from "clsx";
import type { ApuracaoLinha } from "@/lib/types";
import { brl } from "@/lib/format";

function Saldo({ v }: { v: number }) {
  const recolher = v > 0;
  return (
    <span
      className={clsx(
        "tnum font-medium",
        Math.abs(v) < 0.005 ? "text-muted" : recolher ? "text-sai" : "text-ent"
      )}
    >
      {brl(v)}
    </span>
  );
}

export function ApuracaoTabela({
  dados,
  carregando,
  recarregando,
}: {
  dados: ApuracaoLinha[] | undefined;
  carregando: boolean;
  recarregando: boolean;
}) {
  const totalSaldo = dados?.reduce((s, l) => s + l.saldo, 0) ?? 0;
  const totalDebito = dados?.reduce((s, l) => s + l.debito, 0) ?? 0;
  const totalCredito = dados?.reduce((s, l) => s + l.credito, 0) ?? 0;

  return (
    <section className="card anim-fade-up overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-hairline p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-ink-2">
            <Scale className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Apuração gerencial</h2>
            <p className="mt-0.5 text-xs text-muted">Débito (saídas) − crédito (entradas)</p>
          </div>
        </div>
        {!carregando && dados && (
          <div className="text-right">
            <p className="text-[11px] text-muted">
              Saldo {totalSaldo >= 0 ? "a recolher" : "credor"}
            </p>
            <p
              className={clsx(
                "text-xl font-semibold tracking-tight",
                totalSaldo >= 0 ? "text-sai" : "text-ent"
              )}
            >
              {brl(Math.abs(totalSaldo))}
            </p>
          </div>
        )}
      </header>

      {carregando || !dados ? (
        <div className="p-5">
          <div className="skeleton h-40 w-full" />
        </div>
      ) : (
        <div className={clsx("overflow-x-auto", recarregando && "opacity-60 transition-opacity")}>
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-hairline">
                <th className="py-2.5 pl-5 font-medium">Imposto</th>
                <th className="py-2.5 pr-3 text-right font-medium">Débito (saídas)</th>
                <th className="py-2.5 pr-3 text-right font-medium">Crédito (entradas)</th>
                <th className="py-2.5 pr-5 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((l) => (
                <tr key={l.imposto} className="border-b border-hairline/60">
                  <td className="py-2.5 pl-5 font-medium">{l.imposto}</td>
                  <td className="tnum py-2.5 pr-3 text-right">{brl(l.debito)}</td>
                  <td className="tnum py-2.5 pr-3 text-right text-muted">{brl(l.credito)}</td>
                  <td className="py-2.5 pr-5 text-right">
                    <Saldo v={l.saldo} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-hairline bg-surface-2/40 font-medium">
                <td className="py-2.5 pl-5">Total</td>
                <td className="tnum py-2.5 pr-3 text-right">{brl(totalDebito)}</td>
                <td className="tnum py-2.5 pr-3 text-right text-muted">{brl(totalCredito)}</td>
                <td className="py-2.5 pr-5 text-right">
                  <Saldo v={totalSaldo} />
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="flex items-start gap-1.5 border-t border-hairline px-5 py-3 text-[11px] text-muted">
            <Info className="mt-px size-3.5 shrink-0" />
            Estimativa gerencial pelos impostos destacados nas notas. Não substitui a apuração
            fiscal oficial (SPED E100/E110), que considera ajustes, estornos e créditos específicos.
          </p>
        </div>
      )}
    </section>
  );
}
