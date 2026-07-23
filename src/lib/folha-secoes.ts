import { Repeat } from "lucide-react";
import type { SecaoFiscal } from "./fiscal-secoes";

/**
 * Seções do módulo Folha. Mesmo recorte `SecaoFiscal` do Fiscal (uma seção =
 * um item de sidebar); a Folha começa com uma tela só — Rotatividade —, então
 * não precisa do aparato de abas do Contábil. Seção nova é uma entrada aqui.
 *
 * `metrica` (toggle Valor|Quantidade) não existe na Folha, mas o campo é do tipo
 * compartilhado — fica `false`.
 */
export const SECOES_FOLHA: SecaoFiscal[] = [
  {
    id: "rotatividade",
    icone: Repeat,
    rotulo: "Rotatividade",
    path: "/folha/rotatividade",
    metrica: false,
    descricao: "Turnover: admissões e desligamentos sobre o efetivo",
  },
];

export function secaoFolhaAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_FOLHA.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
