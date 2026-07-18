import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ApuracaoLinha } from "@/lib/types";

/**
 * Apuração GERENCIAL: débito (impostos destacados nas saídas) − crédito
 * (impostos destacados nas entradas). Não é a apuração fiscal oficial (SPED
 * E100/E110), que considera ajustes, estornos e créditos específicos.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const w = buildWhere({ ...filters, especies: [] }, { alias: "f", incluirCanceladas: true });

  const prod = (lado: "ent" | "sai") =>
    query<{ icms: number; ipi: number; st: number; iss: number }>(
      `select coalesce(sum(f.valoricms), 0)::float as icms,
              coalesce(sum(f.valoripi), 0)::float as ipi,
              coalesce(sum(f.valorsubtribut), 0)::float as st,
              coalesce(sum(f.valoriss), 0)::float as iss
         from lctofis${lado}produto f where ${w.sql}`,
      w.params
    );
  const pc = (lado: "ent" | "sai") =>
    query<{ pis: number; cofins: number }>(
      `select coalesce(sum(f.valorpis), 0)::float as pis,
              coalesce(sum(f.valorcofins), 0)::float as cofins
         from lctofis${lado}piscofins f where ${w.sql}`,
      w.params
    );

  const [pSai, pEnt, cSai, cEnt] = await Promise.all([
    prod("sai"),
    prod("ent"),
    pc("sai"),
    pc("ent"),
  ]);

  const linha = (imposto: string, debito: number, credito: number): ApuracaoLinha => ({
    imposto,
    debito,
    credito,
    saldo: debito - credito,
  });

  const linhas: ApuracaoLinha[] = [
    linha("ICMS", pSai[0].icms, pEnt[0].icms),
    linha("ICMS-ST", pSai[0].st, pEnt[0].st),
    linha("IPI", pSai[0].ipi, pEnt[0].ipi),
    linha("ISS", pSai[0].iss, pEnt[0].iss),
    linha("PIS", cSai[0].pis, cEnt[0].pis),
    linha("COFINS", cSai[0].cofins, cEnt[0].cofins),
  ];

  return linhas;
});
