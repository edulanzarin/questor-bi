import type { QueryClient } from "@tanstack/react-query";

/**
 * O extrato lido fica no cache do React Query para sobreviver à troca de abas
 * dentro da Conciliação — o uso normal é ver uma pendência, ir cadastrar a
 * regra na aba Regras e voltar.
 *
 * Sair da seção libera tudo: guardar um extrato inteiro na memória enquanto o
 * usuário trabalha em outro assunto não serve para nada, e voltar dias depois
 * num extrato esquecido é pior do que carregar de novo.
 */
export const CHAVES_CONCILIACAO = [
  ["conciliacao-extrato"],
  ["conciliacao-conta"],
  ["conciliacao-ajustes"],
] as const;

export function limparConciliacao(queryClient: QueryClient): void {
  for (const chave of CHAVES_CONCILIACAO) queryClient.removeQueries({ queryKey: chave });
}
