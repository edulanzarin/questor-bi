"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  Search,
  ShieldCheck,
  Tags,
  Truck,
  X,
} from "lucide-react";
import clsx from "clsx";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { Kpi } from "@/components/kpi-conf";
import { FacetaDropdown } from "@/components/filters/faceta-dropdown";
import { useFiltros } from "@/hooks/use-filters";
import { useConferencia } from "@/hooks/use-api";
import { brl, brlCompact, dataBR, documento, num } from "@/lib/format";
import type { NotaConferida, SituacaoNota, TipoDivergencia } from "@/lib/types";

type Tipo = "ent" | "sai";
type FiltroSituacao = "problema" | "todas" | SituacaoNota;
type Ordem = "valor_desc" | "valor_asc" | "data_desc" | "data_asc" | "numero";

const SITUACOES: { id: FiltroSituacao; rotulo: string }[] = [
  { id: "problema", rotulo: "Com problema" },
  { id: "todas", rotulo: "Todas" },
  { id: "pendente", rotulo: "Não contabilizadas" },
  { id: "divergente", rotulo: "Conta errada" },
  { id: "ok", rotulo: "Corretas" },
  { id: "nao_exige", rotulo: "Não exigem" },
  { id: "cancelada", rotulo: "Canceladas" },
];

const ORDENS: { id: Ordem; rotulo: string }[] = [
  { id: "valor_desc", rotulo: "Maior valor" },
  { id: "valor_asc", rotulo: "Menor valor" },
  { id: "data_desc", rotulo: "Mais recente" },
  { id: "data_asc", rotulo: "Mais antiga" },
  { id: "numero", rotulo: "Nº da nota" },
];

const SIT_ROTULO: Record<SituacaoNota, string> = {
  ok: "Correta",
  divergente: "Conta errada",
  pendente: "Não contabilizada",
  nao_exige: "Não exige lançamento",
  cancelada: "Cancelada",
};

const SIT_COR: Record<SituacaoNota, string> = {
  ok: "bg-good/12 text-good",
  divergente: "bg-critical/12 text-critical",
  pendente: "bg-warn/12 text-warn",
  nao_exige: "bg-surface-2 text-muted",
  cancelada: "bg-surface-2 text-muted",
};

const DIV_ROTULO: Record<TipoDivergencia, string> = {
  conta: "Conta fora do plano",
  faltando: "Lançamento faltando",
  valor: "Valor divergente",
  natureza: "Natureza invertida",
  extra: "Lançamento extra",
};

