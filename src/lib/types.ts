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
