import { MODULOS, secoesDoModulo } from "@/lib/modulos";
import { salvarUsuario, excluirUsuario } from "../actions";
import type { UsuarioDetalhe, GrupoResumo, EmpresaOpcao } from "../dados";
import { AvatarCampo } from "./avatar-campo";

const input =
  "h-10 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-ent/50";
const check = "size-4 accent-[var(--ent)]";

/**
 * Cria ou edita um usuário: identidade, flags, perfil por SEÇÃO (matriz
 * none/view/edit) e escopo de empresa (grupos + extras). Form puro sobre Server
 * Action — a checagem admin mora na action. Admin já tem acesso total, então a
 * matriz é ignorada para ele (o texto avisa).
 */
export function UsuarioForm({
  usuario,
  grupos,
  empresas,
}: {
  usuario: UsuarioDetalhe | null;
  grupos: GrupoResumo[];
  empresas: EmpresaOpcao[];
}) {
  const modulos = MODULOS.filter((m) => m.ativo);

  return (
    <form action={salvarUsuario} encType="multipart/form-data" className="flex flex-col gap-6">
      {usuario && <input type="hidden" name="id" value={usuario.id} />}

      <AvatarCampo
        id={usuario?.id ?? "novo"}
        nome={usuario?.nome ?? ""}
        temFoto={usuario ? usuario.avatarVersao != null : false}
        versao={usuario?.avatarVersao ?? null}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Nome</span>
          <input name="nome" required defaultValue={usuario?.nome ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={usuario?.email ?? ""}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Cargo</span>
          <input name="cargo" defaultValue={usuario?.cargo ?? ""} className={input} placeholder="Ex.: Analista Fiscal" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Setor</span>
          <input name="setor" defaultValue={usuario?.setor ?? ""} className={input} placeholder="Ex.: Fiscal" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">Telefone</span>
          <input name="telefone" defaultValue={usuario?.telefone ?? ""} className={input} placeholder="(00) 00000-0000" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-2">
            Senha {usuario && <span className="text-muted">(deixe em branco para manter)</span>}
          </span>
          <input
            name="senha"
            type="password"
            autoComplete="new-password"
            required={!usuario}
            className={input}
            placeholder="••••••••"
          />
        </label>
      </section>

      <section className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativo" defaultChecked={usuario ? usuario.ativo : true} className={check} />
          Ativo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="admin" defaultChecked={usuario?.admin ?? false} className={check} />
          Administrador
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="todas_empresas"
            defaultChecked={usuario?.todas_empresas ?? false}
            className={check}
          />
          Vê todas as empresas
        </label>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Acesso por seção</h2>
        <p className="mt-0.5 text-xs text-muted">
          Admin tem acesso total (a matriz abaixo é ignorada para ele).
        </p>
        <div className="mt-3 flex flex-col gap-5">
          {modulos.map((m) => (
            <div key={m.id}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {m.titulo}
              </p>
              <div className="card divide-y divide-hairline">
                {secoesDoModulo(m.id).map((s) => {
                  const atual = usuario?.secoes[`${m.id}/${s.id}`];
                  const nome = `sec:${m.id}:${s.id}`;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="text-sm">{s.rotulo}</span>
                      <div className="flex gap-4 text-xs">
                        {(["none", "view", "edit"] as const).map((op) => (
                          <label key={op} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={nome}
                              value={op}
                              defaultChecked={(atual ?? "none") === op}
                              className={check}
                            />
                            {op === "none" ? "Sem acesso" : op === "view" ? "Ver" : "Editar"}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold">Grupos de empresa</h2>
          <p className="mt-0.5 text-xs text-muted">Ignorados se &quot;vê todas&quot; estiver marcado.</p>
          <div className="card mt-3 max-h-56 divide-y divide-hairline overflow-auto">
            {grupos.length === 0 && <p className="px-4 py-3 text-xs text-muted">Nenhum grupo criado.</p>}
            {grupos.map((g) => (
              <label key={g.id} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                <input
                  type="checkbox"
                  name="grupos"
                  value={g.id}
                  defaultChecked={usuario?.grupos.includes(g.id) ?? false}
                  className={check}
                />
                <span className="min-w-0 truncate">{g.nome}</span>
                <span className="ml-auto shrink-0 text-xs text-muted">{g.empresas} empresas</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Empresas avulsas</h2>
          <p className="mt-0.5 text-xs text-muted">Extras além dos grupos (Ctrl/Shift para várias).</p>
          <select
            name="empresas"
            multiple
            defaultValue={(usuario?.empresas ?? []).map(String)}
            className="mt-3 h-56 w-full rounded-lg border border-hairline bg-surface p-2 text-sm text-ink outline-none focus:border-ent/50"
          >
            {empresas.map((e) => (
              <option key={e.codigo} value={e.codigo} className="rounded px-1 py-0.5">
                {e.codigo} · {e.nome}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-hairline pt-4">
        {usuario ? (
          <button
            type="submit"
            formAction={excluirUsuario}
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
          {usuario ? "Salvar" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}
