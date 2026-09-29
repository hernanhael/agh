import { randomUUID } from "node:crypto";
import { clavear, oracion, titulo } from "@/lib/formato";
import { ahora, leerDatos, modificarDatos } from "./almacen";
import { correcto, fallo, type Resultado } from "./resultado";
import type { TipoProceso } from "./tipos";

/**
 * Tipos de proceso: alta, edición y baja desde Configuración
 * (docs/02-expedientes.md §2.1 y §2.10).
 *
 * Todo lo que escribe el abogado se normaliza acá, no en la pantalla, para
 * que el importador del SAE y cualquier otra vía de carga futura queden
 * formateados igual.
 */

/** Datos de un tipo de proceso tal como los escribe el abogado. */
export interface EntradaTipoProceso {
  nombre: string;
  descripcion: string;
  /** Materias en las que suele usarse. */
  materias: string[];
  /** Nombres de las etapas, en orden. */
  etapas: string[];
  activo: boolean;
}

export async function listarTiposProceso(): Promise<TipoProceso[]> {
  const { tiposProceso } = await leerDatos();
  return [...tiposProceso].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Solo los tipos activos, que son los que se pueden elegir al dar de alta. */
export async function listarTiposProcesoActivos(): Promise<TipoProceso[]> {
  return (await listarTiposProceso()).filter((tipo) => tipo.activo);
}

export async function obtenerTipoProceso(id: string): Promise<TipoProceso | undefined> {
  const { tiposProceso } = await leerDatos();
  return tiposProceso.find((tipo) => tipo.id === id);
}

function normalizar(entrada: EntradaTipoProceso, acentuar: boolean) {
  const opciones = { acentuar };
  return {
    nombre: titulo(entrada.nombre, opciones),
    descripcion: oracion(entrada.descripcion),
    materias: entrada.materias
      .map((materia) => titulo(materia, opciones))
      .filter((materia) => materia !== ""),
    etapas: entrada.etapas
      .map((nombre) => titulo(nombre, opciones))
      .filter((nombre) => nombre !== "")
      .map((nombre, indice) => ({ clave: clavear(nombre), nombre, orden: indice + 1 })),
  };
}

export async function crearTipoProceso(
  entrada: EntradaTipoProceso,
): Promise<Resultado<TipoProceso>> {
  return modificarDatos((datos) => {
    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.nombre) return fallo<TipoProceso>("El tipo de proceso necesita un nombre.");

    const clave = clavear(campos.nombre);
    if (datos.tiposProceso.some((tipo) => tipo.clave === clave)) {
      return fallo<TipoProceso>(`Ya existe un tipo de proceso llamado "${campos.nombre}".`);
    }

    const marca = ahora();
    const nuevo: TipoProceso = {
      id: randomUUID(),
      clave,
      ...campos,
      activo: entrada.activo,
      origen: "propio",
      creadoEn: marca,
      actualizadoEn: marca,
    };
    datos.tiposProceso.push(nuevo);
    return correcto(nuevo);
  });
}

export async function actualizarTipoProceso(
  id: string,
  entrada: EntradaTipoProceso,
): Promise<Resultado<TipoProceso>> {
  return modificarDatos((datos) => {
    const tipo = datos.tiposProceso.find((candidato) => candidato.id === id);
    if (!tipo) return fallo<TipoProceso>("No se encontró el tipo de proceso.");

    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.nombre) return fallo<TipoProceso>("El tipo de proceso necesita un nombre.");

    const clave = clavear(campos.nombre);
    if (datos.tiposProceso.some((otro) => otro.id !== id && otro.clave === clave)) {
      return fallo<TipoProceso>(`Ya existe un tipo de proceso llamado "${campos.nombre}".`);
    }

    // Cambiar un tipo de proceso no altera los expedientes ya creados
    // (docs/02-expedientes.md §2.1); solo se avisa si alguno queda apuntando
    // a una etapa que dejó de existir.
    Object.assign(tipo, campos, { clave, activo: entrada.activo, actualizadoEn: ahora() });
    return correcto(tipo);
  });
}

/**
 * Elimina un tipo de proceso. Se niega si algún expediente lo usa: perder la
 * plantilla dejaría al expediente sin etapas ni contexto para los agentes.
 */
export async function eliminarTipoProceso(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    const indice = datos.tiposProceso.findIndex((tipo) => tipo.id === id);
    if (indice === -1) return fallo<string>("No se encontró el tipo de proceso.");

    const enUso = datos.expedientes.filter((expediente) => expediente.tipoProcesoId === id);
    if (enUso.length > 0) {
      const cuantos =
        enUso.length === 1 ? "1 expediente lo usa" : `${enUso.length} expedientes lo usan`;
      return fallo<string>(
        `No se puede borrar "${datos.tiposProceso[indice].nombre}": ${cuantos}. Desactivalo para que no aparezca en las altas nuevas.`,
      );
    }

    const agentesAfectados = datos.agentes.filter((agente) =>
      agente.tiposProcesoIds.includes(id),
    );
    for (const agente of agentesAfectados) {
      agente.tiposProcesoIds = agente.tiposProcesoIds.filter((otro) => otro !== id);
      agente.actualizadoEn = ahora();
    }

    const [borrado] = datos.tiposProceso.splice(indice, 1);
    return correcto(borrado.nombre);
  });
}
