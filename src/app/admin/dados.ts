import "server-only";
import { appQuery } from "@/lib/app-db";
import { query } from "@/lib/db";
import type { Nivel } from "@/lib/sessao";

/**
 * Leituras da área admin. Usuários/grupos vêm do banco do app; a lista de
 * empresas vem do Questor (read-only) — o admin monta o escopo escolhendo entre
 * TODAS as empresas, independente do escopo dele.
 */

export interface UsuarioDetalhe {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  admin: boolean;
  todas_empresas: boolean;
  secoes: Record<string, Nivel>; // "modulo/secao" -> nivel
  grupos: number[];
  empresas: number[];
}

export async function carregarUsuario(id: string): Promise<UsuarioDetalhe | null> {
  const [u] = await appQuery<{
    id: string;
    nome: string;
    email: string;
    ativo: boolean;
    admin: boolean;
    todas_empresas: boolean;
  }>(
    `select id, nome, email, ativo, admin, todas_empresas from usuario where id = $1`,
    [id]
  );
  if (!u) return null;

  const [secoes, grupos, empresas] = await Promise.all([
    appQuery<{ modulo: string; secao: string; nivel: Nivel }>(
      `select modulo, secao, nivel from usuario_secao where usuario_id = $1`,
      [id]
    ),
    appQuery<{ grupo_id: number }>(`select grupo_id from usuario_grupo where usuario_id = $1`, [id]),
    appQuery<{ codigoempresa: number }>(
      `select codigoempresa from usuario_empresa where usuario_id = $1`,
      [id]
    ),
  ]);

  const secMap: Record<string, Nivel> = {};
  for (const s of secoes) secMap[`${s.modulo}/${s.secao}`] = s.nivel;

  return {
    ...u,
    secoes: secMap,
    grupos: grupos.map((g) => g.grupo_id),
    empresas: empresas.map((e) => e.codigoempresa),
  };
}

export interface GrupoResumo {
  id: number;
  nome: string;
  empresas: number;
}

export async function listarGrupos(): Promise<GrupoResumo[]> {
  return appQuery<GrupoResumo>(
    `select g.id, g.nome, count(i.codigoempresa)::int as empresas
       from empresa_grupo g
       left join empresa_grupo_item i on i.grupo_id = g.id
      group by g.id
      order by g.nome`
  );
}

export interface GrupoDetalhe {
  id: number;
  nome: string;
  empresas: number[];
}

export async function carregarGrupo(id: number): Promise<GrupoDetalhe | null> {
  const [g] = await appQuery<{ id: number; nome: string }>(
    `select id, nome from empresa_grupo where id = $1`,
    [id]
  );
  if (!g) return null;
  const itens = await appQuery<{ codigoempresa: number }>(
    `select codigoempresa from empresa_grupo_item where grupo_id = $1`,
    [id]
  );
  return { ...g, empresas: itens.map((i) => i.codigoempresa) };
}

export interface EmpresaOpcao {
  codigo: number;
  nome: string;
}

/** Todas as empresas do Questor — para o admin escolher o escopo. */
export async function listarTodasEmpresas(): Promise<EmpresaOpcao[]> {
  return query<EmpresaOpcao>(
    `select codigoempresa as codigo, nomeempresa as nome from empresa order by nomeempresa`
  );
}
