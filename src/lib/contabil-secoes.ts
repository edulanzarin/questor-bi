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
  {
    id: "extratos",
    rotulo: "Extratos",
    path: "/contabil/extratos",
    metrica: false,
    descricao: "Extrato bancário → lançamentos",
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

/**
 * Telas de cadastro são fixas por empresa e não têm recorte de tempo — mostrar
 * um seletor de período nelas sugeriria que a regra vale só naquele mês.
 */
const SEM_PERIODO = ["/contabil/configuracao", "/contabil/extratos"];

export function abaUsaPeriodo(pathname: string): boolean {
  return !SEM_PERIODO.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function abaConferenciaAtual(pathname: string): AbaConferencia | undefined {
  return ABAS_CONFERENCIA.find((a) => pathname === a.path || pathname.startsWith(a.path + "/"));
}

export function secaoContabilAtual(pathname: string): SecaoFiscal | undefined {
  // Todas as abas da conferência pertencem à mesma seção.
  if (abaConferenciaAtual(pathname)) return SECOES_CONTABIL[0];
  return SECOES_CONTABIL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
