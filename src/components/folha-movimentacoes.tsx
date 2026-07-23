"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import clsx from "clsx";
import { Modal } from "@/components/ui/modal";
import { useFicha } from "@/hooks/use-api";
import type { FolhaMovimentacao } from "@/lib/types";
import { dataBR, num } from "@/lib/format";

type Filtro = "todos" | "admitidos" | "desligados";

/** Dias → "X anos Y meses" / "N meses" / "N dias". */
function tempoCasa(dias: number | null): string {
  if (dias == null) return "—";
  if (dias < 30) return `${dias} ${dias === 1 ? "dia" : "dias"}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  return resto ? `${anos}a ${resto}m` : `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{rotulo}</p>
      <p className="mt-0.5 text-sm text-ink">{valor || "—"}</p>
    </div>
  );
}

function FichaModal({
  empresa,
  contrato,
  onFechar,
}: {
  empresa: number | null;
  contrato: number | null;
  onFechar: () => void;
}) {
  const { data: f, isLoading } = useFicha(empresa, contrato);
  return (
    <Modal
      aberto={contrato != null}
      onFechar={onFechar}
      largura="max-w-2xl"
      titulo={f ? f.nome : "Colaborador"}
      subtitulo={f ? `${f.cargo ?? "—"} · contrato ${f.contrato}` : undefined}
    >
      <div className="overflow-y-auto px-6 py-5">
        {isLoading || !f ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-2">
                Pessoa
              </h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Campo rotulo="CPF" valor={f.cpf} />
                <Campo rotulo="Sexo" valor={f.sexo} />
                <Campo
                  rotulo="Idade"
                  valor={f.idade != null ? `${f.idade} anos` : "—"}
                />
                <Campo rotulo="Nascimento" valor={dataBR(f.nascimento)} />
                <Campo rotulo="Escolaridade" valor={f.escolaridade} />
                <Campo
                  rotulo="Cidade"
                  valor={f.cidade ? `${f.cidade}${f.uf ? `/${f.uf}` : ""}` : "—"}
                />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-2">
                Vínculo
              </h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Campo rotulo="Cargo" valor={f.cargo} />
                <Campo rotulo="Função" valor={f.funcao} />
                <Campo rotulo="Setor" valor={f.setor} />
                <Campo rotulo="Estabelecimento" valor={f.estabelecimento} />
                <Campo
                  rotulo="Salário"
                  valor={
                    f.salario != null
                      ? `${f.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${f.tipoSalario ? ` · ${f.tipoSalario}` : ""}`
                      : "—"
                  }
                />
                <Campo
                  rotulo="Categoria / tipo"
                  valor={`${f.categoria ?? "—"} / ${f.tipoVinculo ?? "—"}`}
                />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-2">
                Contrato
              </h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Campo rotulo="Admissão" valor={dataBR(f.dataadm)} />
                <Campo rotulo="Desligamento" valor={f.datadem ? dataBR(f.datadem) : "ativo"} />
                <Campo rotulo="Tempo de casa" valor={tempoCasa(f.tempoCasaDias)} />
                {f.motivoDesligamento && (
                  <div className="col-span-2 sm:col-span-3">
                    <Campo rotulo="Motivo do desligamento" valor={f.motivoDesligamento} />
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface Props {
  dados: FolhaMovimentacao[] | undefined;
  empresa: number | null;
  carregando: boolean;
  recarregando: boolean;
}

/** Lista de quem foi admitido/desligado no período; clicar abre a ficha. */
export function FolhaMovimentacoes({ dados, empresa, carregando, recarregando }: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<number | null>(null);

  const visiveis = useMemo(() => {
    if (!dados) return undefined;
    const q = busca.trim().toLowerCase();
    return dados.filter((m) => {
      if (filtro === "admitidos" && !m.admitido) return false;
      if (filtro === "desligados" && !m.desligado) return false;
      if (q && !m.nome.toLowerCase().includes(q) && !m.cargo.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [dados, filtro, busca]);

  const nAdm = dados?.filter((m) => m.admitido).length ?? 0;
  const nDes = dados?.filter((m) => m.desligado).length ?? 0;

  const chips: { id: Filtro; rotulo: string }[] = [
    { id: "todos", rotulo: `Todos (${num((dados?.length ?? 0))})` },
    { id: "admitidos", rotulo: `Admitidos (${num(nAdm)})` },
    { id: "desligados", rotulo: `Desligados (${num(nDes)})` },
  ];

  return (
    <section className="card anim-fade-up p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Movimentações no período</h2>
          <p className="mt-0.5 text-xs text-muted">
            Quem foi admitido ou desligado · clique numa linha para a ficha
          </p>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltro(c.id)}
            className={clsx(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              filtro === c.id
                ? "border-ent/30 bg-ent/12 font-medium text-ent"
                : "border-hairline bg-surface-2 text-muted hover:text-ink"
            )}
          >
            {c.rotulo}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-3 py-1.5">
          <Search className="size-3.5 text-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome ou cargo…"
            className="w-44 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
          />
        </label>
      </div>

      {carregando || !visiveis ? (
        <div className="skeleton h-80 w-full" />
      ) : visiveis.length === 0 ? (
        <p className="grid h-32 place-items-center text-sm text-muted">
          Nenhuma movimentação no período
        </p>
      ) : (
        <div className={clsx("max-h-[34rem] overflow-y-auto overflow-x-auto", recarregando && "refetching")}>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-hairline text-xs text-muted">
                <th className="py-2 pr-3 text-left font-medium">Colaborador</th>
                <th className="py-2 px-3 text-left font-medium">Situação</th>
                <th className="py-2 px-3 text-left font-medium">Cargo · Setor</th>
                <th className="py-2 px-3 text-right font-medium">Admissão</th>
                <th className="py-2 px-3 text-right font-medium">Desligamento</th>
                <th className="py-2 pl-3 text-right font-medium">Tempo de casa</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((m) => (
                <tr
                  key={m.contrato}
                  onClick={() => setAberto(m.contrato)}
                  className="cursor-pointer border-b border-hairline/60 last:border-0 hover:bg-surface-2/50"
                >
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted">
                        <UserRound className="size-3.5" />
                      </span>
                      <span className="font-medium text-ink">{m.nome}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {m.admitido && (
                        <span className="rounded bg-good/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-good">
                          admitido
                        </span>
                      )}
                      {m.desligado && (
                        <span className="rounded bg-critical/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-critical">
                          desligado
                        </span>
                      )}
                    </div>
                    {m.desligado && m.motivo && (
                      <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-muted" title={m.motivo}>
                        {m.motivo}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="text-ink-2">{m.cargo}</p>
                    <p className="text-[11px] text-muted">{m.setor}</p>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-ink-2">{dataBR(m.dataadm)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-ink-2">
                    {m.datadem ? dataBR(m.datadem) : "—"}
                  </td>
                  <td className="py-2.5 pl-3 text-right tabular-nums text-ink-2">
                    {tempoCasa(m.tempoCasaDias)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FichaModal empresa={empresa} contrato={aberto} onFechar={() => setAberto(null)} />
    </section>
  );
}
