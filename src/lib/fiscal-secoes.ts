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
    descricao: "Resumo da movimentação",
  },
  {
    id: "analises",
    rotulo: "Análises",
    path: "/fiscal/analises",
    metrica: true,
    descricao: "Rankings e distribuições",
  },
  {
    id: "tributos",
    rotulo: "Tributos",
    path: "/fiscal/tributos",
    metrica: false,
    descricao: "Carga, DIFAL e regime (CST)",
  },
  {
    id: "recebiveis",
    rotulo: "Recebíveis",
    path: "/fiscal/recebiveis",
    metrica: false,
    descricao: "Duplicatas e meios de pagamento",
  },
  {
    id: "produtividade",
    rotulo: "Produtividade",
    path: "/fiscal/produtividade",
    metrica: false,
    descricao: "Quanto cada colaborador lançou",
  },
  {
    id: "conformidade",
    rotulo: "Conformidade",
    path: "/fiscal/conformidade",
    metrica: false,
    descricao: "Pendências e saúde fiscal",
  },
  {
    id: "dados",
    rotulo: "Dados",
    path: "/fiscal/dados",
    metrica: false,
    descricao: "Todas as notas, com filtros",
  },
];

export function secaoAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_FISCAL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
