"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Copy, Landmark, Search } from "lucide-react";
import clsx from "clsx";
import { ContaDropdown } from "@/components/conta-dropdown";
import { ReplicarModal } from "@/components/replicar-modal";
import { RegraExtratoLinha } from "@/components/regra-extrato-linha";
import { useEstadoSecao } from "@/hooks/use-estado-secao";
import { useFiltros } from "@/hooks/use-filters";
import { num } from "@/lib/format";
import type { ContaBanco } from "@/lib/types";

async function carregarTodas(empresa: number) {
  const res = await fetch(`/api/contabil/extrato-regras?empresa=${empresa}`);
  if (!res.ok) throw new Error("Falha ao carregar");
  return (await res.json()) as ContaBanco[];
}

async function carregarConta(empresa: number, conta: number) {
  const res = await fetch(`/api/contabil/extrato-regras?empresa=${empresa}&conta=${conta}`);
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo?.error ?? "Falha ao carregar");
  return corpo as ContaBanco;
}

export default function RegrasPage() {
  const { filtros } = useFiltros();
  const queryClient = useQueryClient();
  const empresa = filtros.empresas[0];
  const temEmpresa = filtros.empresas.length === 1;

  // Nomes prefixados: a conta aqui é a que se está cadastrando, não a conta do
  // extrato importado na outra aba — mesma seção, significados diferentes.
  const [conta, setConta] = useEstadoSecao<number | null>("regras.conta", null);
  const [replicando, setReplicando] = useState<ContaBanco | null>(null);
  const [busca, setBusca] = useEstadoSecao("regras.busca", "");

  // Contas que já têm cadastro: atalho para navegar entre elas.
  const { data: comRegras } = useQuery({
    queryKey: ["extrato-regras", empresa],
    queryFn: () => carregarTodas(empresa),
    enabled: temEmpresa,
  });

  const { data: atual, isLoading } = useQuery({
    queryKey: ["extrato-regras", empresa, conta],
    queryFn: () => carregarConta(empresa, conta!),
    enabled: temEmpresa && conta != null,
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ["extrato-regras"] });

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!atual) return [];
    if (!q) return atual.regras;
    return atual.regras.filter(
      (r) =>
        r.termoOriginal.toLowerCase().includes(q) ||
        String(r.contaPagamento ?? "").includes(q) ||
        String(r.contaRecebimento ?? "").includes(q) ||
        (r.descrPagamento ?? "").toLowerCase().includes(q) ||
        (r.descrRecebimento ?? "").toLowerCase().includes(q)
    );
  }, [atual, busca]);

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">Escolha a empresa no filtro acima.</p>
      </section>
    );
  }

  return (
    <>

      <section className="card anim-fade-up flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-2">Conta de banco</label>
            <ContaDropdown
              empresa={empresa}
              valor={conta}
              onMudar={setConta}
              soBanco
              placeholder="Escolher no plano de contas"
            />
          </div>
          {atual && atual.regras.length > 0 && (
            <button
              onClick={() => setReplicando(atual)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-hairline px-3 text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Copy className="size-3.5" /> Replicar para outras contas
            </button>
          )}
        </div>

        {!!comRegras?.length && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3">
            <span className="text-[11px] text-muted">Já cadastradas:</span>
            {comRegras.map((c) => (
              <button
                key={c.conta}
                onClick={() => setConta(c.conta)}
                className={clsx(
                  "rounded-lg px-2 py-1 text-xs transition-colors",
                  c.conta === conta
                    ? "bg-ent/12 font-medium text-ent"
                    : "text-muted hover:bg-surface-2 hover:text-ink"
                )}
              >
                {c.conta} · {c.descricao}
                <span className="ml-1 text-[10px]">({c.regras.length})</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {conta == null ? (
        <section className="card grid place-items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
            <Landmark className="size-6" />
          </span>
          <p className="text-sm font-medium text-ink">Escolha uma conta de banco</p>
          <p className="max-w-md text-xs text-muted">
            Escolha a conta no seletor acima para ver e cadastrar as regras dela.
          </p>
        </section>
      ) : isLoading || !atual ? (
        <div className="skeleton h-64 w-full" />
      ) : (
        <section className="card anim-fade-up p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-ent/12 text-ent">
                <Landmark className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">
                  {atual.descricao ?? `Conta ${atual.conta}`}
                </h2>
                <p className="text-xs text-muted">
                  conta {atual.conta} · {num(atual.regras.length)}{" "}
                  {atual.regras.length === 1 ? "regra" : "regras"}
                  {busca && ` · ${num(visiveis.length)} no filtro`}
                </p>
              </div>
            </div>
            {atual.regras.length > 8 && (
              <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
                <Search className="size-4 text-muted" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Filtrar por termo ou conta…"
                  className="w-48 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
                />
              </div>
            )}
          </header>

          {/* Altura limitada: o cadastro cresce sem fim e a página não pode
              crescer junto. Cabeçalho fica fixo e a linha de nova regra vem
              antes da lista, para continuar alcançável com a lista rolada. */}
          <div className="max-h-[30rem] overflow-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="w-64 py-2 pr-3 text-left font-medium">Descrição no extrato</th>
                  <th className="w-28 py-2 pr-3 text-left font-medium">Casamento</th>
                  <th className="py-2 pr-3 text-left font-medium">Se for pagamento</th>
                  <th className="py-2 pr-3 text-left font-medium">Se for recebimento</th>
                  <th className="w-20 py-2 pl-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                <RegraExtratoLinha
                  empresa={empresa}
                  conta={atual.conta}
                  regra={null}
                  onSalvo={recarregar}
                />
                {visiveis.map((r) => (
                  <RegraExtratoLinha
                    key={r.id}
                    empresa={empresa}
                    conta={atual.conta}
                    regra={r}
                    onSalvo={recarregar}
                  />
                ))}
                {busca && visiveis.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-muted">
                      Nenhuma regra com esse filtro
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>
      )}

      {replicando && (
        <ReplicarModal
          origem={replicando}
          onFechar={() => setReplicando(null)}
          onReplicado={() => {
            setReplicando(null);
            recarregar();
          }}
        />
      )}
    </>
  );
}
