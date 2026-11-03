"use client";

import { useEffect } from "react";
import { ATAJOS_LADO, esAtajoDeLado } from "../atajos";

/**
 * Los atajos que **recorren el tablero de partes**: `alt+a` a la parte actora,
 * `alt+d` a la demandada, `alt+g` a la citada en garantía, `alt+t` a los
 * terceros (`atajos.ts`).
 *
 * Son secuenciales. La primera vez el foco va a la primera parte de ese lado, y
 * cada repetición de la tecla con el `alt` apretado pasa a la siguiente, hasta
 * volver a la primera: en un juicio con tres actores, `alt+a` tres veces los
 * recorre a los tres.
 *
 * **No dibuja nada**: es un componente de cliente que solo escucha el teclado,
 * igual que `Desplegable` pero sin contenido. El tablero lo renderiza el
 * servidor y lo único que necesita de él es el atributo `data-lado` en cada
 * grupo, así que este componente no recibe ni una prop: lee la pantalla.
 *
 * **Lo que recibe el foco es el `<summary>` de cada parte**, que es lo que se
 * abre con Enter. Así el atajo deja el teclado listo para la acción siguiente:
 * `alt+a`, Enter, y la ficha de ese actor está abierta.
 *
 * El selector baja por hijos directos —`> li > details > summary`— y no por
 * descendientes, porque adentro de una parte abierta hay otros `<summary>`: el
 * "Editar" de la parte y el de cada uno de sus letrados. Con el selector de
 * descendientes, `alt+a` iría a parar a un "Editar".
 */
export function AtajosDeLado() {
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent): void {
      // Una tecla sostenida no recorre el tablero sola: el atajo avanza de a
      // una pulsación, que es el gesto que se pidió (alt apretado, la letra
      // repetida). Es la misma salvedad que hace `Desplegable`.
      if (evento.repeat) return;

      const atajo = ATAJOS_LADO.find((candidato) =>
        candidato.codigos.some((codigo) => esAtajoDeLado(evento, codigo)),
      );
      if (!atajo) return;

      const partes = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-lado="${atajo.lado}"] > li > details > summary`,
        ),
      );
      // Un lado vacío deja pasar el atajo: si la pestaña no tiene terceros,
      // `alt+t` tiene que seguir siendo del navegador y no un atajo que no
      // hace nada.
      if (partes.length === 0) return;

      evento.preventDefault();
      // Con el foco afuera del lado, `indexOf` da -1 y el módulo lleva a la
      // primera. Con el foco en la última, vuelve a la primera.
      const actual = partes.indexOf(document.activeElement as HTMLElement);
      const siguiente = partes[(actual + 1) % partes.length];
      siguiente.focus();
      siguiente.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  return null;
}
