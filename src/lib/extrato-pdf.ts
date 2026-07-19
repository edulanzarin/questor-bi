import type { Transacao } from "./regras-extrato";
import type { ExtratoLido } from "./extrato-ofx";
import { acharConfig, lerTabular, type ResultadoTabular } from "./extrato-tabular";

/**
 * Leitor de extrato em PDF. Cada banco tem um layout próprio, então isto é um
 * conjunto de leitores registrados — o texto é extraído uma vez e o primeiro
 * leitor que reconhecer o formato assume.
 *
 * O texto precisa vir de `pdftotext -layout`, que preserva as colunas; sem o
 * `-layout` as colunas viram uma sopa e não dá para separar valor de descrição.
 */

const MESES: Record<string, string> = {
  JAN: "01", FEV: "02", MAR: "03", ABR: "04", MAI: "05", JUN: "06",
  JUL: "07", AGO: "08", SET: "09", OUT: "10", NOV: "11", DEZ: "12",
};

/** "1.618,22" → 1618.22 */
function valorBR(texto: string): number | null {
  const limpo = texto.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

const RE_VALOR = /^[\d.]+,\d{2}$/;
/** "03 FEV 2025" no começo da linha. */
const RE_DIA = /^(\d{2})\s+([A-Z]{3})\s+(\d{4})\b/;
const RE_GRUPO = /Total de (entradas|sa[ií]das)/i;

export interface LeitorPdf {
  banco: string;
  /** Reconhece o extrato pelo texto extraído. */
  reconhece: (texto: string) => boolean;
  ler: (texto: string) => ExtratoLido;
}

/**
 * Nubank (NU PAGAMENTOS). Layout:
 *
 *   03 FEV 2025    Total de entradas                          + 1.735,02
 *                  Transferência Recebida                        116,80
 *                  Total de saídas                            - 623,11
 *                  Transferência enviada pelo Pix  HAVAN ...     450,00
 *                                                  continuação da descrição
 *
 * Dois detalhes que definem a leitura: a data só aparece no cabeçalho do dia
 * (as transações abaixo herdam), e **o sinal vem do grupo**, não da linha — um
 * mesmo dia pode ter um bloco de entradas e outro de saídas.
 */
export const nubank: LeitorPdf = {
  banco: "Nubank",
  reconhece: (t) => /NU PAGAMENTOS|nubank/i.test(t),

  ler(texto) {
    const transacoes: Transacao[] = [];
    let dia: string | null = null;
    let sinal = -1;
    // Para grudar as linhas de continuação na descrição da transação anterior.
    let ultima: Transacao | null = null;

    for (const linha of texto.split("\n")) {
      if (!linha.trim()) continue;

      const mDia = linha.match(RE_DIA);
      if (mDia) {
        const mes = MESES[mDia[2].toUpperCase()];
        dia = mes ? `${mDia[3]}-${mes}-${mDia[1]}` : dia;
      }

      const mGrupo = linha.match(RE_GRUPO);
      if (mGrupo) {
        sinal = /entrada/i.test(mGrupo[1]) ? 1 : -1;
        ultima = null;
        continue;
      }
      if (!dia) continue;

      // Transações e continuações são indentadas; texto na coluna 1 é rodapé
      // ("Tem alguma dúvida?…", ouvidoria) e não pode grudar na descrição.
      if (!/^\s{6}/.test(linha)) {
        ultima = null;
        continue;
      }

      // Colunas do -layout são separadas por 2+ espaços.
      const campos = linha.trim().split(/\s{2,}/).filter(Boolean);
      const fim = campos[campos.length - 1];

      if (campos.length >= 2 && RE_VALOR.test(fim)) {
        const valor = valorBR(fim);
        if (valor == null) continue;
        // [tipo, descrição, valor] ou [tipo, valor] quando não há descrição.
        const partes = campos.slice(0, -1);
        const descricao = partes.join(" - ").replace(/\s+/g, " ").trim();
        ultima = { data: dia, descricao, valor: sinal * Math.abs(valor) };
        transacoes.push(ultima);
        continue;
      }

      // Linha sem valor logo depois de uma transação: continuação da descrição.
      if (ultima && campos.length === 1) {
        ultima.descricao = `${ultima.descricao} ${campos[0]}`.replace(/\s+/g, " ").trim();
      }
    }

    const conta = texto.match(/Conta\s*\n?\s*([\d-]{6,})/)?.[1] ?? null;
    const agencia = texto.match(/Ag[êe]ncia\s+(\d{3,4})/)?.[1] ?? null;
    const datas = transacoes.map((t) => t.data).sort();

    return {
      transacoes,
      banco: "Nubank",
      agencia,
      conta,
      inicio: datas[0] ?? null,
      fim: datas[datas.length - 1] ?? null,
    };
  },
};

/** Leitores de layout próprio, que não cabem no motor tabular. */
export const LEITORES: LeitorPdf[] = [nubank];

export class PdfNaoReconhecido extends Error {}

export interface PdfLido extends ExtratoLido {
  /** Cadeia de saldos fechou — só quando o extrato traz saldo corrente. */
  saldoConfere?: boolean | null;
}

/**
 * Escolhe o leitor: primeiro os de layout próprio, depois o motor tabular, que
 * cobre a maioria dos bancos por configuração em vez de código.
 */
export function lerPdf(texto: string): PdfLido {
  const proprio = LEITORES.find((l) => l.reconhece(texto));
  if (proprio) return proprio.ler(texto);

  const cfg = acharConfig(texto);
  if (cfg) {
    const r: ResultadoTabular = lerTabular(texto, cfg);
    return r;
  }

  throw new PdfNaoReconhecido(
    "Não reconheci o banco deste PDF. Se o extrato tiver OFX, use o OFX — é padrão e funciona com qualquer banco."
  );
}

/** O PDF está protegido por senha? A tela usa isto para pedir a senha. */
export function exigeSenha(texto: string): boolean {
  return acharConfig(texto)?.exigeSenha ?? false;
}
