"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarEntradaHistoria,
  actualizarExpediente,
  actualizarParte,
  crearEntradaHistoria,
  crearExpediente,
  crearGasto,
  crearParte,
  eliminarEntradaHistoria,
  eliminarExpediente,
  eliminarGasto,
  eliminarParte,
  sumarParteDeCaratula,
  type CargaDeEntrada,
  type CentroJudicial,
  type ClaseExpediente,
  type ConceptoGasto,
  type EntradaExpediente,
  type EntradaParte,
  type EstadoExpediente,
  type EstadoGasto,
  type Resultado,
  type SubtipoEntrada,
  type TipoEntrada,
  type RolCliente,
  type RolParte,
  type TipoGasto,
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
    juzgadoTipo: texto(datos, "juzgadoTipo"),
    juzgadoNumero: texto(datos, "juzgadoNumero"),
    oficinaGestion: texto(datos, "oficinaGestion"),
    clase: texto(datos, "clase") as ClaseExpediente,
    ultimoMovimiento: texto(datos, "ultimoMovimiento"),
    caducidadDeclarada: texto(datos, "caducidadDeclarada"),
    audienciaTipo: texto(datos, "audienciaTipo"),
    audienciaFecha: texto(datos, "audienciaFecha"),
    audienciaHora: texto(datos, "audienciaHora"),
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
  // El expediente es un `layout` con una pestaña por ruta: se revalida el
  // layout para que se renueven la cabecera y todas las pestañas, y no solo
  // una de ellas.
  revalidatePath(`/expedientes/${id}`, "layout");
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

/*
 * Contabilidad del expediente (docs/02-expedientes.md §2.12). Las dos acciones
 * vuelven a la pestaña de Contabilidad con el aviso en la URL, que es de donde
 * lo lee el cuadro del expediente.
 */

export async function agregarGasto(datos: FormData): Promise<void> {
  const expedienteId = texto(datos, "expedienteId");
  const resultado = await crearGasto({
    expedienteId,
    tipo: texto(datos, "tipo") as TipoGasto,
    concepto: texto(datos, "concepto") as ConceptoGasto,
    detalle: texto(datos, "detalle"),
    importe: texto(datos, "importe"),
    fecha: texto(datos, "fecha"),
    estado: texto(datos, "estado") as EstadoGasto,
  });
  revalidatePath(`/expedientes/${expedienteId}`, "layout");
  const parametro = resultado.ok
    ? `hecho=${encodeURIComponent("Partida agregada.")}`
    : `error=${encodeURIComponent(resultado.error)}`;
  redirect(`/expedientes/${expedienteId}/contabilidad?${parametro}`);
}

export async function borrarGasto(datos: FormData): Promise<void> {
  const expedienteId = texto(datos, "expedienteId");
  const resultado = await eliminarGasto(texto(datos, "id"));
  revalidatePath(`/expedientes/${expedienteId}`, "layout");
  const parametro = resultado.ok
    ? `hecho=${encodeURIComponent(`Se borró "${resultado.valor}".`)}`
    : `error=${encodeURIComponent(resultado.error)}`;
  redirect(`/expedientes/${expedienteId}/contabilidad?${parametro}`);
}

/*
 * Nómina de partes del expediente (docs/02-expedientes.md §2.14). Las cuatro
 * acciones vuelven a la pestaña de Partes con el aviso en la URL.
 */

function entradaParte(datos: FormData): EntradaParte {
  return {
    expedienteId: texto(datos, "expedienteId"),
    rol: texto(datos, "rol") as RolParte,
    nombre: texto(datos, "nombre"),
    documento: texto(datos, "documento"),
    domicilioReal: texto(datos, "domicilioReal"),
    domicilioElectronico: texto(datos, "domicilioElectronico"),
    telefono: texto(datos, "telefono"),
    email: texto(datos, "email"),
    representaA: texto(datos, "representaA"),
    // Una casilla sin marcar no viaja en el formulario: no está es `false`.
    esCliente: datos.get("esCliente") !== null,
    notas: texto(datos, "notas"),
  };
}

/** Vuelve a la pestaña con el resultado, y al ancla de la parte si la hay. */
function volverAPartes<T>(
  expedienteId: string,
  resultado: Resultado<T>,
  hecho: string,
  ancla = "",
): never {
  revalidatePath(`/expedientes/${expedienteId}`, "layout");
  const parametro = resultado.ok
    ? `hecho=${encodeURIComponent(hecho)}`
    : `error=${encodeURIComponent(resultado.error)}`;
  redirect(`/expedientes/${expedienteId}/partes?${parametro}${ancla}`);
}

export async function agregarParte(datos: FormData): Promise<void> {
  const entrada = entradaParte(datos);
  const resultado = await crearParte(entrada);
  volverAPartes(entrada.expedienteId, resultado, "Parte agregada.");
}

export async function guardarParte(datos: FormData): Promise<void> {
  const entrada = entradaParte(datos);
  const id = texto(datos, "id");
  const resultado = await actualizarParte(id, entrada);
  volverAPartes(entrada.expedienteId, resultado, "Parte guardada.", `#parte-${id}`);
}

