"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mesBR, num } from "@/lib/format";
import { ChartCard, LegendaSeries, TooltipContainer, TooltipLinha } from "@/components/ui/chart-card";
import type { TurnoverPonto } from "@/lib/types";

interface Props {
  dados: TurnoverPonto[] | undefined;
  carregando: boolean;
  recarregando: boolean;
}

const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: { payload: TurnoverPonto }[];
}

function Tip({ active, label, payload }: TipProps) {
  if (!active || !payload?.length || !label) return null;
  const p = payload[0].payload;
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">{mesBR(label)}</p>
      <TooltipLinha cor="var(--esp-5)" nome="Turnover" valor={pct(p.turnover)} />
      <TooltipLinha cor="var(--good)" nome="Admissões" valor={`${num(p.admissoes)}`} />
      <TooltipLinha cor="var(--critical)" nome="Desligamentos" valor={`${num(p.desligamentos)}`} />
      <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
        {num(p.ativos)} colaboradores ativos no fim do mês
      </p>
    </TooltipContainer>
  );
}

/** Turnover mês a mês: barras de admissões/desligamentos + a linha do índice. */
export function TurnoverSerieChart({ dados, carregando, recarregando }: Props) {
  return (
    <ChartCard
      titulo="Rotatividade no período"
      subtitulo="Admissões e desligamentos (barras) e o índice de turnover (linha), por mês"
      acao={
        <LegendaSeries
          series={[
            { nome: "Turnover", cor: "var(--esp-5)" },
            { nome: "Admissões", cor: "var(--good)" },
            { nome: "Desligamentos", cor: "var(--critical)" },
          ]}
        />
      }
      carregando={carregando || !dados}
      recarregando={recarregando}
      alturaSkeleton="h-72"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ComposedChart data={dados ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
            <XAxis
              dataKey="mes"
              tickFormatter={(v: string) => mesBR(v)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--baseline)" }}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              yAxisId="pessoas"
              allowDecimals={false}
              tickFormatter={(v: number) => num(v)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tickFormatter={(v: number) => pct(v)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={<Tip />}
              cursor={{ fill: "var(--surface-2)", opacity: 0.5 }}
            />
            <Bar yAxisId="pessoas" dataKey="admissoes" fill="var(--good)" radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Bar yAxisId="pessoas" dataKey="desligamentos" fill="var(--critical)" radius={[3, 3, 0, 0]} maxBarSize={22} />
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="turnover"
              stroke="var(--esp-5)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--esp-5)", strokeWidth: 0 }}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              animationDuration={500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
