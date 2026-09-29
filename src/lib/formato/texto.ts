import {
  ACENTOS,
  PALABRAS_MENORES_TITULO,
  PARTICULAS_NOMBRE,
  SIGLAS,
  SIGLAS_INSENSIBLES,
} from "./diccionario";

/**
 * Normalizador de texto del sistema.
 *
 * Módulo puro (sin red ni base de datos) que se usa en dos momentos:
 *
 * 1. **Al guardar**: las acciones de servidor normalizan lo que el abogado
 *    escribe antes de persistirlo, y el importador del SAE hará lo mismo con
 *    lo que llega del Portal.
 * 2. **Al mostrar**: los mismos funciones sirven de red de seguridad para
 *    datos cargados antes de existir esta normalización.
 *
 * Que sea puro e isomorfo permite además usarlo en el cliente para
 * previsualizar en vivo cómo va a quedar un campo mientras se tipea.
 */

/** Opciones comunes de los formateadores. */
export interface OpcionesFormato {
  /**
   * Si se corrigen las tildes faltantes usando el diccionario `ACENTOS`
   * ("NICOLAS" → "Nicolás"). El abogado puede desactivarlo desde
   * Configuración cuando trabaja con nombres que legítimamente van sin tilde.
   * Por defecto, activado.
   */
  acentuar?: boolean;
}

/** Quita marcas diacríticas: "Daños" → "Danos", "José" → "Jose". */
export function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Clave de búsqueda en los diccionarios: sin tildes y en minúsculas. */
function clave(texto: string): string {
  return quitarAcentos(texto).toLowerCase();
}

/**
 * Colapsa espacios repetidos, normaliza los espacios no separables y recorta
 * los extremos. No toca los saltos de línea.
 */
export function normalizarEspacios(texto: string): string {
  return texto.replace(/[\t    ]+/g, " ").trim();
}

/** Números romanos bien formados: I, IV, XII, MCMXCIV ("MIL" no lo es). */
const NUMERO_ROMANO = /^(?=[IVXLCDM]+$)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/** Solo letras (con tildes y ñ): distingue palabras de signos y números. */
const ES_PALABRA = /^[\p{L}]+$/u;

type Contexto = "nombre" | "titulo";

/**
 * Formatea un segmento alfabético (una "palabra" sin signos internos).
 *
 * El orden de las reglas importa: sigla o número romano → partícula o palabra
 * menor → inicial → diccionario de acentos → capitalización común. La
 * partícula va antes que la inicial porque "y" en "Ortega y Gasset" mide una
 * letra y no es una inicial.
 */
function segmento(
  original: string,
  { primero, contexto, acentuar }: { primero: boolean; contexto: Contexto; acentuar: boolean },
): string {
  if (!ES_PALABRA.test(original)) return original;

  const enMayusculas = original === original.toUpperCase();
  const k = clave(original);

  const enSiglas = quitarAcentos(original).toUpperCase();

  // Tipos societarios: se reconocen en cualquier caja porque no son palabras.
  if (SIGLAS_INSENSIBLES.has(enSiglas)) return SIGLAS.get(enSiglas) ?? enSiglas;

  // El resto de las siglas, solo si venían en mayúsculas, para no convertir la
  // abreviatura "art." (artículo) en la aseguradora "ART".
  if (enMayusculas && original.length >= 2) {
    const sigla = SIGLAS.get(enSiglas);
    if (sigla) return sigla;
    if (NUMERO_ROMANO.test(original)) return original;
  }

  const menor = contexto === "nombre" ? PARTICULAS_NOMBRE : PALABRAS_MENORES_TITULO;
  if (!primero && menor.has(k)) return original.toLowerCase();

  // Iniciales: "J" en "Juan J Pérez".
  if (original.length === 1) return original.toUpperCase();

  if (acentuar && k in ACENTOS) return ACENTOS[k];

  // Prefijos escoceses/irlandeses: "MCCARTHY" → "McCarthy".
  if (k.length > 2 && (k.startsWith("mc") || k.startsWith("mac"))) {
    const largoPrefijo = k.startsWith("mac") ? 3 : 2;
    const prefijo = original.slice(0, largoPrefijo);
    const resto = original.slice(largoPrefijo);
    return (
      prefijo[0].toUpperCase() +
      prefijo.slice(1).toLowerCase() +
      resto[0].toUpperCase() +
      resto.slice(1).toLowerCase()
    );
  }

  return original[0].toUpperCase() + original.slice(1).toLowerCase();
}

