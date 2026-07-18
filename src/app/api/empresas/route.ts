import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import type { Empresa } from "@/lib/types";

export const revalidate = 300;

export const GET = apiRoute(async () => {
  const rows = await query<{ codigo: number; nome: string }>(
    `select codigoempresa as codigo, nomeempresa as nome
       from empresa
      order by nomeempresa`
  );
  return rows satisfies Empresa[];
});
