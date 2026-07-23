"use client";

import { Repeat, UserMinus, UserPlus, Users } from "lucide-react";
import clsx from "clsx";
import { TurnoverSerieChart } from "@/components/charts/turnover-serie-chart";
import { RotatividadeOrganogramas } from "@/components/rotatividade-organogramas";
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

  const c = turnover.data?.consolidado;
  const carregando = turnover.isLoading;
  const recarregando = turnover.isFetching && !turnover.isLoading;

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

      <TurnoverSerieChart
        dados={turnover.data?.serie}
        carregando={carregando}
        recarregando={recarregando}
      />

      <RotatividadeOrganogramas
        dados={turnover.data?.organogramas}
        total={c}
        carregando={carregando}
        recarregando={recarregando}
      />

      <p className="text-[11px] text-muted">
        Turnover = (admissões + desligamentos) ÷ 2, sobre os colaboradores ativos
        (efetivo no fim do período). Cada setor é o organograma da lotação atual do
        colaborador. Considera todos os vínculos da empresa.
      </p>
    </>
  );
}
