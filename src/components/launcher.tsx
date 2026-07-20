import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { MODULOS, type ModuloId } from "@/lib/modulos";
import { ThemeToggle } from "./theme-toggle";

/**
 * Primeira tela depois do login: escolher o módulo. É também a primeira porta
 * de permissão — só entram na grade os módulos que a sessão libera (`acessiveis`
 * vem do perfil no servidor). Módulo ainda por vir aparece como "em breve", pra
 * sinalizar o roteiro sem prometer o que não abre.
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {visiveis.map((m) => {
            const Icone = m.icone;

            if (!m.ativo) {
              return (
                <div
                  key={m.id}
                  className="card anim-scale-in flex items-start gap-4 p-5 opacity-55"
                  aria-disabled
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                    <Icone className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.titulo}</p>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                        em breve
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{m.descricao}</p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={m.id}
                href={m.home}
                className="card anim-scale-in group flex items-start gap-4 p-5 transition-colors hover:border-ent/40 hover:bg-surface-2"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ent/12 text-ent">
                  <Icone className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.titulo}</p>
                  <p className="mt-0.5 text-sm text-muted">{m.descricao}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ent" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
