"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { appPool } from "@/lib/app-db";
import { hashSenha } from "@/lib/auth";
import { assertAdmin } from "@/lib/sessao";
import { MODULOS, secoesDoModulo } from "@/lib/modulos";

/** Conjunto válido de "modulo/secao" — barra chaves forjadas no form. */
function secoesValidas(): Set<string> {
  const s = new Set<string>();
  for (const m of MODULOS) for (const sec of secoesDoModulo(m.id)) s.add(`${m.id}/${sec.id}`);
  return s;
}

type Q = (sql: string, p?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

async function comTransacao<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  const client = await appPool.connect();
  try {
    await client.query("begin");
    const r = await fn((sql, p) => client.query(sql, p));
    await client.query("commit");
    return r;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

// ------------------------------------------------------------------ Usuários

export async function salvarUsuario(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const ativo = formData.get("ativo") === "on";
  const admin = formData.get("admin") === "on";
  const todasEmpresas = admin || formData.get("todas_empresas") === "on";

  if (!nome || !email) throw new Error("Nome e email são obrigatórios");
  if (!id && !senha) throw new Error("Defina uma senha para o novo usuário");

  // Perfil por seção: chaves "sec:<modulo>:<secao>" com valor view|edit (none
  // = ausente). Só as chaves válidas entram.
  const validas = secoesValidas();
  const perfis: { modulo: string; secao: string; nivel: string }[] = [];
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("sec:")) continue;
    const nivel = String(v);
    if (nivel !== "view" && nivel !== "edit") continue;
    const [, modulo, secao] = k.split(":");
    if (validas.has(`${modulo}/${secao}`)) perfis.push({ modulo, secao, nivel });
  }

  const grupos = formData.getAll("grupos").map((g) => Number(g)).filter(Number.isInteger);
  const empresas = formData.getAll("empresas").map((e) => Number(e)).filter(Number.isInteger);

  const senhaHash = senha ? await hashSenha(senha) : null;

  await comTransacao(async (q) => {
    let usuarioId = id;
    if (id) {
      await q(
        `update usuario set nome = $2, email = $3, ativo = $4, admin = $5, todas_empresas = $6
           ${senhaHash ? ", senha_hash = $7" : ""}
         where id = $1`,
        senhaHash ? [id, nome, email, ativo, admin, todasEmpresas, senhaHash] : [id, nome, email, ativo, admin, todasEmpresas]
      );
    } else {
      const { rows } = await q(
        `insert into usuario (nome, email, senha_hash, ativo, admin, todas_empresas)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [nome, email, senhaHash, ativo, admin, todasEmpresas]
      );
      usuarioId = rows[0].id as string;
    }

    // Perfil, grupos e empresas: recria do zero (o form é a verdade completa).
    await q(`delete from usuario_secao where usuario_id = $1`, [usuarioId]);
    for (const p of perfis) {
      await q(
        `insert into usuario_secao (usuario_id, modulo, secao, nivel) values ($1, $2, $3, $4)`,
        [usuarioId, p.modulo, p.secao, p.nivel]
      );
    }
    await q(`delete from usuario_grupo where usuario_id = $1`, [usuarioId]);
    for (const g of grupos) {
      await q(`insert into usuario_grupo (usuario_id, grupo_id) values ($1, $2)`, [usuarioId, g]);
    }
    await q(`delete from usuario_empresa where usuario_id = $1`, [usuarioId]);
    for (const e of empresas) {
      await q(`insert into usuario_empresa (usuario_id, codigoempresa) values ($1, $2)`, [usuarioId, e]);
    }
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function excluirUsuario(formData: FormData): Promise<void> {
  const sessao = await assertAdmin();
  const id = String(formData.get("id") ?? "");
  // Um admin não se exclui sozinho (evita ficar sem nenhum admin por engano).
  if (id && id !== sessao.usuario.id) {
    await appPool.query(`delete from usuario where id = $1`, [id]);
  }
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

// -------------------------------------------------------------------- Grupos

export async function salvarGrupo(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) throw new Error("Dê um nome ao grupo");
  const empresas = formData.getAll("empresas").map((e) => Number(e)).filter(Number.isInteger);

  await comTransacao(async (q) => {
    let grupoId = id;
    if (Number.isInteger(id) && id > 0) {
      await q(`update empresa_grupo set nome = $2 where id = $1`, [id, nome]);
    } else {
      const { rows } = await q(
        `insert into empresa_grupo (nome) values ($1) returning id`,
        [nome]
      );
      grupoId = rows[0].id as number;
    }
    await q(`delete from empresa_grupo_item where grupo_id = $1`, [grupoId]);
    for (const e of empresas) {
      await q(`insert into empresa_grupo_item (grupo_id, codigoempresa) values ($1, $2)`, [grupoId, e]);
    }
  });

  revalidatePath("/admin/grupos");
  redirect("/admin/grupos");
}

export async function excluirGrupo(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await appPool.query(`delete from empresa_grupo where id = $1`, [id]);
  }
  revalidatePath("/admin/grupos");
  redirect("/admin/grupos");
}