export async function borrarParte(datos: FormData): Promise<void> {
  const expedienteId = texto(datos, "expedienteId");
  const resultado = await eliminarParte(texto(datos, "id"));
  volverAPartes(
    expedienteId,
    resultado,
    resultado.ok ? `Se borró "${resultado.valor}" de la nómina.` : "",
  );
}

/** Da de alta como parte al actor o al demandado que ya nombra la carátula. */
export async function agregarParteDeCaratula(datos: FormData): Promise<void> {
  const expedienteId = texto(datos, "expedienteId");
  const rol = texto(datos, "rol") === "demandado" ? "demandado" : "actor";
  const resultado = await sumarParteDeCaratula(expedienteId, rol);
  volverAPartes(
    expedienteId,
    resultado,
    resultado.ok ? `"${resultado.valor.nombre}" entró en la nómina. Completá sus datos.` : "",
    resultado.ok ? `#parte-${resultado.valor.id}` : "",
  );
}

/*
 * Historia del expediente (docs/02-expedientes.md §2.3). Las tres acciones
 * vuelven a la pestaña de Historia, al ancla de la actuación cuando la hay.
 */

function entradaHistoria(datos: FormData): CargaDeEntrada {
  return {
    expedienteId: texto(datos, "expedienteId"),
    fecha: texto(datos, "fecha"),
    fechaNotificacion: texto(datos, "fechaNotificacion"),
    tipo: texto(datos, "tipo") as TipoEntrada,
    subtipo: texto(datos, "subtipo") as SubtipoEntrada,
    titulo: texto(datos, "titulo"),
    texto: texto(datos, "texto"),
    abreEtapa: texto(datos, "abreEtapa"),
  };
}

/** Vuelve a la pestaña con el resultado, y al ancla de la actuación si la hay. */
function volverAHistoria<T>(
  expedienteId: string,
  resultado: Resultado<T>,
  hecho: string,
  ancla = "",
): never {
  // Se revalida el layout y no solo la pestaña: una actuación puede mover la
  // etapa y la fecha del último movimiento, que se leen en la cabecera del
  // expediente y en el semáforo de caducidad.
  revalidatePath(`/expedientes/${expedienteId}`, "layout");
  revalidatePath("/expedientes");
  const parametro = resultado.ok
    ? `hecho=${encodeURIComponent(hecho)}`
    : `error=${encodeURIComponent(resultado.error)}`;
  redirect(`/expedientes/${expedienteId}/historia?${parametro}${ancla}`);
}

export async function agregarEntradaHistoria(datos: FormData): Promise<void> {
  const entrada = entradaHistoria(datos);
  const resultado = await crearEntradaHistoria(entrada);
  volverAHistoria(
    entrada.expedienteId,
    resultado,
    "Actuación cargada en la historia.",
    resultado.ok ? `#entrada-${resultado.valor.id}` : "",
  );
}

/**
 * Guarda un escrito redactado en el editor como una entrada de la historia
 * (docs/02-expedientes.md §2.5).
 *
 * Entra como **presentado**, con la fecha que puso el abogado: una presentación
 * del estudio en la historia significa que se presentó, y por eso impulsa el
 * proceso. El borrador no va a la historia —vive en el editor hasta que se
 * presenta—, y las versiones llegan con `documents`.
 *
 * Se guarda el **cuerpo**, no la hoja completa: el encabezado se vuelve a armar
 * con los metadatos cada vez que se abre, así que guardarlo sería guardar dos
 * veces el mismo dato y dejar la copia vieja cuando cambie el juzgado.
 */
export async function agregarEscrito(datos: FormData): Promise<void> {
  const expedienteId = texto(datos, "expedienteId");
  const resultado = await crearEntradaHistoria({
    expedienteId,
    fecha: texto(datos, "fecha"),
    fechaNotificacion: "",
    tipo: "escrito_propio",
    subtipo: texto(datos, "subtipo") as SubtipoEntrada,
    titulo: texto(datos, "suma"),
    texto: texto(datos, "texto"),
    abreEtapa: "",
  });
  volverAHistoria(
    expedienteId,
    resultado,
    "Escrito guardado en la historia como presentado.",
    resultado.ok ? `#entrada-${resultado.valor.id}` : "",
  );
}

export async function guardarEntradaHistoria(datos: FormData): Promise<void> {
  const entrada = entradaHistoria(datos);
  const id = texto(datos, "id");
  const resultado = await actualizarEntradaHistoria(id, entrada);
  volverAHistoria(entrada.expedienteId, resultado, "Actuación guardada.", `#entrada-${id}`);
}

export async function borrarEntradaHistoria(datos: FormData): Promise<void> {
  const expedienteId = texto(datos, "expedienteId");
  const resultado = await eliminarEntradaHistoria(texto(datos, "id"));
  volverAHistoria(
    expedienteId,
    resultado,
    resultado.ok ? `Se borró "${resultado.valor}" de la historia.` : "",
  );
}
