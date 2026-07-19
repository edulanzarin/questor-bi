import type { SecaoFiscal } from "./fiscal-secoes";

/** Seções do módulo Contábil (mesma forma das do Fiscal). */
export const SECOES_CONTABIL: SecaoFiscal[] = [
  {
    id: "conferencia",
    rotulo: "Conferência Fiscal",
    path: "/contabil/conferencia",
    metrica: false,
    descricao: "Notas pendentes de contabilização",
  },
  {
    id: "contas",
    rotulo: "Conferência de Contas",
    path: "/contabil/contas",
    metrica: false,
    descricao: "Notas contabilizadas na conta errada",
  },
  {
    id: "configuracao",
    rotulo: "Configuração",
    path: "/contabil/configuracao",
    metrica: false,
    descricao: "Plano de contabilização por CFOP",
  },
];

export function secaoContabilAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_CONTABIL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
