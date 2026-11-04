"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * **Qué lados de la nómina están plegados**, mientras el abogado está adentro de
 * un expediente (docs/02-expedientes.md §2.14).
 *
 * La pestaña Partes arranca con todos los lados abiertos. Si el abogado pliega
 * uno —la parte actora, los auxiliares— y se va a Datos o a Historia, al volver
 * lo encuentra como lo dejó: lo plegó porque no lo quería ver, y esa decisión
 * vale mientras siga trabajando en ese expediente. Cuando sale al listado de
 * expedientes, se olvida, y la próxima vez que entra está todo abierto otra
 * vez.
 *
 * **Por eso vive en el layout del expediente y no en la pestaña, ni en el
 * navegador.** El layout es lo que React conserva al cambiar de pestaña y lo
 * que se desmonta al salir a `/expedientes`, así que su ciclo de vida es
 * exactamente esa "sesión": no hace falta contar navegaciones ni borrar nada a
 * mano. Guardarlo en `sessionStorage` lo haría sobrevivir a la salida al
 * listado, que es justo lo que no se pidió. El layout lo monta con la `key` del
 * expediente, para que pasar de un expediente a otro empiece de cero aunque
 * React decidiera reusar el árbol.
 */

interface ValorLados {
  /** Si el lado está plegado. */
  plegado: (lado: string) => boolean;
  /** Pliega o despliega el lado. */
  fijar: (lado: string, plegado: boolean) => void;
}

const ContextoLados = createContext<ValorLados | null>(null);

export function LadosPlegados({ children }: { children: ReactNode }) {
  const [plegados, setPlegados] = useState<ReadonlySet<string>>(() => new Set());

  const valor = useMemo<ValorLados>(
    () => ({
      plegado: (lado) => plegados.has(lado),
      fijar: (lado, plegar) =>
        setPlegados((anteriores) => {
          if (anteriores.has(lado) === plegar) return anteriores;
          const siguientes = new Set(anteriores);
          if (plegar) siguientes.add(lado);
          else siguientes.delete(lado);
          return siguientes;
        }),
    }),
    [plegados],
  );

  return <ContextoLados.Provider value={valor}>{children}</ContextoLados.Provider>;
}

/**
 * El estado de los lados. Afuera del layout del expediente no hay a quién
 * preguntarle, así que devuelve uno que tiene todo abierto y no recuerda nada:
 * la pestaña se sigue viendo bien aunque se la renderice suelta.
 */
export function useLadosPlegados(): ValorLados {
  return useContext(ContextoLados) ?? SIN_MEMORIA;
}

const SIN_MEMORIA: ValorLados = { plegado: () => false, fijar: () => {} };
