"use client";

import { useActionState } from "react";
import { entrar, type LoginState } from "./actions";

const INICIAL: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(entrar, INICIAL);

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-2">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          className="h-10 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-ent/50"
          placeholder="voce@navecon.com.br"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-2">Senha</span>
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="h-10 rounded-lg border border-hairline bg-surface px-3 text-sm text-ink outline-none placeholder:text-muted focus:border-ent/50"
          placeholder="••••••••"
        />
      </label>

      {state.erro && (
        <p role="alert" className="text-xs font-medium text-critical">
          {state.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-10 rounded-lg bg-ent px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
