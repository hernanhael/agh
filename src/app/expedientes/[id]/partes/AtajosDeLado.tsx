"use client";

import { useEffect } from "react";
import { useLadosPlegados } from "../LadosPlegados";
import { ATAJOS_LADO, esAtajoDeLado } from "../atajos";

/**
 * El teclado de la nómina de partes (docs/02-expedientes.md §2.14).
 *
 * **`alt` con la inicial del lado lo abre y lo cierra**: `alt+a` la parte
 * actora, `alt+d` la demandada, `alt+g` la citada en garantía, `alt+t` los
 * terceros, `alt+j` los auxiliares del juzgado (`atajos.ts`). Lo que hace
 * depende de dónde está el lado y dónde está el foco:
 *
 * - **Plegado**: lo despliega y pone el foco en su primera parte.
 * - **Abierto, con el foco afuera**: lleva el foco a su primera parte. Como los
 *   lados arrancan abiertos, este es el caso de la primera pulsación, y cerrar
 *   de entrada lo que se fue a buscar sería al revés de lo que se quiere.
 * - **Abierto, con el foco adentro**: lo pliega, y el foco queda en el nombre
 *   del lado, para poder volver a abrirlo con Enter.
 *
 * **Una vez adentro se camina con las flechas, y sin salir del lado**: ↓ a la
 * parte siguiente y ↑ a la anterior, y en los extremos **dan la vuelta** —desde
 * el último actor, ↓ vuelve al primer actor; desde el primero, ↑ va al
 * último—. Para pasar a otro lado hay que usar su atajo: `alt+d` para la
 * demandada. El lado en el que se entró con su atajo es el lugar de trabajo, y
 * que una flecha de más lo sacara a la demandada sin avisar era perder dónde
 * se estaba.
 *
 * Desde el nombre de un lado abierto —donde queda el foco al plegarlo y
 * volverlo a abrir con Enter—, ↓ entra a su primera parte y ↑ a la última. Solo
 * se toman **cuando el foco está en una parte o en el nombre de un lado**: en
 * un campo del formulario de una ficha abierta, o en cualquier otro lado de la
 * página, ↑ y ↓ siguen siendo del navegador.
 *
 * **Lo que recibe el foco es el `<summary>` de cada parte**, que es lo que se
 * abre con Enter: `alt+a`, Enter, y la ficha de ese actor está abierta. El
 * selector baja por hijos directos —`> li > details > summary`— y no por
 * descendientes, porque adentro de una parte abierta hay otros `<summary>`: el
 * "Editar" de la parte y el de cada uno de sus letrados.
 *
 * **No dibuja nada**: escucha el teclado y lee la pantalla. Los renglones los
 * arma el servidor con un `data-lado` en cada lista y un `data-lado-boton` en
 * cada cabecera (`LadoPlegable`), así que el orden del foco es el de la
 * pantalla y no una lista aparte que haya que mantener al día.
 */

/** Las partes de un lado, o de todos, en el orden de la pantalla. */
function partesDe(lado?: string): HTMLElement[] {
  const filtro = lado ? `[data-lado="${lado}"]` : "[data-lado]";
  return Array.from(document.querySelectorAll<HTMLElement>(`${filtro} > li > details > summary`));
}

function botonDe(lado: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-lado-boton="${lado}"]`);
}

function enfocar(elemento: HTMLElement): void {
  elemento.focus();
  elemento.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/**
 * ↑ y ↓ entre las partes **del mismo lado**, dando la vuelta en los extremos.
 * Devuelve `true` si la tecla era suya, para que el llamador no siga buscando
 * atajos.
 */
function moverConFlechas(evento: KeyboardEvent): boolean {
  if (evento.key !== "ArrowDown" && evento.key !== "ArrowUp") return false;
  if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return false;

  const activo = document.activeElement as HTMLElement | null;
  if (!activo) return false;
  const abajo = evento.key === "ArrowDown";

  // Desde el nombre de un lado abierto: ↓ entra a la primera parte, ↑ a la
  // última. Plegado no hay adónde entrar, y la tecla sigue siendo del
  // navegador.
  const ladoDelBoton = activo.dataset.ladoBoton;
  if (ladoDelBoton) {
    const partes = partesDe(ladoDelBoton);
    if (activo.getAttribute("aria-expanded") !== "true" || partes.length === 0) return false;
    evento.preventDefault();
    enfocar(abajo ? partes[0] : partes[partes.length - 1]);
    return true;
  }

  // Desde una parte: la siguiente o la anterior de su lado, y nunca de otro.
  const lado = activo.closest<HTMLElement>("[data-lado]")?.dataset.lado;
  if (!lado) return false;
  const partes = partesDe(lado);
  const actual = partes.indexOf(activo);
  // Un `summary` de adentro de una ficha abierta —el "Editar"— está dentro del
  // lado pero no es una parte: ahí las flechas siguen siendo del navegador.
  if (actual === -1) return false;

  evento.preventDefault();
  const largo = partes.length;
  enfocar(partes[(actual + (abajo ? 1 : -1) + largo) % largo]);
  return true;
}

export function AtajosDeLado() {
  const { plegado, fijar } = useLadosPlegados();

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent): void {
      // Las flechas van antes que la salvedad de la tecla sostenida: dejar
      // apretada ↓ sí tiene que bajar de parte en parte, como en cualquier lista.
      if (moverConFlechas(evento)) return;

      // Un atajo sostenido no abre y cierra el lado en ráfaga: se toma de a una
      // pulsación. Es la misma salvedad que hace `Desplegable`.
      if (evento.repeat) return;

      const atajo = ATAJOS_LADO.find((candidato) =>
        candidato.codigos.some((codigo) => esAtajoDeLado(evento, codigo)),
      );
      if (!atajo) return;

      // Un lado que la pestaña no dibuja —no hay terceros— deja pasar el atajo:
      // `alt+t` tiene que seguir siendo del navegador y no algo que no hace nada.
      const boton = botonDe(atajo.lado);
      if (!boton) return;
      evento.preventDefault();

      if (plegado(atajo.lado)) {
        fijar(atajo.lado, false);
        // La lista recién deja de estar oculta en el próximo pintado: antes de
        // eso, el foco no puede entrar en una parte que no se ve.
        requestAnimationFrame(() => {
          const [primera] = partesDe(atajo.lado);
          enfocar(primera ?? boton);
        });
        return;
      }

      const activo = document.activeElement;
      const lista = document.querySelector(`[data-lado="${atajo.lado}"]`);
      const adentro = activo === boton || Boolean(activo && lista?.contains(activo));
      if (adentro) {
        fijar(atajo.lado, true);
        enfocar(boton);
        return;
      }

      const [primera] = partesDe(atajo.lado);
      enfocar(primera ?? boton);
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [plegado, fijar]);

  return null;
}
