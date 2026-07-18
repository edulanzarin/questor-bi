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
import type { Metrica, Timeseries } from "@/lib/types";
import { brl, brlCompact, dataBR, mesBR, num, numCompact } from "@/lib/format";
import { ChartCard, LegendaSeries, TooltipContainer, TooltipLinha } from "@/components/ui/chart-card";

interface Props {
  dados: Timeseries | undefined;
  carregando: boolean;
  recarregando: boolean;
  metrica: Metrica;
}

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { payload: Timeseries["pontos"][number] }[];
  granularidade: "dia" | "mes";
  metrica: Metrica;
}

function TooltipSerie({ active, label, payload, granularidade, metrica }: TooltipProps) {
  if (!active || !payload?.length || !label) return null;
  const p = payload[0].payload;
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">
        {granularidade === "mes" ? mesBR(label) : dataBR(label)}
      </p>
      {metrica === "valor" ? (
        <>
          <TooltipLinha cor="var(--ent)" nome="Entradas" valor={brl(p.entradas)} />
          <TooltipLinha cor="var(--sai)" nome="Saídas" valor={brl(p.saidas)} />
          <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
            {num(p.qtdEntradas)} notas de entrada · {num(p.qtdSaidas)} de saída
          </p>
        </>
      ) : (
        <>
          <TooltipLinha cor="var(--ent)" nome="Entradas" valor={`${num(p.qtdEntradas)} notas`} />
          <TooltipLinha cor="var(--sai)" nome="Saídas" valor={`${num(p.qtdSaidas)} notas`} />
          <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
            {brl(p.entradas)} em entradas · {brl(p.saidas)} em saídas
          </p>
        </>
      )}
    </TooltipContainer>
  );
}

export function TimeseriesChart({ dados, carregando, recarregando, metrica }: Props) {
  const granularidade = dados?.granularidade ?? "dia";
  const chaveEnt = metrica === "valor" ? "entradas" : "qtdEntradas";
  const chaveSai = metrica === "valor" ? "saidas" : "qtdSaidas";
  const eixoY = metrica === "valor" ? brlCompact : numCompact;

  return (
    <ChartCard
      titulo="Evolução no período"
      subtitulo={`${metrica === "valor" ? "Valor contábil" : "Quantidade de notas"} por ${granularidade === "mes" ? "mês" : "dia"}`}
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
              tickFormatter={(v: number) => eixoY(v)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={76}
            />
            <Tooltip
              content={<TooltipSerie granularidade={granularidade} metrica={metrica} />}
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey={chaveEnt}
              name="Entradas"
              stroke="var(--ent)"
              strokeWidth={2}
              fill="var(--ent)"
              fillOpacity={0.1}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              animationDuration={500}
            />
            <Area
              type="monotone"
              dataKey={chaveSai}
              name="Saídas"
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
