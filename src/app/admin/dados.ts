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
  cargo: string | null;
  setor: string | null;
  telefone: string | null;
  ativo: boolean;
  admin: boolean;
  todas_empresas: boolean;
  /** Timestamp da foto (ms), para cache-buster no <img>; null = sem foto. */
  avatarVersao: number | null;
  secoes: Record<string, Nivel>; // "modulo/secao" -> nivel
  grupos: number[];
  empresas: number[];
}

export async function carregarUsuario(id: string): Promise<UsuarioDetalhe | null> {
  const [u] = await appQuery<{
    id: string;
    nome: string;
    email: string;
    cargo: string | null;
    setor: string | null;
    telefone: string | null;
    ativo: boolean;
    admin: boolean;
    todas_empresas: boolean;
    avatar_versao: string | null;
  }>(
    `select u.id, u.nome, u.email, u.cargo, u.setor, u.telefone, u.ativo, u.admin, u.todas_empresas,
            extract(epoch from a.atualizado_em) * 1000 as avatar_versao
       from usuario u
       left join usuario_avatar a on a.usuario_id = u.id
      where u.id = $1`,
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
    id: u.id,
    nome: u.nome,
    email: u.email,
    cargo: u.cargo,
    setor: u.setor,
    telefone: u.telefone,
    ativo: u.ativo,
    admin: u.admin,
    todas_empresas: u.todas_empresas,
    avatarVersao: u.avatar_versao != null ? Math.round(Number(u.avatar_versao)) : null,
    secoes: secMap,
    grupos: grupos.map((g) => g.grupo_id),
    empresas: empresas.map((e) => e.codigoempresa),
  };
}

export interface UsuarioLista {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  setor: string | null;
  ativo: boolean;
  admin: boolean;
  todas_empresas: boolean;
  secoes: number;
  ultimo_acesso: string | null;
  avatarVersao: number | null;
}

/** Lista de usuários para a tela de administração (rica, ordenada por nome). */
export async function listarUsuarios(): Promise<UsuarioLista[]> {
  const rows = await appQuery<{
    id: string;
    nome: string;
    email: string;
    cargo: string | null;
    setor: string | null;
    ativo: boolean;
    admin: boolean;
    todas_empresas: boolean;
    secoes: number;
    ultimo_acesso: string | null;
    avatar_versao: string | null;
  }>(
    `select u.id, u.nome, u.email, u.cargo, u.setor, u.ativo, u.admin, u.todas_empresas,
            count(s.secao)::int as secoes,
            to_char(u.ultimo_acesso, 'YYYY-MM-DD"T"HH24:MI:SS') as ultimo_acesso,
            extract(epoch from a.atualizado_em) * 1000 as avatar_versao
       from usuario u
       left join usuario_secao s on s.usuario_id = u.id
       left join usuario_avatar a on a.usuario_id = u.id
      group by u.id, a.atualizado_em
      order by u.nome`
  );
  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    cargo: r.cargo,
    setor: r.setor,
    ativo: r.ativo,
    admin: r.admin,
    todas_empresas: r.todas_empresas,
    secoes: r.secoes,
    ultimo_acesso: r.ultimo_acesso,
    avatarVersao: r.avatar_versao != null ? Math.round(Number(r.avatar_versao)) : null,
  }));
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
