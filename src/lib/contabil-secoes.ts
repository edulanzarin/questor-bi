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
];

export function secaoContabilAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_CONTABIL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
