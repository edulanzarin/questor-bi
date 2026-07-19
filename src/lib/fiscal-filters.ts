const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Teto de período: no máximo 1 ano (evita consultas pesadas nas tabelas gigantes). */
export const MAX_DIAS_PERIODO = 366;

export const ESPECIES_PRINCIPAIS = ["NFE", "CTE", "NFSE", "NFCE", "NF"];

export interface FiscalFilters {
  inicio: string;
  fim: string;
  empresas: number[];
  especies: string[];
}

export class FilterError extends Error {}

export function parseFilters(searchParams: URLSearchParams): FiscalFilters {
  const inicio = searchParams.get("inicio") ?? "";
  const fim = searchParams.get("fim") ?? "";
  if (!DATE_RE.test(inicio) || !DATE_RE.test(fim)) {
    throw new FilterError("Período inválido: informe inicio e fim como YYYY-MM-DD");
  }
  if (inicio > fim) throw new FilterError("Data inicial maior que a final");
  const dias = (Date.parse(fim) - Date.parse(inicio)) / 86_400_000 + 1;
  if (dias > MAX_DIAS_PERIODO) throw new FilterError("Período máximo permitido: 1 ano");

  const empresas = (searchParams.get("empresas") ?? "")
    .split(",")
    .filter(Boolean)
    .map((v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0) throw new FilterError(`Empresa inválida: ${v}`);
      return n;
    });

  const especies = (searchParams.get("especies") ?? "")
    .split(",")
    .filter(Boolean)
    .map((e) => e.toUpperCase().slice(0, 10));

  return { inicio, fim, empresas, especies };
}

/**
 * Monta o WHERE compartilhado por todas as consultas fiscais.
 * Retorna o SQL (sem a palavra WHERE) e os parâmetros posicionais.
 */
export function buildWhere(
  f: FiscalFilters,
  opts: { incluirCanceladas?: boolean; alias?: string } = {}
): { sql: string; params: unknown[] } {
  const a = opts.alias ? `${opts.alias}.` : "";
  const params: unknown[] = [f.inicio, f.fim];
  const conds = [`${a}datalctofis between $1 and $2`];

  if (f.empresas.length > 0) {
    params.push(f.empresas);
    conds.push(`${a}codigoempresa = any($${params.length}::int[])`);
  }

  if (f.especies.length > 0) {
    const listadas = f.especies.filter((e) => e !== "OUTRAS");
    const parts: string[] = [];
    if (listadas.length > 0) {
      params.push(listadas);
      parts.push(`upper(btrim(${a}especienf)) = any($${params.length}::text[])`);
    }
    if (f.especies.includes("OUTRAS")) {
      params.push(ESPECIES_PRINCIPAIS);
      parts.push(`upper(btrim(${a}especienf)) <> all($${params.length}::text[])`);
    }
    conds.push(`(${parts.join(" or ")})`);
  }

  if (!opts.incluirCanceladas) {
    conds.push(`${a}cancelada <> '1'`);
  }

  return { sql: conds.join(" and "), params };
}

/** Período imediatamente anterior, com a mesma duração — usado nos deltas dos KPIs. */
export function periodoAnterior(f: FiscalFilters): FiscalFilters {
  const ini = new Date(f.inicio + "T00:00:00Z");
  const fim = new Date(f.fim + "T00:00:00Z");
  const dias = Math.round((fim.getTime() - ini.getTime()) / 86_400_000) + 1;
  const prevFim = new Date(ini.getTime() - 86_400_000);
  const prevIni = new Date(prevFim.getTime() - (dias - 1) * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { ...f, inicio: iso(prevIni), fim: iso(prevFim) };
}
