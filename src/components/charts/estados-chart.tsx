"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EstadoResumo, Metrica } from "@/lib/types";
import { brl, brlCompact, num, numCompact } from "@/lib/format";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { ChartCard, TooltipContainer, TooltipLinha } from "@/components/ui/chart-card";

interface Props {
  dados: EstadoResumo[] | undefined;
  carregando: boolean;
  recarregando: boolean;
  tipo: "ent" | "sai";
  onTipo: (t: "ent" | "sai") => void;
  metrica: Metrica;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: EstadoResumo }[];
  cor: string;
}

function TooltipEstado({ active, payload, cor }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <TooltipContainer>
      <p className="mb-1 text-xs font-medium text-ink">{p.nome ?? p.uf}</p>
      <TooltipLinha cor={cor} nome="Valor" valor={brl(p.valor)} />
      <TooltipLinha nome="Notas" valor={num(p.qtd)} />
    </TooltipContainer>
  );
}

export function EstadosChart({ dados, carregando, recarregando, tipo, onTipo, metrica }: Props) {
  const cor = tipo === "ent" ? "var(--ent)" : "var(--sai)";
  const chave = metrica === "valor" ? "valor" : "qtd";
  const rotulo = metrica === "valor" ? brlCompact : numCompact;
  // Reordena pela métrica exibida — a API entrega ordenado por valor
  const top = [...(dados ?? [])].sort((a, b) => b[chave] - a[chave]).slice(0, 10);

  return (
    <ChartCard
      titulo="Por estado (UF) da contraparte"
      subtitulo={
        tipo === "ent"
          ? "Origem dos fornecedores nas entradas"
          : "Destino dos clientes nas saídas"
      }
      acao={<SeletorTipo tipo={tipo} onTipo={onTipo} />}
      carregando={carregando || !dados}
      recarregando={recarregando}
      alturaSkeleton="h-80"
    >
      {top.length === 0 ? (
        <p className="grid h-40 place-items-center text-sm text-muted">Sem dados no período</p>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <BarChart
              data={top}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              barCategoryGap={6}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="uf"
                width={40}
                tick={{ fill: "var(--ink-2)", fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: "var(--baseline)" }}
                tickLine={false}
                interval={0}
              />
              <Tooltip
                content={<TooltipEstado cor={cor} />}
                cursor={{ fill: "var(--surface-2)", opacity: 0.6 }}
              />
              <Bar dataKey={chave} maxBarSize={20} radius={[0, 4, 4, 0]} animationDuration={500}>
                {top.map((d) => (
                  <Cell key={d.uf} fill={cor} />
                ))}
                <LabelList
                  dataKey={chave}
                  position="right"
                  formatter={(v) => rotulo(v as number)}
                  style={{ fill: "var(--ink-2)", fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
