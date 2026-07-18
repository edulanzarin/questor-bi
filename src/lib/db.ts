import { Pool, types } from "pg";

// datalctofis é DATE — manter como string "YYYY-MM-DD" evita deslocamento de fuso
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));
types.setTypeParser(types.builtins.INT8, (v) => Number(v));

declare global {
  var _questorPool: Pool | undefined;
}

export const pool =
  global._questorPool ??
  new Pool({
    host: process.env.QUESTOR_DB_HOST,
    port: Number(process.env.QUESTOR_DB_PORT ?? 5432),
    database: process.env.QUESTOR_DB_NAME,
    user: process.env.QUESTOR_DB_USER,
    password: process.env.QUESTOR_DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // BI é somente leitura: nenhuma query consegue alterar o Questor
    options: "-c default_transaction_read_only=on -c statement_timeout=60000",
  });

if (process.env.NODE_ENV !== "production") global._questorPool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
