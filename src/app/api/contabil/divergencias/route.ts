import { PoolClient } from "pg";
import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { planoQuestor } from "@/lib/plano-contabil";
import { aplicarOverrides, listarOverrides } from "@/lib/plano-override";
import { conferirNota, type LancamentoReal, type ValoresNota } from "@/lib/divergencias";
import type { DivergenciasLado, NotaDivergente, PlanoCfop } from "@/lib/types";

const LIMITE = 300;
/** Teto de notas analisadas por lado — a comparação roda em memória. */
const MAX_NOTAS = 4000;

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
  valorcontabil: number;
  valoripi: number;
  valorfunrural: number;
  valoricms: number;
  contraparte: string | null;
}

/** Notas contabilizadas no período, com os valores que alimentam as fórmulas. */
function sqlNotas(c: LadoCfg): string {
  return `
    select n.${c.chave} chave, n.numeronf numero, n.serienf serie,
           upper(btrim(n.especienf)) especie, n.datalctofis data, n.codigoestab estab,
           coalesce(n.valorcontabil, 0) valorcontabil, coalesce(n.valoripi, 0) valoripi,
           ${c.funrural} valorfunrural,
           coalesce((select sum(f.valorimposto) from ${c.cfops} f
                      where f.codigoempresa = n.codigoempresa
                        and f.${c.chave} = n.${c.chave} and f.tipoimposto = 1), 0) valoricms,
           p.nomepessoa contraparte
      from ${c.tabela} n
      left join pessoa p on p.codigopessoa = n.codigopessoa
     where n.codigoempresa = $1 and n.datalctofis between $2 and $3 and n.cancelada <> '1'
       and exists (select 1 from lctoctb l
                    where l.codigoempresa = n.codigoempresa
                      and l.datalctoctb between $2 and $3 and l.codigooriglctoctb = 'FI'
                      and l.chaveorigem = '${c.prefix}' || lpad(n.${c.chave}::text, 10, '0'))
     order by n.valorcontabil desc
     limit ${MAX_NOTAS}`;
}

async function analisar(
  client: PoolClient,
  c: LadoCfg,
  empresa: number,
  inicio: string,
  fim: string
): Promise<DivergenciasLado> {
  const params = [empresa, inicio, fim];
  const notas = (await client.query<NotaRow>(sqlNotas(c), params)).rows;

  const vazio: DivergenciasLado = {
    analisadas: 0,
    conformes: 0,
    divergentes: 0,
    semPlano: 0,
    valorDivergente: 0,
    porTipo: { conta: 0, faltando: 0, valor: 0, natureza: 0, extra: 0 },
    notas: [],
    truncado: false,
  };
  if (!notas.length) return vazio;

  const chaves = notas.map((n) => n.chave);

  // Lançamentos contábeis de todas as notas de uma vez.
  const lctos = await client.query<{ chave: number; deb: number | null; cred: number | null; valor: number }>(
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
    const item = { contaDeb: l.deb, contaCred: l.cred, valor: Number(l.valor) };
    if (l.deb != null) observadas.add(`1:${l.deb}`);
    if (l.cred != null) observadas.add(`-1:${l.cred}`);
    const lista = porNota.get(l.chave);
    if (lista) lista.push(item);
    else porNota.set(l.chave, [item]);
  }

  // CFOPs de cada nota.
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
  const planoPorChave = new Map<string, PlanoCfop>();
  for (const p of plano) planoPorChave.set(`${p.estab}:${p.cfop}`, p);

  const resultado: DivergenciasLado = { ...vazio, porTipo: { ...vazio.porTipo } };
  const divergentes: NotaDivergente[] = [];

  for (const n of notas) {
    resultado.analisadas += 1;
    const cfops = cfopsPorNota.get(n.chave) ?? [];
    const planoNota = cfops
      .map((cf) => planoPorChave.get(`${n.estab}:${cf}`))
      .filter((p): p is PlanoCfop => p != null && p.contabiliza);

    if (!planoNota.length) {
      resultado.semPlano += 1;
      continue;
    }

    const valores: ValoresNota = {
      vlrContabil: Number(n.valorcontabil),
      vlrICMS: Number(n.valoricms),
      vlrIPI: Number(n.valoripi),
      vlrFunRural: Number(n.valorfunrural),
    };
    const divs = conferirNota(porNota.get(n.chave) ?? [], planoNota, valores, {
      observadas,
      checarValor: cfops.length === 1,
    });

    if (!divs.length) {
      resultado.conformes += 1;
      continue;
    }
    resultado.divergentes += 1;
    resultado.valorDivergente += Number(n.valorcontabil);
    for (const d of divs) resultado.porTipo[d.tipo] += 1;

    divergentes.push({
      chave: String(n.chave),
      numero: n.numero,
      serie: n.serie,
      especie: n.especie,
      data: n.data,
      valor: Number(n.valorcontabil),
      contraparte: n.contraparte,
      cfops,
      divergencias: divs,
    });
  }

  resultado.notas = divergentes.slice(0, LIMITE);
  resultado.truncado = divergentes.length > LIMITE;
  return resultado;
}

/**
 * Conferência de contas: entre as notas JÁ contabilizadas, quais foram para
 * conta contábil diferente da que o plano manda, com valor diferente, com
 * natureza invertida ou com lançamento faltando.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  if (filters.empresas.length !== 1) {
    throw new FilterError("Selecione uma empresa para a conferência de contas");
  }
  const empresa = filters.empresas[0];

  const client = await pool.connect();
  try {
    const [ent, sai] = await Promise.all([
      analisar(client, ENT, empresa, filters.inicio, filters.fim),
      analisar(client, SAI, empresa, filters.inicio, filters.fim),
    ]);
    return { ent, sai };
  } finally {
    client.release();
  }
});
