import { diasEntre, formatoFecha, sumarMeses } from "@/lib/plazos/calendario";
import type { FechaISO } from "@/lib/plazos/tipos";
import {
  etiquetaEstado,
  type ClaseExpediente,
  type EstadoExpediente,
  type Expediente,
} from "@/lib/datos/tipos";

/**
 * Caducidad de instancia.
 *
 * Primera regla de derecho procesal que el sistema aplica sobre el expediente
 * (docs/02-expedientes.md §2.11). Responde la pregunta que el abogado se hace
 * de un vistazo en el listado: **¿este expediente se está cayendo?**
 *
 * El estado no se guarda: se **deduce** de la fecha del último movimiento, de
 * la clase del expediente y del estado cargado. Lo único que se guarda es el
 * hecho —la fecha del último movimiento y, si ocurrió, la fecha en que el
 * juzgado declaró la caducidad—, porque un estado derivado que se persiste
 * queda viejo solo con que pase el tiempo.
 *
 * Módulo **puro**: no toca el almacén ni usa APIs de Node, así que el listado
 * lo usa en el cliente mientras filtra. El día de hoy entra como argumento y
 * no se lee del reloj: el servidor y el cliente tienen que llegar al mismo
 * resultado, y los tests necesitan fijarlo.
 */

/**
 * Meses sin movimiento que hacen caducar la instancia **[a confirmar contra el
 * texto vigente de la Ley 9531]**. Son los plazos que indicó el abogado: seis
 * meses en el principal, tres en los incidentes. Cuando exista la sección de
 * plazos de Configuración pasan a ser configurables, como el resto.
 */
export const MESES_SIN_MOVIMIENTO: Record<ClaseExpediente, number> = {
  principal: 6,
  incidente: 3,
};

/** Desde cuándo el aviso pasa de "hay tiempo" a "esto vence pronto". */
export const DIAS_DE_AVISO = 30;

/**
 * Situación del expediente frente a la caducidad, que es lo que el listado
 * muestra con su color:
 *
 * - `en_movimiento` (verde): la instancia está abierta y el expediente se mueve.
 * - `para_caducidad` (amarillo): se cumplieron los meses sin movimiento y la
 *   contraria puede acusar la caducidad.
 * - `caduco` (rojo): el juzgado la declaró.
 * - `sin_instancia` (gris): no hay instancia en curso que pueda caducar
 *   (mediación previa, suspendido, con sentencia, en ejecución, archivado).
 */
export type EstadoProcesal = "en_movimiento" | "para_caducidad" | "caduco" | "sin_instancia";

/**
 * Estados en los que la caducidad no corre: o todavía no hay instancia abierta
 * (mediación previa), o el trámite está suspendido, o ya hay sentencia y con
 * ella se cerró la instancia.
 */
const SIN_INSTANCIA_EN_CURSO: ReadonlyArray<EstadoExpediente> = [
  "en_mediacion",
  "suspendido",
  "con_sentencia",
  "en_ejecucion",
  "archivado",
];

export interface SituacionCaducidad {
  estado: EstadoProcesal;
  /** Cómo se nombra en pantalla: "En trámite", "Para caducidad", "Caduco". */
  etiqueta: string;
  /** Por qué: "sin movimiento desde el 10/05/2026". */
  detalle: string;
  /** Fecha del último movimiento con la que se hizo el cómputo. */
  desde: FechaISO;
  /** Fecha en que se cumplen los meses sin movimiento. Ausente si no corre. */
  vence?: FechaISO;
  /** Días hasta `vence`; cero o negativo si el plazo ya se cumplió. */
  dias?: number;
}

/** Principal, salvo que el expediente esté marcado como incidente. */
export function claseDeExpediente(expediente: Expediente): ClaseExpediente {
  return expediente.clase === "incidente" ? "incidente" : "principal";
}

/** Meses sin movimiento que hacen caducar este expediente: seis o tres. */
export function mesesDeCaducidad(expediente: Expediente): number {
  return MESES_SIN_MOVIMIENTO[claseDeExpediente(expediente)];
}

/**
 * Fecha del último movimiento. Si el expediente no la tiene cargada —los que
 * se guardaron antes de que existiera el campo—, se usa la fecha en que entró
 * en la etapa actual, que es el último movimiento del que hay registro, y en
 * última instancia la fecha de carga.
 */
export function ultimoMovimiento(expediente: Expediente): FechaISO {
  return expediente.ultimoMovimiento || expediente.etapaDesde || expediente.creadoEn.slice(0, 10);
}

/**
 * Situación del expediente frente a la caducidad al día `hoy`.
 *
 * El orden de las reglas es el que manda el derecho: la caducidad declarada
 * tapa todo lo demás, después se ve si hay instancia en curso, y solo entonces
 * se cuentan los meses. Un expediente marcado como paralizado se informa para
 * caducidad aunque las fechas todavía no lleguen al plazo: esa marca es la del
 * abogado diciendo que el expediente no se mueve.
 */
export function situacionCaducidad(expediente: Expediente, hoy: FechaISO): SituacionCaducidad {
  const desde = ultimoMovimiento(expediente);

  if (expediente.caducidadDeclarada) {
    return {
      estado: "caduco",
      etiqueta: "Caduco",
      detalle: `caducidad declarada el ${formatoFecha(expediente.caducidadDeclarada)}`,
      desde,
    };
  }

  if (SIN_INSTANCIA_EN_CURSO.includes(expediente.estado)) {
    return {
      estado: "sin_instancia",
      etiqueta: etiquetaEstado(expediente.estado),
      detalle: "sin instancia en curso: la caducidad no corre",
      desde,
    };
  }

  const vence = sumarMeses(desde, mesesDeCaducidad(expediente));
  const dias = diasEntre(hoy, vence);

  if (dias <= 0 || expediente.estado === "paralizado") {
    return {
      estado: "para_caducidad",
      etiqueta: "Para caducidad",
      detalle: `sin movimiento desde el ${formatoFecha(desde)}`,
      desde,
      vence,
      dias,
    };
  }

  return {
    estado: "en_movimiento",
    etiqueta: "En trámite",
    detalle:
      dias <= DIAS_DE_AVISO
        ? `faltan ${dias} ${dias === 1 ? "día" : "días"} para la caducidad`
        : `último movimiento el ${formatoFecha(desde)}`,
    desde,
    vence,
    dias,
  };
}
