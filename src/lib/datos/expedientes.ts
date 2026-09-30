import { randomUUID } from "node:crypto";
import {
  construirCaratula,
  nombrePropio,
  normalizarEspacios,
  numeroExpediente,
  oracion,
  partirCaratula,
  titulo,
} from "@/lib/formato";
import { ahora, hoy, leerDatos, modificarDatos } from "./almacen";
import { oficinaGestion } from "./filtros";
import { correcto, fallo, type Resultado } from "./resultado";
import type {
  CentroJudicial,
  ClaseExpediente,
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
  /** Radicación: tipo de juzgado, nominación y Oficina de Gestión Asociada. */
  juzgadoTipo: string;
  juzgadoNumero: string;
  oficinaGestion: string;
  /** Principal o incidente: decide el plazo de caducidad (seis o tres meses). */
  clase: ClaseExpediente;
  /** Fecha del último movimiento. Si viene vacía, se usa la de hoy. */
  ultimoMovimiento: string;
  /** Fecha en que el juzgado declaró la caducidad, si la declaró. */
  caducidadDeclarada: string;
  /** Audiencia fijada, si hay una. */
  audienciaTipo: string;
  audienciaFecha: string;
  audienciaHora: string;
}

export async function listarExpedientes(): Promise<Expediente[]> {
  const { expedientes } = await leerDatos();
  return [...expedientes].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function obtenerExpediente(id: string): Promise<Expediente | undefined> {
  const { expedientes } = await leerDatos();
  return expedientes.find((expediente) => expediente.id === id);
}

/**
 * Juzgados y Oficinas de Gestión Asociada que ya se usaron, para sugerirlos en
 * el alta sin obligar a elegir de una lista cerrada. Es el mismo criterio que
 * `listarMaterias` y desaparece cuando exista el catálogo de juzgados de
 * Configuración (`courts` en docs/06-modelo-de-datos.md).
 */
export async function listarRadicaciones(): Promise<{
  juzgados: string[];
  nominaciones: string[];
  oficinasGestion: string[];
}> {
  const { expedientes } = await leerDatos();
  const ordenar = (valores: Set<string>) =>
    [...valores].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));

  return {
    juzgados: ordenar(new Set(expedientes.map((expediente) => expediente.juzgadoTipo ?? ""))),
    nominaciones: ordenar(new Set(expedientes.map((expediente) => expediente.juzgadoNumero ?? ""))),
    oficinasGestion: ordenar(new Set(expedientes.map(oficinaGestion))),
  };
}

// La búsqueda, los filtros y `identificador` viven en `./filtros`, que es un
// módulo puro: el listado los usa en el cliente para filtrar mientras se tipea.

/** 'YYYY-MM-DD' si la fecha está bien escrita y existe; si no, cadena vacía. */
function fecha(valor: string): string {
  const limpio = normalizarEspacios(valor);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio)) return "";
  // El constructor de Date corrige los meses y días imposibles ("2026-02-31"
  // pasa a marzo), así que se compara contra lo que se escribió.
  return new Date(`${limpio}T00:00:00Z`).toISOString().slice(0, 10) === limpio ? limpio : "";
}

/** 'HH:mm' en formato de 24 horas; vacía si no lo es. */
function hora(valor: string): string {
  const limpio = normalizarEspacios(valor);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(limpio) ? limpio : "";
}

/**
 * Nominación del juzgado en mayúsculas: se escribe en números romanos ("VI") y
 * el SAE la muestra así, pero el abogado puede cargar "6" y se respeta.
 */
function nominacion(valor: string): string {
  return normalizarEspacios(valor).toUpperCase();
}

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
  // Sin fecha no hay audiencia fijada: el tipo y la hora sueltos serían un
  // resto de una audiencia que ya pasó o que se dio de baja.
  const audienciaFecha = fecha(entrada.audienciaFecha);

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
    juzgadoTipo: titulo(entrada.juzgadoTipo, opciones),
    juzgadoNumero: nominacion(entrada.juzgadoNumero),
    oficinaGestion: titulo(entrada.oficinaGestion, opciones),
    clase: entrada.clase === "incidente" ? ("incidente" as const) : ("principal" as const),
    // Una fecha mal escrita no se guarda a medias: queda vacía y el cómputo de
    // la caducidad cae en la fecha de la etapa, que es un dato que sí existe.
    ultimoMovimiento: fecha(entrada.ultimoMovimiento),
    caducidadDeclarada: fecha(entrada.caducidadDeclarada),
    audienciaFecha,
    audienciaTipo: audienciaFecha ? titulo(entrada.audienciaTipo, opciones) : "",
    audienciaHora: audienciaFecha ? hora(entrada.audienciaHora) : "",
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
      // Dar de alta el expediente cuenta como movimiento: sin esto, un
      // expediente nuevo con la fecha en blanco nacería para caducidad.
      ultimoMovimiento: campos.ultimoMovimiento || hoy(),
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
      // Pasar de etapa es un movimiento del expediente, así que corre de nuevo
      // el plazo de caducidad. Si el abogado no tocó la fecha, se conserva la
      // que había en lugar de borrarla.
      ultimoMovimiento:
        campos.ultimoMovimiento || (cambioDeEtapa ? hoy() : (expediente.ultimoMovimiento ?? "")),
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
