import { normalizarParaBuscar, quitarAcentos } from "@/lib/formato";
import { FUEROS, type Expediente } from "./tipos";
import type { Filtros } from "./filtros";

/**
 * Los fueros como puerta de entrada a los expedientes.
 *
 * `/expedientes` no muestra los juicios de una vez: primero se elige el fuero
 * y adentro aparecen sus procesos, con su propio juego de filtros. Este módulo
 * dice qué fueros hay, cómo se llaman en la tarjeta, qué dirección tienen y
 * qué filtros ofrece cada uno.
 *
 * Es **puro**, como `filtros.ts`: lo usan las páginas del servidor y el
 * listado del cliente.
 */

/** Filtros que puede ofrecer un fuero, además de la búsqueda libre. */
export type CampoFiltro = Exclude<keyof Filtros, "consulta" | "fuero">;

export interface Fuero {
  /** El valor guardado en `Expediente.fuero`: "Civil en Documentos y Locaciones". */
  valor: string;
  /** Cómo se nombra en la tarjeta y en el título: "Documentos y Locaciones". */
  nombre: string;
  /** Segmento de la dirección: "documentos-y-locaciones". */
  slug: string;
  /** Filtros del listado interno, en el orden en que se muestran. */
  filtros: ReadonlyArray<CampoFiltro>;
}

/** Filtros de un fuero que todavía no tiene los suyos definidos. */
const FILTROS_COMUNES: ReadonlyArray<CampoFiltro> = [
  "juzgado",
  "oga",
  "estado",
  "materia",
  "etiqueta",
];

/**
 * Lo propio de cada fuero del catálogo. Los nombres cortos y los filtros están
 * **[a confirmar]** con la práctica del estudio: es acá donde se ajustan, y el
 * listado los toma sin más cambios.
 *
 * Un desplegable sin valores no se dibuja, así que poner un filtro que el fuero
 * todavía no usa no ensucia la pantalla: aparece cuando haya datos.
 */
const PROPIOS: Record<string, { nombre?: string; filtros?: ReadonlyArray<CampoFiltro> }> = {
  "Civil y Comercial Común": {},
  "Civil en Documentos y Locaciones": { nombre: "Documentos y Locaciones" },
  "Cobros y Apremios": {},
  "Familia y Sucesiones": {},
  // La Justicia de Paz no trabaja con Oficinas de Gestión Asociada.
  Paz: { nombre: "Justicia de Paz", filtros: ["juzgado", "estado", "materia", "etiqueta"] },
};

/** "Civil y Comercial Común" → "civil-y-comercial-comun". */
export function slugFuero(nombre: string): string {
  return quitarAcentos(nombre)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function armar(valor: string): Fuero {
  const propio = PROPIOS[valor] ?? {};
  return {
    valor,
    nombre: propio.nombre ?? valor,
    slug: slugFuero(valor),
    filtros: propio.filtros ?? FILTROS_COMUNES,
  };
}

/** Los fueros del catálogo, en su orden. */
export const CATALOGO_FUEROS: ReadonlyArray<Fuero> = FUEROS.map(armar);

/** Si dos nombres de fuero son el mismo, sin mirar tildes ni mayúsculas. */
function mismoFuero(a: string, b: string): boolean {
  return normalizarParaBuscar(a) === normalizarParaBuscar(b);
}

/**
 * Los fueros que se ofrecen como tarjetas: los del catálogo, aunque todavía no
 * tengan expedientes, y cualquier otro que aparezca en los datos (un
 * expediente viejo cargado con un nombre que ya no está en la lista no puede
 * quedar inalcanzable).
 *
 * Van en orden alfabético **por el nombre que se ve en la tarjeta**, no por el
 * valor guardado: "Documentos y Locaciones" se ordena por la D y no por el
 * "Civil en" con que se guarda.
 */
export function fuerosDisponibles(expedientes: ReadonlyArray<Expediente>): Fuero[] {
  const fueros = [...CATALOGO_FUEROS];
  for (const expediente of expedientes) {
    const valor = expediente.fuero?.trim();
    if (!valor) continue;
    if (fueros.some((fuero) => mismoFuero(fuero.valor, valor))) continue;
    fueros.push(armar(valor));
  }
  return fueros.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** El fuero de una dirección, o `undefined` si no existe. */
export function fueroPorSlug(
  slug: string,
  expedientes: ReadonlyArray<Expediente>,
): Fuero | undefined {
  return fuerosDisponibles(expedientes).find((fuero) => fuero.slug === slug);
}

/** El fuero de un expediente, con su nombre corto y su dirección. */
export function fueroDe(expediente: Expediente): Fuero {
  return CATALOGO_FUEROS.find((fuero) => mismoFuero(fuero.valor, expediente.fuero)) ??
    armar(expediente.fuero);
}

/** Los expedientes que pertenecen a un fuero. */
export function expedientesDelFuero(
  expedientes: ReadonlyArray<Expediente>,
  fuero: Fuero,
): Expediente[] {
  return expedientes.filter((expediente) => mismoFuero(expediente.fuero, fuero.valor));
}
