import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * El **registro**: el dibujo con el que la aplicación muestra sus listas.
 *
 * Nació en el listado de expedientes (docs/02-expedientes.md §2.9) y estas
 * piezas lo vuelven el patrón común de los tipos de proceso, los agentes y lo
 * que venga: un cuadro por elemento, sobre el papel de las superficies, con la
 * misma rejilla de dos columnas —a la izquierda qué es, a la derecha cómo está—
 * y la misma regla para los estados.
 *
 * La regla de los estados es la que importa: **el color avisa, el hover
 * explica**. En la lista solo se ve un punto de color con dos palabras; el
 * porqué ("sin movimiento desde el 11/05/2026", "no se ofrece en las altas
 * nuevas") aparece al pasar el mouse y queda en la ficha. Así una lista larga
 * se recorre por color sin que el texto compita, y nada queda sin explicación.
 *
 * Son componentes sin estado ni efectos: sirven igual en el servidor y en el
 * cliente.
 */

/**
 * Tono de un estado. Es semántico, no decorativo, y significa lo mismo en toda
 * la aplicación: verde lo que está en curso y en regla, amarillo lo que pide
 * atención, rojo lo consumado y malo, gris lo que no está corriendo.
 */
export type TonoEstado = "ok" | "aviso" | "riesgo" | "neutro";

const ESTILO_TONO: Record<TonoEstado, { punto: string; texto: string }> = {
  ok: { punto: "bg-emerald-500", texto: "text-emerald-700 dark:text-emerald-400" },
  aviso: { punto: "bg-amber-500", texto: "text-amber-700 dark:text-amber-400" },
  riesgo: { punto: "bg-rose-500", texto: "text-rose-700 dark:text-rose-400" },
  neutro: { punto: "bg-zinc-400", texto: "text-zinc-500 dark:text-zinc-400" },
};

/**
 * Punto de color y dos palabras: "● En trámite", "● Activo", "● Caduco".
 *
 * `detalle` es la explicación del color. Va en el `title` —el hover— y también
 * oculta para el lector de pantalla, que no tiene hover: lo que el color dice
 * no puede quedar solo en el gesto del mouse.
 */
export function Semaforo({
  tono,
  etiqueta,
  detalle,
  className = "",
}: {
  tono: TonoEstado;
  etiqueta: string;
  detalle?: string;
  className?: string;
}) {
  const estilo = ESTILO_TONO[tono];
  return (
    <span
      className={`rotulo flex shrink-0 items-center gap-1.5 ${estilo.texto} ${className}`}
      title={detalle}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${estilo.punto}`} />
      {etiqueta}
      {detalle ? <span className="sr-only"> — {detalle}</span> : null}
    </span>
  );
}

/**
 * Rejilla de la cabecera de un registro: dos columnas enfrentadas fila por
 * fila, y no dos bloques sueltos, para que lo de la derecha quede a la altura
 * de lo de la izquierda sin depender de que midan lo mismo. En pantalla angosta
 * se apila en el orden de la rejilla.
 */
export const claseRejillaRegistro =
  "grid items-center gap-x-6 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]";

/** Celda de la derecha: alineada al borde en pantalla ancha. */
export const claseColumnaEstado = "sm:justify-self-end";

/** Nombre del elemento: la carátula del expediente, el nombre del agente. */
export const claseNombreRegistro = "text-[15px] leading-snug text-zinc-900 dark:text-zinc-50";

/** Dato secundario de la columna derecha, en el gris de los metadatos. */
export const claseDatoRegistro = "text-xs text-zinc-700 dark:text-zinc-300";

/**
 * Una fila del registro. Con `href` es un enlace a la ficha —toda la fila,
 * no un "ver más"—; sin `href`, un cuadro que contiene sus propias acciones.
 *
 * `orden` escalona la entrada, que acompaña al filtrado sin volverlo un
 * espectáculo y se apaga con `prefers-reduced-motion` (globals.css).
 */
export function Registro({
  href,
  orden = 0,
  children,
}: {
  href?: ComponentProps<typeof Link>["href"];
  orden?: number;
  children: ReactNode;
}) {
  const cuadro = "block rounded-lg border border-linea bg-superficie px-4 py-3.5";
  const enlace =
    "transition-colors hover:border-linea-fuerte hover:bg-acento-suave focus-visible:border-acento focus-visible:bg-acento-suave focus-visible:outline-none";

  return (
    <li className="aparece" style={{ animationDelay: `${Math.min(orden, 8) * 30}ms` }}>
      {href ? (
        <Link href={href} className={`${cuadro} ${enlace}`}>
          {children}
        </Link>
      ) : (
        <div className={cuadro}>{children}</div>
      )}
    </li>
  );
}

/** Línea de metadatos: datos secundarios separados por puntos. */
export function Meta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </div>
  );
}

/** Separador entre datos de una misma línea. */
export function Punto() {
  return <span className="text-linea-fuerte">·</span>;
}

/** Etiqueta breve en versalitas de la primera línea del registro. */
export function Rotulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rotulo text-zinc-500 dark:text-zinc-400 ${className}`}>{children}</span>
  );
}
