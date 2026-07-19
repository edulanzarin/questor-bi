"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import clsx from "clsx";
import { SeletorTipo } from "@/components/charts/top-bar-chart";
import { Kpi } from "@/components/kpi-conf";
import { useFiltros } from "@/hooks/use-filters";
import { useConferencia, useDivergencias } from "@/hooks/use-api";
import { brl, brlCompact, dataBR, documento, num } from "@/lib/format";
import type { Divergencia, TipoDivergencia } from "@/lib/types";

type Tipo = "ent" | "sai";
type Problema = "pendente" | TipoDivergencia;

const ROTULO: Record<Problema, string> = {
  pendente: "Não contabilizada",
  conta: "Conta fora do plano",
  faltando: "Lançamento faltando",
  valor: "Valor divergente",
  natureza: "Natureza invertida",
  extra: "Lançamento extra",
};

const COR: Record<Problema, string> = {
  pendente: "bg-critical/12 text-critical",
  conta: "bg-critical/12 text-critical",
  faltando: "bg-warn/12 text-warn",
  valor: "bg-ent/12 text-ent",
  natureza: "bg-sai/12 text-sai",
  extra: "bg-surface-2 text-ink-2",
};

/** Uma nota com problema, venha ela de "não lançada" ou de "lançada errado". */
interface Achado {
  chave: string;
  numero: number;
  serie: string | null;
  especie: string;
  data: string;
  valor: number;
  contraparte: string | null;
  doc: string | null;
  uf: string | null;
  cfops: string;
  tipos: Problema[];
  detalhes: { tipo: Problema; texto: string }[];
}

