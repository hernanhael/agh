import { normalizarEspacios, nombrePropio, titulo, type OpcionesFormato } from "./texto";

/**
 * Lectura y formateo de carátulas.
 *
 * La carátula es la denominación del expediente: "ACTOR c/ DEMANDADO s/
 * OBJETO" (docs/00-vision.md §7). El Portal del SAE la publica en mayúsculas
 * y sin tildes, y el abogado la escribe de maneras distintas según el día.
 * Este módulo la parte en sus tres componentes y la vuelve a armar con un
 * formato único:
 *
 *   "NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y Perjuicios"
 *   → "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios"
 */

export interface PartesCaratula {
  actor: string;
  /** Vacío si la carátula no tiene contraparte (por ejemplo, un sucesorio). */
  demandado: string;
  /** Vacío si la carátula no declara objeto. */
  objeto: string;
}

/**
 * Separador de la contraparte. Se aceptan las formas que aparecen en el
 * Portal y en el uso cotidiano: "c/", "C /", "contra", "vs", "vs.", "v/".
 *
 * No se acepta "C." suelto: sería indistinguible de la inicial del segundo
 * nombre en "Juan C. Pérez".
 */
const SEPARADOR_CONTRA = /\s*(?:\bc\s*\/|\bcontra\b|\bvs\b\.?|\bv\s*\/)\s*/i;

/** Separador del objeto: "s/", "S /", "sobre". */
const SEPARADOR_OBJETO = /\s*(?:\bs\s*\/|\bsobre\b)\s*/i;

/** Corta `texto` en la primera aparición de `separador`. */
function cortar(texto: string, separador: RegExp): [string, string] {
  const encontrado = separador.exec(texto);
  if (!encontrado) return [texto, ""];
  return [
    texto.slice(0, encontrado.index),
    texto.slice(encontrado.index + encontrado[0].length),
  ];
}

/**
 * Parte una carátula escrita en cualquier variante en sus tres componentes.
 *
 * Se busca primero el objeto ("s/") y después la contraparte ("c/") dentro de
 * lo que quedó a la izquierda: así "Sucesión de X s/ Sucesorio" no confunde
 * el objeto con una contraparte, y "A c/ B" sin objeto tampoco se rompe.
 */
export function partirCaratula(bruto: string): PartesCaratula {
  const limpio = normalizarEspacios(bruto);
  const [partesDelJuicio, objeto] = cortar(limpio, SEPARADOR_OBJETO);
  const [actor, demandado] = cortar(partesDelJuicio, SEPARADOR_CONTRA);
  return {
    actor: normalizarEspacios(actor),
    demandado: normalizarEspacios(demandado),
    objeto: normalizarEspacios(objeto),
  };
}

/**
 * Arma una carátula a partir de sus componentes, formateando cada uno según
 * lo que es: las partes como nombres propios, el objeto como título. Omite
 * los tramos vacíos.
 */
export function construirCaratula(
  partes: Partial<PartesCaratula>,
  opciones: OpcionesFormato = {},
): string {
  const actor = nombrePropio(partes.actor ?? "", opciones);
  const demandado = nombrePropio(partes.demandado ?? "", opciones);
  const objeto = titulo(partes.objeto ?? "", opciones);

  let caratula = actor;
  if (demandado) caratula = caratula ? `${caratula} c/ ${demandado}` : demandado;
  if (objeto) caratula = caratula ? `${caratula} s/ ${objeto}` : objeto;
  return caratula;
}

/**
 * Normaliza una carátula completa escrita en cualquier variante.
 *
 * Si el texto no tiene ningún separador reconocible se formatea entero como
 * nombre propio, que es lo más parecido a lo que el abogado quiso escribir.
 */
export function formatearCaratula(bruto: string, opciones: OpcionesFormato = {}): string {
  return construirCaratula(partirCaratula(bruto), opciones);
}
