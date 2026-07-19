import { ClipboardCheck, Landmark } from "lucide-react";
import type { SecaoFiscal } from "./fiscal-secoes";

/**
 * Uma aba dentro de uma seção. Vira aba, e não item de sidebar, quando as telas
 * são ângulos do mesmo trabalho e compartilham o filtro.
 */
export interface AbaContabil {
  id: string;
  rotulo: string;
  path: string;
  descricao: string;
  /** Cadastro fixo por empresa: sem recorte de tempo. */
  semPeriodo?: boolean;
}

export interface SecaoContabil extends SecaoFiscal {
  abas: AbaContabil[];
}

/**
 * Seções do módulo Contábil. Cada seção é um assunto próprio — a aba pertence à
 * seção pelo `abas`, não por prefixo de caminho, porque nem toda aba mora sob o
 * caminho da seção (a Configuração do plano de contabilização, por exemplo).
 */
export const SECOES_CONTABIL: SecaoContabil[] = [
  {
    id: "conferencia",
    rotulo: "Conferência Fiscal",
    icone: ClipboardCheck,
    path: "/contabil/conferencia",
    metrica: false,
    descricao: "Notas fiscais × contabilidade",
    abas: [
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
        semPeriodo: true,
      },
    ],
  },
  {
    id: "conciliacao",
    rotulo: "Conciliação",
    icone: Landmark,
    path: "/contabil/conciliacao",
    metrica: false,
    descricao: "Extrato bancário → lançamentos",
    // Importar primeiro: é o que se faz no dia a dia. As regras são cadastro,
    // mexidas de vez em quando — por isso a raiz da seção é a importação.
    abas: [
      {
        id: "importar",
        rotulo: "Importar",
        path: "/contabil/conciliacao",
        descricao: "Ler OFX ou PDF e gerar os lançamentos",
        semPeriodo: true,
      },
      {
        id: "regras",
        rotulo: "Regras",
        path: "/contabil/conciliacao/regras",
        descricao: "Contrapartida de cada descrição do extrato",
        semPeriodo: true,
      },
    ],
  },
];

const TODAS_ABAS: { aba: AbaContabil; secao: SecaoContabil }[] = SECOES_CONTABIL.flatMap((secao) =>
  secao.abas.map((aba) => ({ aba, secao }))
)
  // Mais específica primeiro: /conciliacao/regras antes de /conciliacao.
  .sort((a, b) => b.aba.path.length - a.aba.path.length);

function casar(pathname: string) {
  return TODAS_ABAS.find(
    ({ aba }) => pathname === aba.path || pathname.startsWith(aba.path + "/")
  );
}

export function abaContabilAtual(pathname: string): AbaContabil | undefined {
  return casar(pathname)?.aba;
}

export function secaoContabilAtual(pathname: string): SecaoContabil | undefined {
  return casar(pathname)?.secao;
}

/** Abas da seção a que o caminho pertence — vazio quando não pertence a nenhuma. */
export function abasDaSecao(pathname: string): AbaContabil[] {
  return casar(pathname)?.secao.abas ?? [];
}

/**
 * Mostrar seletor de período numa tela de cadastro sugeriria que a regra vale
 * só naquele mês, o que não é verdade.
 */
export function abaUsaPeriodo(pathname: string): boolean {
  return !casar(pathname)?.aba.semPeriodo;
}
