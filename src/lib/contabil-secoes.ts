import type { SecaoFiscal } from "./fiscal-secoes";

/** Seções do módulo Contábil (mesma forma das do Fiscal). */
export const SECOES_CONTABIL: SecaoFiscal[] = [
  {
    id: "conferencia",
    rotulo: "Conferência Fiscal",
    path: "/contabil/conferencia",
    metrica: false,
    descricao: "Notas fiscais × contabilidade",
  },
];

/**
 * A Conferência Fiscal é uma coisa só, vista de três ângulos — por isso são
 * abas dentro da seção, e não itens separados na sidebar: as três compartilham
 * o mesmo filtro (uma empresa + período) e se lêem em sequência (o que falta
 * lançar → o que foi lançado errado → a regra que define o certo).
 */
export interface AbaConferencia {
  id: string;
  rotulo: string;
  path: string;
  descricao: string;
}

export const ABAS_CONFERENCIA: AbaConferencia[] = [
  {
    id: "conferencia",
    rotulo: "Conferência",
    path: "/contabil/conferencia",
    descricao: "Notas não contabilizadas e notas na conta errada",
  },
  {
    id: "configuracao",
    rotulo: "Configuração",
    path: "/contabil/configuracao",
    descricao: "Plano de contabilização por CFOP — vale para a empresa toda",
  },
];

/** A Configuração é fixa por empresa: não depende do período selecionado. */
export function abaUsaPeriodo(pathname: string): boolean {
  return abaConferenciaAtual(pathname)?.id !== "configuracao";
}

export function abaConferenciaAtual(pathname: string): AbaConferencia | undefined {
  return ABAS_CONFERENCIA.find((a) => pathname === a.path || pathname.startsWith(a.path + "/"));
}

export function secaoContabilAtual(pathname: string): SecaoFiscal | undefined {
  // Todas as abas da conferência pertencem à mesma seção.
  if (abaConferenciaAtual(pathname)) return SECOES_CONTABIL[0];
  return SECOES_CONTABIL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
