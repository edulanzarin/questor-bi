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

/**
 * Situação de uma nota na conferência.
 * - `ok`: contabilizada e de acordo com o plano
 * - `divergente`: contabilizada, mas fora do plano
 * - `pendente`: deveria ter lançamento e não tem
 * - `nao_exige`: CFOP que não gera lançamento (remessa, retorno…)
 * - `cancelada`: fora da conferência
 */
export type SituacaoNota =
  | "ok"
  | "divergente"
  | "duplicada"
  | "pendente"
  | "nao_exige"
  | "cancelada";

/**
 * Nota contabilizada mais de uma vez: a MESMA partida (débito, crédito, valor)
 * reaparece em dias distintos de lançamento — re-rodaram a contabilização.
 */
export interface Duplicidade {
  /** Quantas vezes a nota foi contabilizada (>= 2). */
  vezes: number;
  /** Valor lançado a mais (valor da nota × (vezes − 1)). */
  valor: number;
  /** Dias de lançamento envolvidos (YYYY-MM-DD), em ordem. */
  datas: string[];
}

export interface NotaConferida {
  chave: string;
  numero: number;
  serie: string | null;
  especie: string;
  data: string;
  valor: number;
  contraparte: string | null;
  doc: string | null;
  uf: string | null;
  cfops: number[];
  situacao: SituacaoNota;
  /** Quantos lançamentos contábeis a nota gerou. */
  lancamentos: number;
  divergencias: Divergencia[];
  /** Presente só quando a nota foi contabilizada em duplicidade. */
  duplicidade: Duplicidade | null;
}

export interface ConfResumo {
  total: number;
  contabilizadas: number;
  conformes: number;
  divergentes: number;
  /** Contabilizadas mais de uma vez (partida idêntica em dias distintos). */
  duplicadas: number;
  pendentes: number;
  naoExigem: number;
  canceladas: number;
  /** Contabilizadas cujo CFOP não tem plano — não dá para conferir a conta. */
  semPlano: number;
  valorTotal: number;
  valorPendente: number;
  valorDivergente: number;
  /** Total lançado a mais pelas duplicadas. */
  valorDuplicado: number;
}

/** Valor disponível para filtrar, com quantas notas ele tem. */
export interface Faceta {
  valor: string;
  rotulo: string | null;
  qtd: number;
}

export interface ConferenciaResp {
  resumo: ConfResumo;
  /** Página atual, já filtrada e ordenada. */
  notas: NotaConferida[];
  /** Quantas notas passam no filtro. */
  total: number;
  pagina: number;
  porPagina: number;
  /** Período grande demais: nem todas as notas foram analisadas. */
  truncado: boolean;
  /** Espécies e CFOPs realmente presentes, para montar os filtros. */
  facetas: { especies: Faceta[]; cfops: Faceta[] };
}

/** Conta analítica do plano de contas da empresa (vem do Questor). */
export interface ContaPlano {
  conta: number;
  descricao: string;
  classificacao: string | null;
}

/** Conta de banco da empresa, com as regras de contrapartida do extrato. */
export interface ContaBanco {
  id: number;
  empresa: number;
  conta: number;
  apelido: string | null;
  descricao: string | null;
  classificacao: string | null;
  regras: RegraExtratoDTO[];
}

export interface RegraExtratoDTO {
  id: number;
  termo: string;
  termoOriginal: string;
  tipo: "exato" | "parcial";
  contaPagamento: number | null;
  contaRecebimento: number | null;
  descrPagamento: string | null;
  descrRecebimento: string | null;
  historico: string | null;
  ativo: boolean;
}

/** Um lançamento contábil que a nota deveria gerar, segundo o plano. */
export interface LinhaPlano {
  seq: number;
  /** 1 = débito, -1 = crédito. */
  natureza: 1 | -1;
  conta: number | null;
  /** Conta que só se conhece no lançamento (fornecedor/cliente) — não dá para fixar. */
  contaVariavel: boolean;
  origemConta: number;
  descrConta: string | null;
  /** Fórmula do Questor, ex.: "vlrContabil-vlrIPI-vlrICMS". */
  regraValor: string | null;
}

/** Slot de contabilização do CFOP: o valor contábil ou um tributo. */
export interface ComponentePlano {
  id: string;
  rotulo: string;
  retido: boolean;
  tabela: number | null;
  descrTabela: string | null;
  linhas: LinhaPlano[];
}

/** Plano de contabilização de um CFOP — do Questor ou sobrescrito pelo usuário. */
export interface PlanoCfop {
  estab: number;
  cfop: number;
  cfopBase: number;
  descricao: string | null;
  lado: "ent" | "sai";
  contaLivro: number | null;
  componentes: ComponentePlano[];
  origem: "questor" | "override";
  contabiliza: boolean;
  observacao?: string | null;
  /** Quantas notas usaram esse CFOP no período consultado. */
  usos?: number;
  /**
   * O que o histórico (12 meses) diz sobre esse CFOP contabilizar. É a fonte do
   * `contabiliza` quando não há override — presente para a tela explicar o
   * porquê ("lançou em 157 de 162 notas"). Ausente = ainda não aprendido.
   */
  aprendido?: { contabiliza: boolean; notas: number; contabilizadas: number } | null;
}

/** Uma linha do balancete fiscal: movimento hipotético (regras) × real (fiscal). */
export interface BalanceteLinha {
  conta: number;
  /** Classificação hierárquica (ex.: "1.1.01.002"); o nível = nº de segmentos. */
  classif: string;
  nivel: number;
  descricao: string;
  sintetica: boolean;
  fiscalDeb: number;
  fiscalCred: number;
  realDeb: number;
  realCred: number;
}

export interface BalanceteFiscalResp {
  /** Todas as contas com movimento, ordenadas por classificação (a tela corta por nível). */
  linhas: BalanceteLinha[];
  cobertura: { notas: number; componentesPulados: number };
  nivelMax: number;
}

/** Estabelecimento (filial) da empresa — cada um tem CNPJ próprio. */
export interface EstabInfo {
  codigo: number;
  nome: string | null;
  cnpj: string | null;
  uf: string | null;
}

export interface PlanoResp {
  empresa: number;
  estabs: EstabInfo[];
  /** Só a página atual. */
  cfops: PlanoCfop[];
  /** Quantos CFOPs passam no filtro/busca. */
  total: number;
  /** Quantos CFOPs a empresa tem cadastrados, sem filtro. */
  totalGeral: number;
  overrides: number;
  pagina: number;
  porPagina: number;
}

/** Tipos de divergência que a conferência aponta. */
export type TipoDivergencia = "conta" | "faltando" | "valor" | "natureza" | "extra";

export interface Divergencia {
  tipo: TipoDivergencia;
  /**
   * Lado do razão a que o apontamento se refere: 1 = débito, -1 = crédito.
   * É por onde se começa a procurar no Questor, então a tela mostra sempre.
   */
  natureza: 1 | -1;
  componente: string;
  detalhe: string;
  contaEsperada: number | null;
  contaLancada: number | null;
  valorEsperado: number | null;
  valorLancado: number | null;
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
