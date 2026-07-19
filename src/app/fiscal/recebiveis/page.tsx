"use client";

import { AlertTriangle, CalendarClock, Receipt, Wallet } from "lucide-react";
import clsx from "clsx";
import { SerieChart } from "@/components/charts/serie-chart";
import { TopBarChart } from "@/components/charts/top-bar-chart";
import { ChartCard } from "@/components/ui/chart-card";
import { useFiltros } from "@/hooks/use-filters";
import { useRecebiveis, usePagamento } from "@/hooks/use-api";
import { brl, brlCompact, num } from "@/lib/format";

function Kpi({
  rotulo,
  icone,
  corIcone,
  valor,
  valorCheio,
  secundario,
  alerta,
}: {
  rotulo: string;
  icone: React.ReactNode;
  corIcone: string;
  valor: string;
  valorCheio?: string;
  secundario: string;
  alerta?: boolean;
}) {
  return (
    <div className="card anim-fade-up flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-2">{rotulo}</p>
        <span className={clsx("grid size-8 place-items-center rounded-lg", corIcone)}>{icone}</span>
      </div>
      <p className={clsx("text-3xl font-semibold tracking-tight", alerta && "text-critical")} title={valorCheio}>
        {valor}
      </p>
      <p className="text-xs text-muted">{secundario}</p>
    </div>
  );
}

/** Barra horizontal rotulada (aging, à vista × prazo). */
function Barra({
  rotulo,
  valor,
  detalhe,
  fracao,
  cor,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  fracao: number;
  cor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-2">{rotulo}</span>
        <span className="tabular-nums text-muted">
          {valor}
          {detalhe && <span className="ml-1 text-[11px]">{detalhe}</span>}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${fracao * 100}%`, background: cor }} />
      </div>
    </div>
  );
}

export default function RecebiveisPage() {
  const { qs } = useFiltros();
  const rec = useRecebiveis(qs);
  const pag = usePagamento(qs);
  const r = rec.data;

  const maxAging = r ? Math.max(1, ...r.aging.map((a) => a.valor)) : 1;
  const pct = (p: number, t: number) =>
    t > 0 ? `${((p / t) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—";

  const totalPag = pag.data ? pag.data.aVista + pag.data.aPrazo + pag.data.outros : 0;

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rec.isLoading || !r ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)
        ) : (
          <>
            <Kpi
              rotulo="Total a receber"
              icone={<Wallet className="size-4 text-ent" />}
              corIcone="bg-ent/12"
              valor={brlCompact(r.totalReceber)}
              valorCheio={brl(r.totalReceber)}
              secundario={`${num(r.qtdParcelas)} parcelas · notas do período`}
            />
            <Kpi
              rotulo="Vencido"
              icone={<AlertTriangle className="size-4 text-critical" />}
              corIcone="bg-critical/12"
              valor={brlCompact(r.vencido)}
              valorCheio={brl(r.vencido)}
              secundario={`${pct(r.vencido, r.totalReceber)} do total a receber`}
              alerta={r.vencido > 0}
            />
            <Kpi
              rotulo="A vencer"
              icone={<CalendarClock className="size-4 text-sai" />}
              corIcone="bg-sai/12"
              valor={brlCompact(r.aVencer)}
              valorCheio={brl(r.aVencer)}
              secundario="ainda dentro do prazo"
            />
            <Kpi
              rotulo="Parcela média"
              icone={<Receipt className="size-4 text-ink-2" />}
              corIcone="bg-surface-2"
              valor={brlCompact(r.qtdParcelas > 0 ? r.totalReceber / r.qtdParcelas : 0)}
              secundario="valor médio por parcela"
            />
          </>
        )}
      </div>

      {/* Aging + fluxo por vencimento */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          titulo="Aging dos recebíveis"
          subtitulo="Parcelas por faixa de vencimento (vermelho = vencido)"
          carregando={rec.isLoading || !r}
          recarregando={rec.isFetching && !rec.isLoading}
          alturaSkeleton="h-64"
        >
          <div className="flex flex-col gap-3 pt-1">
            {r?.aging.map((a) => (
              <Barra
                key={a.faixa}
                rotulo={a.faixa}
                valor={brlCompact(a.valor)}
                detalhe={`· ${num(a.qtd)}`}
                fracao={a.valor / maxAging}
                cor={a.vencido ? "var(--critical)" : "var(--sai)"}
              />
            ))}
            {r && r.aging.length === 0 && (
              <p className="grid h-40 place-items-center text-sm text-muted">Sem recebíveis no período</p>
            )}
          </div>
        </ChartCard>

        <SerieChart
          titulo="Fluxo de recebíveis"
          subtitulo="A receber por mês de vencimento"
          dados={r?.fluxo}
          granularidade="mes"
          cor="var(--sai)"
          formato="valor"
          nomeSerie="A receber"
          carregando={rec.isLoading || !r}
          recarregando={rec.isFetching && !rec.isLoading}
        />
      </div>

      {/* Meios de pagamento + à vista × prazo */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TopBarChart
            titulo="Meios de pagamento"
            subtituloEnt=""
            subtituloSai="Notas de saída por forma de pagamento (NFe) · valor no tooltip"
            dados={pag.data?.meios}
            carregando={pag.isLoading}
            recarregando={pag.isFetching && !pag.isLoading}
            tipo="sai"
            onTipo={() => {}}
            metrica="qtd"
            rotuloQtd="Notas"
            semSeletor
          />
        </div>
        <ChartCard
          titulo="À vista × a prazo"
          subtitulo="Indicador de pagamento (indpagto)"
          carregando={pag.isLoading || !pag.data}
          recarregando={pag.isFetching && !pag.isLoading}
          alturaSkeleton="h-64"
        >
          <div className="flex flex-col gap-3 pt-1">
            {pag.data && (
              <>
                <Barra
                  rotulo="À vista"
                  valor={num(pag.data.aVista)}
                  detalhe={pct(pag.data.aVista, totalPag)}
                  fracao={totalPag > 0 ? pag.data.aVista / totalPag : 0}
                  cor="var(--sai)"
                />
                <Barra
                  rotulo="A prazo"
                  valor={num(pag.data.aPrazo)}
                  detalhe={pct(pag.data.aPrazo, totalPag)}
                  fracao={totalPag > 0 ? pag.data.aPrazo / totalPag : 0}
                  cor="var(--ent)"
                />
                <Barra
                  rotulo="Outros / não informado"
                  valor={num(pag.data.outros)}
                  detalhe={pct(pag.data.outros, totalPag)}
                  fracao={totalPag > 0 ? pag.data.outros / totalPag : 0}
                  cor="var(--muted)"
                />
              </>
            )}
          </div>
        </ChartCard>
      </div>
    </>
  );
}
