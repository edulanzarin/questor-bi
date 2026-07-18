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
import { brl, brlCompact, dataBR, mesBR, num, numCompact } from "@/lib/format";
import { ChartCard, TooltipContainer, TooltipLinha } from "@/components/ui/chart-card";

export interface PontoValor {
  bucket: string;
  valor: number;
}

interface Props {
  titulo: string;
  subtitulo: string;
  dados: PontoValor[] | undefined;
  granularidade: "dia" | "mes";
  cor: string;
  formato?: "valor" | "qtd";
  nomeSerie?: string;
  carregando: boolean;
  recarregando: boolean;
  acao?: React.ReactNode;
}

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: { payload: PontoValor }[];
  granularidade: "dia" | "mes";
  cor: string;
  formato: "valor" | "qtd";
  nomeSerie: string;
}

function Tip({ active, label, payload, granularidade, cor, formato, nomeSerie }: TipProps) {
  if (!active || !payload?.length || !label) return null;
  const p = payload[0].payload;
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">
        {granularidade === "mes" ? mesBR(label) : dataBR(label)}
      </p>
      <TooltipLinha
        cor={cor}
        nome={nomeSerie}
        valor={formato === "valor" ? brl(p.valor) : num(p.valor)}
      />
    </TooltipContainer>
  );
}

export function SerieChart({
  titulo,
  subtitulo,
  dados,
  granularidade,
  cor,
  formato = "valor",
  nomeSerie = "Total",
  carregando,
  recarregando,
  acao,
}: Props) {
  const eixoY = formato === "valor" ? brlCompact : numCompact;
  return (
    <ChartCard
      titulo={titulo}
      subtitulo={subtitulo}
      acao={acao}
      carregando={carregando || !dados}
      recarregando={recarregando}
      alturaSkeleton="h-72"
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={dados ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${titulo}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={cor} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              content={
                <Tip
                  granularidade={granularidade}
                  cor={cor}
                  formato={formato}
                  nomeSerie={nomeSerie}
                />
              }
              cursor={{ stroke: "var(--baseline)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={cor}
              strokeWidth={2}
              fill={`url(#g-${titulo})`}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
