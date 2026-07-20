"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { guardarEstado, idDaSecao, lerEstado } from "@/lib/estado-secao";

/**
 * `useState` que sobrevive à troca de abas dentro da seção e é descartado ao
 * sair dela — quem descarta é o shell, que sabe qual seção está ativa.
 *
 * A seção sai do caminho, então a tela só declara o nome do campo. `campo`
 * precisa ser único dentro da seção.
 */
export function useEstadoSecao<T>(
  campo: string,
  inicial: T
): [T, Dispatch<SetStateAction<T>>] {
  const secao = idDaSecao(usePathname());

  const [valor, setValor] = useState<T>(() => {
    const guardado = lerEstado<T>(secao, campo);
    return guardado === undefined ? inicial : guardado;
  });

  const definir = useCallback<Dispatch<SetStateAction<T>>>(
    (acao) => {
      setValor((anterior) => {
        const proximo = typeof acao === "function" ? (acao as (a: T) => T)(anterior) : acao;
        guardarEstado(secao, campo, proximo);
        return proximo;
      });
    },
    [secao, campo]
  );

  return [valor, definir];
}
