"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import clsx from "clsx";
import { FichaModal } from "@/components/folha-ficha-modal";
import { PessoasTabela } from "@/components/folha-pessoas-tabela";
import type { FolhaMovimentacao } from "@/lib/types";
import { baixarCSV } from "@/lib/csv";
import { dataBR, num } from "@/lib/format";

type Filtro = "todos" | "admitidos" | "desligados";

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
    { id: "todos", rotulo: `Todos (${num(dados?.length ?? 0)})` },
    { id: "admitidos", rotulo: `Admitidos (${num(nAdm)})` },
    { id: "desligados", rotulo: `Desligados (${num(nDes)})` },
  ];

  const exportar = () => {
    const linhas = (visiveis ?? []).map((m) => [
      m.nome,
      m.admitido ? "Admitido" : "",
      m.desligado ? "Desligado" : "",
      m.cargo,
      m.setor,
      dataBR(m.dataadm),
      m.datadem ? dataBR(m.datadem) : "",
      m.motivo ?? "",
      m.tempoCasaDias ?? "",
    ]);
    baixarCSV(
      "movimentacoes-folha",
      ["Nome", "Admitido", "Desligado", "Cargo", "Setor", "Admissão", "Desligamento", "Motivo", "Tempo de casa (dias)"],
      linhas
    );
  };

  return (
    <section className="card anim-fade-up p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Movimentações no período</h2>
          <p className="mt-0.5 text-xs text-muted">
            Quem foi admitido ou desligado · clique numa linha para a ficha
          </p>
        </div>
        <button
          onClick={exportar}
          disabled={!visiveis || visiveis.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-2 px-3 py-1.5 text-xs text-ink-2 transition-colors hover:text-ink disabled:opacity-40"
        >
          <Download className="size-3.5" />
          Exportar CSV
        </button>
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
        <PessoasTabela dados={visiveis} onAbrir={setAberto} recarregando={recarregando} />
      )}

      <FichaModal empresa={empresa} contrato={aberto} onFechar={() => setAberto(null)} />
    </section>
  );
}
