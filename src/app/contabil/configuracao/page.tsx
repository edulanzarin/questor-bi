"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, PencilLine, Search, Settings2 } from "lucide-react";
import clsx from "clsx";
import { PlanoEditor } from "@/components/plano-editor";
import { useFiltros } from "@/hooks/use-filters";
import { usePlano } from "@/hooks/use-api";
import { num } from "@/lib/format";
import type { PlanoCfop } from "@/lib/types";

type FiltroLado = "todos" | "ent" | "sai";

/** Resumo de uma linha do plano: "D 25204 Resíduo de Madeira". */
function Lancamento({
  natureza,
  conta,
  variavel,
  descricao,
}: {
  natureza: 1 | -1;
  conta: number | null;
  variavel: boolean;
  descricao: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px]">
      <span className={clsx("font-semibold", natureza === 1 ? "text-ent" : "text-sai")}>
        {natureza === 1 ? "D" : "C"}
      </span>
      <span className="tabular-nums text-ink">{variavel ? "variável" : conta}</span>
      {descricao && <span className="max-w-40 truncate text-muted">{descricao}</span>}
    </span>
  );
}

export default function ConfiguracaoPage() {
  const { filtros, qs } = useFiltros();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [lado, setLado] = useState<FiltroLado>("todos");
  const [soOverride, setSoOverride] = useState(false);
  const [editando, setEditando] = useState<PlanoCfop | null>(null);
  const temEmpresa = filtros.empresas.length === 1;

  const plano = usePlano(qs, temEmpresa);

  const cfops = useMemo(() => {
    if (!plano.data) return undefined;
    const q = busca.trim().toLowerCase();
    return plano.data.cfops.filter((c) => {
      if (lado !== "todos" && c.lado !== lado) return false;
      if (soOverride && c.origem !== "override") return false;
      if (!q) return true;
      return (
        String(c.cfop).includes(q) ||
        String(c.cfopBase).includes(q) ||
        (c.descricao ?? "").toLowerCase().includes(q)
      );
    });
  }, [plano.data, busca, lado, soOverride]);

  const totalOverrides = plano.data?.cfops.filter((c) => c.origem === "override").length ?? 0;

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          O plano de contabilização é por empresa. Escolha a empresa e o período no filtro acima
          para ver os CFOPs movimentados e as contas que cada um deve usar.
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted">
          O plano vem pronto do Questor: cada CFOP já sabe em quais contas lançar. Edite um CFOP
          para sobrescrever essa regra — a partir daí a conferência cobra a sua versão.
        </p>
        {totalOverrides > 0 && (
          <span className="rounded-lg bg-ent/12 px-2.5 py-1.5 text-xs font-medium text-ent">
            {num(totalOverrides)} {totalOverrides === 1 ? "override ativo" : "overrides ativos"}
          </span>
        )}
      </div>

      <section className="card anim-fade-up p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">CFOPs movimentados no período</h2>
            <p className="mt-0.5 text-xs text-muted">
              {plano.data ? `${num(plano.data.cfops.length)} CFOPs · ordenados por uso` : "…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["todos", "ent", "sai"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLado(l)}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  lado === l
                    ? "bg-ent/12 font-medium text-ent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {l === "todos" ? "Todos" : l === "ent" ? "Entradas" : "Saídas"}
              </button>
            ))}
            <button
              onClick={() => setSoOverride((v) => !v)}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                soOverride
                  ? "bg-ent/12 font-medium text-ent"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              Só overrides
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
              <Search className="size-4 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="CFOP ou descrição…"
                className="w-40 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
              />
            </div>
          </div>
        </header>

        {plano.isLoading || !cfops ? (
          <div className="skeleton h-80 w-full" />
        ) : cfops.length === 0 ? (
          <p className="grid h-32 place-items-center text-sm text-muted">
            Nenhum CFOP encontrado
          </p>
        ) : (
          <div
            className={clsx(
              "max-h-[34rem] overflow-auto",
              plano.isFetching && !plano.isLoading && "refetching"
            )}
          >
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="py-2 pr-3 text-left font-medium">CFOP</th>
                  <th className="py-2 pr-3 text-left font-medium">Descrição</th>
                  <th className="py-2 pr-3 text-left font-medium">Lançamentos esperados</th>
                  <th className="py-2 pr-3 text-right font-medium">Notas</th>
                  <th className="py-2 pl-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {cfops.map((c) => {
                  const linhas = c.componentes.flatMap((comp) =>
                    comp.linhas.map((l) => ({ ...l, comp: comp.rotulo }))
                  );
                  return (
                    <tr
                      key={`${c.estab}:${c.cfop}`}
                      className="border-b border-hairline/60 align-top last:border-0 hover:bg-surface-2/50"
                    >
                      <td className="py-3 pr-3">
                        <span className="tabular-nums text-ink">{c.cfop}</span>
                        <span className="block text-[11px] text-muted">
                          base {c.cfopBase} · estab {c.estab}
                        </span>
                      </td>
                      <td className="max-w-[260px] py-3 pr-3">
                        <span className="block truncate text-ink-2" title={c.descricao ?? ""}>
                          {c.descricao ?? "—"}
                        </span>
                        {c.origem === "override" && (
                          <span className="mt-1 inline-block rounded bg-ent/12 px-1.5 py-0.5 text-[10px] font-medium text-ent">
                            override
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {!c.contabiliza ? (
                          <span className="text-[11px] text-muted">não contabiliza</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {linhas.map((l, i) => (
                              <Lancamento
                                key={i}
                                natureza={l.natureza}
                                conta={l.conta}
                                variavel={l.contaVariavel}
                                descricao={l.descrConta}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums text-ink-2">
                        {num(c.usos ?? 0)}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          onClick={() => setEditando(c)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-ink"
                        >
                          <PencilLine className="size-3.5" /> Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 px-1 text-[11px] text-muted">
        <Settings2 className="mt-px size-3.5 shrink-0" />
        <span>
          &quot;Variável&quot; é a conta que só se conhece no lançamento — a do fornecedor ou do
          cliente. CFOP sem lançamento é operação que o Questor não contabiliza (remessa, retorno,
          industrialização por encomenda).
        </span>
      </p>

      {editando && (
        <PlanoEditor
          empresa={filtros.empresas[0]}
          plano={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => {
            setEditando(null);
            queryClient.invalidateQueries({ queryKey: ["plano"] });
            queryClient.invalidateQueries({ queryKey: ["divergencias"] });
          }}
        />
      )}
    </>
  );
}
