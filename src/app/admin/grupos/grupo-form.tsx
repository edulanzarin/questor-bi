import { salvarGrupo, excluirGrupo } from "../actions";
import type { GrupoDetalhe, EmpresaOpcao } from "../dados";

const input =
  "h-10 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-ent/50";

/** Cria ou edita um grupo de empresas (nome + seleção). Form sobre Server Action. */
export function GrupoForm({
  grupo,
  empresas,
}: {
  grupo: GrupoDetalhe | null;
  empresas: EmpresaOpcao[];
}) {
  return (
    <form action={salvarGrupo} className="flex flex-col gap-6">
      {grupo && <input type="hidden" name="id" value={grupo.id} />}

      <label className="flex max-w-md flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-2">Nome do grupo</span>
        <input name="nome" required defaultValue={grupo?.nome ?? ""} className={input} placeholder="Ex.: Carteira Sul" />
      </label>

      <div>
        <h2 className="text-sm font-semibold">Empresas do grupo</h2>
        <p className="mt-0.5 text-xs text-muted">Ctrl/Shift para selecionar várias.</p>
        <select
          name="empresas"
          multiple
          defaultValue={(grupo?.empresas ?? []).map(String)}
          className="mt-3 h-80 w-full max-w-2xl rounded-lg border border-hairline bg-surface p-2 text-sm text-ink outline-none focus:border-ent/50"
        >
          {empresas.map((e) => (
            <option key={e.codigo} value={e.codigo}>
              {e.codigo} · {e.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between border-t border-hairline pt-4">
        {grupo ? (
          <button
            type="submit"
            formAction={excluirGrupo}
            className="h-9 rounded-lg border border-critical/40 px-3 text-sm font-medium text-critical transition-colors hover:bg-critical/10"
          >
            Excluir
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className="h-10 rounded-lg bg-ent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {grupo ? "Salvar" : "Criar grupo"}
        </button>
      </div>
    </form>
  );
}
