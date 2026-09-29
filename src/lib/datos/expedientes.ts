import { randomUUID } from "node:crypto";
import {
  construirCaratula,
  nombrePropio,
  numeroExpediente,
  oracion,
  partirCaratula,
  titulo,
} from "@/lib/formato";
import { ahora, hoy, leerDatos, modificarDatos } from "./almacen";
import { correcto, fallo, type Resultado } from "./resultado";
import type {
  CentroJudicial,
  EstadoExpediente,
  Expediente,
  RolCliente,
  TipoProceso,
} from "./tipos";

/**
 * Expedientes: alta, edición y baja.
 *
 * Al dar de alta, el abogado elige el **tipo de proceso** y con eso el
 * expediente queda posicionado en la primera etapa de esa plantilla
 * (docs/02-expedientes.md §2.1). La carátula se escribe o se pega como venga
 * y se guarda ya normalizada, junto con sus tres componentes.
 */

export interface EntradaExpediente {
  numero: string;
  anio: string;
  /** Carátula tal como la escribe o la pega el abogado. */
  caratula: string;
  tipoProcesoId: string;
  /** Clave de etapa. Si viene vacía, se usa la primera del tipo de proceso. */
  etapaActual: string;
  centroJudicial: CentroJudicial;
  fuero: string;
  materia: string;
  rolCliente: RolCliente;
  estado: EstadoExpediente;
  notas: string;
}

export async function listarExpedientes(): Promise<Expediente[]> {
  const { expedientes } = await leerDatos();
  return [...expedientes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerExpediente(id: string): Promise<Expediente | undefined> {
  const { expedientes } = await leerDatos();
  return expedientes.find((expediente) => expediente.id === id);
}

// La búsqueda, los filtros y `identificador` viven en `./filtros`, que es un
// módulo puro: el listado los usa en el cliente para filtrar mientras se tipea.

/**
 * Normaliza lo que cargó el abogado: la carátula se parte en actor,
 * demandado y objeto, cada uno se formatea según lo que es, y la carátula se
 * vuelve a armar desde esos componentes.
 */
function normalizar(entrada: EntradaExpediente, acentuar: boolean) {
  const opciones = { acentuar };
  const partes = partirCaratula(entrada.caratula);
  const identificacion = numeroExpediente(entrada.numero, entrada.anio);
  const [numero, anio] = identificacion ? identificacion.split("/") : ["", ""];

  return {
    numero,
    anio,
    actor: nombrePropio(partes.actor, opciones),
    demandado: nombrePropio(partes.demandado, opciones),
    objeto: titulo(partes.objeto, opciones),
    caratula: construirCaratula(partes, opciones),
    materia: titulo(entrada.materia, opciones),
    fuero: entrada.fuero,
    centroJudicial: entrada.centroJudicial,
    rolCliente: entrada.rolCliente,
    estado: entrada.estado,
    notas: oracion(entrada.notas),
  };
}

/** La etapa pedida si existe en el tipo de proceso; si no, la primera. */
function etapaInicial(tipo: TipoProceso, etapaPedida: string): string {
  if (etapaPedida && tipo.etapas.some((etapa) => etapa.clave === etapaPedida)) return etapaPedida;
  return tipo.etapas[0]?.clave ?? "";
}

export async function crearExpediente(
  entrada: EntradaExpediente,
): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.numero || !campos.anio) {
      return fallo<Expediente>("El expediente necesita número y año (por ejemplo 1234 y 26).");
    }
    if (!campos.caratula) return fallo<Expediente>("El expediente necesita una carátula.");

    const tipo = datos.tiposProceso.find((candidato) => candidato.id === entrada.tipoProcesoId);
    if (!tipo) return fallo<Expediente>("Elegí el tipo de proceso del juicio.");

    const repetido = datos.expedientes.some(
      (expediente) =>
        expediente.numero === campos.numero &&
        expediente.anio === campos.anio &&
        expediente.centroJudicial === campos.centroJudicial,
    );
    if (repetido) {
      return fallo<Expediente>(
        `Ya hay un expediente ${campos.numero}/${campos.anio} en ese centro judicial.`,
      );
    }

    const marca = ahora();
    const nuevo: Expediente = {
      id: randomUUID(),
      ...campos,
      tipoProcesoId: tipo.id,
      etapaActual: etapaInicial(tipo, entrada.etapaActual),
      etapaDesde: hoy(),
      creadoEn: marca,
      actualizadoEn: marca,
    };
    datos.expedientes.push(nuevo);
    return correcto(nuevo);
  });
}

export async function actualizarExpediente(
  id: string,
  entrada: EntradaExpediente,
): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find((candidato) => candidato.id === id);
    if (!expediente) return fallo<Expediente>("No se encontró el expediente.");

    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.numero || !campos.anio) {
      return fallo<Expediente>("El expediente necesita número y año (por ejemplo 1234 y 26).");
    }
    if (!campos.caratula) return fallo<Expediente>("El expediente necesita una carátula.");

    const tipo = datos.tiposProceso.find((candidato) => candidato.id === entrada.tipoProcesoId);
    if (!tipo) return fallo<Expediente>("Elegí el tipo de proceso del juicio.");

    const repetido = datos.expedientes.some(
      (otro) =>
        otro.id !== id &&
        otro.numero === campos.numero &&
        otro.anio === campos.anio &&
        otro.centroJudicial === campos.centroJudicial,
    );
    if (repetido) {
      return fallo<Expediente>(
        `Ya hay un expediente ${campos.numero}/${campos.anio} en ese centro judicial.`,
      );
    }

    const etapa = etapaInicial(tipo, entrada.etapaActual);
    const cambioDeEtapa = etapa !== expediente.etapaActual;

    Object.assign(expediente, campos, {
      tipoProcesoId: tipo.id,
      etapaActual: etapa,
      etapaDesde: cambioDeEtapa ? hoy() : expediente.etapaDesde,
      actualizadoEn: ahora(),
    });
    return correcto(expediente);
  });
}

export async function eliminarExpediente(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    const indice = datos.expedientes.findIndex((expediente) => expediente.id === id);
    if (indice === -1) return fallo<string>("No se encontró el expediente.");
    const [borrado] = datos.expedientes.splice(indice, 1);
    return correcto(borrado.caratula);
  });
}
