"use client";

import clsx from "clsx";
import { Modal } from "@/components/ui/modal";
import { ItensNota } from "@/components/itens-nota";
import { SituacaoBadge } from "@/components/situacao-badge";
import { brl, dataBR, documento, num } from "@/lib/format";
import type { NotaConferida, TipoDivergencia } from "@/lib/types";

const DIV_ROTULO: Record<TipoDivergencia, string> = {
  conta: "Conta fora do plano",
  faltando: "Lançamento faltando",
  valor: "Valor divergente",
  natureza: "Natureza invertida",
  extra: "Lançamento extra",
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{rotulo}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}

/**
 * Detalhe de uma nota da Conferência: cabeçalho, resumo, divergências e os itens
 * (produtos), buscados sob demanda pela rota do Contábil. Abre ao clicar na linha
 * da tabela — que fica enxuta, com o detalhe aqui.
 */
export function NotaDetalheModal({
  nota,
  tipo,
  empresa,
  onFechar,
}: {
  nota: NotaConferida | null;
  tipo: "ent" | "sai";
  empresa: number;
  onFechar: () => void;
}) {
  if (!nota) return null;

  const legenda = [
    nota.especie,
    `${num(nota.numero)}${nota.serie ? ` / ${nota.serie}` : ""}`,
    dataBR(nota.data),
    documento(nota.doc),
    nota.uf,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal
      aberto
      onFechar={onFechar}
      largura="max-w-5xl"
      ariaLabel={`Nota ${num(nota.numero)}`}
      titulo={
        <h3 className="truncate text-lg font-semibold" title={nota.contraparte ?? ""}>
          {nota.contraparte ?? "Nota sem contraparte"}
        </h3>
      }
      subtitulo={legenda}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-hairline px-6 py-4 sm:grid-cols-4">
          <Campo rotulo="Situação">
            <SituacaoBadge situacao={nota.situacao} />
          </Campo>
          <Campo rotulo="Valor">
            <span className="font-semibold tabular-nums">{brl(nota.valor)}</span>
          </Campo>
          <Campo rotulo="CFOP">
            <span className="tabular-nums">{nota.cfops.join(", ") || "—"}</span>
          </Campo>
          <Campo rotulo="Lançamentos">
            <span className="tabular-nums">{num(nota.lancamentos)}</span>
          </Campo>
        </div>

        {nota.duplicidade && (
          <div className="border-b border-hairline bg-sai/8 px-6 py-4">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-sai">
              Contabilizada em duplicidade
            </p>
            <p className="text-sm text-ink-2">
              Lançada <span className="font-semibold text-ink">{nota.duplicidade.vezes}×</span>, com
              a mesma partida, em {nota.duplicidade.datas.map((d) => dataBR(d)).join(" e ")}.{" "}
              <span className="font-semibold text-ink">{brl(nota.duplicidade.valor)}</span> lançado a
              mais.
            </p>
          </div>
        )}

        {nota.divergencias.length > 0 && (
          <div className="border-b border-hairline px-6 py-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">
              Divergências
            </p>
            <ul className="flex flex-col gap-1.5">
              {nota.divergencias.map((d, i) => (
                <li key={i} className="text-sm text-ink-2">
                  {/* Mesmo D/C do plano na Configuração: é por onde se começa a
                      procurar no Questor. */}
                  <span
                    className={clsx(
                      "mr-1 font-semibold",
                      d.natureza === 1 ? "text-ent" : "text-sai"
                    )}
                    title={d.natureza === 1 ? "Débito" : "Crédito"}
                  >
                    {d.natureza === 1 ? "D" : "C"}
                  </span>
                  <span className="text-muted">{DIV_ROTULO[d.tipo]}:</span> {d.detalhe}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="py-2">
          <p className="px-6 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted">
            Itens da nota
          </p>
          <ItensNota tipo={tipo} empresa={empresa} chave={nota.chave} modulo="contabil" />
        </div>
      </div>
    </Modal>
  );
}
