"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { esAtajoExpediente } from "../atajos";

/**
 * El desplegable "Editar expediente" de la ficha, con su teclado
 * (`alt+e`, ver `atajos.ts`).
 *
 * Es de cliente por una sola razón, el teclado: el formulario que va adentro y
 * el botón de borrar se siguen renderizando en el servidor y llegan como
 * `children`, así que el componente no sabe nada de lo que contiene.
 *
 * - **`alt+e`** abre y cierra: el mismo atajo para las dos cosas, así no hay
 *   que acordarse de dos.
 * - **`Escape`** cierra, igual que en la nota.
 *
 * Cerrar no pierde nada de lo escrito: un `<details>` cerrado esconde su
 * contenido pero los campos conservan su valor, así que volver a abrirlo
 * muestra lo que había. Lo que guarda sigue siendo el botón del formulario.
 *
 * El `<details>` queda **sin controlar**: los atajos le escriben `open` en el
 * elemento en lugar de manejarlo con estado de React. Abrir y cerrar con el
 * clic es lo que el elemento ya hace solo, y controlarlo obligaría a replicar
 * ese comportamiento con un `onToggle` para no pelearse con el navegador.
 */
export function EditarExpediente({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const detalle = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function abrir(elemento: HTMLDetailsElement): void {
      elemento.open = true;
      // Al cuadro, que puede estar fuera de la pantalla, y el foco al primer
      // campo: el atajo tiene que dejar listo para escribir y no solo abrir.
      elemento.scrollIntoView({ block: "nearest", behavior: "smooth" });
      elemento.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea")?.focus();
    }

    function cerrar(elemento: HTMLDetailsElement): void {
      elemento.open = false;
      // El foco al rótulo del desplegable. Si se deja en el campo que acaba de
      // esconderse, el navegador lo manda al cuerpo del documento y quien venía
      // navegando con el teclado pierde el lugar.
      elemento.querySelector<HTMLElement>("summary")?.focus();
    }

    function alPresionar(evento: KeyboardEvent): void {
      const elemento = detalle.current;
      if (!elemento || evento.repeat) return;

      if (esAtajoExpediente(evento)) {
        // En Chrome `Alt+E` abre el menú de tres puntos: acá manda el
        // formulario del expediente. Si el navegador no cede el atajo, la letra
        // se cambia en `atajos.ts` y esta pantalla no se toca.
        evento.preventDefault();
        if (elemento.open) cerrar(elemento);
        else abrir(elemento);
        return;
      }

      if (evento.key !== "Escape" || !elemento.open) return;
      /*
       * Escape adentro del editor de la nota es **de la nota**, que ahí guarda
       * y cierra. Sin esta salvedad, una nota abierta encima de un formulario
       * abierto cerraría las dos cosas con una sola tecla, y el formulario
       * —que es lo que el abogado no estaba mirando— se cerraría sin que se
       * entienda por qué.
       */
      const destino = evento.target;
      if (destino instanceof HTMLElement && destino.isContentEditable) return;

      evento.preventDefault();
      cerrar(elemento);
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  return (
    <details ref={detalle} className={className}>
      {children}
    </details>
  );
}
