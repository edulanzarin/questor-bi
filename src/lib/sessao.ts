import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { ModuloId } from "./modulos";

/**
 * Seam de permissão do Hub, no servidor.
 *
 * A doutrina (Brain: "Permissão se valida no servidor, não na interface"):
 * o cliente esconde por conveniência, mas quem TRANCA é o servidor — em toda
 * rota, sempre. E permissão é PERFIL POR MÓDULO, não por cargo: o setor é
 * rótulo (quem a pessoa é), o perfil é a regra (view/edit por módulo).
 *
 * Hoje `getSessao` é um STUB (admin de dev com tudo liberado). Quando o login
 * entrar, só ele muda — lê o cookie de sessão e o banco do app (usuario +
 * usuario_modulo). Todo o resto (launcher, layouts, apiRoute) já passa por
 * aqui, então nada precisa ser retrofitado.
 */

export type Nivel = "view" | "edit";

export interface Sessao {
  usuario: { id: string; nome: string; setor: string };
  /** Perfil por módulo. Módulo ausente = sem acesso. */
  modulos: Partial<Record<ModuloId, Nivel>>;
}

/**
 * STUB até o login existir. `cache` memoiza por render, então várias checagens
 * na mesma requisição compartilham um resultado só.
 */
export const getSessao = cache(async (): Promise<Sessao> => {
  return {
    usuario: { id: "dev", nome: "Desenvolvimento", setor: "admin" },
    modulos: { fiscal: "edit", contabil: "edit", folha: "edit" },
  };
});

/** `view` é satisfeito por view ou edit; `edit` só por edit. */
export function satisfaz(nivel: Nivel | undefined, minimo: Nivel): boolean {
  if (!nivel) return false;
  return minimo === "view" ? true : nivel === "edit";
}

export async function podeAcessar(modulo: ModuloId, minimo: Nivel = "view"): Promise<boolean> {
  return satisfaz((await getSessao()).modulos[modulo], minimo);
}

/**
 * Gate de página/layout: nega mandando de volta ao launcher. É a checagem
 * OTIMISTA (some do menu o que a pessoa não acessa). Ela não é a tranca: layout
 * não re-roda em navegação client-side — quem de fato barra é o gate das rotas
 * de API, checado a cada requisição em `apiRoute`.
 */
export async function assertAcesso(modulo: ModuloId, minimo: Nivel = "view"): Promise<Sessao> {
  const sessao = await getSessao();
  if (!satisfaz(sessao.modulos[modulo], minimo)) redirect("/");
  return sessao;
}
