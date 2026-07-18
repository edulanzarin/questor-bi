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
import type { ApuracaoSerie } from "@/lib/types";
import { brl, brlCompact, dataBR, mesBR } from "@/lib/format";
import {
  ChartCard,
  LegendaSeries,
  TooltipContainer,
  TooltipLinha,
} from "@/components/ui/chart-card";

interface Props {
  dados: ApuracaoSerie | undefined;
  carregando: boolean;
  recarregando: boolean;
  acao?: React.ReactNode;
}

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: { payload: ApuracaoSerie["pontos"][number] }[];
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
      <TooltipLinha cor="var(--sai)" nome="Débito (saídas)" valor={brl(p.debito)} />
      <TooltipLinha cor="var(--ent)" nome="Crédito (entradas)" valor={brl(p.credito)} />
      <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
        Saldo {brl(p.debito - p.credito)}
      </p>
    </TooltipContainer>
  );
}

export function ApuracaoSerieChart({ dados, carregando, recarregando, acao }: Props) {
  const granularidade = dados?.granularidade ?? "dia";
  return (
    <ChartCard
      titulo="Débito × crédito no período"
      subtitulo={`ICMS destacado por ${granularidade === "mes" ? "mês" : "dia"}`}
      acao={
        acao ?? (
          <LegendaSeries
            series={[
              { nome: "Débito", cor: "var(--sai)" },
              { nome: "Crédito", cor: "var(--ent)" },
            ]}
          />
        )
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
              tickFormatter={(v: number) => brlCompact(v)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={76}
            />
            <Tooltip
              content={<Tip granularidade={granularidade} />}
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="debito"
              name="Débito"
              stroke="var(--sai)"
              strokeWidth={2}
              fill="var(--sai)"
              fillOpacity={0.1}
              animationDuration={500}
            />
            <Area
              type="monotone"
              dataKey="credito"
              name="Crédito"
              stroke="var(--ent)"
              strokeWidth={2}
              fill="var(--ent)"
              fillOpacity={0.1}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
