import { query } from "@/lib/db";
import { apiRoute } from "@/lib/api-route";
import { parseFilters, buildWhere } from "@/lib/fiscal-filters";
import type { ColaboradorProd } from "@/lib/types";

interface Row {
  codigo: number;
  notas_ent: number;
  notas_sai: number;
  notas: number;
  canceladas: number;
  valor_ent: number;
  valor_sai: number;
  empresas: number;
  nome: string;
  inativo: boolean;
}

/**
 * Produtividade por colaborador: junta entradas e saídas por usuário que lançou
 * (codigousuario → usuario). Inclui o usuário 0 (ADMINISTRADOR/sistema) marcado
 * como `auto` — o front decide se mostra. Canceladas contam como trabalho feito.
 */
export const GET = apiRoute(async (req) => {
  const filters = parseFilters(req.nextUrl.searchParams);
  const w = buildWhere(filters, { alias: "f", incluirCanceladas: true });

  const rows = await query<Row>(
    `with mov as (
       select f.codigousuario, f.codigoempresa, f.cancelada, f.valorcontabil, 'sai'::text lado
         from lctofissai f
        where ${w.sql}
       union all
       select f.codigousuario, f.codigoempresa, f.cancelada, f.valorcontabil, 'ent'::text lado
         from lctofisent f
        where ${w.sql}
     ),
     agg as (
       select codigousuario,
              count(*) filter (where lado = 'ent')::int as notas_ent,
              count(*) filter (where lado = 'sai')::int as notas_sai,
              count(*)::int as notas,
              count(*) filter (where cancelada = '1')::int as canceladas,
              coalesce(sum(valorcontabil) filter (where lado = 'ent'), 0)::float as valor_ent,
              coalesce(sum(valorcontabil) filter (where lado = 'sai'), 0)::float as valor_sai,
              count(distinct codigoempresa)::int as empresas
         from mov
        group by codigousuario
     )
     select a.codigousuario as codigo,
            a.notas_ent, a.notas_sai, a.notas, a.canceladas,
            a.valor_ent, a.valor_sai, a.empresas,
            coalesce(nullif(btrim(u.nomeusuariocompl), ''), nullif(btrim(u.nomeusuario), ''),
                     'Usuário ' || a.codigousuario) as nome,
            (u.databaixausuario is not null) as inativo
       from agg a
       left join usuario u on u.codigousuario = a.codigousuario
      order by a.notas desc`,
    w.params
  );

  return rows.map<ColaboradorProd>((r) => ({
    codigo: r.codigo,
    nome: r.codigo === 0 ? "Sistema" : r.nome,
    auto: r.codigo === 0,
    inativo: r.inativo,
    notasEnt: r.notas_ent,
    notasSai: r.notas_sai,
    notas: r.notas,
    valorEnt: r.valor_ent,
    valorSai: r.valor_sai,
    valor: r.valor_ent + r.valor_sai,
    canceladas: r.canceladas,
    empresas: r.empresas,
  }));
});
