"use client";

import { useState } from "react";
import clsx from "clsx";
import { ListaModal } from "@/components/lista-modal";
import { useBalanceteCulpados } from "@/hooks/use-api";
import { brl, num } from "@/lib/format";
import type { BalanceteLinha } from "@/lib/types";

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

/**
 * Notas por trás da diferença de uma conta do balancete: por nota, o líquido
 * (débito − crédito) que o motor esperava na conta × o que o contábil lançou.
 * A soma das diferenças fecha com a coluna Diferença da conta. Monta sobre a
 * base comum `ListaModal` (mesma casca e busca do drill-down).
 */
export function CulpadosModal({
  alvo,
  qs,
  onFechar,
}: {
  alvo: BalanceteLinha | null;
  qs: string;
  onFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const { data, isLoading } = useBalanceteCulpados(
    qs,
    alvo?.classif ?? null,
    alvo?.conta ?? 0,
    alvo?.sintetica ?? false
  );

  const todos = data?.culpados ?? [];
  const q = busca.trim().toLowerCase();
  const culpados = !q
    ? todos
    : todos.filter(
        (c) =>
          String(c.numero ?? "").includes(q) ||
          (c.contraparte ?? "").toLowerCase().includes(q) ||
          (c.especie ?? "").toLowerCase().includes(q)
      );

  const totalDif = culpados.reduce((s, c) => s + c.diferenca, 0);
  // "extra" = motor não reproduz a nota (NFSE/serviço) → provável não-erro. As
  // demais (valor/faltando) são diferença de verdade, a investigar.
  const semRegra = culpados.filter((c) => c.tipo === "extra");
  const investigar = culpados.filter((c) => c.tipo !== "extra");
  const difInvestigar = investigar.reduce((s, c) => s + c.diferenca, 0);
  const temMix = semRegra.length > 0 && investigar.length > 0;

  return (
    <ListaModal
      aberto={alvo != null}
      onFechar={onFechar}
      largura="max-w-5xl"
      ariaLabel="Notas da diferença"
      titulo={
        <h3 className="truncate text-lg font-semibold" title={alvo?.descricao}>
          {alvo ? `${alvo.conta} · ${alvo.descricao}` : ""}
        </h3>
      }
      subtitulo="Notas cujo esperado não bate com o lançado · esperado − real"
      busca={busca}
      onBusca={setBusca}
      buscaPlaceholder="Nº, contraparte ou espécie…"
      carregando={isLoading}
      rodape={
        <>
          <span>
            {num(culpados.length)} {culpados.length === 1 ? "nota" : "notas"}
            {(data?.total ?? 0) > todos.length && (
              <span className="text-muted/70"> · maiores de {num(data?.total ?? 0)}</span>
            )}
          </span>
          <span className="tabular-nums">
            {temMix ? (
              <>
                <span className="text-muted">total {brl(totalDif)} · </span>
                <span className="font-medium text-ink">a investigar {brl(difInvestigar)}</span>
              </>
            ) : (
              <span className="font-medium text-ink">{brl(totalDif)}</span>
            )}
          </span>
        </>
      }
    >
      {isLoading ? (
        <div className="p-6">
          <div className="skeleton h-40 w-full" />
        </div>
      ) : culpados.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          {todos.length === 0
            ? "Nenhuma nota isolada explica a diferença (pode ser imposto/apuração)."
            : "Nenhuma nota com esse filtro."}
        </p>
      ) : (
        <table className="w-full min-w-[820px] text-xs">
          <thead className="sticky top-0 bg-surface text-left text-muted">
            <tr className="border-b border-hairline">
              <th className="py-2 pl-6 pr-3 font-medium">Nº</th>
              <th className="py-2 pr-3 font-medium">Espécie</th>
              <th className="py-2 pr-3 font-medium">Contraparte</th>
              <th className="py-2 pr-3 font-medium">Situação</th>
              <th className="py-2 pr-3 text-right font-medium">Esperado</th>
              <th className="py-2 pr-3 text-right font-medium">Real</th>
              <th className="py-2 pr-6 text-right font-medium">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {culpados.map((c, i) => {
              const nfse = c.especie === "NFSE";
              return (
                <tr key={i} className="border-b border-hairline/50 last:border-0">
                  <td className="py-1.5 pl-6 pr-3 tabular-nums whitespace-nowrap">
                    {c.numero ?? "—"}
                    <span className="ml-1.5 text-[10px] text-muted">{ORIGEM[c.origem] ?? c.origem}</span>
                  </td>
                  <td className="py-1.5 pr-3">
                    {c.especie ? (
                      <span
                        className={clsx(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          nfse ? "bg-warn/12 text-warn" : "bg-surface-2 text-muted"
                        )}
                        title={nfse ? "NFSE (serviço) — o motor não reproduz; confira manualmente" : c.especie}
                      >
                        {c.especie}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="max-w-[280px] truncate py-1.5 pr-3" title={c.contraparte ?? ""}>
                    {c.contraparte ?? "—"}
                  </td>
                  <td className="py-1.5 pr-3">
                    {nfse && c.tipo === "extra" ? (
                      <span
                        className="rounded bg-warn/12 px-1.5 py-0.5 text-[10px] font-medium text-warn"
                        title="Serviço (NFSE) — o motor não reproduz; confira a contabilização manualmente"
                      >
                        Verificar manual
                      </span>
                    ) : (
                      <span
                        className={clsx("rounded px-1.5 py-0.5 text-[10px] font-medium", TIPO[c.tipo].cor)}
                        title={TIPO[c.tipo].titulo}
                      >
                        {TIPO[c.tipo].rotulo}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{brl(c.esperado)}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{brl(c.real)}</td>
                  <td className="py-1.5 pr-6 text-right font-semibold tabular-nums text-ink">
                    {brl(c.diferenca)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </ListaModal>
  );
}
