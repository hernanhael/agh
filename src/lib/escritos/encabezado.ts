import { identificador } from "@/lib/datos/filtros";
import type { Estudio, Expediente, Parte } from "@/lib/datos/tipos";

/**
 * El encabezado de un escrito, armado con los metadatos del expediente
 * (docs/02-expedientes.md §2.5).
 *
 * El abogado no vuelve a escribir nunca el juzgado, la carátula, el número ni
 * su propia matrícula: todo eso ya está cargado y es justamente lo que más se
 * equivoca cuando se copia y pega de un escrito anterior —el clásico escrito
 * presentado con la carátula del expediente de al lado—.
 *
 * **Lo que falta no se inventa**: donde no hay dato va una marca
 * `[[COMPLETAR: ...]]`, que es la misma convención con la que los agentes
 * señalan lo que no encontraron en las fuentes (docs/03-ia-agentes.md), y además
 * se devuelve la lista de lo que falta para que la pantalla avise antes de
 * imprimir.
 *
 * Las **fórmulas de estilo** ("Señor Juez", "a V.S. digo") son las de uso
 * corriente en el fuero y están **[a confirmar]** contra la práctica del
 * estudio; la idea es que terminen siendo plantillas de escrito configurables
 * (`writing_templates` en docs/06-modelo-de-datos.md).
 *
 * Módulo puro: recibe los datos y devuelve texto.
 */

export interface EncabezadoEscrito {
  /** La suma: qué es el escrito, arriba de todo. "Contesta traslado". */
  suma: string;
  /** A quién se dirige: "Señor Juez de Primera Instancia en lo…". */
  destinatario: string;
  /** "Expte. n.º 1234/26". */
  numero: string;
  caratula: string;
  /** La comparecencia, que termina en dos puntos y sigue el cuerpo. */
  comparecencia: string;
  /** Firma: nombre y matrícula del abogado. */
  firma: string[];
  /** Qué metadatos faltan, en lenguaje llano, para avisar antes de imprimir. */
  faltantes: string[];
}

/** Marca de lo que falta, con el mismo formato que usan los agentes. */
function completar(que: string): string {
  return `[[COMPLETAR: ${que}]]`;
}

/**
 * La preposición con la que se nombra al fuero.
 *
 * "En lo Civil y Comercial Común" y "en lo Civil en Documentos y Locaciones",
 * pero "de Familia y Sucesiones", "de Cobros y Apremios" y "de Paz": en lo
 * Familia no se dice. La regla es chica y cubre los cinco fueros del
 * `FUEROS` de la aplicación; si aparece uno que no encaje, se corrige acá.
 */
function preposicionDeFuero(juzgado: string): string {
  return /^civil\b/i.test(juzgado) ? "en lo" : "de";
}

/**
 * Cómo se nombra al juzgado en el encabezado.
 *
 * Se arma con el tipo de juzgado y su nominación, que es como lo nombra el
 * Portal del SAE. Sin juzgado cargado queda la marca, porque dirigir un escrito
 * "a quien corresponda" no es una opción.
 */
function destinatarioDe(expediente: Expediente, faltantes: string[]): string {
  const tipo = expediente.juzgadoTipo?.trim();
  const nominacion = expediente.juzgadoNumero?.trim();

  if (!tipo) {
    faltantes.push("el juzgado del expediente (pestaña Datos)");
    return `Señor Juez ${completar("juzgado")}`;
  }

  const nominado = nominacion ? ` de la ${nominacion} Nominación` : "";
  if (!nominacion) faltantes.push("la nominación del juzgado (pestaña Datos)");

  return `Señor Juez de Primera Instancia ${preposicionDeFuero(tipo)} ${tipo}${nominado}`;
}

/**
 * La comparecencia: quién se presenta, por quién, con qué domicilio y en qué
 * expediente. Es la parte del encabezado que más datos cruza, y por eso la que
 * más gana con salir sola.
 */
function comparecenciaDe(
  expediente: Expediente,
  estudio: Estudio,
  cliente: Parte | undefined,
  faltantes: string[],
): string {
  const abogado = estudio.nombre.trim();
  if (!abogado) faltantes.push("el nombre del abogado (Configuración → Estudio)");

  const matricula = estudio.matricula.trim();
  if (!matricula) faltantes.push("la matrícula (Configuración → Estudio)");

  const casilla = estudio.domicilioElectronico.trim();
  if (!casilla) faltantes.push("el domicilio electrónico (Configuración → Estudio)");

  // Por quién se presenta: la parte de la nómina marcada como cliente. Si la
  // nómina está vacía, el lado de la carátula que ocupa el estudio.
  const porQuien =
    cliente?.nombre ||
    (expediente.rolCliente === "actor"
      ? expediente.actor
      : expediente.rolCliente === "demandado"
        ? expediente.demandado
        : "");
  if (!porQuien) faltantes.push("quién es el cliente en este juicio (pestaña Partes)");

  return [
    abogado || completar("nombre del abogado"),
    `abogado, matrícula ${matricula || completar("matrícula")}`,
    `con domicilio electrónico constituido en ${casilla || completar("domicilio electrónico")}`,
    `en los autos caratulados «${expediente.caratula}», Expte. n.º ${identificador(expediente)}`,
    `en el carácter de letrado de ${porQuien || completar("cliente")}`,
    "a V.S. respetuosamente digo:",
  ].join(", ");
}

/**
 * El encabezado completo.
 *
 * `suma` es lo que el abogado escribe arriba del escrito ("Contesta traslado",
 * "Ofrece prueba"): es lo único que no sale de los metadatos, porque es lo que
 * el escrito viene a hacer.
 */
export function encabezadoDeEscrito({
  expediente,
  estudio,
  cliente,
  suma,
}: {
  expediente: Expediente;
  estudio: Estudio;
  cliente?: Parte;
  suma: string;
}): EncabezadoEscrito {
  const faltantes: string[] = [];

  return {
    suma: suma.trim() || completar("qué hace este escrito"),
    destinatario: destinatarioDe(expediente, faltantes),
    numero: `Expte. n.º ${identificador(expediente)}`,
    caratula: expediente.caratula,
    comparecencia: comparecenciaDe(expediente, estudio, cliente, faltantes),
    firma: [
      estudio.nombre.trim() || completar("nombre del abogado"),
      estudio.matricula.trim()
        ? `Matrícula ${estudio.matricula.trim()}`
        : completar("matrícula"),
    ],
    faltantes,
  };
}

/** Los párrafos del cuerpo, sin las líneas en blanco de más. */
export function parrafosDelCuerpo(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((parrafo) => parrafo.trim())
    .filter((parrafo) => parrafo !== "");
}
