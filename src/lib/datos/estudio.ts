import { nombrePropio, normalizarEspacios } from "@/lib/formato";
import { ahora, leerDatos, modificarDatos } from "./almacen";
import { correcto, type Resultado } from "./resultado";
import type { CentroJudicial, Estudio } from "./tipos";

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