function Linha({ nota, rotuloContraparte }: { nota: NotaConferida; rotuloContraparte: string }) {
  return (
    <tr className="border-b border-hairline/60 align-top last:border-0 hover:bg-surface-2/50">
      <td className="py-3 pr-3 tabular-nums">
        {num(nota.numero)}
        {nota.serie && <span className="text-muted"> / {nota.serie}</span>}
        <span className="block text-[11px] text-muted">{dataBR(nota.data)}</span>
      </td>
      <td className="max-w-[220px] py-3 pr-3">
        <span className="block truncate text-ink" title={nota.contraparte ?? rotuloContraparte}>
          {nota.contraparte ?? "—"}
        </span>
        <span className="text-[11px] text-muted">
          {[nota.especie, documento(nota.doc), nota.uf].filter(Boolean).join(" · ")}
        </span>
      </td>
      <td className="max-w-[130px] py-3 pr-3 text-xs text-muted" title={nota.cfops.join(", ")}>
        <span className="block truncate">{nota.cfops.join(", ") || "—"}</span>
        {nota.lancamentos > 0 && (
          <span className="text-[11px]">
            {nota.lancamentos} {nota.lancamentos === 1 ? "lançamento" : "lançamentos"}
          </span>
        )}
      </td>
      <td className="py-3 pr-3">
        <span
          className={clsx(
            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
            SIT_COR[nota.situacao]
          )}
        >
          {SIT_ROTULO[nota.situacao]}
        </span>
        {nota.divergencias.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-1">
            {nota.divergencias.map((d, i) => (
              <li key={i} className="text-xs text-ink-2">
                <span className="text-muted">{DIV_ROTULO[d.tipo]}:</span> {d.detalhe}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="py-3 pl-3 text-right font-semibold tabular-nums text-ink">{brl(nota.valor)}</td>
    </tr>
  );
}

export default function ConferenciaPage() {
  const { filtros, qs } = useFiltros();
  const [tipo, setTipo] = useState<Tipo>("ent");
  const [situacao, setSituacao] = useState<FiltroSituacao>("problema");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [especies, setEspecies] = useState<string[]>([]);
  const [cfops, setCfops] = useState<string[]>([]);
  const [ordem, setOrdem] = useState<Ordem>("valor_desc");
  const [pagina, setPagina] = useState(1);
  const temEmpresa = filtros.empresas.length === 1;

  // Digitar não dispara consulta a cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);

  // Qualquer mudança de recorte recomeça na primeira página.
  useEffect(() => setPagina(1), [tipo, situacao, buscaAplicada, especies, cfops, ordem]);

  const url = useMemo(() => {
    const p = new URLSearchParams(qs);
    p.set("tipo", tipo);
    p.set("situacao", situacao);
    p.set("ordem", ordem);
    p.set("pagina", String(pagina));
    if (buscaAplicada) p.set("busca", buscaAplicada);
    if (especies.length) p.set("especies", especies.join(","));
    if (cfops.length) p.set("cfops", cfops.join(","));
    return p.toString();
  }, [qs, tipo, situacao, ordem, pagina, buscaAplicada, especies, cfops]);

  const conf = useConferencia(url, temEmpresa);
  const dados = conf.data;
  const r = dados?.resumo;

  const temFiltroExtra = !!buscaAplicada || especies.length > 0 || cfops.length > 0;

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          A conferência roda uma empresa por vez. Escolha a empresa e o período (até 1 ano) no
          filtro acima para ver o que falta lançar e o que foi lançado na conta errada.
        </p>
      </section>
    );
  }

  const exigem = (r?.contabilizadas ?? 0) + (r?.pendentes ?? 0);
  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.porPagina)) : 1;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Duas perguntas sobre as mesmas notas: foi contabilizada? e foi para a conta certa?
        </p>
        <SeletorTipo tipo={tipo} onTipo={setTipo} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {conf.isLoading || !r ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)
        ) : (
          <>
            <Kpi
              rotulo={tipo === "ent" ? "Notas de entrada" : "Notas de saída"}
              icone={<FileText className="size-4 text-ent" />}
              corIcone="bg-ent/12"
              valor={num(r.total)}
              secundario={`${num(r.naoExigem)} não exigem lançamento`}
            />
            <Kpi
              rotulo="Pendentes de lançamento"
              icone={<AlertTriangle className="size-4 text-warn" />}
              corIcone="bg-warn/12"
              valor={num(r.pendentes)}
              secundario={`${brlCompact(r.valorPendente)} a contabilizar`}
              alerta={r.pendentes > 0}
            />
            <Kpi
              rotulo="Lançadas na conta errada"
              icone={<Truck className="size-4 text-critical" />}
              corIcone="bg-critical/12"
              valor={num(r.divergentes)}
              secundario={`de ${num(r.contabilizadas)} contabilizadas`}
              alerta={r.divergentes > 0}
            />
            <Kpi
              rotulo="Corretas"
              icone={<ShieldCheck className="size-4 text-good" />}
              corIcone="bg-good/12"
              valor={num(r.conformes)}
              secundario={
                exigem > 0
                  ? `${((r.conformes / exigem) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do que exige lançamento`
                  : "—"
              }
            />
          </>
        )}
      </div>

      <section className="card anim-fade-up p-5">
        <header className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Notas do período</h2>
              <p className="mt-0.5 text-xs text-muted">
                {dados
                  ? `${num(dados.total)} ${dados.total === 1 ? "nota" : "notas"} no filtro`
                  : "…"}
                {dados?.truncado && " · período grande, analisadas as 8.000 de maior valor"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5 text-xs text-ink outline-none"
                aria-label="Ordenar por"
              >
                {ORDENS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
                <Search className="size-4 text-muted" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nº, contraparte, CNPJ ou UF…"
                  className="w-52 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
                />
              </div>
            </div>
          </div>

          {/* Situação: o filtro principal */}
          <div className="flex flex-wrap items-center gap-1">
            {SITUACOES.map((s) => {
              const qtd = !r
                ? null
                : s.id === "todas"
                  ? r.total
                  : s.id === "problema"
                    ? r.pendentes + r.divergentes
                    : s.id === "ok"
                      ? r.conformes
                      : s.id === "pendente"
                        ? r.pendentes
                        : s.id === "divergente"
                          ? r.divergentes
                          : s.id === "nao_exige"
                            ? r.naoExigem
                            : r.canceladas;
              return (
                <button
                  key={s.id}
                  onClick={() => setSituacao(s.id)}
                  className={clsx(
                    "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                    situacao === s.id
                      ? "bg-ent/12 font-medium text-ent"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  )}
                >
                  {s.rotulo}
                  {qtd != null && <span className="ml-1 tabular-nums">{num(qtd)}</span>}
                </button>
              );
            })}
          </div>

          {/* Refinos: só os valores que existem no recorte atual */}
          <div className="flex flex-wrap items-center gap-2">
            <FacetaDropdown
              rotulo="Espécie"
              icone={<Receipt className="size-4" />}
              opcoes={dados?.facetas.especies ?? []}
              selecionados={especies}
              onMudar={setEspecies}
              largura="w-60"
            />
            <FacetaDropdown
              rotulo="CFOP"
              icone={<Tags className="size-4" />}
              opcoes={dados?.facetas.cfops ?? []}
              selecionados={cfops}
              onMudar={setCfops}
              buscavel
              largura="w-96"
            />
            {temFiltroExtra && (
              <button
                onClick={() => {
                  setBusca("");
                  setEspecies([]);
                  setCfops([]);
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-3.5" /> Limpar filtros
              </button>
            )}
          </div>
        </header>

        {conf.isLoading || !dados ? (
          <div className="skeleton h-80 w-full" />
        ) : dados.notas.length === 0 ? (
          <div className="grid h-32 place-items-center gap-2 text-center">
            <CheckCircle2 className="mx-auto size-6 text-good" />
            <p className="text-sm text-muted">
              {situacao === "problema" && !temFiltroExtra
                ? "Nada pendente e nada fora do plano 🎉"
                : "Nenhuma nota com esse filtro"}
            </p>
          </div>
        ) : (
          <div className={clsx(conf.isFetching && !conf.isLoading && "refetching")}>
            <div className="max-h-[34rem] overflow-auto">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="border-b border-hairline text-xs text-muted">
                    <th className="py-2 pr-3 text-left font-medium">Nº / Data</th>
                    <th className="py-2 pr-3 text-left font-medium">
                      {tipo === "ent" ? "Fornecedor" : "Cliente"}
                    </th>
                    <th className="py-2 pr-3 text-left font-medium">CFOP</th>
                    <th className="py-2 pr-3 text-left font-medium">Situação</th>
                    <th className="py-2 pl-3 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.notas.map((n) => (
                    <Linha
                      key={n.chave}
                      nota={n}
                      rotuloContraparte={tipo === "ent" ? "Fornecedor" : "Cliente"}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                <p className="text-xs text-muted">
                  Página {dados.pagina} de {num(totalPaginas)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={dados.pagina <= 1}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="size-3.5" /> Anterior
                  </button>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={dados.pagina >= totalPaginas}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Próxima <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <p className="px-1 text-[11px] text-muted">
        &quot;Não exigem lançamento&quot; são operações que por CFOP não geram lançamento contábil
        (remessa, retorno, industrialização por encomenda) — quem define isso é a aba Configuração.
        Nas contabilizadas, só é cobrado o que o Questor lança nota a nota: tributo apurado
        mensalmente (ICMS e IPI de saída) vai na apuração, não na nota. Valores só são conferidos em
        nota de CFOP único.
      </p>
    </>
  );
}
