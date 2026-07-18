"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarRange,
  Check,
  Hash,
  CircleDollarSign,
  FolderKanban,
  Search,
  Settings2,
  Tags,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Dropdown, ItemLista } from "@/components/ui/dropdown";
import { GruposModal } from "@/components/grupos-modal";
import { useEmpresas } from "@/hooks/use-api";
import { useGruposLocais } from "@/hooks/use-grupos-locais";
import { useFiltros } from "@/hooks/use-filters";
import { dataBR, hojeISO, inicioDoMesISO } from "@/lib/format";
import type { GrupoLocal } from "@/lib/types";

const ESPECIES = ["NFE", "CTE", "NFSE", "NFCE", "NF", "OUTRAS"];

function presets() {
  const hoje = new Date();
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const diasAtras = (n: number) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const mesPassadoIni = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const mesPassadoFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  return [
    { nome: "Hoje", inicio: hojeISO(), fim: hojeISO() },
    { nome: "Últimos 7 dias", inicio: diasAtras(6), fim: hojeISO() },
    { nome: "Últimos 30 dias", inicio: diasAtras(29), fim: hojeISO() },
    { nome: "Este mês", inicio: inicioDoMesISO(), fim: hojeISO() },
    { nome: "Mês passado", inicio: iso(mesPassadoIni), fim: iso(mesPassadoFim) },
    { nome: "Este ano", inicio: `${hoje.getFullYear()}-01-01`, fim: hojeISO() },
  ];
}

