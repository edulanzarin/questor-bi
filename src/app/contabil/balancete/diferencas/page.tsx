"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import clsx from "clsx";
import { Modal } from "@/components/ui/modal";
import { useFiltros } from "@/hooks/use-filters";
import { useBalanceteFiscal, useBalanceteCulpados } from "@/hooks/use-api";
import { brl, num } from "@/lib/format";
import type { BalanceteLinha } from "@/lib/types";

/** Diferença líquida da conta: (débito − crédito) esperado − o mesmo no real. */
const netDif = (l: BalanceteLinha) =>
  l.fiscalDeb - l.fiscalCred - (l.realDeb - l.realCred);
const TOL = 0.5;

const ORIGEM: Record<string, string> = { ME: "Nota entrada", MS: "Nota saída" };

const TIPO: Record<string, { rotulo: string; cor: string; titulo: string }> = {
  valor: {
    rotulo: "Valor diferente",
    cor: "bg-critical/12 text-critical",
    titulo: "Lançada, mas com valor diferente do esperado pela regra",
  },
  faltando: {
    rotulo: "Não lançada aqui",
    cor: "bg-warn/12 text-warn",
    titulo: "Esperada nesta conta pela regra, mas não lançada aqui (foi para outra)",
  },
  extra: {
    rotulo: "Sem regra reproduzível",
    cor: "bg-surface-2 text-muted",
    titulo:
      "Lançada sem o motor esperar — pode ser conta errada, mas também nota que o motor não reproduz (NFSE/serviço)",
  },
};

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

/** Notas por trás da diferença de uma conta: esperado × real por nota. */
function CulpadosModal({
  alvo,
  qs,
  onFechar,
}: {
  alvo: BalanceteLinha | null;
  qs: string;
  onFechar: () => void;
}) {
  const { data, isLoading } = useBalanceteCulpados(qs, alvo?.classif ?? null, alvo?.conta ?? 0, false);
  const culpados = data?.culpados ?? [];
  const totalDif = culpados.reduce((s, c) => s + c.diferenca, 0);
  // Diferença explicada só por notas que o motor não reproduz: provável
  // incompletude (NFSE/serviço), não erro de contabilização.
  const soMotorIncompleto = culpados.length > 0 && culpados.every((c) => c.tipo === "extra");

  return (
    <Modal
      aberto={alvo != null}
      onFechar={onFechar}
      largura="max-w-3xl"
      ariaLabel="Notas da diferença"
      titulo={
        <h3 className="truncate text-lg font-semibold" title={alvo?.descricao}>
          {alvo ? `${alvo.conta} · ${alvo.descricao}` : ""}
        </h3>
      }
      subtitulo="Notas cujo esperado não bate com o lançado · esperado − real"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6">
            <div className="skeleton h-40 w-full" />
          </div>
        ) : culpados.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Nenhuma nota isolada explica a diferença (pode ser imposto/apuração).
          </p>
        ) : (
          <>
            {soMotorIncompleto && (
              <p className="border-b border-hairline bg-surface-2/60 px-6 py-3 text-xs text-muted">
                Toda a diferença vem de notas lançadas sem o motor esperar — típico de
                NFSE/serviço, que o motor ainda não reproduz. Provavelmente não é erro de
                contabilização; confira pela Conferência de Contas.
              </p>
            )}
            <table className="w-full min-w-[680px] text-xs">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr className="border-b border-hairline">
                  <th className="py-2 pl-6 pr-3 font-medium">Nº</th>
                  <th className="py-2 pr-3 font-medium">Contraparte</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 text-right font-medium">Esperado</th>
                  <th className="py-2 pr-3 text-right font-medium">Real</th>
                  <th className="py-2 pr-6 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {culpados.map((c, i) => (
                  <tr key={i} className="border-b border-hairline/50 last:border-0">
                    <td className="py-1.5 pl-6 pr-3 tabular-nums whitespace-nowrap">
                      {c.numero ?? "—"}
                      <span className="ml-1.5 text-[10px] text-muted">{ORIGEM[c.origem] ?? c.origem}</span>
                    </td>
                    <td className="max-w-[220px] truncate py-1.5 pr-3" title={c.contraparte ?? ""}>
                      {c.contraparte ?? "—"}
                    </td>
                    <td className="py-1.5 pr-3">
                      <span
                        className={clsx("rounded px-1.5 py-0.5 text-[10px] font-medium", TIPO[c.tipo].cor)}
                        title={TIPO[c.tipo].titulo}
                      >
                        {TIPO[c.tipo].rotulo}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{brl(c.esperado)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{brl(c.real)}</td>
                    <td className="py-1.5 pr-6 text-right font-semibold tabular-nums text-ink">
                      {brl(c.diferenca)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-3 text-xs text-muted">
        <span>
          {num(culpados.length)} {culpados.length === 1 ? "nota" : "notas"}
          {(data?.total ?? 0) > culpados.length && (
            <span className="text-muted/70"> · maiores de {num(data?.total ?? 0)}</span>
          )}
        </span>
        {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
        <span className="tabular-nums font-medium text-ink">{brl(totalDif)}</span>
      </footer>
    </Modal>
  );
}
