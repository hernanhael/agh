import { randomUUID } from "node:crypto";
import { nombrePropio, normalizarEspacios, oracion, titulo } from "@/lib/formato";
import { ahora, leerDatos, modificarDatos } from "./almacen";
import { correcto, fallo, type Resultado } from "./resultado";
import { ROLES_PARTE, type Datos, type Parte, type RolParte } from "./tipos";

/**
 * Nómina de partes del expediente: alta, edición y baja
 * (`case_parties` en docs/06-modelo-de-datos.md, docs/02-expedientes.md §2.14).
 *
 * Cómo se agrupa y cómo se concilia con la carátula no está acá sino en
 * `lib/procesal/partes`, que es puro. Este módulo solo guarda hechos, como el
 * resto de los repositorios.
 */

export interface EntradaParte {
  expedienteId: string;
  rol: RolParte;
  nombre: string;
  documento: string;
  domicilioReal: string;
  domicilioElectronico: string;
  telefono: string;
  email: string;
  /** Id de otra parte del mismo expediente. Vacío si no representa a nadie. */
  representaA: string;
  esCliente: boolean;
  notas: string;
}

/** El rol pedido si está en el catálogo; si no, "otro". */
function rolValido(valor: string): RolParte {
  return ROLES_PARTE.some((rol) => rol.valor === valor) ? (valor as RolParte) : "otro";
}

/**
 * Documento como lo escribe el abogado, sin espacios de más.
 *
 * No se reformatea a "25.123.456" ni se valida el dígito verificador del CUIT:
 * en los escritos el documento se transcribe tal como figura en el expediente,
 * y un DNI extranjero o un pasaporte no siguen ninguno de los dos formatos.
 */
function documento(valor: string): string {
  return normalizarEspacios(valor);
}

/** Casilla del SAE o correo: se guardan en minúsculas, que es como se tipean. */
function minusculas(valor: string): string {
  return normalizarEspacios(valor).toLowerCase();
}

function normalizar(entrada: EntradaParte, acentuar: boolean) {
  const opciones = { acentuar };
  return {
    rol: rolValido(entrada.rol),
    nombre: nombrePropio(entrada.nombre, opciones),
    documento: documento(entrada.documento),
    // El domicilio es un nombre de calle y de ciudad: va como título, que es lo
    // que deja "San Miguel de Tucumán" con la partícula en minúscula.
    domicilioReal: titulo(entrada.domicilioReal, opciones),
    domicilioElectronico: minusculas(entrada.domicilioElectronico),
    telefono: normalizarEspacios(entrada.telefono),
    email: minusculas(entrada.email),
    esCliente: entrada.esCliente,
    notas: oracion(entrada.notas),
  };
}

/**
 * A quién representa, validado contra la nómina del mismo expediente.
 *
 * Tres cosas no se aceptan: representar a una parte de otro expediente,
 * representarse a sí mismo, y representar a quien a su vez representa a otro
 * —una cadena de dos saltos que la pestaña no sabría dibujar—.
 */
function representaValido(
  datos: Datos,
  expedienteId: string,
  representaA: string,
  idPropio: string,
): string {
  if (!representaA) return "";
  const representado = (datos.partes ?? []).find((parte) => parte.id === representaA);
  if (!representado) return "";
  if (representado.expedienteId !== expedienteId) return "";
  if (representado.id === idPropio) return "";
  if (representado.representaA) return "";
  return representado.id;
}

/** Deja una sola parte marcada como cliente en el expediente. */
function clienteUnico(datos: Datos, expedienteId: string, idCliente: string): void {
  for (const parte of datos.partes ?? []) {
    if (parte.expedienteId !== expedienteId || parte.id === idCliente) continue;
    if (parte.esCliente) {
      parte.esCliente = false;
      parte.actualizadoEn = ahora();
    }
  }
}

/** Las partes de un expediente, en el orden en que se cargaron. */
export async function listarPartes(expedienteId: string): Promise<Parte[]> {
  const datos = await leerDatos();
  return (datos.partes ?? []).filter((parte) => parte.expedienteId === expedienteId);
}

export async function crearParte(entrada: EntradaParte): Promise<Resultado<Parte>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find(
      (candidato) => candidato.id === entrada.expedienteId,
    );
    if (!expediente) return fallo<Parte>("No se encontró el expediente.");

    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.nombre) return fallo<Parte>("Escribí el nombre de la parte.");

    const marca = ahora();
    const parte: Parte = {
      id: randomUUID(),
      expedienteId: expediente.id,
      ...campos,
      representaA: representaValido(datos, expediente.id, entrada.representaA, ""),
      creadoEn: marca,
      actualizadoEn: marca,
    };

    // El almacén puede venir de una versión anterior, sin la lista.
    datos.partes ??= [];
    datos.partes.push(parte);
    if (parte.esCliente) clienteUnico(datos, expediente.id, parte.id);
    return correcto(parte);
  });
}

export async function actualizarParte(
  id: string,
  entrada: EntradaParte,
): Promise<Resultado<Parte>> {
  return modificarDatos((datos) => {
    datos.partes ??= [];
    const parte = datos.partes.find((candidata) => candidata.id === id);
    if (!parte) return fallo<Parte>("No se encontró la parte.");

    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.nombre) return fallo<Parte>("Escribí el nombre de la parte.");

    Object.assign(parte, campos, {
      representaA: representaValido(datos, parte.expedienteId, entrada.representaA, parte.id),
      actualizadoEn: ahora(),
    });
    if (parte.esCliente) clienteUnico(datos, parte.expedienteId, parte.id);
    return correcto(parte);
  });
}

/**
 * Da de alta la parte que ya nombra la carátula, con el rol del lado que
 * ocupa: el abogado completa después el documento y los domicilios.
 *
 * Es el atajo de la nómina vacía (docs/02-expedientes.md §2.14): el actor y el
 * demandado ya están escritos en la carátula, así que volver a tipearlos sería
 * trabajo que el sistema puede ahorrarse.
 */
export async function sumarParteDeCaratula(
  expedienteId: string,
  rol: "actor" | "demandado",
): Promise<Resultado<Parte>> {
  const datos = await leerDatos();
  const expediente = datos.expedientes.find((candidato) => candidato.id === expedienteId);
  if (!expediente) return fallo<Parte>("No se encontró el expediente.");

  const nombre = rol === "actor" ? expediente.actor : expediente.demandado;
  if (!nombre) return fallo<Parte>("La carátula de este expediente no tiene ese lado cargado.");

  return crearParte({
    expedienteId,
    rol,
    nombre,
    documento: "",
    domicilioReal: "",
    domicilioElectronico: "",
    telefono: "",
    email: "",
    representaA: "",
    // La carátula dice de qué lado está el estudio, así que si el lado que se
    // suma es el del cliente, la parte nace marcada como tal.
    esCliente: expediente.rolCliente === rol,
    notas: "",
  });
}

export async function eliminarParte(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    datos.partes ??= [];
    const indice = datos.partes.findIndex((parte) => parte.id === id);
    if (indice === -1) return fallo<string>("No se encontró la parte.");
    const [borrada] = datos.partes.splice(indice, 1);

    // Los letrados de quien se borró quedan sin representado: se les suelta la
    // referencia en lugar de dejarla apuntando a una parte que ya no existe.
    for (const parte of datos.partes) {
      if (parte.representaA === borrada.id) {
        parte.representaA = "";
        parte.actualizadoEn = ahora();
      }
    }
    return correcto(borrada.nombre);
  });
}
