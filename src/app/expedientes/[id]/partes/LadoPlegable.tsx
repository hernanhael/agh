"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useLadosPlegados } from "../LadosPlegados";

/**
 * Un **lado de la nómina que se pliega y se despliega**: la parte actora, la
 * demandada, la citada, los terceros o los auxiliares (docs/02-expedientes.md
 * §2.14).
 *
 * La cabecera es un botón —el nombre del lado con una flecha— y debajo van sus
 * renglones. Arranca abierto; si el abogado lo pliega, queda plegado mientras
 * siga en este expediente, aunque se vaya a otra pestaña, y se abre de nuevo
 * cuando sale al listado (`LadosPlegados`). Plegado, la cabecera dice cuántas
 * partes tiene adentro, para que plegar no sea olvidarse de que están.
 *
 * Los renglones los arma el servidor y llegan como `children`: este componente
 * solo decide si se ven. Plegado no los desmonta, los oculta con `hidden`, así
 * que una ficha abierta adentro sigue abierta al desplegar, y los atajos los
 * saltean porque no se ven (`AtajosDeLado`).
 *
 * El `data-lado` de la lista es lo que leen los atajos para saber qué partes
 * recorrer, y el `data-lado-boton` de la cabecera, a qué botón volver al
 * plegar con el teclado.
 */
export function LadoPlegable({
  lado,
  titulo,
  color,
  atajo,
  cantidad,
  separado,
  children,
}: {
  lado: string;
  titulo: string;
  /** El color del lado (`colorDeLado`), para la flecha. */
  color: string;
  /** La pista del atajo que lo abre y lo cierra, si tiene. */
  atajo: string;
  cantidad: number;
  /** Si lleva la línea que lo separa del lado de arriba. */
  separado: string;
  children: ReactNode;
}) {
  const { plegado, fijar } = useLadosPlegados();
  const cerrado = plegado(lado);
  const idLista = `lado-${lado}`;

  return (
    <div className={separado}>
      <div className="flex items-baseline px-2 pb-1">
        {/*
          El botón arranca donde arrancan los nombres de abajo: el lado se
          nombra a la misma altura que sus partes. No hay títulos de columna,
          porque no hay columnas: lo que acompaña a cada parte va pegado a su
          nombre. **La flecha va a la derecha del nombre y lleva
          el color del lado** —azul la actora, naranja la demandada—: es el
          único lugar donde la nómina muestra ese color, en vez de repetir un
          círculo en cada persona, y es el mismo que va a identificar al lado
          en la historia. Apunta a la derecha plegado y hacia abajo abierto,
          que es la convención de cualquier lista que se pliega. Después, la
          pista de su atajo, que aparece **solo mientras el mouse está sobre el
          título**.

          La pista no se prende con el foco, y es a propósito: al hacer clic en
          el título para plegarlo, el botón se queda con el foco, y la pista
          quedaba encendida mientras el mouse ya andaba por las partes de abajo
          —se veía "alt+j" al pasar por la perito—. Con el hover solo, aparece
          donde está el mouse y en ningún otro lado.

          **El título no cambia de color, ni con el mouse ni con el foco.** Es
          una categoría y no algo que se elige. Cuando el foco llega por el
          teclado —con las flechas, o al plegarlo con su atajo— se subraya con
          puntos. Es `focus-visible` y no `focus` para que un clic no lo deje
          subrayado: con el mouse ya se sabe dónde se hizo clic.
        */}
        <button
          type="button"
          data-lado-boton={lado}
          aria-expanded={!cerrado}
          aria-controls={idLista}
          onClick={() => fijar(lado, !cerrado)}
          className="group/titulo rotulo flex min-w-0 cursor-pointer items-center gap-1 text-left text-zinc-500 underline-offset-4 outline-none focus-visible:underline focus-visible:decoration-dotted dark:text-zinc-400"
        >
          <span className="truncate">{titulo}</span>
          <ChevronRight
            aria-hidden
            strokeWidth={2.5}
            style={{ color }}
            className={`size-3.5 shrink-0 transition-transform duration-150 ${cerrado ? "" : "rotate-90"}`}
          />
          {cerrado ? (
            <span className="tabular-nums text-zinc-400 dark:text-zinc-600">· {cantidad}</span>
          ) : null}
          {atajo ? (
            <span
              aria-hidden
              className="rotulo-tecla ml-1 text-zinc-300 opacity-0 transition-opacity duration-150 group-hover/titulo:opacity-100 dark:text-zinc-700"
            >
              {atajo}
            </span>
          ) : null}
        </button>
      </div>
      <ul id={idLista} data-lado={lado} hidden={cerrado}>
        {children}
      </ul>
    </div>
  );
}
