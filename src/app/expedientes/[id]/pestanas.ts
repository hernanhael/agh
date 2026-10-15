import {
  CalendarDays,
  Calculator,
  Gauge,
  IdCard,
  Sparkles,
  Timeline,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Las pestañas del expediente (docs/02-expedientes.md §2).
 *
 * El expediente es una sola cosa con muchas caras, así que cada cara es un
 * segmento de ruta propio —`/expedientes/<id>/partes`— y no un estado del
 * cliente: así se puede compartir el enlace de una pestaña, volver con el botón
 * de atrás y que cada pestaña cargue en el servidor solo lo que necesita.
 *
 * **El orden de esta lista es el orden de las teclas de función**: la primera
 * responde a F1, la segunda a F2, y así. Es la única fuente de la verdad; la
 * tira de pestañas, los atajos de teclado y la pestaña a la que cae
 * `/expedientes/<id>` salen todos de acá (`pestanas.test.ts` lo verifica).
 *
 * Módulo puro —solo datos e íconos—, para que lo pueda importar tanto el
 * cuadro del expediente, que corre en el servidor, como la tira de pestañas,
 * que corre en el cliente.
 */

export interface Pestana {
  /** Último segmento de la ruta y nombre de la carpeta: `datos`, `partes`… */
  clave: string;
  etiqueta: string;
  /** Qué se responde en esta pestaña. Va en el `title` del enlace. */
  proposito: string;
  Icono: LucideIcon;
}

export const PESTANAS: ReadonlyArray<Pestana> = [
  {
    clave: "datos",
    etiqueta: "Datos",
    proposito: "Número, radicación, encuadre y fechas del expediente",
    Icono: IdCard,
  },
  {
    clave: "partes",
    etiqueta: "Partes",
    proposito: "Quiénes litigan y de qué lado está el cliente",
    Icono: Users,
  },
  {
    clave: "agenda",
    etiqueta: "Agenda",
    proposito: "Audiencias, vencimientos y tareas de esta causa",
    Icono: CalendarDays,
  },
  {
    clave: "historia",
    etiqueta: "Historia",
    proposito: "Todo lo que pasó en el expediente, en una sola línea de tiempo",
    Icono: Timeline,
  },
  {
    clave: "resumen",
    etiqueta: "Resumen",
    proposito: "En qué estado está la causa y qué hay que hacer",
    Icono: Gauge,
  },
  {
    clave: "contabilidad",
    etiqueta: "Contabilidad",
    proposito: "Cuánto lleva gastado el juicio y cuánto falta",
    Icono: Calculator,
  },
  {
    clave: "ia",
    etiqueta: "IA",
    proposito: "Agentes que intervienen en este expediente",
    Icono: Sparkles,
  },
];

/** La pestaña a la que cae `/expedientes/<id>` sin segmento. */
export const PESTANA_INICIAL = PESTANAS[0].clave;

/** Tecla de función de la pestaña que está en esa posición: F1, F2, F3… */
export function teclaDePestana(indice: number): string {
  return `F${indice + 1}`;
}

export function rutaPestana(expedienteId: string, clave: string): string {
  return `/expedientes/${expedienteId}/${clave}`;
}
