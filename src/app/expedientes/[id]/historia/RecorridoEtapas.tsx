import { formatoFecha } from "@/lib/plazos";
import type { EtapaRecorrida, Recorrido } from "@/lib/procesal";

/**
 * El recorrido del expediente por las etapas de su tipo de proceso, en la misma
 * línea que los filtros de la historia (docs/02-expedientes.md §2.3).
 *
 * Las etapas salen de la plantilla que el abogado configuró para ese tipo de
 * proceso (Configuración → Tipos de proceso), no de una lista fija del sistema:
 * el recorrido de un ordinario de daños y el de un ejecutivo son distintos
 * porque sus plantillas lo son.
 *
 * Es un tramo por etapa, del tamaño de la etapa y no de su duración: lo que
 * interesa es cuántas quedaron atrás y cuántas faltan, no cuánto tardó cada
 * una. Los tres estados usan los tres registros de color que ya tiene la
 * aplicación: lo cumplido en el gris hondo de las barras de Contabilidad, la
 * etapa actual en el azul del acento —que es el color de "dónde estoy"— y lo
 * que falta en la línea del papel.
 */

function claseTramo(estado: EtapaRecorrida["estado"]): string {
  if (estado === "actual") return "bg-acento";
  if (estado === "cumplida") return "bg-zinc-500 dark:bg-zinc-400";
  return "bg-linea";
}

/** Lo que dice el tramo al pasar el mouse: la etapa, su estado y su fecha. */
function titulo(etapa: EtapaRecorrida): string {
  const estado =
    etapa.estado === "actual" ? "etapa actual" : etapa.estado === "cumplida" ? "cumplida" : "falta";
  const desde = etapa.fecha ? ` — ${formatoFecha(etapa.fecha)}` : "";
  return `${etapa.nombre}: ${estado}${desde}`;
}

export function RecorridoEtapas({
  recorrido,
  /** Nombre del tipo de proceso y materia, que son de dónde sale el recorrido. */
  proceso,
}: {
  recorrido: Recorrido;
  proceso: string;
}) {
  if (recorrido.total === 0) return null;

  const cumplidas = recorrido.etapas.filter((etapa) => etapa.estado === "cumplida").length;
  const resumen = recorrido.actual
    ? `${recorrido.actual.nombre} · etapa ${recorrido.posicion} de ${recorrido.total}`
    : `${cumplidas} de ${recorrido.total} etapas`;

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 sm:justify-end"
      /* El resumen completo en un solo lugar accesible: un lector de pantalla
         no puede leer una tira de tramos de colores. */
      role="group"
      aria-label={`Recorrido del expediente en ${proceso}. ${recorrido.etapas
        .map((etapa) => titulo(etapa))
        .join(". ")}`}
    >
      <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-500">{resumen}</span>
      <span aria-hidden className="flex min-w-24 max-w-64 flex-1 gap-0.5">
        {recorrido.etapas.map((etapa) => (
          <span
            key={etapa.clave}
            title={titulo(etapa)}
            className={`h-2 flex-1 rounded-[1px] first:rounded-l-full last:rounded-r-full ${claseTramo(
              etapa.estado,
            )}`}
          />
        ))}
      </span>
    </div>
  );
}
