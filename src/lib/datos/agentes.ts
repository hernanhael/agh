import { randomUUID } from "node:crypto";
import { oracion, titulo } from "@/lib/formato";
import { ahora, leerDatos, modificarDatos } from "./almacen";
import { correcto, fallo, type Resultado } from "./resultado";
import type { Agente, ModoConocimiento, RolAgente } from "./tipos";

/**
 * Agentes especializados: alta, edición y baja desde Configuración.
 *
 * El constructor completo de agentes (fuentes ítem por ítem, herramientas,
 * panel de prueba) es de la Fase 2 (docs/03-ia-agentes.md §2.2). Acá está la
 * identidad del agente: quién es, en qué actúa, cómo se comporta y con qué
 * modelo corre. Las fuentes y las herramientas se suman cuando exista el RAG.
 */

export interface EntradaAgente {
  nombre: string;
  descripcion: string;
  rol: RolAgente;
  rama: string;
  especialidades: string[];
  tiposProcesoIds: string[];
  instrucciones: string;
  guiasComportamiento: string;
  modoConocimiento: ModoConocimiento;
  modelo: string;
  activo: boolean;
}

export async function listarAgentes(): Promise<Agente[]> {
  const { agentes } = await leerDatos();
  return [...agentes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function obtenerAgente(id: string): Promise<Agente | undefined> {
  const { agentes } = await leerDatos();
  return agentes.find((agente) => agente.id === id);
}

function normalizar(entrada: EntradaAgente, acentuar: boolean) {
  const opciones = { acentuar };
  return {
    nombre: titulo(entrada.nombre, opciones),
    descripcion: oracion(entrada.descripcion),
    rol: entrada.rol,
    rama: titulo(entrada.rama, opciones),
    especialidades: entrada.especialidades
      .map((especialidad) => titulo(especialidad, opciones))
      .filter((especialidad) => especialidad !== ""),
    instrucciones: oracion(entrada.instrucciones),
    guiasComportamiento: oracion(entrada.guiasComportamiento),
    modoConocimiento: entrada.modoConocimiento,
    modelo: entrada.modelo,
  };
}

/** Descarta las referencias a tipos de proceso que ya no existen. */
function tiposValidos(ids: string[], existentes: { id: string }[]): string[] {
  const conocidos = new Set(existentes.map((tipo) => tipo.id));
  return [...new Set(ids)].filter((id) => conocidos.has(id));
}

export async function crearAgente(entrada: EntradaAgente): Promise<Resultado<Agente>> {
  return modificarDatos((datos) => {
    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.nombre) return fallo<Agente>("El agente necesita un nombre.");
    if (datos.agentes.some((agente) => agente.nombre === campos.nombre)) {
      return fallo<Agente>(`Ya existe un agente llamado "${campos.nombre}".`);
    }

    const marca = ahora();
    const nuevo: Agente = {
      id: randomUUID(),
      ...campos,
      tiposProcesoIds: tiposValidos(entrada.tiposProcesoIds, datos.tiposProceso),
      activo: entrada.activo,
      origen: "propio",
      creadoEn: marca,
      actualizadoEn: marca,
    };
    datos.agentes.push(nuevo);
    return correcto(nuevo);
  });
}

export async function actualizarAgente(
  id: string,
  entrada: EntradaAgente,
): Promise<Resultado<Agente>> {
  return modificarDatos((datos) => {
    const agente = datos.agentes.find((candidato) => candidato.id === id);
    if (!agente) return fallo<Agente>("No se encontró el agente.");

    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.nombre) return fallo<Agente>("El agente necesita un nombre.");
    if (datos.agentes.some((otro) => otro.id !== id && otro.nombre === campos.nombre)) {
      return fallo<Agente>(`Ya existe un agente llamado "${campos.nombre}".`);
    }

    Object.assign(agente, campos, {
      tiposProcesoIds: tiposValidos(entrada.tiposProcesoIds, datos.tiposProceso),
      activo: entrada.activo,
      actualizadoEn: ahora(),
    });
    return correcto(agente);
  });
}

export async function eliminarAgente(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    const indice = datos.agentes.findIndex((agente) => agente.id === id);
    if (indice === -1) return fallo<string>("No se encontró el agente.");
    const [borrado] = datos.agentes.splice(indice, 1);
    return correcto(borrado.nombre);
  });
}

/** Clona un agente para probar una variante sin tocar el original. */
export async function clonarAgente(id: string): Promise<Resultado<Agente>> {
  return modificarDatos((datos) => {
    const original = datos.agentes.find((agente) => agente.id === id);
    if (!original) return fallo<Agente>("No se encontró el agente.");

    let nombre = `${original.nombre} (Copia)`;
    let sufijo = 2;
    while (datos.agentes.some((agente) => agente.nombre === nombre)) {
      nombre = `${original.nombre} (Copia ${sufijo})`;
      sufijo += 1;
    }

    const marca = ahora();
    const copia: Agente = {
      ...original,
      id: randomUUID(),
      nombre,
      especialidades: [...original.especialidades],
      tiposProcesoIds: [...original.tiposProcesoIds],
      origen: "propio",
      creadoEn: marca,
      actualizadoEn: marca,
    };
    datos.agentes.push(copia);
    return correcto(copia);
  });
}

/**
 * Agentes que el sistema sugiere para un expediente, por materia y tipo de
 * proceso (docs/02-expedientes.md §2.6). La selección final es del abogado.
 */
export async function sugerirAgentes(tipoProcesoId: string, materia: string): Promise<Agente[]> {
  const agentes = await listarAgentes();
  return agentes.filter((agente) => {
    if (!agente.activo) return false;
    const actuaEnElProceso =
      agente.tiposProcesoIds.length === 0 || agente.tiposProcesoIds.includes(tipoProcesoId);
    const esDeLaMateria =
      materia === "" ||
      agente.especialidades.some(
        (especialidad) => especialidad.localeCompare(materia, "es", { sensitivity: "base" }) === 0,
      );
    return actuaEnElProceso && (esDeLaMateria || agente.rol !== "especialista");
  });
}
