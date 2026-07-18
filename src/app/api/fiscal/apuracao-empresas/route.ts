import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { TopItem } from "@/lib/types";

/** Saldo de ICMS (débito saídas − crédito entradas) por empresa, maiores a recolher. */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const w = buildWhere({ ...filters, especies: [] }, { alias: "f", incluirCanceladas: true });

  const porEmpresa = (lado: "ent" | "sai") =>
    query<{ codigoempresa: number; total: number }>(
      `select f.codigoempresa, coalesce(sum(f.valoricms), 0)::float as total
         from lctofis${lado}produto f where ${w.sql}
        group by f.codigoempresa`,
      w.params
    );

  const [sai, ent] = await Promise.all([porEmpresa("sai"), porEmpresa("ent")]);

  const saldo = new Map<number, { debito: number; credito: number }>();
  const get = (e: number) => {
    let s = saldo.get(e);
    if (!s) {
      s = { debito: 0, credito: 0 };
      saldo.set(e, s);
    }
    return s;
  };
  for (const r of sai) get(r.codigoempresa).debito = r.total;
  for (const r of ent) get(r.codigoempresa).credito = r.total;

  const empresas = [...saldo.keys()];
  const nomes =
    empresas.length > 0
      ? await query<{ codigoempresa: number; nomeempresa: string }>(
          `select codigoempresa, nomeempresa from empresa where codigoempresa = any($1::int[])`,
          [empresas]
        )
      : [];
  const nomeDe = new Map(nomes.map((n) => [n.codigoempresa, n.nomeempresa]));

  return [...saldo.entries()]
    .map(([codigo, s]) => ({
      codigo,
      nome: nomeDe.get(codigo) ?? `Empresa ${codigo}`,
      valor: s.debito - s.credito,
      qtd: s.debito - s.credito,
      detalhe: null as string | null,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10) satisfies TopItem[];
});
