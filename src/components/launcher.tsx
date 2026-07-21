import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { MODULOS, type ModuloId } from "@/lib/modulos";
import { ThemeToggle } from "./theme-toggle";

/**
 * Primeira tela depois do login: escolher o módulo. É também a primeira porta
 * de permissão — só entram na grade os módulos que a sessão libera (`acessiveis`
 * vem do perfil no servidor). Módulo ainda por vir aparece como "em breve", pra
 * sinalizar o roteiro sem prometer o que não abre.
 *
 * Card icônico: o ícone grande é o foco, o título vem abaixo. A descrição não
 * ocupa espaço — fica só no tooltip (title), pra tela respirar.
 */
export function Launcher({
  usuario,
  acessiveis,
}: {
  usuario: string;
  acessiveis: ModuloId[];
}) {
  const acesso = new Set(acessiveis);
  // Ativo e liberado vira card clicável; inativo vira "em breve"; ativo sem
  // acesso não aparece — o launcher só mostra o que a pessoa pode abrir.
  const visiveis = MODULOS.filter((m) => !m.ativo || acesso.has(m.id));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-ent/15 text-ent">
            <BarChart3 className="size-5" />
          </span>
          <p className="text-sm font-semibold tracking-tight">Questor Hub</p>
        </div>
        <ThemeToggle label={false} />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-16">
        <p className="text-sm text-muted">Bem-vindo, {usuario}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Escolha um módulo</h1>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {visiveis.map((m) => {
            const Icone = m.icone;

            if (!m.ativo) {
              return (
                <div
                  key={m.id}
                  title={m.descricao}
                  aria-disabled
                  className="card anim-scale-in flex flex-col items-center gap-4 px-6 py-8 text-center opacity-55"
                >
                  <span className="grid size-16 place-items-center rounded-2xl bg-surface-2 text-muted">
                    <Icone className="size-8" />
                  </span>
                  <div>
                    <p className="text-base font-semibold">{m.titulo}</p>
                    <span className="mt-1 inline-block text-[10px] font-medium uppercase tracking-wide text-muted">
                      em breve
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={m.id}
                href={m.home}
                title={m.descricao}
                className="card anim-scale-in group flex flex-col items-center gap-4 px-6 py-8 text-center transition-colors hover:border-ent/40 hover:bg-surface-2"
              >
                <span className="grid size-16 place-items-center rounded-2xl bg-ent/12 text-ent transition-colors group-hover:bg-ent/20">
                  <Icone className="size-8" />
                </span>
                <p className="text-base font-semibold">{m.titulo}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
