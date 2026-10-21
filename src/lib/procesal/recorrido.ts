import type { EntradaHistoria, Expediente, TipoProceso } from "@/lib/datos/tipos";

/**
 * El recorrido del expediente por las etapas de su tipo de proceso
 * (docs/02-expedientes.md §2.2 y §2.3).
 *
 * Contesta de un vistazo las dos preguntas que no contesta la etapa actual
 * sola: **qué se cumplió** y **qué falta**. Las etapas no las inventa este
 * módulo: salen de la plantilla que el abogado configuró para ese tipo de
 * proceso, así que el recorrido de un ordinario de daños y el de un ejecutivo
 * son distintos porque sus plantillas lo son.
 *
 * Qué se cumplió se sabe de dos maneras, y se usan las dos: por el **orden** de
 * la etapa actual dentro de la plantilla —si está en Prueba, Demanda y Traslado
 * quedaron atrás— y por la **historia**, que además dice con qué actuación y en
 * qué fecha se abrió cada una. La historia es la que tiene la fecha; el orden
 * es el que no deja huecos cuando la historia está incompleta.
 *
 * Módulo puro, como el resto de `lib/procesal`.
 */

export type EstadoEtapa = "cumplida" | "actual" | "pendiente";

export interface EtapaRecorrida {
  clave: string;
  nombre: string;
  estado: EstadoEtapa;
  /** Fecha en que se abrió, si se sabe. */
  fecha?: string;
}

export interface Recorrido {
  etapas: EtapaRecorrida[];
  /** Posición de la etapa actual, empezando en 1. Cero si no se ubicó. */
  posicion: number;
  total: number;
  /** La etapa en la que está el expediente, si la plantilla la tiene. */
  actual?: EtapaRecorrida;
}

/**
 * Las etapas de la plantilla con su estado, más la posición del expediente.
 *
 * Una etapa que la historia abrió queda cumplida aunque esté después de la
 * actual en el orden de la plantilla: pasó, y el proceso puede haber vuelto
 * atrás —una nulidad, un recurso— sin que eso borre lo que ya ocurrió.
 */
export function recorridoDeEtapas({
  tipo,
  expediente,
  entradas,
}: {
  tipo: TipoProceso | undefined;
  expediente: Expediente;
  entradas: ReadonlyArray<EntradaHistoria>;
}): Recorrido {
  const plantilla = [...(tipo?.etapas ?? [])].sort((a, b) => a.orden - b.orden);

  /** La fecha más temprana en que la historia abrió cada etapa. */
  const aperturas = new Map<string, string>();
  for (const entrada of entradas) {
    if (!entrada.abreEtapa) continue;
    const anterior = aperturas.get(entrada.abreEtapa);
    if (!anterior || entrada.fecha < anterior) aperturas.set(entrada.abreEtapa, entrada.fecha);
  }

  const indiceActual = plantilla.findIndex((etapa) => etapa.clave === expediente.etapaActual);

  const etapas: EtapaRecorrida[] = plantilla.map((etapa, indice) => {
    const fecha =
      aperturas.get(etapa.clave) ??
      (etapa.clave === expediente.etapaActual ? expediente.etapaDesde : undefined);

    const estado: EstadoEtapa =
      etapa.clave === expediente.etapaActual
        ? "actual"
        : aperturas.has(etapa.clave) || (indiceActual >= 0 && indice < indiceActual)
          ? "cumplida"
          : "pendiente";

    return { clave: etapa.clave, nombre: etapa.nombre, estado, fecha: fecha || undefined };
  });

  return {
    etapas,
    posicion: indiceActual + 1,
    total: plantilla.length,
    actual: etapas.find((etapa) => etapa.estado === "actual"),
  };
}
