"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Copy,
  Landmark,
  Plus,
  Trash2,
} from "lucide-react";
import { ContaDropdown } from "@/components/conta-dropdown";
import { ReplicarModal } from "@/components/replicar-modal";
import { RegraExtratoLinha } from "@/components/regra-extrato-linha";
import { useFiltros } from "@/hooks/use-filters";
import { num } from "@/lib/format";
import type { ContaBanco } from "@/lib/types";

async function carregar(empresa: number) {
  const res = await fetch(`/api/contabil/extrato-regras?empresa=${empresa}`);
  const corpo = await res.json();
  if (!res.ok) throw new Error(corpo?.error ?? "Falha ao carregar");
  return corpo as ContaBanco[];
}

export default function ExtratosPage() {
  const { filtros } = useFiltros();
  const queryClient = useQueryClient();
  const empresa = filtros.empresas[0];
  const temEmpresa = filtros.empresas.length === 1;

  const [novaConta, setNovaConta] = useState<number | null>(null);
  const [replicando, setReplicando] = useState<ContaBanco | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["extrato-regras", empresa],
    queryFn: () => carregar(empresa),
    enabled: temEmpresa,
  });

  const recarregar = () => queryClient.invalidateQueries({ queryKey: ["extrato-regras"] });

  async function adicionarConta() {
    if (novaConta == null) return;
    const res = await fetch("/api/contabil/extrato-regras", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acao: "conta", empresa, conta: novaConta }),
    });
    const corpo = await res.json();
    if (!res.ok) return toast.error(corpo?.error ?? "Falha ao adicionar");
    toast.success("Conta de banco adicionada");
    setNovaConta(null);
    recarregar();
  }

  async function removerConta(c: ContaBanco) {
    if (c.regras.length && !confirm(`Remover a conta ${c.conta} e as suas ${c.regras.length} regras?`)) {
      return;
    }
    const res = await fetch(`/api/contabil/extrato-regras?contaBanco=${c.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Falha ao remover");
    toast.success("Conta removida");
    recarregar();
  }

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          As regras de contrapartida são por empresa e por conta de banco. Escolha a empresa no
          filtro acima para cadastrar.
        </p>
      </section>
    );
  }

  return (
    <>
      <p className="max-w-3xl text-sm text-muted">
        Para cada conta de banco, diga em que conta contábil cai cada descrição do extrato. O
        dinheiro que entra debita o banco e credita a contrapartida; o que sai faz o inverso.
        Quando mais de uma regra casa, vence a mais específica: exato ganha de parcial, e entre
        parciais o termo mais longo ganha.
      </p>

      <section className="card anim-fade-up flex flex-wrap items-end gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-2">Adicionar conta de banco</label>
          <ContaDropdown
            empresa={empresa}
            valor={novaConta}
            onMudar={setNovaConta}
            soBanco
            placeholder="Escolher no plano de contas"
          />
        </div>
        <button
          onClick={adicionarConta}
          disabled={novaConta == null}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-ent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="size-4" /> Adicionar
        </button>
        <p className="ml-auto max-w-xs text-[11px] text-muted">
          Só aparecem contas de caixa e bancos (1.1.01) do plano desta empresa.
        </p>
      </section>

      {isLoading ? (
        <div className="skeleton h-64 w-full" />
      ) : !data?.length ? (
        <section className="card grid place-items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
            <Landmark className="size-6" />
          </span>
          <p className="text-sm font-medium text-ink">Nenhuma conta de banco cadastrada</p>
          <p className="max-w-md text-xs text-muted">
            Comece adicionando a conta do banco acima — por exemplo o Viacredi. Depois cadastre as
            descrições que aparecem no extrato dela.
          </p>
        </section>
      ) : (
        data.map((c) => (
          <section key={c.id} className="card anim-fade-up p-5">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-ent/12 text-ent">
                  <Landmark className="size-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">
                    {c.apelido || c.descricao || `Conta ${c.conta}`}
                  </h2>
                  <p className="text-xs text-muted">
                    conta {c.conta}
                    {c.apelido && c.descricao ? ` · ${c.descricao}` : ""} ·{" "}
                    {num(c.regras.length)} {c.regras.length === 1 ? "regra" : "regras"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReplicando(c)}
                  disabled={!c.regras.length}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Copy className="size-3.5" /> Replicar
                </button>
                <button
                  onClick={() => removerConta(c)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-critical"
                >
                  <Trash2 className="size-3.5" /> Remover
                </button>
              </div>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline text-xs text-muted">
                    <th className="w-64 py-2 pr-3 text-left font-medium">Descrição no extrato</th>
                    <th className="w-28 py-2 pr-3 text-left font-medium">Casamento</th>
                    <th className="py-2 pr-3 text-left font-medium">Se for pagamento</th>
                    <th className="py-2 pr-3 text-left font-medium">Se for recebimento</th>
                    <th className="w-20 py-2 pl-3 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {c.regras.map((r) => (
                    <RegraExtratoLinha
                      key={r.id}
                      empresa={empresa}
                      contaBancoId={c.id}
                      regra={r}
                      onSalvo={recarregar}
                    />
                  ))}
                  <RegraExtratoLinha
                    empresa={empresa}
                    contaBancoId={c.id}
                    regra={null}
                    onSalvo={recarregar}
                  />
                </tbody>
              </table>
            </div>

            {c.regras.length > 0 && (
              <p className="mt-3 text-[11px] text-muted">
                Ordem de precedência de cima para baixo. Deixar uma contrapartida em branco faz a
                regra ignorar aquele sentido — a transação aparece como pendente na importação.
              </p>
            )}
          </section>
        ))
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
