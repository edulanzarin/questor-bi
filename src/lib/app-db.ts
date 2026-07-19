import { Pool, types } from "pg";

// Mesmos parsers do pool do Questor: DATE como string, numéricos como number
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));
types.setTypeParser(types.builtins.INT8, (v) => Number(v));

declare global {
  var _appPool: Pool | undefined;
}

/**
 * Banco PRÓPRIO do BI (gravável) — não confundir com o pool do Questor, que é
 * produção e somente leitura. Aqui moram os overrides do plano de
 * contabilização e, futuramente, usuários e permissões.
 */
export const appPool =
  global._appPool ??
  new Pool({
    connectionString:
      process.env.APP_DB_URL ?? "postgres://questorbi:questorbi@localhost:5433/questorbi",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    options: "-c statement_timeout=30000",
  });

if (process.env.NODE_ENV !== "production") global._appPool = appPool;

export async function appQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await appPool.query(text, params);
  return result.rows as T[];
}
