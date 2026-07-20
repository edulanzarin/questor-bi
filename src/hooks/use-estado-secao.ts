"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { guardarEstado, idDaSecao, lerEstado } from "@/lib/estado-secao";

/**
 * `useState` que sobrevive à troca de abas dentro da seção e é descartado ao
 * sair dela — quem descarta é o shell, que sabe qual seção está ativa.
 *
 * Seção e página saem do caminho, então a tela só declara o nome do campo, e
 * `campo` só precisa ser único dentro da própria página: duas abas da mesma
 * seção podem ter cada uma a sua `busca` sem uma enxergar a da outra.
 */
export function useEstadoSecao<T>(
  campo: string,
  inicial: T
): [T, Dispatch<SetStateAction<T>>] {
  const pagina = usePathname();
  const secao = idDaSecao(pagina);

  const [valor, setValor] = useState<T>(() => {
    const guardado = lerEstado<T>(secao, pagina, campo);
    return guardado === undefined ? inicial : guardado;
  });

  const definir = useCallback<Dispatch<SetStateAction<T>>>(
    (acao) => {
      setValor((anterior) => {
        const proximo = typeof acao === "function" ? (acao as (a: T) => T)(anterior) : acao;
        guardarEstado(secao, pagina, campo, proximo);
        return proximo;
      });
    },
    [secao, pagina, campo]
  );

  return [valor, definir];
}
