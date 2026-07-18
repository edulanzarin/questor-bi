"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { EspecieResumo, Metrica } from "@/lib/types";
import { brl, brlCompact, num, numCompact } from "@/lib/format";
import { ChartCard, TooltipContainer, TooltipLinha } from "@/components/ui/chart-card";

interface Props {
  dados: EspecieResumo[] | undefined;
  carregando: boolean;
  recarregando: boolean;
  metrica: Metrica;
}

const CORES = ["var(--esp-1)", "var(--esp-2)", "var(--esp-3)", "var(--esp-4)", "var(--esp-5)"];

const corFatia = (especie: string, i: number) =>
  especie === "Outras" ? "var(--esp-outras)" : CORES[i % CORES.length];

interface TooltipDonutProps {
  active?: boolean;
  payload?: { payload: EspecieResumo & { total: number; cor: string } }[];
}

function TooltipDonut({ active, payload }: TooltipDonutProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">{p.especie}</p>
      <TooltipLinha cor="var(--ent)" nome="Entradas" valor={brl(p.entradas)} />
      <TooltipLinha cor="var(--sai)" nome="Saídas" valor={brl(p.saidas)} />
      <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
        {num(p.qtd)} notas
      </p>
    </TooltipContainer>
  );
}

export function EspecieDonut({ dados, carregando, recarregando, metrica }: Props) {
  const fatias = (dados ?? []).map((d, i) => ({
    ...d,
    total: metrica === "valor" ? d.entradas + d.saidas : d.qtd,
    cor: corFatia(d.especie, i),
  }));
  const totalGeral = fatias.reduce((acc, f) => acc + f.total, 0);
  const compacto = metrica === "valor" ? brlCompact : numCompact;

  return (
    <ChartCard
      titulo="Por espécie de documento"
      subtitulo={
        metrica === "valor"
          ? "Entradas + saídas, valor contábil"
          : "Entradas + saídas, quantidade de notas"
      }
      carregando={carregando || !dados}
      recarregando={recarregando}
      alturaSkeleton="h-72"
    >
      <div className="flex h-72 items-center gap-4">
        <div className="h-full min-w-0 flex-1">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip content={<TooltipDonut />} />
              <Pie
                data={fatias}
                dataKey="total"
                nameKey="especie"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={1.5}
                stroke="var(--surface)"
                strokeWidth={2}
                animationDuration={500}
              >
                {fatias.map((f) => (
                  <Cell key={f.especie} fill={f.cor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda com valores visíveis — identidade nunca depende só da cor */}
        <ul className="w-40 shrink-0 space-y-2.5">
          {fatias.map((f) => (
            <li key={f.especie} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: f.cor }} />
              <span className="min-w-0 flex-1 truncate text-ink-2">{f.especie}</span>
              <span className="tnum text-right leading-tight">
                <span className="block font-medium text-ink">{compacto(f.total)}</span>
                <span className="text-muted">
                  {totalGeral > 0
                    ? `${((f.total / totalGeral) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
                    : "—"}
                </span>
              </span>
            </li>
          ))}
          {fatias.length === 0 && <li className="text-xs text-muted">Sem dados no período</li>}
        </ul>
      </div>
    </ChartCard>
  );
}
