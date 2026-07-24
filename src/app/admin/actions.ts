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
  const limpo = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s || null;
  };
  const cargo = limpo(formData.get("cargo"));
  const setor = limpo(formData.get("setor"));
  const telefone = limpo(formData.get("telefone"));
  const ativo = formData.get("ativo") === "on";
  const admin = formData.get("admin") === "on";
  const todasEmpresas = admin || formData.get("todas_empresas") === "on";

  if (!nome || !email) throw new Error("Nome e email são obrigatórios");
  if (!id && !senha) throw new Error("Defina uma senha para o novo usuário");

  // Foto de perfil: arquivo novo (substitui) ou pedido de remoção. Valida tipo e
  // tamanho no servidor — nunca confiar no accept do input.
  const removerFoto = formData.get("remover_foto") === "on";
  const arquivo = formData.get("avatar");
  let avatar: { mime: string; bytes: Buffer } | null = null;
  if (arquivo instanceof File && arquivo.size > 0) {
    if (!arquivo.type.startsWith("image/")) throw new Error("A foto precisa ser uma imagem");
    if (arquivo.size > 2 * 1024 * 1024) throw new Error("A foto deve ter no máximo 2 MB");
    avatar = { mime: arquivo.type, bytes: Buffer.from(await arquivo.arrayBuffer()) };
  }

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
        `update usuario set nome = $2, email = $3, cargo = $4, setor = $5, telefone = $6,
                ativo = $7, admin = $8, todas_empresas = $9
           ${senhaHash ? ", senha_hash = $10" : ""}
         where id = $1`,
        senhaHash
          ? [id, nome, email, cargo, setor, telefone, ativo, admin, todasEmpresas, senhaHash]
          : [id, nome, email, cargo, setor, telefone, ativo, admin, todasEmpresas]
      );
    } else {
      const { rows } = await q(
        `insert into usuario (nome, email, cargo, setor, telefone, senha_hash, ativo, admin, todas_empresas)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
        [nome, email, cargo, setor, telefone, senhaHash, ativo, admin, todasEmpresas]
      );
      usuarioId = rows[0].id as string;
    }

    // Foto: remoção explícita ou upsert do arquivo novo (mantém a atual se nada
    // veio no form).
    if (removerFoto) {
      await q(`delete from usuario_avatar where usuario_id = $1`, [usuarioId]);
    } else if (avatar) {
      await q(
        `insert into usuario_avatar (usuario_id, mime, bytes, atualizado_em)
         values ($1, $2, $3, now())
         on conflict (usuario_id) do update
           set mime = excluded.mime, bytes = excluded.bytes, atualizado_em = now()`,
        [usuarioId, avatar.mime, avatar.bytes]
      );
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
