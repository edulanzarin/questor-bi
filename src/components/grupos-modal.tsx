"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { useEmpresas } from "@/hooks/use-api";
import { useGruposLocais } from "@/hooks/use-grupos-locais";
import type { GrupoLocal } from "@/lib/types";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onAplicar: (grupo: GrupoLocal) => void;
}

export function GruposModal({ aberto, onFechar, onAplicar }: Props) {
  const { grupos, salvar, excluir } = useGruposLocais();
  const { data: empresas } = useEmpresas();

  const [editando, setEditando] = useState<GrupoLocal | null>(null);
  const [nome, setNome] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, onFechar]);

  const empresasFiltradas = useMemo(() => {
    if (!empresas) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter(
      (e) => e.nome.toLowerCase().includes(q) || String(e.codigo).includes(q)
    );
  }, [empresas, busca]);

  if (!aberto) return null;

  const iniciarEdicao = (g: GrupoLocal | null) => {
    setEditando(g ?? { id: "", nome: "", empresas: [] });
    setNome(g?.nome ?? "");
    setSelecionadas(new Set(g?.empresas ?? []));
    setBusca("");
  };

  const toggleEmpresa = (codigo: number) => {
    setSelecionadas((prev) => {
      const s = new Set(prev);
      if (s.has(codigo)) s.delete(codigo);
      else s.add(codigo);
      return s;
    });
  };

  const salvarGrupo = () => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      toast.error("Dê um nome ao grupo");
      return;
    }
    if (selecionadas.size === 0) {
      toast.error("Selecione ao menos uma empresa");
      return;
    }
    salvar({
      id: editando?.id || undefined,
      nome: nomeLimpo,
      empresas: [...selecionadas].sort((a, b) => a - b),
    });
    toast.success(editando?.id ? "Grupo atualizado" : `Grupo "${nomeLimpo}" criado`);
    setEditando(null);
  };

  const excluirGrupo = (g: GrupoLocal) => {
    excluir(g.id);
    toast.success(`Grupo "${g.nome}" excluído`);
  };

  return createPortal(
    <div
      className="anim-fade-in fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="anim-scale-in card flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Grupos de empresas"
      >
        <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Grupos de empresas</h3>
            <p className="mt-0.5 text-xs text-muted">
              Grupos ficam salvos neste navegador
            </p>
          </div>
          <button
            onClick={onFechar}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </header>

        {editando === null ? (
          <div className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {grupos.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">
                  Nenhum grupo ainda — crie o primeiro para filtrar várias empresas de uma vez
                </p>
              )}
              <ul className="space-y-2">
                {grupos.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center gap-3 rounded-lg border border-hairline px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{g.nome}</p>
                      <p className="text-xs text-muted">{g.empresas.length} empresas</p>
                    </div>
                    <button
                      onClick={() => {
                        onAplicar(g);
                        onFechar();
                      }}
                      className="rounded-lg bg-ent/12 px-2.5 py-1.5 text-xs font-medium text-ent transition-colors hover:bg-ent/20"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => iniciarEdicao(g)}
                      className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      title="Editar"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => excluirGrupo(g)}
                      className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-critical/12 hover:text-critical"
                      title="Excluir"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <footer className="border-t border-hairline px-6 py-4">
              <button
                onClick={() => iniciarEdicao(null)}
                className="flex items-center gap-2 rounded-lg bg-ent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" />
                Novo grupo
              </button>
            </footer>
          </div>
        ) : (
          <div className="flex min-h-0 flex-col">
            <div className="space-y-3 px-6 pt-4">
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do grupo (ex.: Têxteis, Clientes da Larissa…)"
                className="h-10 w-full rounded-lg border border-hairline bg-surface-2 px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-ent/50"
              />
              <div className="flex h-9 items-center gap-2 rounded-lg border border-hairline px-3">
                <Search className="size-4 text-muted" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar empresa por nome ou código…"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
                <span className="tnum shrink-0 text-xs text-muted">
                  {selecionadas.size} selec.
                </span>
              </div>
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-6 pb-2">
              {empresasFiltradas.slice(0, 300).map((e) => {
                const marcada = selecionadas.has(e.codigo);
                return (
                  <button
                    key={e.codigo}
                    onClick={() => toggleEmpresa(e.codigo)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={clsx(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        marcada ? "border-ent bg-ent text-white" : "border-baseline"
                      )}
                    >
                      {marcada && <Check className="size-3 stroke-[3]" />}
                    </span>
                    <span className="flex-1 truncate text-ink-2">{e.nome}</span>
                    <span className="tnum text-xs text-muted">{e.codigo}</span>
                  </button>
                );
              })}
            </div>
            <footer className="flex justify-between gap-2 border-t border-hairline px-6 py-4">
              <button
                onClick={() => setEditando(null)}
                className="rounded-lg px-3.5 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2"
              >
                Voltar
              </button>
              <button
                onClick={salvarGrupo}
                className="rounded-lg bg-ent px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {editando.id ? "Salvar alterações" : "Criar grupo"}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
