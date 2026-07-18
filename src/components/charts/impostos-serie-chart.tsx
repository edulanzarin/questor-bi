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
import type { ImpostosSerie, PontoImposto } from "@/lib/types";
import { brl, brlCompact, dataBR, mesBR } from "@/lib/format";
import {
  ChartCard,
  LegendaSeries,
  TooltipContainer,
  TooltipLinha,
} from "@/components/ui/chart-card";

interface Props {
  dados: ImpostosSerie | undefined;
  carregando: boolean;
  recarregando: boolean;
  tipo: "ent" | "sai";
}

type ChaveImposto = Exclude<keyof PontoImposto, "bucket">;

const SERIES: { chave: ChaveImposto; nome: string; cor: string }[] = [
  { chave: "icms", nome: "ICMS", cor: "var(--esp-1)" },
  { chave: "st", nome: "ICMS-ST", cor: "var(--esp-4)" },
  { chave: "ipi", nome: "IPI", cor: "var(--esp-3)" },
  { chave: "iss", nome: "ISS", cor: "var(--esp-5)" },
  { chave: "pis", nome: "PIS", cor: "var(--esp-2)" },
  { chave: "cofins", nome: "COFINS", cor: "var(--ent)" },
];

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: { payload: PontoImposto }[];
  granularidade: "dia" | "mes";
}

function TooltipImposto({ active, label, payload, granularidade }: TooltipProps) {
  if (!active || !payload?.length || !label) return null;
  const p = payload[0].payload;
  const total = SERIES.reduce((s, x) => s + p[x.chave], 0);
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">
        {granularidade === "mes" ? mesBR(label) : dataBR(label)}
      </p>
      {SERIES.filter((s) => p[s.chave] > 0).map((s) => (
        <TooltipLinha key={s.chave} cor={s.cor} nome={s.nome} valor={brl(p[s.chave])} />
      ))}
      <p className="mt-1 border-t border-hairline pt-1 text-[11px] text-muted">
        Total {brl(total)}
      </p>
    </TooltipContainer>
  );
}

export function ImpostosSerieChart({ dados, carregando, recarregando, tipo }: Props) {
  const granularidade = dados?.granularidade ?? "dia";

  return (
    <ChartCard
      titulo="Carga tributária no período"
      subtitulo={`Impostos por ${granularidade === "mes" ? "mês" : "dia"} · ${tipo === "ent" ? "entradas" : "saídas"}`}
      acao={<LegendaSeries series={SERIES.map((s) => ({ nome: s.nome, cor: s.cor }))} />}
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
              content={<TooltipImposto granularidade={granularidade} />}
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            />
            {SERIES.map((s) => (
              <Area
                key={s.chave}
                type="monotone"
                dataKey={s.chave}
                name={s.nome}
                stackId="impostos"
                stroke={s.cor}
                strokeWidth={1.5}
                fill={s.cor}
                fillOpacity={0.18}
                animationDuration={500}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
