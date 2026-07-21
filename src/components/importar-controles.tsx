"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { ContaDropdown } from "@/components/conta-dropdown";
import { DropzoneArquivo } from "@/components/dropzone-arquivo";
import { BotaoExecutar } from "@/components/filters/botao-executar";
import { useEstadoSecao } from "@/hooks/use-estado-secao";
import { useFiltros } from "@/hooks/use-filters";
import { resumir, type Ajustes, type Previa } from "@/lib/extrato-previa";
import { gerarLancamentos, type RegraExtrato } from "@/lib/regras-extrato";
import type { ContaBanco } from "@/lib/types";

/**
 * Controles da aba Importar, renderizados pelo shell NA LINHA da barra de
 * filtros, ao lado da empresa. Compartilham o estado da seção com a página
 * (conta, arquivo, prévia), então escolher aqui reflete lá na hora.
 *
 * Escolher o extrato NÃO processa — só guarda o arquivo. Quem processa é o
 * botão Executar ([[executar-com-botao]]): escolher é escolher, executar é
 * executar.
 */
export function ImportarControles() {
  const { filtros } = useFiltros();
  const empresa = filtros.empresas[0];
  const temEmpresa = filtros.empresas.length === 1;

  const [conta, setConta] = useEstadoSecao<number | null>("conta", null);
  const [arquivo, setArquivo] = useEstadoSecao<File | null>("arquivo", null);
  const [previa, setPrevia] = useEstadoSecao<Previa | null>("extrato", null);
  const [ajustes, setAjustes] = useEstadoSecao<Ajustes>("ajustes", {});
  const [enviando, setEnviando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [senha, setSenha] = useState("");

  const { data: cadastro } = useQuery({
    queryKey: ["extrato-regras", empresa, conta],
    queryFn: async () => {
      const res = await fetch(`/api/contabil/extrato-regras?empresa=${empresa}&conta=${conta}`);
      if (!res.ok) throw new Error("Falha ao carregar regras");
      return (await res.json()) as ContaBanco;
    },
    enabled: temEmpresa && conta != null,
  });

  async function executar() {
    if (conta == null || !arquivo) return;
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.set("arquivo", arquivo);
      fd.set("empresa", String(empresa));
      fd.set("conta", String(conta));
      if (senha) fd.set("senha", senha);
      const res = await fetch("/api/contabil/extrato-importar", { method: "POST", body: fd });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo?.error ?? "Falha ao ler o extrato");
      setPrevia(corpo as Previa);
      setAjustes({});
      toast.success(`${corpo.resumo.total} transações lidas`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao ler o extrato");
    } finally {
      setEnviando(false);
    }
  }

  /**
   * Reaplica as regras nas transações já lidas, sem precisar do arquivo de
   * novo — é o caminho depois de cadastrar o que faltava na aba Regras.
   */
  async function reaplicar() {
    if (!previa) return;
    setAtualizando(true);
    try {
      const res = await fetch(
        `/api/contabil/extrato-regras?empresa=${empresa}&conta=${previa.contaBanco.conta}`
      );
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo?.error ?? "Falha ao buscar as regras");

      const regras: RegraExtrato[] = (corpo as ContaBanco).regras.map((r) => ({
        id: r.id,
        termo: r.termo,
        termoOriginal: r.termoOriginal,
        tipo: r.tipo,
        contaPagamento: r.contaPagamento,
        contaRecebimento: r.contaRecebimento,
        historico: r.historico,
        ativo: r.ativo,
      }));

      // O sinal foi perdido no `valor` absoluto; volta a partir do sentido.
      const transacoes = previa.lancamentos.map((l) => ({
        data: l.data,
        descricao: l.descricao,
        valor: l.sentido === "recebimento" ? l.valor : -l.valor,
      }));

      const lancamentos = gerarLancamentos(transacoes, previa.contaBanco.conta, regras);
      setPrevia({ ...previa, lancamentos, resumo: resumir(lancamentos, ajustes) });
      toast.success(`Regras reaplicadas · ${resumir(lancamentos, ajustes).prontos} prontas`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar");
    } finally {
      setAtualizando(false);
    }
  }

  if (!temEmpresa) return null;

  // Já processou este arquivo? Então o botão fica neutro (reexecutar é opção).
  const pendenteDeExecucao = arquivo != null && previa?.arquivo !== arquivo.name;

  return (
    <>
      <ContaDropdown
        empresa={empresa}
        valor={conta}
        onMudar={(c) => {
          // Trocar de conta invalida a prévia — ela era da conta anterior.
          setConta(c);
          setPrevia(null);
          setAjustes({});
        }}
        soBanco
        placeholder="Conta de banco no plano"
      />

      <DropzoneArquivo
        aceita={[".ofx", ".qfx", ".pdf"]}
        onArquivo={setArquivo}
        desabilitado={conta == null}
        carregando={enviando}
        motivo={conta == null ? "Escolha a conta primeiro" : undefined}
        nomeArquivo={arquivo?.name}
      />

      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="senha do PDF, se protegido"
        className="h-9 w-44 rounded-lg border border-hairline bg-surface px-2.5 text-sm text-ink outline-none placeholder:text-muted"
      />

      <BotaoExecutar
        onClick={executar}
        dirty={pendenteDeExecucao}
        disabled={conta == null || !arquivo}
        executando={enviando}
        title={
          conta == null
            ? "Escolha a conta de banco"
            : !arquivo
              ? "Escolha o extrato"
              : undefined
        }
      />

      {previa && (
        <button
          onClick={reaplicar}
          disabled={atualizando}
          title="Reaplica as regras cadastradas nas transações já lidas"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-hairline px-3 text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          <RefreshCw className={clsx("size-3.5", atualizando && "animate-spin")} />
          Reaplicar regras
        </button>
      )}

      {conta != null && cadastro && cadastro.regras.length === 0 && (
        <p className="text-[11px] text-warn">Esta conta ainda não tem regras</p>
      )}
    </>
  );
}
