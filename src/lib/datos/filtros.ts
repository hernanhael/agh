import { normalizarParaBuscar, numeroExpediente } from "@/lib/formato";
import { ESTADOS_EXPEDIENTE, type Expediente } from "./tipos";

/**
 * Búsqueda y filtrado de expedientes.
 *
 * Módulo **puro**: no toca el almacén ni usa APIs de Node. Eso es lo que
 * permite que el listado filtre en el cliente mientras el abogado tipea, con
 * exactamente las mismas reglas que usaría el servidor.
 *
 * Cuando el volumen lo pida (miles de expedientes), estos mismos predicados se
 * traducen a una consulta SQL —`unaccent(lower(...))` para el texto y columnas
 * indexadas para estado, materia y fuero— y el listado pasa a paginar. La
 * forma de las funciones no cambia.
 */

/** Identificador del expediente con el formato del SAE: "1234/26". */
export function identificador(expediente: Expediente): string {
  return numeroExpediente(expediente.numero, expediente.anio);
}

/**
 * Nombre del juzgado: tipo y nominación, "Civil y Comercial Común VI".
 *
 * Es también el valor por el que se filtra, así que se arma en un solo lugar:
 * si el listado y el filtro lo armaran cada uno por su cuenta, alcanzaría un
 * espacio de diferencia para que el desplegable no encontrara nada.
 */
export function nombreJuzgado(expediente: Expediente): string {
  return [expediente.juzgadoTipo, expediente.juzgadoNumero].filter(Boolean).join(" ");
}

/** Oficina de Gestión Asociada del expediente, vacía si no se cargó. */
export function oficinaGestion(expediente: Expediente): string {
  return expediente.oficinaGestion ?? "";
}

/**
 * Texto sobre el que se busca: número, carátula, partes, objeto y materia,
 * todo reducido a la forma comparable.
 */
function textoBuscable(expediente: Expediente): string {
  return normalizarParaBuscar(
    [
      identificador(expediente),
      expediente.numero,
      expediente.caratula,
      expediente.actor,
      expediente.demandado,
      expediente.objeto,
      expediente.materia,
      nombreJuzgado(expediente),
      oficinaGestion(expediente),
    ].join(" "),
  );
}

/**
 * Decide si un expediente coincide con lo que escribió el abogado.
 *
 * Se exige que **todas** las palabras de la consulta aparezcan en el texto
 * buscable, en cualquier orden y como fragmento: así "juan perez" encuentra
 * "Pérez, Juan", "123" encuentra el 1234/26 y "danos" encuentra "Daños y
 * Perjuicios".
 */
export function coincide(expediente: Expediente, consulta: string): boolean {
  const palabras = normalizarParaBuscar(consulta).split(" ").filter(Boolean);
  if (palabras.length === 0) return true;
  const buscable = textoBuscable(expediente);
  return palabras.every((palabra) => buscable.includes(palabra));
}

export interface Filtros {
  consulta: string;
  estado: string;
  materia: string;
  fuero: string;
  /** Juzgado con su nominación, tal como lo devuelve `nombreJuzgado`. */
  juzgado: string;
  /** Oficina de Gestión Asociada. */
  oga: string;
}

export const FILTROS_VACIOS: Filtros = {
  consulta: "",
  estado: "",
  materia: "",
  fuero: "",
  juzgado: "",
  oga: "",
};

/** Si hay algún filtro puesto (para mostrar el conteo y el botón de limpiar). */
export function hayFiltros(filtros: Filtros): boolean {
  return (
    filtros.consulta.trim() !== "" ||
    filtros.estado !== "" ||
    filtros.materia !== "" ||
    filtros.fuero !== "" ||
    filtros.juzgado !== "" ||
    filtros.oga !== ""
  );
}

/**
 * Aplica la búsqueda y los filtros. Un filtro vacío no filtra, y los de
 * materia, fuero, juzgado y OGA comparan sin tildes ni mayúsculas por las
 * mismas razones que la búsqueda.
 */
export function aplicarFiltros(expedientes: Expediente[], filtros: Filtros): Expediente[] {
  const materia = normalizarParaBuscar(filtros.materia);
  const fuero = normalizarParaBuscar(filtros.fuero);
  const juzgado = normalizarParaBuscar(filtros.juzgado);
  const oga = normalizarParaBuscar(filtros.oga);

  return expedientes.filter((expediente) => {
    if (filtros.estado && expediente.estado !== filtros.estado) return false;
    if (materia && normalizarParaBuscar(expediente.materia) !== materia) return false;
    if (fuero && normalizarParaBuscar(expediente.fuero) !== fuero) return false;
    if (juzgado && normalizarParaBuscar(nombreJuzgado(expediente)) !== juzgado) return false;
    if (oga && normalizarParaBuscar(oficinaGestion(expediente)) !== oga) return false;
    return coincide(expediente, filtros.consulta);
  });
}

export interface OpcionFiltro {
  valor: string;
  etiqueta: string;
  cantidad: number;
}

/**
 * Valores disponibles para cada desplegable, tomados de los expedientes que
 * existen y con la cantidad de cada uno.
 *
 * Se ofrecen solo los valores presentes: un desplegable con los siete estados
 * posibles cuando el estudio usa dos invita a elegir combinaciones que no
 * devuelven nada.
 */
export function opcionesDeFiltro(expedientes: Expediente[]): {
  estados: OpcionFiltro[];
  materias: OpcionFiltro[];
  fueros: OpcionFiltro[];
  juzgados: OpcionFiltro[];
  ogas: OpcionFiltro[];
} {
  const contar = (valores: string[]): Map<string, number> => {
    const cuenta = new Map<string, number>();
    for (const valor of valores) {
      if (!valor) continue;
      cuenta.set(valor, (cuenta.get(valor) ?? 0) + 1);
    }
    return cuenta;
  };

  const estados = contar(expedientes.map((expediente) => expediente.estado));
  const materias = contar(expedientes.map((expediente) => expediente.materia));
  const fueros = contar(expedientes.map((expediente) => expediente.fuero));
  const juzgados = contar(expedientes.map(nombreJuzgado));
  const ogas = contar(expedientes.map(oficinaGestion));

  const alfabetico = (a: OpcionFiltro, b: OpcionFiltro) =>
    a.etiqueta.localeCompare(b.etiqueta, "es");

  /** Los valores libres se ofrecen como vinieron, ordenados alfabéticamente. */
  const listar = (cuenta: Map<string, number>): OpcionFiltro[] =>
    [...cuenta.entries()]
      .map(([valor, cantidad]) => ({ valor, etiqueta: valor, cantidad }))
      .sort(alfabetico);

  return {
    // Los estados van en el orden del proceso, no alfabético.
    estados: ESTADOS_EXPEDIENTE.filter((estado) => estados.has(estado.valor)).map((estado) => ({
      valor: estado.valor,
      etiqueta: estado.etiqueta,
      cantidad: estados.get(estado.valor) ?? 0,
    })),
    materias: listar(materias),
    fueros: listar(fueros),
    juzgados: listar(juzgados),
    ogas: listar(ogas),
  };
}
