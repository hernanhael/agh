import { cache } from "react";
import { notFound } from "next/navigation";
import { obtenerExpediente, obtenerTipoProceso } from "@/lib/datos";

/**
 * Lecturas compartidas por el cuadro del expediente y sus pestañas.
 *
 * El cuadro necesita el expediente para la cabecera y la pestaña abierta lo
 * necesita para su contenido. `cache` de React hace que las dos lecturas del
 * mismo pedido sean una sola: sin esto, cada navegación entre pestañas abre el
 * archivo del almacén dos veces (y mañana serán dos consultas a Postgres).
 *
 * Si el expediente no existe se corta acá con `notFound`, así ninguna pestaña
 * tiene que repetir la comprobación.
 */

export const cargarExpediente = cache(async (id: string) => {
  const expediente = await obtenerExpediente(id);
  if (!expediente) notFound();
  return expediente;
});

/** El tipo de proceso del expediente, o `undefined` si quedó sin tipo. */
export const cargarTipoProceso = cache(async (tipoProcesoId: string) =>
  tipoProcesoId ? obtenerTipoProceso(tipoProcesoId) : undefined,
);
