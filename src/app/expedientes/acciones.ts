"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarExpediente,
  crearExpediente,
  eliminarExpediente,
  type CentroJudicial,
  type EntradaExpediente,
  type EstadoExpediente,
  type RolCliente,
} from "@/lib/datos";

/** Acciones del área Expedientes. Ver la nota de seguridad en ../configuracion/acciones.ts. */

function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor : "";
}

function entrada(datos: FormData): EntradaExpediente {
  return {
    numero: texto(datos, "numero"),
    anio: texto(datos, "anio"),
    caratula: texto(datos, "caratula"),
    tipoProcesoId: texto(datos, "tipoProcesoId"),
    etapaActual: texto(datos, "etapaActual"),
    centroJudicial: texto(datos, "centroJudicial") as CentroJudicial,
    fuero: texto(datos, "fuero"),
    materia: texto(datos, "materia"),
    rolCliente: texto(datos, "rolCliente") as RolCliente,
    estado: texto(datos, "estado") as EstadoExpediente,
    notas: texto(datos, "notas"),
  };
}

export async function nuevoExpediente(datos: FormData): Promise<void> {
  const resultado = await crearExpediente(entrada(datos));
  revalidatePath("/expedientes");
  if (!resultado.ok) {
    redirect(`/expedientes/nuevo?error=${encodeURIComponent(resultado.error)}`);
  }
  redirect(`/expedientes/${resultado.valor.id}?hecho=${encodeURIComponent("Expediente creado.")}`);
}

export async function guardarExpediente(datos: FormData): Promise<void> {
  const id = texto(datos, "id");
  const resultado = await actualizarExpediente(id, entrada(datos));
  revalidatePath("/expedientes");
  revalidatePath(`/expedientes/${id}`);
  const parametro = resultado.ok
    ? `hecho=${encodeURIComponent("Cambios guardados.")}`
    : `error=${encodeURIComponent(resultado.error)}`;
  redirect(`/expedientes/${id}?${parametro}`);
}

export async function borrarExpediente(datos: FormData): Promise<void> {
  const resultado = await eliminarExpediente(texto(datos, "id"));
  revalidatePath("/expedientes");
  const parametro = resultado.ok
    ? `hecho=${encodeURIComponent(`Se borró "${resultado.valor}".`)}`
    : `error=${encodeURIComponent(resultado.error)}`;
  redirect(`/expedientes?${parametro}`);
}
