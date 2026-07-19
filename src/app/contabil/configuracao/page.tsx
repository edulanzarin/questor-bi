"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronLeft, ChevronRight, PencilLine, Search, Settings2 } from "lucide-react";
import clsx from "clsx";
import { PlanoEditor } from "@/components/plano-editor";
import { useFiltros } from "@/hooks/use-filters";
import { usePlano } from "@/hooks/use-api";
import { num } from "@/lib/format";
import type { EstabInfo, PlanoCfop } from "@/lib/types";

type Filtro = "todos" | "ent" | "sai" | "override" | "naocontabiliza";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "ent", rotulo: "Entradas" },
  { id: "sai", rotulo: "Saídas" },
  { id: "override", rotulo: "Só overrides" },
  { id: "naocontabiliza", rotulo: "Não contabiliza" },
];

/**
 * Rótulo curto do estabelecimento: o sufixo do CNPJ (0001 = matriz, demais são
 * filiais). "estab 2" sozinho não diz nada para quem usa.
 */
function rotuloEstab(e: EstabInfo | undefined, codigo: number): string {
  const ordem = e?.cnpj?.match(/\/(\d{4})-/)?.[1];
  if (!ordem) return `estab ${codigo}`;
  return ordem === "0001" ? "matriz" : `filial ${ordem}`;
}

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
  const { filtros } = useFiltros();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<PlanoCfop | null>(null);
  const empresa = filtros.empresas[0];
  const temEmpresa = filtros.empresas.length === 1;

  // Digitar não dispara consulta a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);

  // Trocar de busca/filtro recomeça na primeira página.
  useEffect(() => setPagina(1), [buscaAplicada, filtro]);

  // Sem período: o plano é configuração fixa da empresa.
  const qs = new URLSearchParams({
    empresa: String(empresa ?? ""),
    filtro,
    pagina: String(pagina),
    ...(buscaAplicada ? { busca: buscaAplicada } : {}),
  }).toString();

  const plano = usePlano(qs, temEmpresa);
  const dados = plano.data;

  const estabs = useMemo(
    () => new Map((dados?.estabs ?? []).map((e) => [e.codigo, e])),
    [dados]
  );

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          O plano de contabilização é por empresa e não depende de período. Escolha a empresa no
          filtro acima para ver em quais contas cada CFOP deve lançar.
        </p>
      </section>
    );
  }

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.porPagina)) : 1;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted">
          O plano vem pronto do Questor: cada CFOP já sabe em quais contas lançar. Editar um CFOP
          grava uma regra fixa da empresa, que passa a valer no lugar da do Questor até você
          alterar de novo.
        </p>
        {!!dados?.overrides && (
          <span className="rounded-lg bg-ent/12 px-2.5 py-1.5 text-xs font-medium text-ent">
            {num(dados.overrides)} {dados.overrides === 1 ? "override ativo" : "overrides ativos"}
          </span>
        )}
      </div>

      <section className="card anim-fade-up p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">CFOPs da empresa</h2>
            <p className="mt-0.5 text-xs text-muted">
              {dados
                ? `${num(dados.total)} ${dados.total === 1 ? "CFOP" : "CFOPs"}${
                    dados.total !== dados.totalGeral ? ` de ${num(dados.totalGeral)}` : ""
                  } · configuração fixa, sem período`
                : "…"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  filtro === f.id
                    ? "bg-ent/12 font-medium text-ent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {f.rotulo}
              </button>
            ))}
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

        {plano.isLoading || !dados ? (
          <div className="skeleton h-80 w-full" />
        ) : dados.cfops.length === 0 ? (
          <p className="grid h-32 place-items-center text-sm text-muted">Nenhum CFOP encontrado</p>
        ) : (
          <div className={clsx(plano.isFetching && !plano.isLoading && "refetching")}>
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="py-2 pr-3 text-left font-medium">CFOP</th>
                  <th className="py-2 pr-3 text-left font-medium">Descrição</th>
                  <th className="py-2 pr-3 text-left font-medium">Lançamentos esperados</th>
                  <th className="py-2 pl-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {dados.cfops.map((c) => {
                  const linhas = c.componentes.flatMap((comp) => comp.linhas);
                  return (
                    <tr
                      key={`${c.estab}:${c.cfop}`}
                      className="border-b border-hairline/60 align-top last:border-0 hover:bg-surface-2/50"
                    >
                      <td className="py-3 pr-3">
                        <span className="tabular-nums text-ink">{c.cfop}</span>
                        <span
                          className="block text-[11px] text-muted"
                          title={estabs.get(c.estab)?.cnpj ?? undefined}
                        >
                          base {c.cfopBase} · {rotuloEstab(estabs.get(c.estab), c.estab)}
                        </span>
                      </td>
                      <td className="max-w-[260px] py-3 pr-3">
                        <span className="block truncate text-ink-2" title={c.descricao ?? ""}>
                          {c.descricao ?? "—"}
                        </span>
                        {c.origem === "override" && (
                          <span
                            className="mt-1 inline-block rounded bg-ent/12 px-1.5 py-0.5 text-[10px] font-medium text-ent"
                            title={c.observacao ?? undefined}
                          >
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

            {totalPaginas > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                <p className="text-xs text-muted">
                  Página {dados.pagina} de {num(totalPaginas)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={dados.pagina <= 1}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="size-3.5" /> Anterior
                  </button>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={dados.pagina >= totalPaginas}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Próxima <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
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
          empresa={empresa}
          plano={editando}
          rotuloEstab={rotuloEstab(estabs.get(editando.estab), editando.estab)}
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
