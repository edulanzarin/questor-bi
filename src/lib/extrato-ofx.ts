import type { Transacao } from "./regras-extrato";

/**
 * Leitor de OFX 1.x (SGML) e 2.x (XML).
 *
 * O OFX 1.x brasileiro é SGML: as tags de folha às vezes vêm fechadas
 * (`<TRNAMT>-14.47</TRNAMT>`, como o Nubank faz) e às vezes não
 * (`<TRNAMT>-14.47` até a próxima tag). A extração abaixo aceita os dois, em
 * vez de assumir XML bem formado e quebrar com metade dos bancos.
 */

export interface ExtratoLido {
  transacoes: Transacao[];
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  inicio: string | null;
  fim: string | null;
}

/** Valor de uma tag de folha, com ou sem fechamento. */
function tag(bloco: string, nome: string): string | null {
  const re = new RegExp(`<${nome}>\\s*([^<\\r\\n]*)`, "i");
  const m = bloco.match(re);
  const v = m?.[1]?.trim();
  return v ? v : null;
}

/** OFX data: YYYYMMDD[HHMMSS][fuso] → YYYY-MM-DD. */
function data(bruto: string | null): string | null {
  if (!bruto) return null;
  const m = bruto.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export function lerOfx(conteudo: string): ExtratoLido {
  const texto = conteudo.replace(/\r\n?/g, "\n");

  const transacoes: Transacao[] = [];
  // Cada <STMTTRN> é uma transação; o fechamento pode faltar no SGML, então o
  // bloco termina no próximo STMTTRN ou no fim da lista.
  const blocos = texto.split(/<STMTTRN>/i).slice(1);

  for (const bruto of blocos) {
    const bloco = bruto.split(/<\/BANKTRANLIST>|<\/STMTTRN>/i)[0];
    const dt = data(tag(bloco, "DTPOSTED"));
    const valorTexto = tag(bloco, "TRNAMT");
    if (!dt || !valorTexto) continue;

    // Alguns bancos usam vírgula decimal mesmo em OFX.
    const valor = Number(valorTexto.replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
    if (!Number.isFinite(valor)) continue;

    const memo = tag(bloco, "MEMO") ?? tag(bloco, "NAME") ?? "";
    transacoes.push({ data: dt, descricao: memo.replace(/\s+/g, " ").trim(), valor });
  }

  return {
    transacoes,
    banco: tag(texto, "ORG") ?? tag(texto, "BANKID"),
    agencia: tag(texto, "BRANCHID"),
    conta: tag(texto, "ACCTID"),
    inicio: data(tag(texto, "DTSTART")),
    fim: data(tag(texto, "DTEND")),
  };
}
