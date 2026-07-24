"use server";

import { redirect } from "next/navigation";
import { appQuery } from "@/lib/app-db";
import { verificarSenha, criarSessao, destruirSessao } from "@/lib/auth";

export interface LoginState {
  erro?: string;
}

/**
 * Login. Roda no servidor (Server Action) — lugar seguro para credenciais. Erro
 * é sempre genérico: não revela se o email existe. Em sucesso, cria a sessão e
 * redireciona (o redirect lança, então nada depois dele roda).
 */
export async function entrar(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe email e senha" };

  const [u] = await appQuery<{ id: string; senha_hash: string }>(
    `select id, senha_hash from usuario where email = $1 and ativo`,
    [email]
  );
  if (!u || !(await verificarSenha(senha, u.senha_hash))) {
    return { erro: "Email ou senha inválidos" };
  }

  await criarSessao(u.id);
  redirect("/");
}

/** Logout: encerra a sessão e volta ao login. */
export async function sair(): Promise<void> {
  await destruirSessao();
  redirect("/login");
}
