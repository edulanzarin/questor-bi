"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import clsx from "clsx";
import { Modal } from "@/components/ui/modal";
import { useBalanceteLancamentos } from "@/hooks/use-api";
import { brl, dataBR, num } from "@/lib/format";

export interface AlvoBalancete {
  classif: string;
  natureza: 1 | -1;
  descricao: string;
  /** "real" = lançamentos do contábil; "fiscal" = o esperado pelas regras (motor). */
  lado?: "real" | "fiscal";
  conta: number;
  sintetica: boolean;
}

const ORIGEM: Record<string, string> = {
  ME: "Nota entrada",
  MS: "Nota saída",
  IM: "Apuração",
  RE: "Retenção",
  MOV: "Consolidação",
};

/** Lançamentos por página — a lista pode ter centenas, então pagina em vez de rolar tudo. */
const POR_PAGINA = 50;

/**
 * Drill-down de uma conta do balancete: os lançamentos reais (origem fiscal)
 * que compõem aquele valor, com a nota de origem e busca. Abre ao clicar num
 * valor da coluna Contábil. Usa a casca comum de modal (ver `components/ui/modal`).
 */
export function BalanceteLancamentosModal({
  qs,
  alvo,
  onFechar,
}: {
  qs: string;
  alvo: AlvoBalancete | null;
  onFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const lado = alvo?.lado ?? "real";
  const { data, isLoading } = useBalanceteLancamentos(
    qs,
    alvo?.classif ?? null,
    alvo?.natureza ?? 1,
    lado,
    alvo?.conta ?? 0,
    alvo?.sintetica ?? false
  );

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const l = data?.lancamentos ?? [];
    if (!q) return l;
    return l.filter(
      (x) =>
        String(x.numero ?? "").includes(q) ||
        (x.contraparte ?? "").toLowerCase().includes(q)
    );
  }, [data, busca]);

  // Trocar de conta ou de busca recomeça na primeira página — ajuste em render
  // (via chave anterior), não em efeito, pra não disparar render em cascata.
  const chave = `${alvo?.classif ?? ""}:${alvo?.natureza ?? ""}:${busca}`;
  const [chaveAnterior, setChaveAnterior] = useState(chave);
  if (chave !== chaveAnterior) {
    setChaveAnterior(chave);
    setPagina(1);
  }

  const total = linhas.reduce((s, l) => s + l.valor, 0);
  // Resposta truncada no servidor: a lista (e a soma) é parcial — sinaliza.
  const carregados = data?.lancamentos.length ?? 0;
  const truncado = (data?.total ?? 0) > carregados;
  const totalPaginas = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  const pag = Math.min(pagina, totalPaginas);
  const visiveis = linhas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  return (
    <Modal
      aberto={alvo != null}
      onFechar={onFechar}
      largura="max-w-3xl"
      ariaLabel="Lançamentos da conta"
      titulo={
        <h3 className="truncate text-lg font-semibold" title={alvo?.descricao}>
          {alvo?.descricao}
        </h3>
      }
      subtitulo={`Lançamentos ${alvo?.natureza === 1 ? "a débito" : "a crédito"} · ${
        lado === "fiscal" ? "esperado pelas regras" : "origem fiscal"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-hairline px-6 py-3">
        <Search className="size-4 text-muted" />
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nº da nota ou contraparte…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-muted" />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6">
            <div className="skeleton h-40 w-full" />
          </div>
        ) : linhas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nenhum lançamento.</p>
        ) : (
          <table className="w-full min-w-[600px] text-xs">
            <thead className="sticky top-0 bg-surface text-left text-muted">
              <tr className="border-b border-hairline">
                <th className="py-2 pl-6 pr-3 font-medium">Data</th>
                {lado === "fiscal" && <th className="py-2 pr-3 font-medium">Tipo</th>}
                <th className="py-2 pr-3 font-medium">Origem</th>
                <th className="py-2 pr-3 font-medium">Nº</th>
                <th className="py-2 pr-3 font-medium">Contraparte</th>
                <th className="py-2 pr-6 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l, i) => (
                <tr key={i} className="border-b border-hairline/50 last:border-0">
                  <td className="tnum py-1.5 pl-6 pr-3 whitespace-nowrap">{dataBR(l.data)}</td>
                  {lado === "fiscal" && (
                    <td className="py-1.5 pr-3">
                      <span
                        className={clsx(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          l.tipo === "espelho"
                            ? "bg-surface-2 text-muted"
                            : "bg-ent/12 text-ent"
                        )}
                        title={
                          l.tipo === "espelho"
                            ? "Espelhado do contábil real (consolidação, apuração ou conta sem regra)"
                            : "Valor esperado que o motor gerou para a nota"
                        }
                      >
                        {l.tipo === "espelho" ? "Espelho" : "Regra"}
                      </span>
                    </td>
                  )}
                  <td className="py-1.5 pr-3 text-muted">{ORIGEM[l.origem] ?? l.origem}</td>
                  <td className="tnum py-1.5 pr-3">{l.numero ?? "—"}</td>
                  <td className="max-w-[240px] truncate py-1.5 pr-3" title={l.contraparte ?? ""}>
                    {l.contraparte ?? (l.historico || "—")}
                  </td>
                  <td className="tnum py-1.5 pr-6 text-right font-medium">{brl(l.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-3 text-xs text-muted">
        <span>
          {num(linhas.length)} lançamentos
          {truncado && !busca && (
            <span className="text-muted/70"> · maiores de {num(data?.total ?? 0)} (soma parcial)</span>
          )}
        </span>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pag <= 1}
              className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-3.5" /> Anterior
            </button>
            <span className="tnum px-1">
              {pag} / {num(totalPaginas)}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pag >= totalPaginas}
              className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Próxima <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
        <span className="tnum font-medium text-ink">{brl(total)}</span>
      </footer>
    </Modal>
  );
}
