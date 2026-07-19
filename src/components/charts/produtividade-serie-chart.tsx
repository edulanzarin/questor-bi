"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dataBR, mesBR, num, numCompact } from "@/lib/format";
import { ChartCard, LegendaSeries, TooltipContainer, TooltipLinha } from "@/components/ui/chart-card";
import type { ProdutividadeSerie } from "@/lib/types";

interface Props {
  dados: ProdutividadeSerie | undefined;
  carregando: boolean;
  recarregando: boolean;
}

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: { payload: ProdutividadeSerie["pontos"][number] }[];
  granularidade: "dia" | "mes";
}

function Tip({ active, label, payload, granularidade }: TipProps) {
  if (!active || !payload?.length || !label) return null;
  const p = payload[0].payload;
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">
        {granularidade === "mes" ? mesBR(label) : dataBR(label)}
      </p>
      <TooltipLinha cor="var(--ent)" nome="Entradas" valor={`${num(p.ent)} notas`} />
      <TooltipLinha cor="var(--sai)" nome="Saídas" valor={`${num(p.sai)} notas`} />
      <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
        {num(p.ent + p.sai)} notas no total
      </p>
    </TooltipContainer>
  );
}

/** Notas lançadas ao longo do período (entrada × saída) — throughput da equipe. */
export function ProdutividadeSerieChart({ dados, carregando, recarregando }: Props) {
  const granularidade = dados?.granularidade ?? "dia";
  return (
    <ChartCard
      titulo="Notas lançadas no período"
      subtitulo={`Quantidade de notas por ${granularidade === "mes" ? "mês" : "dia"} (entradas e saídas)`}
      acao={
        <LegendaSeries
          series={[
            { nome: "Entradas", cor: "var(--ent)" },
            { nome: "Saídas", cor: "var(--sai)" },
          ]}
        />
      }
      carregando={carregando || !dados}
      recarregando={recarregando}
      alturaSkeleton="h-72"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={dados?.pontos ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v: string) =>
                granularidade === "mes" ? mesBR(v) : dataBR(v).slice(0, 5)
              }
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--baseline)" }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v: number) => numCompact(v)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<Tip granularidade={granularidade} />}
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="ent"
              stroke="var(--ent)"
              strokeWidth={2}
              fill="var(--ent)"
              fillOpacity={0.1}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              animationDuration={500}
            />
            <Area
              type="monotone"
              dataKey="sai"
              stroke="var(--sai)"
              strokeWidth={2}
              fill="var(--sai)"
              fillOpacity={0.1}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
