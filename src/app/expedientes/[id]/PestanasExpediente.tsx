"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PESTANAS, rutaPestana, teclaDePestana } from "./pestanas";

/**
 * Tira de pestañas del expediente, en la cabecera del cuadro.
 *
 * Es el mismo dibujo que el riel de áreas de la barra lateral
 * (`components/Nav.tsx`) traído adentro del expediente: ícono arriba, rótulo
 * debajo, y el azul de acento reservado para marcar la pestaña abierta. Las seis
 * se reparten todo el ancho del cuadro, así que cada una es un blanco grande y
 * el expediente se recorre sin apuntar con precisión.
 *
 * Son **enlaces**, no un `tablist` de ARIA: cada pestaña es una ruta, y el
 * lector de pantalla tiene que anunciar una navegación y no un panel que se
 * muestra y se esconde. De ahí `aria-current="page"` en la abierta.
 *
 * Además responden a las **teclas de función**: F1 lleva a la primera pestaña,
 * F2 a la segunda, y así hasta la última (`pestanas.ts` fija el orden).
 *
 * La tecla va escrita debajo del rótulo, pero **solo se ve al pasar el mouse
 * por la tira**. Un atajo que no se ve no existe, así que tiene que estar
 * escrito; pero una vez aprendido es ruido, y son siete rótulos grises
 * repetidos en todas las pestañas de todos los expedientes. Mostrarlo cuando
 * la mano ya está yendo hacia ahí deja las dos cosas: se descubre buscándolo y
 * no estorba el resto del tiempo. Sigue en el `title` de cada pestaña, que es
 * de donde lo toma el lector de pantalla.
 */
export function PestanasExpediente({ expedienteId }: { expedienteId: string }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      // Con modificador la tecla es del navegador o del sistema (Alt+F4,
      // Ctrl+F5): no se toca. `repeat` descarta la tecla mantenida apretada,
      // que si no dispara una navegación por cada repetición del teclado.
      if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
      if (evento.repeat) return;

      const indice = PESTANAS.findIndex((_, posicion) => teclaDePestana(posicion) === evento.key);
      if (indice === -1) return;

      // Varias teclas de función tienen un uso propio del navegador (F1 la
      // ayuda, F3 buscar, F5 recargar): acá mandan las pestañas del
      // expediente, así que se cancela el comportamiento por defecto.
      evento.preventDefault();
      router.push(rutaPestana(expedienteId, PESTANAS[indice].clave));
    }

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [expedienteId, router]);

  return (
    <nav
      aria-label="Secciones del expediente"
      data-pestanas-expediente
      /* Reparto por `flex-1` y no por una rejilla de N columnas: así agregar
         una pestaña a `pestanas.ts` no obliga a cambiar acá el número de
         columnas. Abajo de `sm` entran cuatro por fila. */
      className="flex flex-wrap overflow-hidden rounded-t-lg border-b border-linea"
    >
      {PESTANAS.map((pestana, posicion) => {
        const href = rutaPestana(expedienteId, pestana.clave);
        const tecla = teclaDePestana(posicion);
        const abierta = pathname === href;
        const { Icono } = pestana;

        return (
          <Link
            key={pestana.clave}
            href={href}
            // La ruta es dinámica —el expediente se lee en cada pedido—, así que
            // sin un `loading` prefetchado el navegador no tendría nada
            // adelantado. `loading.tsx` existe justo para eso.
            prefetch
            aria-current={abierta ? "page" : undefined}
            title={`${pestana.etiqueta} (${tecla}) — ${pestana.proposito}`}
            className={`group relative flex flex-1 basis-1/4 flex-col items-center gap-1.5 px-2 py-3 transition-colors sm:basis-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acento ${
              abierta ? "bg-acento-suave" : "hover:bg-acento-suave/60"
            }`}
          >
            <Icono
              aria-hidden
              strokeWidth={2}
              className={`size-6 ${abierta ? "text-acento" : "text-zinc-600 dark:text-zinc-400"}`}
            />
            <span
              className={`text-center text-[13px] font-medium leading-tight ${
                abierta ? "text-acento" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {pestana.etiqueta}
            </span>
            {/*
              La tecla aparece en **la pestaña apuntada** y solo en esa: el
              `group` es el enlace, así que `group-hover` responde a esa pestaña
              y no a la tira.

              Está siempre en el flujo y lo que cambia es su opacidad, no si
              existe: ocultarla con `hidden` encogería la pestaña de tres líneas
              a dos y la tira entera saltaría al pasar el mouse por encima, que
              es el gesto que la revela. Así el lugar ya está reservado y lo
              único que pasa es que aparece la letra.

              `group-focus-visible` suma el teclado: quien se mueve con el
              tabulador no tiene mouse con el que descubrirlas.
            */}
            <span
              aria-hidden
              className={`rotulo leading-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 ${
                abierta ? "text-acento/70" : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {tecla}
            </span>
            {abierta ? (
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-acento" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
