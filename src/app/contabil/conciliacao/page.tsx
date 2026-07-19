"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileUp,
  Landmark,
} from "lucide-react";
import clsx from "clsx";
import { Dropdown, ItemLista } from "@/components/ui/dropdown";
import { DropzoneArquivo } from "@/components/dropzone-arquivo";
import { Kpi } from "@/components/kpi-conf";
import { useFiltros } from "@/hooks/use-filters";
import { brl, dataBR, num } from "@/lib/format";
import type { ContaBanco } from "@/lib/types";
import type { LancamentoGerado } from "@/lib/regras-extrato";

interface Previa {
  arquivo: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  inicio: string | null;
  fim: string | null;
  contaBanco: { conta: number; descricao: string | null; apelido: string | null };
  resumo: {
    total: number;
    prontos: number;
    semRegra: number;
    semConta: number;
    ambiguos: number;
    entradas: number;
    saidas: number;
  };
  lancamentos: LancamentoGerado[];
}

type Filtro = "todos" | "prontos" | "pendentes";

export default function ImportarPage() {
  const { filtros } = useFiltros();
  const empresa = filtros.empresas[0];
  const temEmpresa = filtros.empresas.length === 1;

  const [contaBanco, setContaBanco] = useState<ContaBanco | null>(null);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const { data: contas } = useQuery({
    queryKey: ["extrato-regras", empresa],
    queryFn: async () => {
      const res = await fetch(`/api/contabil/extrato-regras?empresa=${empresa}`);
      if (!res.ok) throw new Error("Falha ao carregar contas");
      return (await res.json()) as ContaBanco[];
    },
    enabled: temEmpresa,
  });

  async function enviar(arquivo: File) {
    if (!contaBanco) return toast.error("Escolha a conta de banco antes");
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.set("arquivo", arquivo);
      fd.set("empresa", String(empresa));
      fd.set("contaBancoId", String(contaBanco.id));
      const res = await fetch("/api/contabil/extrato-importar", { method: "POST", body: fd });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo?.error ?? "Falha ao ler o extrato");
      setPrevia(corpo as Previa);
      toast.success(`${corpo.resumo.total} transações lidas`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao ler o extrato");
    } finally {
      setEnviando(false);
    }
  }

  if (!temEmpresa) {
    return (
      <section className="card grid place-items-center gap-3 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-ent/12 text-ent">
          <Building2 className="size-6" />
        </span>
        <p className="text-sm font-medium text-ink">Selecione uma empresa</p>
        <p className="max-w-md text-xs text-muted">
          Escolha a empresa no filtro acima para importar o extrato dela.
        </p>
      </section>
    );
  }

  const visiveis = (previa?.lancamentos ?? []).filter((l) =>
    filtro === "todos" ? true : filtro === "prontos" ? !l.pendencia : !!l.pendencia
  );

  return (
    <>
      <section className="card anim-fade-up flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-ink-2">Conta de banco</label>
            <Dropdown
              icone={<Landmark className="size-4" />}
              rotulo={
                contaBanco
                  ? `${contaBanco.conta} · ${contaBanco.apelido || contaBanco.descricao}`
                  : "Escolher conta"
              }
              ativo={!!contaBanco}
              largura="w-80"
            >
              {(fechar) => (
                <div className="max-h-72 overflow-y-auto py-1">
                  {!contas?.length && (
                    <p className="px-3 py-2 text-sm text-muted">
                      Nenhuma conta cadastrada — cadastre na aba Regras.
                    </p>
                  )}
                  {contas?.map((c) => (
                    <ItemLista
                      key={c.id}
                      selecionado={c.id === contaBanco?.id}
                      onClick={() => {
                        setContaBanco(c);
                        setPrevia(null);
                        fechar();
                      }}
                    >
                      <span className="tnum w-14 shrink-0 text-xs text-muted">{c.conta}</span>
                      <span className="flex-1 truncate">{c.apelido || c.descricao}</span>
                      <span className="shrink-0 text-[11px] text-muted">
                        {c.regras.length} regras
                      </span>
                    </ItemLista>
                  ))}
                </div>
              )}
            </Dropdown>
          </div>
          <p className="max-w-sm text-[11px] text-muted">
            OFX de qualquer banco. PDF só do Nubank por enquanto — e precisa ser o arquivo
            original, não digitalizado.
          </p>
        </div>

        <DropzoneArquivo
          aceita={[".ofx", ".qfx", ".pdf"]}
          onArquivo={enviar}
          desabilitado={!contaBanco}
          carregando={enviando}
          motivo={!contaBanco ? "Escolha a conta de banco para enviar o extrato" : undefined}
        />
      </section>

      {!previa ? (
        <section className="card grid place-items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
            <FileUp className="size-6" />
          </span>
          <p className="text-sm font-medium text-ink">Nenhum extrato carregado</p>
          <p className="max-w-md text-xs text-muted">
            Escolha a conta de banco e envie o OFX ou PDF. Nada é gravado: isto é uma prévia dos
            lançamentos para conferir antes de exportar.
          </p>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              rotulo="Transações lidas"
              icone={<FileUp className="size-4 text-ent" />}
              corIcone="bg-ent/12"
              valor={num(previa.resumo.total)}
              secundario={
                previa.inicio && previa.fim
                  ? `${dataBR(previa.inicio)} – ${dataBR(previa.fim)}`
                  : (previa.banco ?? "")
              }
            />
            <Kpi
              rotulo="Prontas para lançar"
              icone={<CheckCircle2 className="size-4 text-good" />}
              corIcone="bg-good/12"
              valor={num(previa.resumo.prontos)}
              secundario={`${((previa.resumo.prontos / previa.resumo.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do extrato`}
            />
            <Kpi
              rotulo="Sem regra"
              icone={<AlertTriangle className="size-4 text-warn" />}
              corIcone="bg-warn/12"
              valor={num(previa.resumo.semRegra + previa.resumo.semConta)}
              secundario={
                previa.resumo.semConta > 0
                  ? `${num(previa.resumo.semConta)} com regra mas sem conta no sentido`
                  : "descrições ainda não cadastradas"
              }
              alerta={previa.resumo.semRegra + previa.resumo.semConta > 0}
            />
            <Kpi
              rotulo="Movimento"
              icone={<Landmark className="size-4 text-ink-2" />}
              corIcone="bg-surface-2"
              valor={brl(previa.resumo.entradas + previa.resumo.saidas)}
              secundario={`${brl(previa.resumo.entradas)} entradas · ${brl(Math.abs(previa.resumo.saidas))} saídas`}
            />
          </div>

          <section className="card anim-fade-up p-5">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Lançamentos gerados</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {previa.arquivo}
                  {previa.banco ? ` · ${previa.banco}` : ""} · banco na conta{" "}
                  {previa.contaBanco.conta}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {(["todos", "prontos", "pendentes"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={clsx(
                      "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      filtro === f
                        ? "bg-ent/12 font-medium text-ent"
                        : "text-muted hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    {f === "todos" ? "Todos" : f === "prontos" ? "Prontos" : "Pendentes"}
                  </button>
                ))}
              </div>
            </header>

            <div className="max-h-[32rem] overflow-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-surface">
                  <tr className="border-b border-hairline text-xs text-muted">
                    <th className="py-2 pr-3 text-left font-medium">Data</th>
                    <th className="py-2 pr-3 text-left font-medium">Descrição no extrato</th>
                    <th className="py-2 pr-3 text-left font-medium">Débito</th>
                    <th className="py-2 pr-3 text-left font-medium">Crédito</th>
                    <th className="py-2 pl-3 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((l, i) => (
                    <tr
                      key={i}
                      className="border-b border-hairline/60 align-top last:border-0 hover:bg-surface-2/50"
                    >
                      <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-ink-2">
                        {dataBR(l.data)}
                      </td>
                      <td className="max-w-[380px] py-2.5 pr-3">
                        <span className="block truncate text-ink" title={l.descricao}>
                          {l.descricao}
                        </span>
                        {l.pendencia && (
                          <span className="mt-0.5 inline-block rounded bg-warn/12 px-1.5 py-0.5 text-[10px] font-medium text-warn">
                            {l.pendencia === "sem_regra"
                              ? "Sem regra cadastrada"
                              : `Regra não define conta para ${l.sentido}`}
                          </span>
                        )}
                        {l.ambiguo && (
                          <span className="ml-1 mt-0.5 inline-block rounded bg-sai/12 px-1.5 py-0.5 text-[10px] font-medium text-sai">
                            Duas regras empataram
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {l.contaDebito ?? <span className="text-muted">—</span>}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {l.contaCredito ?? <span className="text-muted">—</span>}
                      </td>
                      <td
                        className={clsx(
                          "py-2.5 pl-3 text-right font-semibold tabular-nums",
                          l.sentido === "recebimento" ? "text-good" : "text-ink"
                        )}
                      >
                        {l.sentido === "recebimento" ? "+" : "−"} {brl(l.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="px-1 text-[11px] text-muted">
            Recebimento debita a conta do banco e credita a contrapartida; pagamento faz o inverso.
            As pendentes ficam de fora do arquivo final — cadastre a descrição na aba Regras e
            envie o extrato de novo. A exportação para o Questor entra quando o formato do arquivo
            estiver confirmado.
          </p>
        </>
      )}
    </>
  );
}
