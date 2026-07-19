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

export const ABAS_EXTRATOS: AbaConferencia[] = [
  {
    id: "regras",
    rotulo: "Regras",
    path: "/contabil/extratos",
    descricao: "Contrapartida de cada descrição do extrato",
  },
  {
    id: "importar",
    rotulo: "Importar",
    path: "/contabil/extratos/importar",
    descricao: "Ler OFX ou PDF e gerar os lançamentos",
  },
];

/** Abas da seção a que o caminho pertence — vazio quando a seção não tem. */
export function abasDaSecao(pathname: string): AbaConferencia[] {
  if (pathname.startsWith("/contabil/extratos")) return ABAS_EXTRATOS;
  if (ABAS_CONFERENCIA.some((a) => pathname === a.path)) return ABAS_CONFERENCIA;
  return [];
}

export function abaConferenciaAtual(pathname: string): AbaConferencia | undefined {
  // A mais específica primeiro: /extratos/importar antes de /extratos.
  return [...ABAS_CONFERENCIA, ...ABAS_EXTRATOS]
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find((a) => pathname === a.path || pathname.startsWith(a.path + "/"));
}

export function secaoContabilAtual(pathname: string): SecaoFiscal | undefined {
  // Todas as abas da conferência pertencem à mesma seção.
  if (abaConferenciaAtual(pathname)) return SECOES_CONTABIL[0];
  return SECOES_CONTABIL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