export default function ConferenciaPage() {
  const { filtros, qs } = useFiltros();
  const [tipo, setTipo] = useState<Tipo>("ent");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Problema | "todos">("todos");
  const temEmpresa = filtros.empresas.length === 1;

  const conf = useConferencia(qs, temEmpresa);
  const div = useDivergencias(qs, temEmpresa);
  const lado = conf.data?.[tipo];
  const ladoDiv = div.data?.[tipo];
  const carregando = conf.isLoading || div.isLoading;

  // Junta os dois lados do problema numa lista só, ordenada por valor.
  const achados = useMemo<Achado[]>(() => {
    const lista: Achado[] = [];
    for (const n of lado?.notas ?? []) {
      lista.push({
        chave: n.chave,
        numero: n.numero,
        serie: n.serie,
        especie: n.especie,
        data: n.data,
        valor: n.valor,
        contraparte: n.contraparte,
        doc: n.doc,
        uf: n.uf,
        cfops: n.cfops ?? "",
        tipos: ["pendente"],
        detalhes: [{ tipo: "pendente", texto: "Nota sem lançamento contábil (origem FI)" }],
      });
    }
    for (const n of ladoDiv?.notas ?? []) {
      lista.push({
        chave: n.chave,
        numero: n.numero,
        serie: n.serie,
        especie: n.especie,
        data: n.data,
        valor: n.valor,
        contraparte: n.contraparte,
        doc: null,
        uf: null,
        cfops: n.cfops.join(", "),
        tipos: [...new Set(n.divergencias.map((d: Divergencia) => d.tipo))],
        detalhes: n.divergencias.map((d: Divergencia) => ({ tipo: d.tipo, texto: d.detalhe })),
      });
    }
    return lista.sort((a, b) => b.valor - a.valor);
  }, [lado, ladoDiv]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return achados.filter((a) => {
      if (filtro !== "todos" && !a.tipos.includes(filtro)) return false;
      if (!q) return true;
      return (
        String(a.numero).includes(q) ||
        (a.contraparte ?? "").toLowerCase().includes(q) ||
        a.cfops.includes(q)
      );
    });
  }, [achados, busca, filtro]);

  const contagem = useMemo(() => {
    const c = {} as Record<Problema, number>;
    for (const a of achados) for (const t of a.tipos) c[t] = (c[t] ?? 0) + 1;
    return c;
  }, [achados]);

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

  const exigemLancamento = (lado?.contabilizadas ?? 0) + (lado?.pendentes ?? 0);
  const conformes = ladoDiv?.conformes ?? 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Duas perguntas sobre as mesmas notas: foi contabilizada? e foi para a conta certa?
        </p>
        <SeletorTipo tipo={tipo} onTipo={setTipo} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {carregando || !lado ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)
        ) : (
          <>
            <Kpi
              rotulo={tipo === "ent" ? "Notas de entrada" : "Notas de saída"}
              icone={<FileText className="size-4 text-ent" />}
              corIcone="bg-ent/12"
              valor={num(lado.total)}
              secundario={
                lado.ignoradas > 0 ? `${num(lado.ignoradas)} não exigem lançamento` : "no período"
              }
            />
            <Kpi
              rotulo="Pendentes de lançamento"
              icone={<AlertTriangle className="size-4 text-critical" />}
              corIcone="bg-critical/12"
              valor={num(lado.pendentes)}
              secundario={`${brlCompact(lado.valorPendente)} a contabilizar`}
              alerta={lado.pendentes > 0}
            />
            <Kpi
              rotulo="Lançadas na conta errada"
              icone={<Truck className="size-4 text-warn" />}
              corIcone="bg-warn/12"
              valor={num(ladoDiv?.divergentes ?? 0)}
              secundario={`de ${num(ladoDiv?.analisadas ?? 0)} contabilizadas`}
              alerta={(ladoDiv?.divergentes ?? 0) > 0}
            />
            <Kpi
              rotulo="Corretas"
              icone={<ShieldCheck className="size-4 text-good" />}
              corIcone="bg-good/12"
              valor={num(conformes)}
              secundario={
                exigemLancamento > 0
                  ? `${((conformes / exigemLancamento) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do que exige lançamento`
                  : "—"
              }
            />
          </>
        )}
      </div>

      <section className="card anim-fade-up p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">O que precisa de atenção</h2>
            <p className="mt-0.5 text-xs text-muted">
              Notas não contabilizadas e notas contabilizadas fora do plano
              {(lado?.truncado || ladoDiv?.truncado) && " · truncado nas de maior valor"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(["todos", "pendente", "conta", "faltando", "valor", "natureza"] as const).map(
                (t) => {
                  const qtd = t === "todos" ? null : (contagem[t] ?? 0);
                  if (t !== "todos" && !qtd) return null;
                  return (
                    <button
                      key={t}
                      onClick={() => setFiltro(t)}
                      className={clsx(
                        "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                        filtro === t
                          ? "bg-ent/12 font-medium text-ent"
                          : "text-muted hover:bg-surface-2 hover:text-ink"
                      )}
                    >
                      {t === "todos" ? "Todos" : ROTULO[t]}
                      {qtd != null && <span className="ml-1 tabular-nums">{qtd}</span>}
                    </button>
                  );
                }
              )}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5">
              <Search className="size-4 text-muted" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nº, contraparte ou CFOP…"
                className="w-40 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
              />
            </div>
          </div>
        </header>

        {carregando ? (
          <div className="skeleton h-80 w-full" />
        ) : visiveis.length === 0 ? (
          <div className="grid h-32 place-items-center gap-2 text-center">
            <CheckCircle2 className="mx-auto size-6 text-good" />
            <p className="text-sm text-muted">
              {busca || filtro !== "todos"
                ? "Nenhuma nota encontrada com esse filtro"
                : "Nada pendente e nada fora do plano 🎉"}
            </p>
          </div>
        ) : (
          <div
            className={clsx(
              "max-h-[34rem] overflow-auto",
              (conf.isFetching || div.isFetching) && !carregando && "refetching"
            )}
          >
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-hairline text-xs text-muted">
                  <th className="py-2 pr-3 text-left font-medium">Nº / Data</th>
                  <th className="py-2 pr-3 text-left font-medium">
                    {tipo === "ent" ? "Fornecedor" : "Cliente"}
                  </th>
                  <th className="py-2 pr-3 text-left font-medium">Problema</th>
                  <th className="py-2 pl-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((a) => (
                  <tr
                    key={`${a.chave}-${a.tipos[0]}`}
                    className="border-b border-hairline/60 align-top last:border-0 hover:bg-surface-2/50"
                  >
                    <td className="py-3 pr-3 tabular-nums">
                      {num(a.numero)}
                      {a.serie && <span className="text-muted"> / {a.serie}</span>}
                      <span className="block text-[11px] text-muted">{dataBR(a.data)}</span>
                    </td>
                    <td className="max-w-[220px] py-3 pr-3">
                      <span className="block truncate text-ink" title={a.contraparte ?? ""}>
                        {a.contraparte ?? "—"}
                      </span>
                      <span className="text-[11px] text-muted">
                        {[a.especie, documento(a.doc), a.uf, a.cfops && `CFOP ${a.cfops}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <ul className="flex flex-col gap-1.5">
                        {a.detalhes.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span
                              className={clsx(
                                "mt-px shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                                COR[d.tipo]
                              )}
                            >
                              {ROTULO[d.tipo]}
                            </span>
                            <span className="text-xs text-ink-2">{d.texto}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3 pl-3 text-right font-semibold tabular-nums text-ink">
                      {brl(a.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="px-1 text-[11px] text-muted">
        &quot;Não exigem lançamento&quot; são operações que por CFOP não geram lançamento contábil
        (remessa, retorno, industrialização por encomenda). Nas contabilizadas, só é cobrado o que o
        Questor lança nota a nota: tributo apurado mensalmente (ICMS e IPI de saída) é contabilizado
        na apuração, não na nota. Valores só são conferidos em nota de CFOP único.
      </p>
    </>
  );
}
