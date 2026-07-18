/** Seções do módulo Fiscal — dirigem a sidebar, o header e a visibilidade da métrica. */
export interface SecaoFiscal {
  id: string;
  rotulo: string;
  path: string;
  /** Se o toggle Valor|Quantidade faz sentido nessa seção. */
  metrica: boolean;
  descricao: string;
}

export const SECOES_FISCAL: SecaoFiscal[] = [
  {
    id: "painel",
    rotulo: "Painel",
    path: "/fiscal/painel",
    metrica: true,
    descricao: "Movimentação da empresa",
  },
  {
    id: "analises",
    rotulo: "Análises",
    path: "/fiscal/analises",
    metrica: false,
    descricao: "Todas as notas, com filtros",
  },
];

export function secaoAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_FISCAL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
