import { normalizarParaBuscar, numeroExpediente } from "@/lib/formato";
import { ESTADOS_EXPEDIENTE, type EstadoExpediente, type Expediente } from "./tipos";

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
}

export const FILTROS_VACIOS: Filtros = { consulta: "", estado: "", materia: "", fuero: "" };

/** Si hay algún filtro puesto (para mostrar el conteo y el botón de limpiar). */
export function hayFiltros(filtros: Filtros): boolean {
  return (
    filtros.consulta.trim() !== "" ||
    filtros.estado !== "" ||
    filtros.materia !== "" ||
    filtros.fuero !== ""
  );
}

/**
 * Aplica la búsqueda y los tres filtros. Un filtro vacío no filtra, y los de
 * materia y fuero comparan sin tildes ni mayúsculas por las mismas razones que
 * la búsqueda.
 */
export function aplicarFiltros(expedientes: Expediente[], filtros: Filtros): Expediente[] {
  const materia = normalizarParaBuscar(filtros.materia);
  const fuero = normalizarParaBuscar(filtros.fuero);

  return expedientes.filter((expediente) => {
    if (filtros.estado && expediente.estado !== filtros.estado) return false;
    if (materia && normalizarParaBuscar(expediente.materia) !== materia) return false;
    if (fuero && normalizarParaBuscar(expediente.fuero) !== fuero) return false;
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

  const alfabetico = (a: OpcionFiltro, b: OpcionFiltro) =>
    a.etiqueta.localeCompare(b.etiqueta, "es");

  return {
    // Los estados van en el orden del proceso, no alfabético.
    estados: ESTADOS_EXPEDIENTE.filter((estado) => estados.has(estado.valor)).map((estado) => ({
      valor: estado.valor,
      etiqueta: estado.etiqueta,
      cantidad: estados.get(estado.valor) ?? 0,
    })),
    materias: [...materias.entries()]
      .map(([valor, cantidad]) => ({ valor, etiqueta: valor, cantidad }))
      .sort(alfabetico),
    fueros: [...fueros.entries()]
      .map(([valor, cantidad]) => ({ valor, etiqueta: valor, cantidad }))
      .sort(alfabetico),
  };
}

/** Etiqueta legible de un estado. */
export function etiquetaEstado(estado: EstadoExpediente | string): string {
  return ESTADOS_EXPEDIENTE.find((candidato) => candidato.valor === estado)?.etiqueta ?? estado;
}
