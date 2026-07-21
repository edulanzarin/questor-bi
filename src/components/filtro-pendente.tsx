import { SlidersHorizontal } from "lucide-react";

/**
 * Estado que a tela mostra antes de o usuário executar: nada é consultado até o
 * botão Executar. Um só, reusado pelos shells dos módulos ([[executar-com-botao]]).
 */
export function FiltroPendente({ mensagem }: { mensagem?: string }) {
  return (
    <section className="card anim-fade-up grid place-items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
        <SlidersHorizontal className="size-6" />
      </span>
      <p className="text-sm font-medium text-ink">Ajuste os filtros e clique em Executar</p>
      <p className="max-w-md text-xs text-muted">
        {mensagem ?? "Nada é consultado até você executar — assim a escolha de empresa e período não dispara consulta sozinha."}
      </p>
    </section>
  );
}
