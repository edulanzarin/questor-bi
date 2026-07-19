"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Users,
  Coins,
  Gauge,
  Landmark,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Table2,
  TrendingUp,
  Wallet,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { SECOES_FISCAL, type SecaoFiscal } from "@/lib/fiscal-secoes";

const ICONE_SECAO: Record<string, LucideIcon> = {
  painel: LayoutDashboard,
  analises: TrendingUp,
  tributos: Coins,
  recebiveis: Wallet,
  produtividade: Gauge,
  conformidade: ShieldCheck,
  dados: Table2,
};

interface Modulo {
  id: string;
  titulo: string;
  icone: LucideIcon;
  ativo: boolean;
  secoes: SecaoFiscal[];
}

const MODULOS: Modulo[] = [
  { id: "fiscal", titulo: "Fiscal", icone: Receipt, ativo: true, secoes: SECOES_FISCAL },
  { id: "contabil", titulo: "Contábil", icone: BookOpen, ativo: false, secoes: [] },
  { id: "folha", titulo: "Folha", icone: Users, ativo: false, secoes: [] },
  { id: "patrimonio", titulo: "Patrimônio", icone: Landmark, ativo: false, secoes: [] },
];

function moduloAtivo(pathname: string): string | undefined {
  return MODULOS.find((m) => pathname.startsWith(`/${m.id}`))?.id;
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const atual = document.documentElement.dataset.theme;
    if (atual === "light" || atual === "dark") setTheme(atual);
  }, []);
  const toggle = () => {
    const proximo = theme === "dark" ? "light" : "dark";
    setTheme(proximo);
    document.documentElement.dataset.theme = proximo;
    try {
      localStorage.setItem("questor-bi-theme", proximo);
    } catch {}
  };
  return { theme, toggle };
}

export function Sidebar() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const { theme, toggle } = useTheme();
  const qs = sp.toString();
  const suffix = qs ? `?${qs}` : "";

  // Acordeão: o módulo da rota atual abre por padrão; o usuário pode fechar/abrir os outros.
  const [aberto, setAberto] = useState<Record<string, boolean>>(() => {
    const ativo = moduloAtivo(pathname) ?? "fiscal";
    return { [ativo]: true };
  });

  useEffect(() => {
    const ativo = moduloAtivo(pathname);
    if (ativo) setAberto((prev) => (prev[ativo] ? prev : { ...prev, [ativo]: true }));
  }, [pathname]);

  const toggleModulo = (id: string) =>
    setAberto((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-hairline bg-surface px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <span className="grid size-9 place-items-center rounded-xl bg-ent/15 text-ent">
          <BarChart3 className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Questor BI</p>
          <p className="text-[11px] text-muted">Navecon</p>
        </div>
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {MODULOS.map((m) => {
          const expandido = !!aberto[m.id] && m.secoes.length > 0;
          const ehAtivo = moduloAtivo(pathname) === m.id;
          return (
            <div key={m.id}>
              <button
                onClick={() => m.ativo && m.secoes.length > 0 && toggleModulo(m.id)}
                disabled={!m.ativo}
                className={clsx(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  !m.ativo
                    ? "cursor-default text-muted/50"
                    : ehAtivo
                      ? "font-medium text-ink hover:bg-surface-2"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                )}
              >
                <m.icone className="size-4 shrink-0" />
                {m.titulo}
                {m.ativo && m.secoes.length > 0 ? (
                  <ChevronDown
                    className={clsx(
                      "ml-auto size-4 text-muted transition-transform",
                      !expandido && "-rotate-90"
                    )}
                  />
                ) : (
                  <span className="ml-auto text-[10px] uppercase tracking-wide">breve</span>
                )}
              </button>

              {expandido && (
                <div className="mt-0.5 mb-1 ml-4 flex flex-col gap-0.5 border-l border-hairline pl-2">
                  {m.secoes.map((s) => {
                    const Icone = ICONE_SECAO[s.id];
                    const secaoAtiva = pathname === s.path || pathname.startsWith(s.path + "/");
                    return (
                      <Link
                        key={s.id}
                        href={`${s.path}${suffix}`}
                        className={clsx(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                          secaoAtiva
                            ? "bg-ent/12 font-medium text-ent"
                            : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                        )}
                      >
                        {Icone && <Icone className="size-4 shrink-0" />}
                        {s.rotulo}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        {theme === "dark" ? "Tema claro" : "Tema escuro"}
      </button>
    </aside>
  );
}