/** Separadores internos de una palabra que también delimitan capitalización. */
const SEPARADORES_INTERNOS = /([-–—'’/()[\]{}"«»,;:]+)/;

/**
 * Formatea un token completo (lo que hay entre dos espacios), respetando sus
 * signos internos: "GARCIA-LOPEZ" → "García-López", "O'BRIEN" → "O'Brien".
 */
function token(
  bruto: string,
  opciones: { primero: boolean; contexto: Contexto; acentuar: boolean },
): string {
  // Siglas con puntos: "S.A." → "S.A.", "C.C.y.C." se deja como venga.
  const sinPuntos = bruto.replace(/\./g, "");
  if (bruto.includes(".") && sinPuntos.length >= 2) {
    const sigla = SIGLAS.get(quitarAcentos(sinPuntos).toUpperCase());
    if (sigla) return bruto.toUpperCase();
  }

  const partes = bruto.split(SEPARADORES_INTERNOS);
  let primero = opciones.primero;
  return partes
    .map((parte) => {
      if (!ES_PALABRA.test(parte)) return parte;
      const formateada = segmento(parte, { ...opciones, primero });
      primero = false;
      return formateada;
    })
    .join("");
}

function formatearFrase(texto: string, contexto: Contexto, opciones: OpcionesFormato): string {
  const { acentuar = true } = opciones;
  const limpio = normalizarEspacios(texto);
  if (!limpio) return "";

  let primero = true;
  return limpio
    .split(" ")
    .map((bruto) => {
      const formateado = token(bruto, { primero, contexto, acentuar });
      // Un token sin letras (un número, un guion suelto) no consume el
      // "primero": en "2 de mayo" la primera palabra sigue siendo "de".
      if (/\p{L}/u.test(bruto)) primero = false;
      return formateado;
    })
    .join(" ");
}

/**
 * Formatea un nombre propio de persona u organización.
 *
 * "NICOLAS ROGEL" → "Nicolás Rogel"
 * "swiss medical ART sa" → "Swiss Medical ART sa" (sa en minúscula no es sigla)
 * "MARIA DE LOS ANGELES PEREZ" → "María de los Ángeles Pérez"
 */
export function nombrePropio(texto: string, opciones: OpcionesFormato = {}): string {
  return formatearFrase(texto, "nombre", opciones);
}

/**
 * Formatea un título: el objeto de una carátula, una materia, el nombre de
 * una etapa o de un tipo de proceso.
 *
 * "daños y Perjuicios" → "Daños y Perjuicios"
 * "COBRO EJECUTIVO" → "Cobro Ejecutivo"
 */
export function titulo(texto: string, opciones: OpcionesFormato = {}): string {
  return formatearFrase(texto, "titulo", opciones);
}

/**
 * Pasa a minúsculas las oraciones escritas enteras en mayúsculas, que es como
 * llega el texto del Portal del SAE y como se escribe a veces a mano.
 *
 * Se decide oración por oración y no sobre el texto completo, para que una
 * nota mitad a los gritos también quede uniforme. Se exigen al menos dos
 * palabras: así una sigla sola ("Presentado ante la AFIP") o un énfasis de una
 * palabra ("URGENTE") quedan como estaban.
 */
function desgritar(texto: string): string {
  return texto
    .split(/([.!?]+\s+|\n+)/)
    .map((tramo) => {
      const palabras = tramo.match(/\p{L}{2,}/gu) ?? [];
      const aGritos = palabras.length >= 2 && /\p{Lu}/u.test(tramo) && !/\p{Ll}/u.test(tramo);
      return aGritos ? tramo.toLowerCase() : tramo;
    })
    .join("");
}

/**
 * Formatea texto libre (notas, resúmenes, instrucciones de un agente).
 *
 * A diferencia de `nombrePropio` y `titulo`, **no corrige la ortografía de
 * las palabras**: cambiar "publico" por "público" o "publicó" requiere
 * entender la oración, y equivocarse alteraría lo que escribió el abogado.
 * Se limita a lo que es seguro: espaciado, signos de puntuación, mayúscula
 * inicial de cada oración y texto que llegó todo en mayúsculas.
 */
export function oracion(texto: string): string {
  const lineas = texto.split(/\r?\n/).map((linea) => normalizarEspacios(linea));
  // Más de un salto de línea seguido se reduce a un párrafo en blanco.
  const cuerpo = lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cuerpo) return "";

  let resultado = cuerpo
    // Sin espacio antes de los signos de cierre.
    .replace(/ +([,;:.!?%)\]])/g, "$1")
    // Espacio después de coma, punto y coma y dos puntos si sigue una letra.
    .replace(/([,;:])(?=[\p{L}\p{N}])/gu, "$1 ")
    // Puntos suspensivos: exactamente tres.
    .replace(/\.{3,}/g, "...")
    // Signos de admiración e interrogación repetidos.
    .replace(/([!?])\1+/g, "$1")
    // Espacio después del punto final de una oración. Se exigen dos letras
    // antes del punto para no separar las siglas con puntos ("S.A.").
    .replace(/(\p{L}{2}\.)(?=\p{Lu})/gu, "$1 ");

  resultado = desgritar(resultado);

  // Mayúscula al inicio del texto y después de cada punto, admiración o
  // interrogación, y al inicio de cada línea.
  resultado = resultado.replace(
    /(^|[.!?]\s+|\n\s*)(\p{Ll})/gu,
    (_, antes: string, letra: string) => `${antes}${letra.toUpperCase()}`,
  );

  return resultado;
}

/**
 * Formatea el identificador del expediente con el formato del SAE: número y
 * año de dos dígitos, "1234/26".
 */
export function numeroExpediente(numero: string, anio: string | number): string {
  const soloNumero = String(numero).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const soloAnio = String(anio).replace(/\D/g, "");
  if (!soloNumero || !soloAnio) return "";
  const anioCorto = soloAnio.length > 2 ? soloAnio.slice(-2) : soloAnio.padStart(2, "0");
  return `${soloNumero}/${anioCorto}`;
}

/**
 * Prepara un texto para comparar en una búsqueda: sin tildes, en minúsculas y
 * con los signos convertidos en espacios.
 *
 * El abogado busca como le queda más cómodo —"perez" para encontrar "Pérez",
 * "danos" para "Daños"—, así que la consulta y el texto buscado se reducen los
 * dos a esta forma antes de compararse. Los signos se vuelven espacios para
 * que "Pérez, Juan" y "perez juan" coincidan.
 */
export function normalizarParaBuscar(texto: string): string {
  return normalizarEspacios(
    quitarAcentos(texto)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}/]+/gu, " "),
  );
}

/**
 * Convierte un nombre en una clave estable para usar como identificador de
 * etapa o de tipo de proceso: "Audiencia Preliminar" → "audiencia_preliminar".
 */
export function clavear(texto: string): string {
  return quitarAcentos(normalizarEspacios(texto))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
