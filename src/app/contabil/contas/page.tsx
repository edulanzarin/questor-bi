"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Coins,
  FileSearch,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { Kpi } from "@/components/kpi-conf";
import { useFiltros } from "@/hooks/use-filters";
import { useDivergencias } from "@/hooks/use-api";
import { brl, dataBR, num } from "@/lib/format";
import type { NotaDivergente, TipoDivergencia } from "@/lib/types";

type Tipo = "ent" | "sai";

const ROTULO_TIPO: Record<TipoDivergencia, string> = {
  conta: "Conta fora do plano",
  faltando: "Lançamento faltando",
  valor: "Valor divergente",
  natureza: "Natureza invertida",
  extra: "Lançamento extra",
};

const COR_TIPO: Record<TipoDivergencia, string> = {
  conta: "bg-critical/12 text-critical",
  faltando: "bg-warn/12 text-warn",
  valor: "bg-ent/12 text-ent",
  natureza: "bg-sai/12 text-sai",
  extra: "bg-surface-2 text-ink-2",
};

function LinhaNota({ nota }: { nota: NotaDivergente }) {
  return (
    <tr className="border-b border-hairline/60 align-top last:border-0 hover:bg-surface-2/50">
      <td className="py-3 pr-3 tabular-nums">
        {num(nota.numero)}
        {nota.serie && <span className="text-muted"> / {nota.serie}</span>}
        <span className="block text-[11px] text-muted">{dataBR(nota.data)}</span>
      </td>
      <td className="max-w-[220px] py-3 pr-3">
        <span className="block truncate text-ink" title={nota.contraparte ?? ""}>
          {nota.contraparte ?? "—"}
        </span>
        <span className="text-[11px] text-muted">
          {nota.especie} · CFOP {nota.cfops.join(", ")}
        </span>
      </td>
      <td className="py-3 pr-3">
        <ul className="flex flex-col gap-1.5">
          {nota.divergencias.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className={clsx(
                  "mt-px shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                  COR_TIPO[d.tipo]
                )}
              >
                {ROTULO_TIPO[d.tipo]}
              </span>
              <span className="text-xs text-ink-2">{d.detalhe}</span>
            </li>
          ))}
        </ul>
      </td>
      <td className="py-3 pl-3 text-right font-semibold tabular-nums text-ink">
        {brl(nota.valor)}
      </td>
    </tr>
  );
}

export default function ContasPage() {
  const { filtros, qs } = useFiltros();
  const [tipo, setTipo] = useState<Tipo>("ent");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoDivergencia | "todos">("todos");
  const temEmpresa = filtros.empresas.length === 1;

  const div = useDivergencias(qs, temEmpresa);
  const lado = div.data?.[tipo];

  const notas = useMemo(() => {
    if (!lado) return undefined;
    const q = busca.trim().toLowerCase();
    return lado.notas.filter((n) => {
      if (filtroTipo !== "todos" && !n.divergencias.some((d) => d.tipo === filtroTipo)) return false;
      if (!q) return true;
      return (
        String(n.numero).includes(q) ||
        (n.contraparte ?? "").toLowerCase().includes(q) ||
        n.cfops.some((c) => String(c).includes(q))
      );
    });
  }, [lado, busca, filtroTipo]);

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          A conferência de contas roda uma empresa por vez. Escolha a empresa e o período (até 1
          ano) no filtro acima para ver as notas contabilizadas fora do plano.
        </p>
      </section>
    );
  }

  const taxa =
    lado && lado.analisadas > 0
      ? ((lado.conformes / lado.analisadas) * 100).toLocaleString("pt-BR", {
          maximumFractionDigits: 1,
        })
      : "—";

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Entre as notas já contabilizadas, quais foram para conta contábil diferente da que o plano
          do CFOP manda.
        </p>
        <SeletorTipo tipo={tipo} onTipo={setTipo} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {div.isLoading || !lado ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)
        ) : (
          <>
            <Kpi
              rotulo="Notas conferidas"
              icone={<FileSearch className="size-4 text-ent" />}
              corIcone="bg-ent/12"
              valor={num(lado.analisadas)}
              secundario={
                lado.semPlano > 0 ? `${num(lado.semPlano)} sem plano no CFOP` : "contabilizadas no período"
              }
            />
            <Kpi
              rotulo="Conformes"
              icone={<CheckCircle2 className="size-4 text-good" />}
              corIcone="bg-good/12"
              valor={num(lado.conformes)}
              secundario={`${taxa}% de aderência ao plano`}
            />
            <Kpi
              rotulo="Com divergência"
              icone={<AlertTriangle className="size-4 text-critical" />}
              corIcone="bg-critical/12"
              valor={num(lado.divergentes)}
              secundario={`${brl(lado.valorDivergente)} em notas afetadas`}
              alerta={lado.divergentes > 0}
            />
            <Kpi
              rotulo="Apontamentos"
              icone={<Coins className="size-4 text-warn" />}
              corIcone="bg-warn/12"
              valor={num(Object.values(lado.porTipo).reduce((a, b) => a + b, 0))}
              secundario="somando todos os tipos"
            />
          </>
        )}
      </div>

      <section className="card anim-fade-up p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Notas fora do plano de contabilização</h2>
            <p className="mt-0.5 text-xs text-muted">
              Comparação lançamento a lançamento contra o plano do CFOP
              {lado?.truncado && " · mostrando as 300 de maior valor"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {(["todos", "conta", "faltando", "valor", "natureza"] as const).map((t) => {
                const qtd = t === "todos" ? null : (lado?.porTipo[t] ?? 0);
                if (t !== "todos" && !qtd) return null;
                return (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={clsx(
                      "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      filtroTipo === t
                        ? "bg-ent/12 font-medium text-ent"
                        : "text-muted hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    {t === "todos" ? "Todos" : ROTULO_TIPO[t]}
                    {qtd != null && <span className="ml-1 tabular-nums">{qtd}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
              <Search className="size-4 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nº, contraparte ou CFOP…"
                className="w-40 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
              />
            </div>
          </div>
        </header>

        {div.isLoading || !notas ? (
          <div className="skeleton h-80 w-full" />
        ) : notas.length === 0 ? (
          <div className="grid h-32 place-items-center gap-2 text-center">
            <CheckCircle2 className="mx-auto size-6 text-good" />
            <p className="text-sm text-muted">
              {busca || filtroTipo !== "todos"
                ? "Nenhuma nota encontrada com esse filtro"
                : "Todas as notas contabilizadas seguem o plano 🎉"}
            </p>
          </div>
        ) : (
          <div
            className={clsx(
              "max-h-[34rem] overflow-auto",
              div.isFetching && !div.isLoading && "refetching"
            )}
          >
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="py-2 pr-3 text-left font-medium">Nº / Data</th>
                  <th className="py-2 pr-3 text-left font-medium">
                    {tipo === "ent" ? "Fornecedor" : "Cliente"}
                  </th>
                  <th className="py-2 pr-3 text-left font-medium">Divergências</th>
                  <th className="py-2 pl-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((n) => (
                  <LinhaNota key={n.chave} nota={n} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 px-1 text-[11px] text-muted">
        <ArrowLeftRight className="mt-px size-3.5 shrink-0" />
        <span>
          Só é cobrado o que o Questor de fato lança nota a nota. Tributo apurado mensalmente (ICMS
          e IPI de saída, por exemplo) é contabilizado na apuração, não na nota, e por isso não
          entra como pendência. Valores só são conferidos em nota de CFOP único.
        </span>
      </p>
    </>
  );
}
