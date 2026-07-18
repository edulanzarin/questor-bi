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
    descricao: "Visão geral do período",
  },
  {
    id: "impostos",
    rotulo: "Impostos",
    path: "/fiscal/impostos",
    metrica: false,
    descricao: "Tributos e retenções",
  },
  {
    id: "analises",
    rotulo: "Análises",
    path: "/fiscal/analises",
    metrica: true,
    descricao: "Rankings e distribuições",
  },
  {
    id: "devolucoes",
    rotulo: "Devoluções",
    path: "/fiscal/devolucoes",
    metrica: true,
    descricao: "Compras e vendas devolvidas",
  },
  {
    id: "cancelamentos",
    rotulo: "Cancelamentos",
    path: "/fiscal/cancelamentos",
    metrica: false,
    descricao: "Notas canceladas e taxa",
  },
  {
    id: "apuracao",
    rotulo: "Apuração",
    path: "/fiscal/apuracao",
    metrica: false,
    descricao: "Débito × crédito de impostos",
  },
  {
    id: "notas",
    rotulo: "Notas fiscais",
    path: "/fiscal/notas",
    metrica: false,
    descricao: "Explorador de documentos",
  },
];

export function secaoAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_FISCAL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
