import { nombrePropio, normalizarEspacios } from "@/lib/formato";
import { ahora, leerDatos, modificarDatos } from "./almacen";
import { correcto, type Resultado } from "./resultado";
import {
  FORMATO_ESCRITO,
  FUENTES_ESCRITO,
  INTERLINEADOS,
  type CentroJudicial,
  type Estudio,
  type FormatoEscrito,
} from "./tipos";

/**
 * Datos del estudio y preferencias: la parte "típica" de Configuración
 * (`profiles` en docs/06-modelo-de-datos.md).
 */

export interface EntradaEstudio {
  nombre: string;
  matricula: string;
  cuit: string;
  domicilioElectronico: string;
  telefono: string;
  centroJudicialHabitual: CentroJudicial;
  modeloPorDefecto: string;
  correccionDeTildes: boolean;
  /** Con qué forma salen los escritos (docs/02-expedientes.md §2.5). */
  formatoEscrito: FormatoEscrito;
}

/**
 * Una medida dentro de lo que es una hoja: un margen de quince centímetros o un
 * cuerpo de 80 puntos no son una preferencia, son un error de tipeo.
 */
function medida(valor: number, minimo: number, maximo: number, porDefecto: number): number {
  if (!Number.isFinite(valor)) return porDefecto;
  return Math.min(maximo, Math.max(minimo, valor));
}

/** El formato pedido, con cada medida acotada y la fuente del catálogo. */
function formatoValido(formato: FormatoEscrito): FormatoEscrito {
  const interlineado = INTERLINEADOS.some((opcion) => opcion.valor === formato.interlineado)
    ? formato.interlineado
    : FORMATO_ESCRITO.interlineado;

  return {
    fuente: FUENTES_ESCRITO.includes(formato.fuente) ? formato.fuente : FORMATO_ESCRITO.fuente,
    tamanio: medida(formato.tamanio, 8, 18, FORMATO_ESCRITO.tamanio),
    interlineado,
    margenSuperior: medida(formato.margenSuperior, 0, 8, FORMATO_ESCRITO.margenSuperior),
    margenInferior: medida(formato.margenInferior, 0, 8, FORMATO_ESCRITO.margenInferior),
    margenIzquierdo: medida(formato.margenIzquierdo, 0, 8, FORMATO_ESCRITO.margenIzquierdo),
    margenDerecho: medida(formato.margenDerecho, 0, 8, FORMATO_ESCRITO.margenDerecho),
    sangria: medida(formato.sangria, 0, 4, FORMATO_ESCRITO.sangria),
    textoJustificado: formato.textoJustificado,
    caratulaNegrita: formato.caratulaNegrita,
    caratulaMayusculas: formato.caratulaMayusculas,
    caratulaTamanio: medida(formato.caratulaTamanio, 8, 18, FORMATO_ESCRITO.caratulaTamanio),
  };
}

export async function obtenerEstudio(): Promise<Estudio> {
  const { estudio } = await leerDatos();
  return estudio;
}

export async function actualizarEstudio(entrada: EntradaEstudio): Promise<Resultado<Estudio>> {
  return modificarDatos((datos) => {
    // El nombre del abogado se formatea como nombre propio; la matrícula, el
    // CUIT y el domicilio electrónico son identificadores: solo se limpian.
    Object.assign(datos.estudio, {
      nombre: nombrePropio(entrada.nombre, { acentuar: entrada.correccionDeTildes }),
      matricula: normalizarEspacios(entrada.matricula),
      cuit: normalizarEspacios(entrada.cuit),
      domicilioElectronico: normalizarEspacios(entrada.domicilioElectronico).toLowerCase(),
      telefono: normalizarEspacios(entrada.telefono),
      centroJudicialHabitual: entrada.centroJudicialHabitual,
      modeloPorDefecto: entrada.modeloPorDefecto,
      correccionDeTildes: entrada.correccionDeTildes,
      formatoEscrito: formatoValido(entrada.formatoEscrito),
      actualizadoEn: ahora(),
    } satisfies Estudio);
    return correcto(datos.estudio);
  });
}

/**
 * Materias conocidas: las que ya usan los tipos de proceso y los
 * expedientes. Sirven para ofrecer sugerencias sin obligar a elegir de una
 * lista cerrada, hasta que exista la tabla `subject_matters`.
 */
export async function listarMaterias(): Promise<string[]> {
  const datos = await leerDatos();
  const materias = new Set<string>();
  for (const tipo of datos.tiposProceso) {
    for (const materia of tipo.materias) materias.add(materia);
  }
  for (const expediente of datos.expedientes) {
    if (expediente.materia) materias.add(expediente.materia);
  }
  for (const agente of datos.agentes) {
    for (const especialidad of agente.especialidades) materias.add(especialidad);
  }
  return [...materias].sort((a, b) => a.localeCompare(b, "es"));
}

/** Descripción corta del estado de la configuración, para la portada. */
export async function resumenConfiguracion(): Promise<{
  tiposProceso: number;
  tiposProcesoActivos: number;
  agentes: number;
  agentesActivos: number;
  expedientes: number;
  estudioCompleto: boolean;
}> {
  const datos = await leerDatos();
  return {
    tiposProceso: datos.tiposProceso.length,
    tiposProcesoActivos: datos.tiposProceso.filter((tipo) => tipo.activo).length,
    agentes: datos.agentes.length,
    agentesActivos: datos.agentes.filter((agente) => agente.activo).length,
    expedientes: datos.expedientes.length,
    estudioCompleto: datos.estudio.nombre !== "" && datos.estudio.matricula !== "",
  };
}
