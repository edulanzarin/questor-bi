"use client";

import { Repeat } from "lucide-react";

/**
 * Casca da tela de Rotatividade — a série de turnover e os KPIs entram na etapa
 * seguinte. Até lá, a tela já navega, filtra por empresa/período e mostra o
 * estado vazio, para o resto do módulo (sidebar, launcher, gate) ser exercido.
 */
export default function RotatividadePage() {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-ent/12 text-ent">
        <Repeat className="size-6" />
      </span>
      <p className="text-sm font-semibold">Rotatividade em construção</p>
      <p className="max-w-sm text-xs text-muted">
        O painel de turnover (admissões, desligamentos e efetivo médio) chega na
        próxima etapa. A empresa e o período já estão selecionados.
      </p>
    </div>
  );
}
