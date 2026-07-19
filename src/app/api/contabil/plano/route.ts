import { pool } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, FilterError } from "@/lib/fiscal-filters";
import { planoQuestor } from "@/lib/plano-contabil";
import {
  aplicarOverrides,
  listarOverrides,
  removerOverride,
  salvarOverride,
  type SalvarOverride,
} from "@/lib/plano-override";
import type { PlanoResp } from "@/lib/types";

/** Quantas notas usaram cada CFOP no período — dirige a ordem da tela. */
const USOS_SQL = `
  select codigocfop cfop, codigoestab estab, count(distinct chavelctofisent) usos
    from lctofisentproduto
   where codigoempresa = $1 and datalctofis between $2 and $3
   group by 1, 2
  union all
  select codigocfop, codigoestab, count(distinct chavelctofissai)
    from lctofissaiproduto
   where codigoempresa = $1 and datalctofis between $2 and $3
   group by 1, 2`;

/**
 * Plano de contabilização da empresa: para cada CFOP movimentado no período,
 * quais lançamentos são esperados. Vem do Questor e, onde houver override
 * cadastrado, do override.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  if (filters.empresas.length !== 1) {
    throw new FilterError("Selecione uma empresa para ver o plano de contabilização");
  }
  const empresa = filters.empresas[0];
  const estabParam = req.nextUrl.searchParams.get("estab");
  const estab = estabParam ? Number(estabParam) : undefined;
  if (estabParam && !Number.isInteger(estab)) throw new FilterError("Estabelecimento inválido");

  const client = await pool.connect();
  try {
    const usosRes = await client.query<{ cfop: number; estab: number; usos: number }>(USOS_SQL, [
      empresa,
      filters.inicio,
      filters.fim,
    ]);

    const usos = new Map<string, number>();
    const cfops = new Set<number>();
    for (const r of usosRes.rows) {
      cfops.add(r.cfop);
      const chave = `${r.estab}:${r.cfop}`;
      usos.set(chave, (usos.get(chave) ?? 0) + Number(r.usos));
    }
    if (!cfops.size) {
      return { empresa, estabs: [], cfops: [] } satisfies PlanoResp;
    }

    const [plano, overrides] = await Promise.all([
      planoQuestor(client, empresa, { estab, cfops: [...cfops] }),
      listarOverrides(empresa),
    ]);

    const comUsos = aplicarOverrides(plano, overrides)
      .map((p) => ({ ...p, usos: usos.get(`${p.estab}:${p.cfop}`) ?? 0 }))
      .filter((p) => p.usos > 0)
      .sort((a, b) => b.usos - a.usos || a.cfop - b.cfop);

    return {
      empresa,
      estabs: [...new Set(comUsos.map((p) => p.estab))].sort((a, b) => a - b),
      cfops: comUsos,
    } satisfies PlanoResp;
  } finally {
    client.release();
  }
});

interface CorpoOverride {
  empresa?: number;
  estab?: number;
  cfop?: number;
  contabiliza?: boolean;
  observacao?: string | null;
  linhas?: Array<{
    natureza?: number;
    conta?: number | null;
    origemConta?: number;
    regraValor?: string | null;
    rotulo?: string | null;
  }>;
}

/** Cria ou atualiza o override de um CFOP. */
export const PUT = apiRoute(async (req) => {
  const corpo = (await req.json()) as CorpoOverride;
  const { empresa, cfop } = corpo;
  if (!Number.isInteger(empresa) || !Number.isInteger(cfop)) {
    throw new FilterError("Informe empresa e cfop");
  }
  const estab = corpo.estab ?? 0;
  if (!Number.isInteger(estab) || estab < 0) throw new FilterError("Estabelecimento inválido");

  const contabiliza = corpo.contabiliza ?? true;
  const linhas: SalvarOverride["linhas"] = (corpo.linhas ?? []).map((l, i) => {
    const origemConta = l.origemConta ?? 0;
    const conta = origemConta === 0 ? (l.conta ?? null) : null;
    if (origemConta === 0 && conta == null) {
      throw new FilterError(`Lançamento ${i + 1}: informe a conta contábil`);
    }
    const natureza = l.natureza;
    if (natureza !== 1 && natureza !== -1) {
      throw new FilterError(`Lançamento ${i + 1}: natureza deve ser débito ou crédito`);
    }
    return {
      natureza,
      conta,
      origemConta,
      regraValor: l.regraValor ?? null,
      rotulo: l.rotulo ?? null,
    };
  });
  if (contabiliza && !linhas.length) {
    throw new FilterError("Um CFOP que contabiliza precisa de ao menos um lançamento");
  }

  const id = await salvarOverride({
    empresa: empresa!,
    estab,
    cfop: cfop!,
    contabiliza,
    observacao: corpo.observacao ?? null,
    linhas,
  });
  return { id, ok: true };
});

/** Remove o override — o CFOP volta a seguir o plano do Questor. */
export const DELETE = apiRoute(async (req) => {
  const p = req.nextUrl.searchParams;
  const empresa = Number(p.get("empresa"));
  const cfop = Number(p.get("cfop"));
  const estab = Number(p.get("estab") ?? 0);
  if (!Number.isInteger(empresa) || !Number.isInteger(cfop) || !Number.isInteger(estab)) {
    throw new FilterError("Informe empresa e cfop");
  }
  const removido = await removerOverride(empresa, estab, cfop);
  return { ok: removido };
});
