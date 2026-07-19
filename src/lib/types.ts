export interface Empresa {
  codigo: number;
  nome: string;
}

/** Grupo de empresas criado pelo usuário, salvo no navegador. */
export interface GrupoLocal {
  id: string;
  nome: string;
  empresas: number[];
}

export type Metrica = "valor" | "qtd";

export interface LadoResumo {
  valor: number;
  qtd: number;
  canceladas: number;
  valorAnterior: number;
  qtdAnterior: number;
}

export interface Overview {
  entradas: LadoResumo;
  saidas: LadoResumo;
  empresasAtivas: number;
  empresasAtivasAnterior: number;
}

export interface PontoSerie {
  bucket: string;
  entradas: number;
  saidas: number;
  qtdEntradas: number;
  qtdSaidas: number;
}

export interface Timeseries {
  granularidade: "dia" | "mes";
  pontos: PontoSerie[];
}

export interface EspecieResumo {
  especie: string;
  entradas: number;
  saidas: number;
  qtd: number;
}

export interface TopItem {
  codigo: number;
  nome: string;
  valor: number;
  qtd: number;
  /** Linha extra no tooltip (empresa do produto, descrição do CFOP…) */
  detalhe?: string | null;
}

export interface EstadoResumo {
  uf: string;
  nome: string | null;
  valor: number;
  qtd: number;
}

export interface ProdutoTop {
  codigoEmpresa: number;
  codigoProduto: number;
  descricao: string | null;
  unidade: string | null;
  nomeEmpresa: string | null;
  valor: number;
  qtd: number;
}

export interface CfopResumo {
  cfop: number;
  descricao: string | null;
  valor: number;
  itens: number;
}

export interface Impostos {
  // Impostos destacados nos itens
  icms: number;
  ipi: number;
  st: number;
  iss: number;
  // PIS/COFINS (tabela própria)
  pis: number;
  cofins: number;
  // Retenções (notas de serviço)
  irrf: number;
  inss: number;
  csll: number;
  issqn: number;
  // Interestadual / rural (só saídas)
  difal: number;
  fcp: number;
  funrural: number;
  // Base
  totalItens: number;
}

export interface PontoImposto {
  bucket: string;
  icms: number;
  st: number;
  ipi: number;
  iss: number;
  pis: number;
  cofins: number;
}

export interface ImpostosSerie {
  granularidade: "dia" | "mes";
  pontos: PontoImposto[];
}

export interface LadoQtdValor {
  valor: number;
  qtd: number;
}

export interface DevolucoesResumo {
  /** Devolução de venda — entra como nota de entrada. */
  ent: LadoQtdValor;
  /** Devolução de compra — sai como nota de saída. */
  sai: LadoQtdValor;
  faturamentoEnt: number;
  faturamentoSai: number;
}

export interface CancelamentosResumo {
  ent: { canceladas: number; total: number };
  sai: { canceladas: number; total: number };
}

export interface PontoValorSerie {
  granularidade: "dia" | "mes";
  pontos: { bucket: string; valor: number }[];
}

/** Contraparte no filtro de busca (server-side) do explorador. */
export interface ContraparteBusca {
  codigo: number;
  nome: string;
  doc: string | null;
  uf: string | null;
  qtd: number;
}

export interface ContrapartesResp {
  rows: ContraparteBusca[];
  page: number;
  temMais: boolean;
}

/** Uma nota fiscal na listagem bruta (explorador de dados). */
export interface NotaLista {
  empresa: number;
  empresaNome: string | null;
  chave: string;
  numero: number;
  serie: string | null;
  especie: string;
  modelo: string | null;
  data: string;
  contraparte: string | null;
  contraparteDoc: string | null;
  uf: string | null;
  valor: number;
  cancelada: boolean;
  chaveNfe: string | null;
}

export interface NotasListaResp {
  rows: NotaLista[];
  total: number;
  page: number;
  pageSize: number;
}

/** Produtividade: um colaborador (usuário do Questor) e o que ele lançou no período. */
export interface ColaboradorProd {
  codigo: number;
  nome: string;
  /** codigousuario 0 = ADMINISTRADOR/sistema (importações automáticas). */
  auto: boolean;
  /** Usuário com data de baixa (desligado/inativo no Questor). */
  inativo: boolean;
  notasEnt: number;
  notasSai: number;
  notas: number;
  valorEnt: number;
  valorSai: number;
  valor: number;
  /** Notas canceladas lançadas por ele (indicador de qualidade). */
  canceladas: number;
  /** Empresas distintas atendidas. */
  empresas: number;
}

export interface ProdutividadeSerie {
  granularidade: "dia" | "mes";
  pontos: { bucket: string; ent: number; sai: number }[];
}

/**
 * Calendário de atividade (estilo GitHub): notas lançadas por dia no período.
 * Sempre diário — o filtro é limitado a no máximo 1 ano, então a grade nunca
 * explode. Cobre exatamente o período selecionado (`inicio`..`fim`).
 */
export interface ProdutividadeCalendario {
  inicio: string;
  fim: string;
  /** d = 'YYYY-MM-DD'; n = notas lançadas nesse dia. */
  celulas: { d: string; n: number }[];
  total: number;
  pico: { d: string; n: number } | null;
}

/** Conformidade fiscal (saídas): pendências que valem atenção/correção. */
export interface ConformidadeResumo {
  totalNotas: number;
  totalItens: number;
  canceladas: number;
  /** cdsituacao especial (denegada / inutilizada / outras ≠ normal e ≠ cancelada). */
  denegadas: number;
  /** Modelos 55/65/57 sem chave de acesso de 44 dígitos. */
  semChave: number;
  ncmInvalidoItens: number;
  ncmInvalidoProdutos: number;
  situacoes: { codigo: number; nome: string; qtd: number }[];
}

export interface ConformidadeEmpresa {
  codigo: number;
  nome: string | null;
  ncmInvalido: number;
  canceladas: number;
  denegadas: number;
  semChave: number;
  pendencias: number;
}

/** Recebíveis: duplicatas de saída (aging + fluxo por vencimento). */
export interface RecebiveisResumo {
  totalReceber: number;
  vencido: number;
  aVencer: number;
  qtdParcelas: number;
  aging: { faixa: string; valor: number; qtd: number; vencido: boolean }[];
  fluxo: { bucket: string; valor: number }[];
}

/** Meios de pagamento das saídas (NFe) e à vista × a prazo. */
export interface PagamentoResumo {
  meios: TopItem[];
  aVista: number;
  aPrazo: number;
  outros: number;
}

/** Carga tributária efetiva por empresa (ICMS+IPI+ST+ISS ÷ faturamento). */
export interface TributosCargaEmpresa {
  codigo: number;
  nome: string;
  faturamento: number;
  tributos: number;
  carga: number;
}

/** Item (produto) de uma nota, no drill-down do explorador. */
export interface NotaItem {
  seq: number;
  produto: number;
  descricao: string | null;
  cfop: number;
  cfopDescr: string | null;
  unidade: string | null;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  icms: number;
  ipi: number;
}
