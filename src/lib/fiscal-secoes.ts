import {
  Coins,
  Gauge,
  LayoutDashboard,
  ShieldCheck,
  Table2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** Seções do módulo Fiscal — dirigem a sidebar, o header e a visibilidade da métrica. */
export interface SecaoFiscal {
  id: string;
  rotulo: string;
  path: string;
  /** Se o toggle Valor|Quantidade faz sentido nessa seção. */
  metrica: boolean;
  descricao: string;
  /**
   * Ícone da sidebar. Fica aqui, e não num mapa à parte por id, para o
   * TypeScript cobrar um ícone de toda seção nova — num mapa, esquecer passa
   * despercebido e a seção aparece sem ícone no meio das outras.
   */
  icone: LucideIcon;
}

export const SECOES_FISCAL: SecaoFiscal[] = [
  {
    id: "painel",
    icone: LayoutDashboard,
    rotulo: "Painel",
    path: "/fiscal/painel",
    metrica: true,
    descricao: "Resumo da movimentação",
  },
  {
    id: "analises",
    icone: TrendingUp,
    rotulo: "Análises",
    path: "/fiscal/analises",
    metrica: true,
    descricao: "Rankings e distribuições",
  },
  {
    id: "tributos",
    icone: Coins,
    rotulo: "Tributos",
    path: "/fiscal/tributos",
    metrica: false,
    descricao: "Carga, DIFAL e regime (CST)",
  },
  {
    id: "produtividade",
    icone: Gauge,
    rotulo: "Produtividade",
    path: "/fiscal/produtividade",
    metrica: false,
    descricao: "Quanto cada colaborador lançou",
  },
  {
    id: "conformidade",
    icone: ShieldCheck,
    rotulo: "Conformidade",
    path: "/fiscal/conformidade",
    metrica: false,
    descricao: "Pendências e saúde fiscal",
  },
  {
    id: "dados",
    icone: Table2,
    rotulo: "Dados",
    path: "/fiscal/dados",
    metrica: false,
    descricao: "Todas as notas, com filtros",
  },
];

export function secaoAtual(pathname: string): SecaoFiscal | undefined {
  return SECOES_FISCAL.find((s) => pathname === s.path || pathname.startsWith(s.path + "/"));
}
