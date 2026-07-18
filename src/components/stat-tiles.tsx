"use client";

import clsx from "clsx";

export interface Stat {
  rotulo: string;
  valor: string;
  sub?: string;
  cor?: string;
}

export function StatTiles({
  stats,
  carregando,
  colunas = 4,
}: {
  stats: Stat[] | undefined;
  carregando: boolean;
  colunas?: 3 | 4;
}) {
  const cols = colunas === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4";
  if (carregando || !stats) {
    return (
      <div className={clsx("grid grid-cols-1 gap-4", cols)}>
        {Array.from({ length: colunas }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton mb-2 h-3 w-24" />
            <div className="skeleton h-7 w-32" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={clsx("grid grid-cols-1 gap-4", cols)}>
      {stats.map((s) => (
        <div key={s.rotulo} className="card anim-fade-up p-5">
          <div className="mb-1.5 flex items-center gap-1.5">
            {s.cor && <span className="size-2 rounded-sm" style={{ background: s.cor }} />}
            <p className="text-xs text-muted">{s.rotulo}</p>
          </div>
          <p className="text-2xl font-semibold tracking-tight">{s.valor}</p>
          {s.sub && <p className="mt-1 text-xs text-muted">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
