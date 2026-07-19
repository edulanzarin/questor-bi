import clsx from "clsx";

/** Card de KPI das telas do módulo Contábil (conferência e contas). */
export function Kpi({
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