export function FilterBar({ mostrarMetrica = true }: { mostrarMetrica?: boolean }) {
  const { filtros, atualizar } = useFiltros();
  const { data: empresas } = useEmpresas();
  const { grupos } = useGruposLocais();
  const [buscaEmpresa, setBuscaEmpresa] = useState("");
  const [buscaGrupo, setBuscaGrupo] = useState("");
  const [modalGrupos, setModalGrupos] = useState(false);

  const listaPresets = useMemo(presets, []);
  const presetAtivo = listaPresets.find(
    (p) => p.inicio === filtros.inicio && p.fim === filtros.fim
  );

  const empresasFiltradas = useMemo(() => {
    if (!empresas) return [];
    const q = buscaEmpresa.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter(
      (e) => e.nome.toLowerCase().includes(q) || String(e.codigo).includes(q)
    );
  }, [empresas, buscaEmpresa]);

  // Um grupo está "ativo" quando todas as suas empresas estão na seleção atual.
  // Assim dá pra somar vários grupos (união) e desmarcar cada um.
  const empresasSet = useMemo(() => new Set(filtros.empresas), [filtros.empresas]);
  const grupoAtivo = (g: GrupoLocal) =>
    g.empresas.length > 0 && g.empresas.every((c) => empresasSet.has(c));
  const gruposAtivos = grupos.filter(grupoAtivo);

  const gruposFiltrados = useMemo(() => {
    const q = buscaGrupo.trim().toLowerCase();
    if (!q) return grupos;
    return grupos.filter((g) => g.nome.toLowerCase().includes(q));
  }, [grupos, buscaGrupo]);

  const rotuloEmpresas =
    filtros.empresas.length === 0
      ? "Todas as empresas"
      : filtros.empresas.length === 1
        ? (empresas?.find((e) => e.codigo === filtros.empresas[0])?.nome ??
          `Empresa ${filtros.empresas[0]}`)
        : `${filtros.empresas.length} empresas`;

  const temFiltro = filtros.empresas.length > 0 || filtros.especies.length > 0;

  const toggleEmpresa = (codigo: number) => {
    const set = new Set(filtros.empresas);
    if (set.has(codigo)) set.delete(codigo);
    else set.add(codigo);
    atualizar({ empresas: [...set] });
  };

  // Marca/desmarca um grupo: adiciona suas empresas à seleção, ou remove se já estão todas
  const toggleGrupo = (g: GrupoLocal) => {
    const set = new Set(filtros.empresas);
    if (g.empresas.every((c) => set.has(c))) {
      g.empresas.forEach((c) => set.delete(c));
    } else {
      g.empresas.forEach((c) => set.add(c));
    }
    atualizar({ empresas: [...set] });
  };

  // Vindo do modal de gerenciar: aplica o grupo somando à seleção
  const aplicarGrupo = (g: GrupoLocal) => {
    const set = new Set(filtros.empresas);
    g.empresas.forEach((c) => set.add(c));
    atualizar({ empresas: [...set] });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Período primeiro — é o filtro mais usado */}
      <Dropdown
        icone={<CalendarRange className="size-4" />}
        rotulo={
          presetAtivo
            ? presetAtivo.nome
            : `${dataBR(filtros.inicio)} – ${dataBR(filtros.fim)}`
        }
        ativo
        largura="w-64"
      >
        {(fechar) => (
          <div>
            <div className="py-1">
              {listaPresets.map((p) => (
                <ItemLista
                  key={p.nome}
                  selecionado={presetAtivo?.nome === p.nome}
                  onClick={() => {
                    atualizar({ inicio: p.inicio, fim: p.fim });
                    fechar();
                  }}
                >
                  <span className="grid size-4 place-items-center">
                    {presetAtivo?.nome === p.nome && (
                      <Check className="size-4 stroke-[3] text-ent" />
                    )}
                  </span>
                  {p.nome}
                </ItemLista>
              ))}
            </div>
            <div className="border-t border-hairline p-3">
              <p className="mb-2 text-xs text-muted">Período personalizado</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filtros.inicio}
                  max={filtros.fim}
                  onChange={(e) => e.target.value && atualizar({ inicio: e.target.value })}
                  className="h-8 w-full rounded-md border border-hairline bg-surface-2 px-2 text-xs text-ink"
                />
                <span className="text-muted">–</span>
                <input
                  type="date"
                  value={filtros.fim}
                  min={filtros.inicio}
                  onChange={(e) => e.target.value && atualizar({ fim: e.target.value })}
                  className="h-8 w-full rounded-md border border-hairline bg-surface-2 px-2 text-xs text-ink"
                />
              </div>
            </div>
          </div>
        )}
      </Dropdown>

      <Dropdown
        icone={<Building2 className="size-4" />}
        rotulo={rotuloEmpresas}
        ativo={filtros.empresas.length > 0}
        largura="w-80"
      >
        {() => (
          <div>
            <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
              <Search className="size-4 text-muted" />
              <input
                autoFocus
                value={buscaEmpresa}
                onChange={(e) => setBuscaEmpresa(e.target.value)}
                placeholder="Buscar por nome ou código…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              {filtros.empresas.length > 0 && (
                <button
                  onClick={() => atualizar({ empresas: [] })}
                  className="shrink-0 text-xs text-ent hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {!empresas && (
                <p className="px-3 py-2 text-sm text-muted">Carregando empresas…</p>
              )}
              {empresas && empresasFiltradas.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted">Nenhuma empresa encontrada</p>
              )}
              {empresasFiltradas.slice(0, 200).map((e) => {
                const marcada = filtros.empresas.includes(e.codigo);
                return (
                  <ItemLista
                    key={e.codigo}
                    selecionado={marcada}
                    onClick={() => toggleEmpresa(e.codigo)}
                  >
                    <span
                      className={clsx(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        marcada ? "border-ent bg-ent text-white" : "border-baseline"
                      )}
                    >
                      {marcada && <Check className="size-3 stroke-[3]" />}
                    </span>
                    <span className="flex-1 truncate">{e.nome}</span>
                    <span className="tnum text-xs text-muted">{e.codigo}</span>
                  </ItemLista>
                );
              })}
              {empresasFiltradas.length > 200 && (
                <p className="px-3 py-2 text-xs text-muted">
                  Mostrando 200 de {empresasFiltradas.length} — refine a busca
                </p>
              )}
            </div>
          </div>
        )}
      </Dropdown>

      <Dropdown
        icone={<FolderKanban className="size-4" />}
        rotulo={
          gruposAtivos.length === 0
            ? "Grupos"
            : gruposAtivos.length === 1
              ? gruposAtivos[0].nome
              : `${gruposAtivos.length} grupos`
        }
        ativo={gruposAtivos.length > 0}
        largura="w-72"
      >
        {() => (
          <div>
            <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
              <Search className="size-4 text-muted" />
              <input
                autoFocus
                value={buscaGrupo}
                onChange={(e) => setBuscaGrupo(e.target.value)}
                placeholder="Buscar grupo…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
              {gruposAtivos.length > 0 && (
                <button
                  onClick={() => {
                    const set = new Set(filtros.empresas);
                    gruposAtivos.forEach((g) => g.empresas.forEach((c) => set.delete(c)));
                    atualizar({ empresas: [...set] });
                  }}
                  className="shrink-0 text-xs text-ent hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {grupos.length === 0 && (
                <p className="px-3 py-3 text-sm text-muted">Nenhum grupo criado ainda</p>
              )}
              {grupos.length > 0 && gruposFiltrados.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted">Nenhum grupo encontrado</p>
              )}
              {gruposFiltrados.map((g) => {
                const marcado = grupoAtivo(g);
                return (
                  <ItemLista key={g.id} selecionado={marcado} onClick={() => toggleGrupo(g)}>
                    <span
                      className={clsx(
                        "grid size-4 shrink-0 place-items-center rounded border",
                        marcado ? "border-ent bg-ent text-white" : "border-baseline"
                      )}
                    >
                      {marcado && <Check className="size-3 stroke-[3]" />}
                    </span>
                    <span className="flex-1 truncate">{g.nome}</span>
                    <span className="tnum text-xs text-muted">{g.empresas.length} emp.</span>
                  </ItemLista>
                );
              })}
            </div>
            <div className="border-t border-hairline p-2">
              <button
                onClick={() => setModalGrupos(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <Settings2 className="size-4" />
                Gerenciar grupos…
              </button>
            </div>
          </div>
        )}
      </Dropdown>

      <Dropdown
        icone={<Tags className="size-4" />}
        rotulo={
          filtros.especies.length === 0
            ? "Todas as espécies"
            : filtros.especies.join(", ")
        }
        ativo={filtros.especies.length > 0}
        largura="w-56"
      >
        {() => (
          <div className="py-1">
            {ESPECIES.map((esp) => {
              const marcada = filtros.especies.includes(esp);
              return (
                <ItemLista
                  key={esp}
                  selecionado={marcada}
                  onClick={() => {
                    const set = new Set(filtros.especies);
                    if (set.has(esp)) set.delete(esp);
                    else set.add(esp);
                    atualizar({ especies: [...set] });
                  }}
                >
                  <span
                    className={clsx(
                      "grid size-4 shrink-0 place-items-center rounded border",
                      marcada ? "border-ent bg-ent text-white" : "border-baseline"
                    )}
                  >
                    {marcada && <Check className="size-3 stroke-[3]" />}
                  </span>
                  {esp === "OUTRAS" ? "Outras" : esp}
                </ItemLista>
              );
            })}
          </div>
        )}
      </Dropdown>

      {temFiltro && (
        <button
          onClick={() => atualizar({ empresas: [], especies: [] })}
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-4" />
          Limpar filtros
        </button>
      )}

      {/* Métrica global — só nas seções onde muda algo (Painel, Análises) */}
      {mostrarMetrica && (
        <div className="ml-auto flex rounded-lg border border-hairline bg-surface-2 p-0.5 text-xs">
          <button
            onClick={() => atualizar({ metrica: "valor" })}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
              filtros.metrica === "valor"
                ? "bg-surface font-medium text-ink shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            <CircleDollarSign className="size-3.5" />
            Valor
          </button>
          <button
            onClick={() => atualizar({ metrica: "qtd" })}
            className={clsx(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors",
              filtros.metrica === "qtd"
                ? "bg-surface font-medium text-ink shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            <Hash className="size-3.5" />
            Quantidade
          </button>
        </div>
      )}

      <GruposModal
        aberto={modalGrupos}
        onFechar={() => setModalGrupos(false)}
        onAplicar={aplicarGrupo}
      />
    </div>
  );
}
