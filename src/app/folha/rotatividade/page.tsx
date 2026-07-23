"use client";

import { useMemo } from "react";
import { Repeat, UserMinus, UserPlus, Users } from "lucide-react";
import clsx from "clsx";
import { TurnoverSerieChart } from "@/components/charts/turnover-serie-chart";
import { RotatividadeQuebra } from "@/components/rotatividade-quebra";
import { RotatividadeBarras } from "@/components/rotatividade-barras";
import { useFiltros } from "@/hooks/use-filters";
import { useTurnover } from "@/hooks/use-api";
import { num } from "@/lib/format";

const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

function Kpi({
  rotulo,
  icone,
  corIcone,
  estiloIcone,
  valor,
  secundario,
}: {
  rotulo: string;
  icone: React.ReactNode;
  corIcone?: string;
  estiloIcone?: React.CSSProperties;
  valor: string;
  secundario: string;
}) {
  return (
    <div className="card anim-fade-up flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-2">{rotulo}</p>
        <span
          className={clsx("grid size-8 place-items-center rounded-lg", corIcone)}
          style={estiloIcone}
        >
          {icone}
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{valor}</p>
      <p className="text-xs text-muted">{secundario}</p>
    </div>
  );
}

export default function RotatividadePage() {
  const { qs } = useFiltros();
  const turnover = useTurnover(qs);

  const d = turnover.data;
  const c = d?.consolidado;
  const carregando = turnover.isLoading;
  const recarregando = turnover.isFetching && !turnover.isLoading;

  const motivos = useMemo(
    () => d?.motivos.map((m) => ({ rotulo: m.motivo, valor: m.desligamentos })),
    [d]
  );
  const tenure = useMemo(
    () => d?.tenure.map((t) => ({ rotulo: t.faixa, valor: t.desligamentos })),
    [d]
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {carregando || !c ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)
        ) : (
          <>
            <Kpi
              rotulo="Turnover geral"
              icone={<Repeat className="size-4" style={{ color: "var(--esp-5)" }} />}
              estiloIcone={{
                backgroundColor: "color-mix(in srgb, var(--esp-5) 12%, transparent)",
              }}
              valor={pct(c.turnover)}
              secundario={`sobre ${num(c.ativos)} colaboradores ativos`}
            />
            <Kpi
              rotulo="Admissões"
              icone={<UserPlus className="size-4 text-good" />}
              corIcone="bg-good/12"
              valor={num(c.admissoes)}
              secundario="contratações no período"
            />
            <Kpi
              rotulo="Desligamentos"
              icone={<UserMinus className="size-4 text-critical" />}
              corIcone="bg-critical/12"
              valor={num(c.desligamentos)}
              secundario="rescisões no período"
            />
            <Kpi
              rotulo="Colaboradores ativos"
              icone={<Users className="size-4 text-ink-2" />}
              corIcone="bg-surface-2"
              valor={num(c.ativos)}
              secundario="efetivo no fim do período"
            />
          </>
        )}
      </div>

      {/* A tendência só faz sentido com 2+ meses; num mês só, o gráfico vira
          duas barrinhas soltas — melhor não mostrar (os KPIs já têm o número). */}
      {(carregando || (d && d.serie.length >= 2)) && (
        <TurnoverSerieChart dados={d?.serie} carregando={carregando} recarregando={recarregando} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RotatividadeBarras
          titulo="Motivo do desligamento"
          subtitulo="Causa da rescisão de quem saiu no período"
          dados={motivos}
          cor="var(--critical)"
          vazio="Nenhum desligamento no período"
          carregando={carregando}
          recarregando={recarregando}
        />
        <RotatividadeBarras
          titulo="Tempo de casa dos desligados"
          subtitulo="Quanto tempo ficou quem saiu no período"
          dados={tenure}
          cor="var(--esp-5)"
          vazio="Nenhum desligamento no período"
          carregando={carregando}
          recarregando={recarregando}
        />
      </div>

      <RotatividadeQuebra
        titulo="Turnover por organograma"
        subtitulo="Cada setor com seu efetivo e movimentação · clique num cabeçalho para ordenar"
        rotuloColuna="Organograma"
        dados={d?.organogramas}
        total={c}
        carregando={carregando}
        recarregando={recarregando}
      />

      <RotatividadeQuebra
        titulo="Turnover por cargo"
        subtitulo="Cada cargo com seu efetivo e movimentação · clique num cabeçalho para ordenar"
        rotuloColuna="Cargo"
        dados={d?.cargos}
        total={c}
        carregando={carregando}
        recarregando={recarregando}
      />

      <p className="text-[11px] text-muted">
        Turnover = (admissões + desligamentos) ÷ 2, sobre os colaboradores ativos
        (efetivo no fim do período). Setor e cargo pela lotação/cargo atual do
        colaborador; motivo pela causa da rescisão. Considera todos os vínculos da
        empresa.
      </p>
    </>
  );
}
