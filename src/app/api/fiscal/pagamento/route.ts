import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { PagamentoResumo, TopItem } from "@/lib/types";

// Meio de pagamento (NFe, tabela do SPED) — rótulos das principais formas.
const MEIO: Record<number, string> = {
  1: "Dinheiro",
  2: "Cheque",
  3: "Cartão de crédito",
  4: "Cartão de débito",
  5: "Crédito loja",
  10: "Vale alimentação",
  11: "Vale refeição",
  12: "Vale presente",
  13: "Vale combustível",
  14: "Duplicata mercantil",
  15: "Boleto bancário",
  16: "Depósito bancário",
  17: "PIX",
  18: "Transferência (TED/DOC)",
  19: "Fidelidade / cashback",
  90: "Sem pagamento",
  99: "Outros",
};

/** Meios de pagamento das saídas + à vista × a prazo (indpagto). */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const w = buildWhere(filters, { alias: "f" }); // exclui canceladas, mantém espécie

  const [meiosRows, prazoRows] = await Promise.all([
    query<{ meio: number | null; notas: number; valor: number }>(
      `select f.meiopagamento as meio, count(*)::int as notas,
              coalesce(sum(f.valorcontabil), 0)::float as valor
         from lctofissai f
        where ${w.sql} and f.meiopagamento is not null
        group by 1
        order by 2 desc
        limit 12`,
      w.params
    ),
    query<{ ind: string | null; notas: number }>(
      `select f.indpagto as ind, count(*)::int as notas
         from lctofissai f
        where ${w.sql}
        group by 1`,
      w.params
    ),
  ]);

  const meios: TopItem[] = meiosRows.map((r) => ({
    codigo: r.meio ?? -1,
    nome: r.meio != null ? MEIO[r.meio] ?? `Forma ${r.meio}` : "Não informado",
    valor: r.valor,
    qtd: r.notas,
    detalhe: null,
  }));

  let aVista = 0;
  let aPrazo = 0;
  let outros = 0;
  for (const r of prazoRows) {
    if (r.ind === "0") aVista += r.notas;
    else if (r.ind === "1") aPrazo += r.notas;
    else outros += r.notas;
  }

  return { meios, aVista, aPrazo, outros } satisfies PagamentoResumo;
});
