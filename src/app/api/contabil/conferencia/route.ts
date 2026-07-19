import { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { planoQuestor } from "@/lib/plano-contabil";
import { aplicarOverrides, listarOverrides } from "@/lib/plano-override";
import { conferirNota, type LancamentoReal, type ValoresNota } from "@/lib/divergencias";
import type {
  ConferenciaResp,
  ConfResumo,
  NotaConferida,
  PlanoCfop,
  SituacaoNota,
} from "@/lib/types";

const POR_PAGINA = 100;
/** Teto de notas analisadas — a comparação com o plano roda em memória. */
const MAX_NOTAS = 8000;

interface LadoCfg {
  tabela: string;
  chave: string;
  itens: string;
  cfops: string;
  prefix: "ME" | "MS";
  funrural: string;
}
const ENT: LadoCfg = {
  tabela: "lctofisent",
  chave: "chavelctofisent",
  itens: "lctofisentproduto",
  cfops: "lctofisentcfop",
  prefix: "ME",
  funrural: "coalesce(n.valorfunrural, 0)",
};
const SAI: LadoCfg = {
  tabela: "lctofissai",
  chave: "chavelctofissai",
  itens: "lctofissaiproduto",
  cfops: "lctofissaicfop",
  prefix: "MS",
  funrural: "0",
};

interface NotaRow {
  chave: number;
  numero: number;
  serie: string | null;
  especie: string;
  data: string;
  estab: number;
  cancelada: boolean;
  valorcontabil: number;
  valoripi: number;
  valorfunrural: number;
  valoricms: number;
  contraparte: string | null;
  doc: string | null;
  uf: string | null;
}

/** Todas as notas do período, com os valores que alimentam as fórmulas do plano. */
function sqlNotas(c: LadoCfg): string {
  return `
    select n.${c.chave} chave, n.numeronf numero, n.serienf serie,
           upper(btrim(n.especienf)) especie, n.datalctofis data, n.codigoestab estab,
           (n.cancelada = '1') cancelada,
           coalesce(n.valorcontabil, 0) valorcontabil, coalesce(n.valoripi, 0) valoripi,
           ${c.funrural} valorfunrural,
           coalesce((select sum(f.valorimposto) from ${c.cfops} f
                      where f.codigoempresa = n.codigoempresa
                        and f.${c.chave} = n.${c.chave} and f.tipoimposto = 1), 0) valoricms,
           p.nomepessoa contraparte, p.inscrfederal doc, p.siglaestado uf
      from ${c.tabela} n
      left join pessoa p on p.codigopessoa = n.codigopessoa
     where n.codigoempresa = $1 and n.datalctofis between $2 and $3
     order by n.valorcontabil desc
     limit ${MAX_NOTAS + 1}`;
}

type Ordem = "valor_desc" | "valor_asc" | "data_desc" | "data_asc" | "numero";

interface Opcoes {
  tipo: "ent" | "sai";
  situacao: string;
  busca: string;
  especie: string;
  cfop: number | null;
  ordem: Ordem;
  pagina: number;
}

async function conferir(
  client: PoolClient,
  empresa: number,
  inicio: string,
  fim: string,
  o: Opcoes
): Promise<ConferenciaResp> {
  const c = o.tipo === "ent" ? ENT : SAI;
  const params = [empresa, inicio, fim];
  const linhas = (await client.query<NotaRow>(sqlNotas(c), params)).rows;
  const truncado = linhas.length > MAX_NOTAS;
  const notas = truncado ? linhas.slice(0, MAX_NOTAS) : linhas;

  const vazio: ConferenciaResp = {
    resumo: {
      total: 0,
      contabilizadas: 0,
      conformes: 0,
      divergentes: 0,
      pendentes: 0,
      naoExigem: 0,
      canceladas: 0,
      semPlano: 0,
      valorTotal: 0,
      valorPendente: 0,
      valorDivergente: 0,
    },
    notas: [],
    total: 0,
    pagina: 1,
    porPagina: POR_PAGINA,
    truncado: false,
  };
  if (!notas.length) return vazio;

  const chaves = notas.map((n) => n.chave);

  // Lançamentos contábeis (origem FI) de todas as notas de uma vez.
  const lctos = await client.query<{
    chave: number;
    deb: number | null;
    cred: number | null;
    valor: number;
  }>(
    `select substring(chaveorigem from 3)::bigint chave, contactbdeb deb, contactbcred cred,
            valorlctoctb valor
       from lctoctb
      where codigoempresa = $1 and datalctoctb between $2 and $3
        and codigooriglctoctb = 'FI' and chaveorigem like '${c.prefix}%'
        and substring(chaveorigem from 3)::bigint = any($4::bigint[])`,
    [...params, chaves]
  );
  const porNota = new Map<number, LancamentoReal[]>();
  // Contas que de fato recebem lançamento por nota — calibra o que é cobrável.
  const observadas = new Set<string>();
  for (const l of lctos.rows) {
    if (l.deb != null) observadas.add(`1:${l.deb}`);
    if (l.cred != null) observadas.add(`-1:${l.cred}`);
    const item = { contaDeb: l.deb, contaCred: l.cred, valor: Number(l.valor) };
    const lista = porNota.get(l.chave);
    if (lista) lista.push(item);
    else porNota.set(l.chave, [item]);
  }

  const cfopsRes = await client.query<{ chave: number; cfop: number }>(
    `select distinct ${c.chave} chave, codigocfop cfop from ${c.itens}
      where codigoempresa = $1 and datalctofis between $2 and $3 and ${c.chave} = any($4::bigint[])`,
    [...params, chaves]
  );
  const cfopsPorNota = new Map<number, number[]>();
  const todosCfops = new Set<number>();
  for (const r of cfopsRes.rows) {
    todosCfops.add(r.cfop);
    const lista = cfopsPorNota.get(r.chave);
    if (lista) lista.push(r.cfop);
    else cfopsPorNota.set(r.chave, [r.cfop]);
  }

  const [planoBruto, overrides] = await Promise.all([
    planoQuestor(client, empresa, { cfops: [...todosCfops] }),
    listarOverrides(empresa),
  ]);
  const plano = aplicarOverrides(planoBruto, overrides);
  const porChave = new Map<string, PlanoCfop>();
  for (const p of plano) porChave.set(`${p.estab}:${p.cfop}`, p);

  /**
   * CFOPs que comprovadamente geram lançamento nesta empresa. O plano sozinho
   * não basta: CFOPs de retorno/industrialização (1902, 1916, 1917, 1949…)
   * vêm com tabela configurada mas o Questor nunca gera lançamento para eles —
   * na 1200 foram 0 contabilizações em milhares de notas no ano. Cobrar essas
   * notas como pendentes seria falso positivo em massa.
   */
  const cfopsComLancamento = new Set<number>();
  for (const n of notas) {
    if (!porNota.has(n.chave)) continue;
    for (const cf of cfopsPorNota.get(n.chave) ?? []) cfopsComLancamento.add(cf);
  }

  const resumo: ConfResumo = { ...vazio.resumo };
  const conferidas: NotaConferida[] = [];

  for (const n of notas) {
    const cfops = (cfopsPorNota.get(n.chave) ?? []).sort((a, b) => a - b);
    const lancamentos = porNota.get(n.chave) ?? [];
    const valor = Number(n.valorcontabil);

    resumo.total += 1;
    resumo.valorTotal += valor;

    let situacao: SituacaoNota;
    let divergencias: NotaConferida["divergencias"] = [];

    if (n.cancelada) {
      situacao = "cancelada";
      resumo.canceladas += 1;
    } else {
      const planoNota = cfops
        .map((cf) => porChave.get(`${n.estab}:${cf}`))
        .filter((p): p is PlanoCfop => p != null);
      // Nota sem item (serviço) não tem CFOP: assume-se que deve contabilizar.
      const deveContabilizar =
        cfops.length === 0 ||
        planoNota.some((p) => p.contabiliza && cfopsComLancamento.has(p.cfop));

      if (lancamentos.length > 0) {
        resumo.contabilizadas += 1;
        const conferiveis = planoNota.filter((p) => p.contabiliza);
        if (!conferiveis.length) {
          // Contabilizada, mas sem plano para comparar as contas.
          situacao = "ok";
          resumo.semPlano += 1;
          resumo.conformes += 1;
        } else {
          const valores: ValoresNota = {
            vlrContabil: valor,
            vlrICMS: Number(n.valoricms),
            vlrIPI: Number(n.valoripi),
            vlrFunRural: Number(n.valorfunrural),
          };
          divergencias = conferirNota(lancamentos, conferiveis, valores, {
            observadas,
            checarValor: cfops.length === 1,
          });
          if (divergencias.length) {
            situacao = "divergente";
            resumo.divergentes += 1;
            resumo.valorDivergente += valor;
          } else {
            situacao = "ok";
            resumo.conformes += 1;
          }
        }
      } else if (deveContabilizar) {
        situacao = "pendente";
        resumo.pendentes += 1;
        resumo.valorPendente += valor;
      } else {
        situacao = "nao_exige";
        resumo.naoExigem += 1;
      }
    }

    conferidas.push({
      chave: String(n.chave),
      numero: n.numero,
      serie: n.serie,
      especie: n.especie,
      data: n.data,
      valor,
      contraparte: n.contraparte,
      doc: n.doc,
      uf: n.uf,
      cfops,
      situacao,
      lancamentos: lancamentos.length,
      divergencias,
    });
  }

  // ---- filtros ----
  const q = o.busca.trim().toLowerCase();
  const filtradas = conferidas.filter((n) => {
    if (o.situacao === "problema") {
      if (n.situacao !== "pendente" && n.situacao !== "divergente") return false;
    } else if (o.situacao !== "todas" && n.situacao !== o.situacao) return false;
    if (o.especie && n.especie !== o.especie) return false;
    if (o.cfop != null && !n.cfops.includes(o.cfop)) return false;
    if (!q) return true;
    return (
      String(n.numero).includes(q) ||
      (n.contraparte ?? "").toLowerCase().includes(q) ||
      (n.doc ?? "").includes(q) ||
      n.cfops.some((cf) => String(cf).includes(q))
    );
  });

  const ordenadas = filtradas.sort((a, b) => {
    switch (o.ordem) {
      case "valor_asc":
        return a.valor - b.valor;
      case "data_desc":
        return b.data.localeCompare(a.data) || b.valor - a.valor;
      case "data_asc":
        return a.data.localeCompare(b.data) || b.valor - a.valor;
      case "numero":
        return a.numero - b.numero;
      default:
        return b.valor - a.valor;
    }
  });

  const pagina = Math.max(1, o.pagina);
  return {
    resumo,
    notas: ordenadas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    total: ordenadas.length,
    pagina,
    porPagina: POR_PAGINA,
    truncado,
  };
}

/**
 * Conferência Fiscal: cruza as notas do período com os lançamentos contábeis
 * (origem FI) e com o plano de contabilização do CFOP. Devolve TODAS as notas
 * com a sua situação — não só as problemáticas —, para dar de filtrar por
 * corretas, pendentes, divergentes etc.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  if (filters.empresas.length !== 1) {
    throw new FilterError("Selecione uma empresa para a conferência");
  }
  const p = req.nextUrl.searchParams;
  const cfopParam = p.get("cfop");
  const cfop = cfopParam ? Number(cfopParam) : null;
  if (cfopParam && !Number.isInteger(cfop)) throw new FilterError("CFOP inválido");

  const opcoes: Opcoes = {
    tipo: p.get("tipo") === "sai" ? "sai" : "ent",
    situacao: p.get("situacao") ?? "problema",
    busca: p.get("busca") ?? "",
    especie: (p.get("especie") ?? "").toUpperCase(),
    cfop,
    ordem: (p.get("ordem") ?? "valor_desc") as Ordem,
    pagina: Number(p.get("pagina") ?? 1) || 1,
  };

  const client = await pool.connect();
  try {
    return await conferir(client, filters.empresas[0], filters.inicio, filters.fim, opcoes);
  } finally {
    client.release();
  }
});
