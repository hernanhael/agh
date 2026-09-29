import type { ReactNode } from "react";

/**
 * Piezas de interfaz compartidas. Son clases y componentes sin estado, así
 * que funcionan tanto en componentes de servidor como de cliente.
 */

export const claseEtiqueta =
  "block text-xs font-medium text-zinc-600 dark:text-zinc-400";

export const claseEntrada =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-600";

export const claseBotonPrimario =
  "inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

/**
 * Acción principal de una pantalla (dar de alta), en registro discreto: sin
 * fondo ni borde, solo ícono y texto en el color de acento, que se aclara al
 * pasar el mouse. El peso visual queda en el contenido, no en el botón.
 */
export const claseBotonAccion =
  "inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium text-acento transition-colors hover:text-acento-fuerte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";

/** Desplegable de filtro del listado. `claseSelectFiltroActivo` cuando filtra. */
export const claseSelectFiltro =
  "appearance-none rounded-md border border-linea bg-superficie py-1.5 pl-2.5 pr-7 text-xs text-zinc-700 transition-colors hover:border-linea-fuerte focus:border-acento focus:outline-none focus:ring-1 focus:ring-acento dark:text-zinc-300";

export const claseSelectFiltroActivo =
  "appearance-none rounded-md border border-acento bg-acento-suave py-1.5 pl-2.5 pr-7 text-xs font-medium text-acento transition-colors focus:outline-none focus:ring-1 focus:ring-acento";

export const claseBotonSecundario =
  "inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export const claseBotonPeligro =
  "inline-flex items-center justify-center rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950";

export const claseTarjeta =
  "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

/** Campo de formulario: etiqueta, control y ayuda opcional. */
export function Campo({
  etiqueta,
  ayuda,
  children,
  className = "",
}: {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={claseEtiqueta}>{etiqueta}</span>
      {children}
      {ayuda ? (
        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-500">{ayuda}</span>
      ) : null}
    </label>
  );
}

/** Aviso de error o de confirmación, alimentado por los parámetros de la URL. */
export function Aviso({ error, hecho }: { error?: string; hecho?: string }) {
  if (!error && !hecho) return null;
  const esError = Boolean(error);
  return (
    <p
      role="status"
      className={`mb-6 rounded-md border px-3 py-2 text-sm ${
        esError
          ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      }`}
    >
      {error ?? hecho}
    </p>
  );
}

/** Encabezado de una página o sección, con acción opcional a la derecha. */
export function Encabezado({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{titulo}</h1>
        {descripcion ? (
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{descripcion}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Etiqueta chica para marcar estado: ejemplo, inactivo, origen. */
export function Marca({
  children,
  tono = "neutro",
}: {
  children: ReactNode;
  tono?: "neutro" | "aviso" | "ok";
}) {
  const tonos = {
    neutro: "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
    aviso: "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400",
    ok: "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

/** Mensaje cuando una lista está vacía. */
export function Vacio({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-500">
      {children}
    </p>
  );
}

/** Lee un mensaje de los parámetros de búsqueda de la página. */
export function mensajes(parametros: Record<string, string | string[] | undefined>): {
  error?: string;
  hecho?: string;
} {
  const uno = (valor: string | string[] | undefined) =>
    Array.isArray(valor) ? valor[0] : valor;
  return { error: uno(parametros.error), hecho: uno(parametros.hecho) };
}
