"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Search, Table2 } from "lucide-react";
import clsx from "clsx";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { useNotaItens, useNotasLista } from "@/hooks/use-api";
import { brl, dataBR, num } from "@/lib/format";
import type { NotaLista } from "@/lib/types";

type Tipo = "ent" | "sai";

/** Formata CNPJ (14) / CPF (11); senão devolve como veio. */
function doc(v: string | null): string {
  if (!v) return "";
  const d = v.replace(/\D/g, "");
  if (d.length === 14)
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v;
}

function ItensNota({ tipo, empresa, chave }: { tipo: Tipo; empresa: number; chave: string }) {
  const { data, isLoading } = useNotaItens(tipo, empresa, chave);
  if (isLoading)
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted">
        <Loader2 className="size-3.5 animate-spin" /> Carregando itens…
      </div>
    );
  if (!data || data.length === 0)
    return <div className="px-4 py-3 text-xs text-muted">Sem itens de produto nesta nota.</div>;
  return (
    <div className="overflow-x-auto px-4 py-3">
      <table className="w-full min-w-[680px] text-xs">
        <thead>
          <tr className="text-left text-muted">
            <th className="py-1 pr-3 font-medium">Produto</th>
            <th className="py-1 pr-3 font-medium">CFOP</th>
            <th className="py-1 pr-3 text-right font-medium">Qtd</th>
            <th className="py-1 pr-3 text-right font-medium">V. unit.</th>
            <th className="py-1 pr-3 text-right font-medium">Total</th>
            <th className="py-1 pr-3 text-right font-medium">ICMS</th>
            <th className="py-1 text-right font-medium">IPI</th>
          </tr>
        </thead>
        <tbody>
          {data.map((it) => (
            <tr key={it.seq} className="border-t border-hairline/60">
              <td className="max-w-[240px] truncate py-1.5 pr-3" title={it.descricao ?? ""}>
                <span className="text-muted">{it.produto}</span> · {it.descricao ?? "—"}
              </td>
              <td className="py-1.5 pr-3 text-muted" title={it.cfopDescr ?? ""}>{it.cfop}</td>
              <td className="tnum py-1.5 pr-3 text-right">
                {it.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                {it.unidade ? <span className="text-muted"> {it.unidade}</span> : null}
              </td>
              <td className="tnum py-1.5 pr-3 text-right">{brl(it.valorUnitario)}</td>
              <td className="tnum py-1.5 pr-3 text-right font-medium">{brl(it.valorTotal)}</td>
              <td className="tnum py-1.5 pr-3 text-right text-muted">{brl(it.icms)}</td>
              <td className="tnum py-1.5 text-right text-muted">{brl(it.ipi)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NotasTabela({ qs, enabled, mostraEmpresa }: {
  qs: string;
  enabled: boolean;
  mostraEmpresa: boolean;
}) {
  const [tipo, setTipo] = useState<Tipo>("sai");
  const [busca, setBusca] = useState("");
  const [buscaDeb, setBuscaDeb] = useState("");
  const [page, setPage] = useState(1);
  const [aberta, setAberta] = useState<string | null>(null);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setBuscaDeb(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  // volta pra página 1 quando muda filtro/busca/tipo
  useEffect(() => {
    setPage(1);
    setAberta(null);
  }, [qs, tipo, buscaDeb]);

  const { data, isLoading, isFetching } = useNotasLista(qs, tipo, page, buscaDeb, enabled);
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 50;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const inicio = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, total);

  const colSpan = mostraEmpresa ? 8 : 7;

  const linhas = useMemo(() => data?.rows ?? [], [data]);

  return (
    <section className="card anim-fade-up overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-ink-2">
            <Table2 className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Notas fiscais</h2>
            <p className="mt-0.5 text-xs text-muted">
              {total > 0
                ? `${num(total)} ${total === 1 ? "nota" : "notas"} no período · clique pra ver os itens`
                : "Dados brutos · clique numa nota pra ver os itens"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
            <Search className="size-3.5 text-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nº da nota ou contraparte…"
              className="w-52 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
            />
          </div>
          <SeletorTipo tipo={tipo} onTipo={setTipo} />
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-hairline">
              <th className="w-8 py-2.5 pl-5" />
              <th className="py-2.5 pr-3 font-medium">Data</th>
              {mostraEmpresa && <th className="py-2.5 pr-3 font-medium">Empresa</th>}
              <th className="py-2.5 pr-3 font-medium">Nº · Série</th>
              <th className="py-2.5 pr-3 font-medium">Espécie</th>
              <th className="py-2.5 pr-3 font-medium">Contraparte</th>
              <th className="py-2.5 pr-3 font-medium">UF</th>
              <th className="py-2.5 pr-5 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className={clsx(isFetching && !isLoading && "opacity-60 transition-opacity")}>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-hairline/60">
                  <td className="py-2.5 pl-5" colSpan={colSpan}>
                    <div className="skeleton h-4 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && linhas.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-muted">
                  Nenhuma nota encontrada com esses filtros.
                </td>
              </tr>
            )}

            {!isLoading &&
              linhas.map((n: NotaLista) => {
                const id = `${n.empresa}-${n.chave}`;
                const aberto = aberta === id;
                return (
                  <FragmentRow
                    key={id}
                    n={n}
                    aberto={aberto}
                    mostraEmpresa={mostraEmpresa}
                    tipo={tipo}
                    colSpan={colSpan}
                    onToggle={() => setAberta(aberto ? null : id)}
                  />
                );
              })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline p-4 text-xs text-muted">
        <span>
          {total > 0 ? `${num(inicio)}–${num(fim)} de ${num(total)}` : "—"}
          {isFetching && !isLoading && <Loader2 className="ml-2 inline size-3 animate-spin" />}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-hairline px-2.5 py-1 transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-2 tnum">
            {page} / {num(totalPaginas)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
            disabled={page >= totalPaginas}
            className="rounded-md border border-hairline px-2.5 py-1 transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </footer>
    </section>
  );
}

function FragmentRow({ n, aberto, mostraEmpresa, tipo, colSpan, onToggle }: {
  n: NotaLista;
  aberto: boolean;
  mostraEmpresa: boolean;
  tipo: Tipo;
  colSpan: number;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={clsx(
          "cursor-pointer border-b border-hairline/60 transition-colors hover:bg-surface-2/60",
          aberto && "bg-surface-2/60",
          n.cancelada && "text-muted"
        )}
      >
        <td className="py-2.5 pl-5 text-muted">
          {aberto ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </td>
        <td className="tnum py-2.5 pr-3 whitespace-nowrap">{dataBR(n.data)}</td>
        {mostraEmpresa && (
          <td className="max-w-[180px] truncate py-2.5 pr-3" title={n.empresaNome ?? ""}>
            {n.empresaNome ?? `Empresa ${n.empresa}`}
          </td>
        )}
        <td className="tnum py-2.5 pr-3 whitespace-nowrap">
          {n.numero}
          {n.serie ? <span className="text-muted">/{n.serie}</span> : null}
        </td>
        <td className="py-2.5 pr-3">
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">{n.especie}</span>
          {n.cancelada && (
            <span className="ml-1.5 rounded bg-sai/12 px-1.5 py-0.5 text-xs text-sai">cancelada</span>
          )}
        </td>
        <td className="max-w-[280px] py-2.5 pr-3">
          <div className="truncate" title={n.contraparte ?? ""}>{n.contraparte ?? "—"}</div>
          {n.contraparteDoc && (
            <div className="tnum text-xs text-muted">{doc(n.contraparteDoc)}</div>
          )}
        </td>
        <td className="py-2.5 pr-3 text-muted">{n.uf ?? "—"}</td>
        <td
          className={clsx(
            "tnum py-2.5 pr-5 text-right font-medium whitespace-nowrap",
            n.cancelada && "line-through"
          )}
        >
          {brl(n.valor)}
        </td>
      </tr>
      {aberto && (
        <tr>
          <td colSpan={colSpan} className="border-b border-hairline bg-surface-2/30 p-0">
            <ItensNota tipo={tipo} empresa={n.empresa} chave={n.chave} />
          </td>
        </tr>
      )}
    </>
  );
}
