"use client";

import { useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, FileText, Truck } from "lucide-react";
import clsx from "clsx";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { ConferenciaTabela } from "@/components/conferencia-tabela";
import { useFiltros } from "@/hooks/use-filters";
import { useConferencia } from "@/hooks/use-api";
import { brl, brlCompact, num } from "@/lib/format";

type Tipo = "ent" | "sai";

function Kpi({
  rotulo,
  icone,
  corIcone,
  valor,
  secundario,
  alerta,
}: {
  rotulo: string;
  icone: React.ReactNode;
  corIcone: string;
  valor: string;
  secundario: string;
  alerta?: boolean;
}) {
  return (
    <div className="card anim-fade-up flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-2">{rotulo}</p>
        <span className={clsx("grid size-8 place-items-center rounded-lg", corIcone)}>{icone}</span>
      </div>
      <p className={clsx("text-3xl font-semibold tracking-tight", alerta && "text-critical")}>
        {valor}
      </p>
      <p className="text-xs text-muted">{secundario}</p>
    </div>
  );
}

export default function ConferenciaPage() {
  const { filtros, qs } = useFiltros();
  const [tipo, setTipo] = useState<Tipo>("ent");
  const temEmpresa = filtros.empresas.length === 1;

  const conf = useConferencia(qs, temEmpresa);
  const lado = conf.data?.[tipo];

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          A conferência fiscal roda uma empresa por vez. Escolha a empresa e o período (até 1 ano)
          no filtro acima para ver as notas pendentes de contabilização.
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Notas fiscais que deveriam estar no contábil (lançamentos origem FI) e não estão.
        </p>
        <SeletorTipo tipo={tipo} onTipo={setTipo} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {conf.isLoading || !lado ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)
        ) : (
          <>
            <Kpi
              rotulo={tipo === "ent" ? "Notas de entrada" : "Notas de saída"}
              icone={<FileText className="size-4 text-ent" />}
              corIcone="bg-ent/12"
              valor={num(lado.total)}
              secundario={lado.canceladas > 0 ? `${num(lado.canceladas)} canceladas (fora)` : "no período"}
            />
            <Kpi
              rotulo="Contabilizadas"
              icone={<CheckCircle2 className="size-4 text-good" />}
              corIcone="bg-good/12"
              valor={num(lado.contabilizadas)}
              secundario={
                lado.contabilizadas + lado.pendentes > 0
                  ? `${((lado.contabilizadas / (lado.contabilizadas + lado.pendentes)) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do que exige lançamento`
                  : "—"
              }
            />
            <Kpi
              rotulo="Pendentes de lançamento"
              icone={<AlertTriangle className="size-4 text-critical" />}
              corIcone="bg-critical/12"
              valor={num(lado.pendentes)}
              secundario={`${brlCompact(lado.valorPendente)} a contabilizar`}
              alerta={lado.pendentes > 0}
            />
            <Kpi
              rotulo="Não exigem lançamento"
              icone={<Truck className="size-4 text-ink-2" />}
              corIcone="bg-surface-2"
              valor={num(lado.ignoradas)}
              secundario="remessas, retornos, industrialização…"
            />
          </>
        )}
      </div>

      <ConferenciaTabela
        notas={lado?.notas}
        carregando={conf.isLoading}
        recarregando={conf.isFetching && !conf.isLoading}
        truncado={lado?.truncado ?? false}
        rotuloContraparte={tipo === "ent" ? "Fornecedor" : "Cliente"}
      />

      {lado && lado.total > 0 && (
        <p className="px-1 text-[11px] text-muted">
          Valor total pendente ({tipo === "ent" ? "entradas" : "saídas"}): {brl(lado.valorPendente)}.
          &quot;Não exigem lançamento&quot; são operações que por CFOP não geram lançamento contábil
          (remessa/retorno/industrialização/consignação etc.).
        </p>
      )}
    </>
  );
}
