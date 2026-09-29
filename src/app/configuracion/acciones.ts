"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarAgente,
  actualizarEstudio,
  actualizarTipoProceso,
  clonarAgente,
  crearAgente,
  crearTipoProceso,
  eliminarAgente,
  eliminarTipoProceso,
  type EntradaAgente,
  type EntradaTipoProceso,
  type ModoConocimiento,
  type Resultado,
  type RolAgente,
} from "@/lib/datos";
import type { CentroJudicial } from "@/lib/datos";

/**
 * Acciones de Configuración.
 *
 * Los formularios son HTML normal con `action`: funcionan sin JavaScript y el
 * resultado se comunica por la URL (`?hecho=` o `?error=`), que la página
 * muestra con el componente `Aviso`.
 *
 * Cuando exista autenticación (Fase 1, docs/08-roadmap.md) cada acción tiene
 * que verificar la sesión antes de escribir: las acciones de servidor se
 * pueden invocar por POST directo, no solo desde la interfaz.
 */

function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor : "";
}

function activado(datos: FormData, campo: string): boolean {
  return datos.get(campo) === "on" || datos.get(campo) === "true";
}

/** Una lista escrita por el abogado separada por comas. */
function lista(datos: FormData, campo: string): string[] {
  return texto(datos, campo)
    .split(",")
    .map((parte) => parte.trim())
    .filter((parte) => parte !== "");
}

/** Una lista escrita una por línea (las etapas de un tipo de proceso). */
function renglones(datos: FormData, campo: string): string[] {
  return texto(datos, campo)
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter((linea) => linea !== "");
}

/** Termina la acción volviendo a `ruta` con el aviso correspondiente. */
function volver(ruta: string, resultado: Resultado<unknown>, hecho: string): never {
  revalidatePath(ruta);
  if (!resultado.ok) {
    redirect(`${ruta}?error=${encodeURIComponent(resultado.error)}`);
  }
  redirect(`${ruta}?hecho=${encodeURIComponent(hecho)}`);
}

// ---------------------------------------------------------------- Estudio

const RUTA_ESTUDIO = "/configuracion/estudio";

export async function guardarEstudio(datos: FormData): Promise<void> {
  const resultado = await actualizarEstudio({
    nombre: texto(datos, "nombre"),
    matricula: texto(datos, "matricula"),
    cuit: texto(datos, "cuit"),
    domicilioElectronico: texto(datos, "domicilioElectronico"),
    telefono: texto(datos, "telefono"),
    centroJudicialHabitual: texto(datos, "centroJudicialHabitual") as CentroJudicial,
    modeloPorDefecto: texto(datos, "modeloPorDefecto"),
    correccionDeTildes: activado(datos, "correccionDeTildes"),
  });
  volver(RUTA_ESTUDIO, resultado, "Datos del estudio guardados.");
}

// ------------------------------------------------------- Tipos de proceso

const RUTA_PROCESOS = "/configuracion/procesos";

function entradaTipoProceso(datos: FormData): EntradaTipoProceso {
  return {
    nombre: texto(datos, "nombre"),
    descripcion: texto(datos, "descripcion"),
    materias: lista(datos, "materias"),
    etapas: renglones(datos, "etapas"),
    activo: activado(datos, "activo"),
  };
}

export async function nuevoTipoProceso(datos: FormData): Promise<void> {
  const resultado = await crearTipoProceso(entradaTipoProceso(datos));
  volver(
    RUTA_PROCESOS,
    resultado,
    resultado.ok ? `Se creó el tipo de proceso "${resultado.valor.nombre}".` : "",
  );
}

export async function guardarTipoProceso(datos: FormData): Promise<void> {
  const resultado = await actualizarTipoProceso(texto(datos, "id"), entradaTipoProceso(datos));
  volver(
    RUTA_PROCESOS,
    resultado,
    resultado.ok ? `Se guardó "${resultado.valor.nombre}".` : "",
  );
}

export async function borrarTipoProceso(datos: FormData): Promise<void> {
  const resultado = await eliminarTipoProceso(texto(datos, "id"));
  volver(
    RUTA_PROCESOS,
    resultado,
    resultado.ok ? `Se borró el tipo de proceso "${resultado.valor}".` : "",
  );
}

// -------------------------------------------------------------- Agentes

const RUTA_AGENTES = "/configuracion/agentes";

function entradaAgente(datos: FormData): EntradaAgente {
  return {
    nombre: texto(datos, "nombre"),
    descripcion: texto(datos, "descripcion"),
    rol: texto(datos, "rol") as RolAgente,
    rama: texto(datos, "rama"),
    especialidades: lista(datos, "especialidades"),
    tiposProcesoIds: datos
      .getAll("tiposProcesoIds")
      .filter((valor): valor is string => typeof valor === "string"),
    instrucciones: texto(datos, "instrucciones"),
    guiasComportamiento: texto(datos, "guiasComportamiento"),
    modoConocimiento: texto(datos, "modoConocimiento") as ModoConocimiento,
    modelo: texto(datos, "modelo"),
    activo: activado(datos, "activo"),
  };
}

export async function nuevoAgente(datos: FormData): Promise<void> {
  const resultado = await crearAgente(entradaAgente(datos));
  volver(
    RUTA_AGENTES,
    resultado,
    resultado.ok ? `Se creó el agente "${resultado.valor.nombre}".` : "",
  );
}

export async function guardarAgente(datos: FormData): Promise<void> {
  const resultado = await actualizarAgente(texto(datos, "id"), entradaAgente(datos));
  volver(RUTA_AGENTES, resultado, resultado.ok ? `Se guardó "${resultado.valor.nombre}".` : "");
}

export async function duplicarAgente(datos: FormData): Promise<void> {
  const resultado = await clonarAgente(texto(datos, "id"));
  volver(
    RUTA_AGENTES,
    resultado,
    resultado.ok ? `Se creó la copia "${resultado.valor.nombre}".` : "",
  );
}

export async function borrarAgente(datos: FormData): Promise<void> {
  const resultado = await eliminarAgente(texto(datos, "id"));
  volver(RUTA_AGENTES, resultado, resultado.ok ? `Se borró el agente "${resultado.valor}".` : "");
}
