import { Marca, Pendientes, Vacio } from "@/components/ui";
import { hoy } from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import { audienciaFijada } from "@/lib/procesal";
import { cargarExpediente, cargarTipoProceso } from "../cargar";

/**
 * Pestaña **Historia**: la línea de tiempo única del expediente
 * (docs/02-expedientes.md §2.3).
 *
 * Es la pieza más grande del área y todavía no tiene su tabla: las actuaciones
 * del juzgado, los escritos, los documentos y las notas llegan con la carga
 * manual asistida y el conector del SAE (docs/09-conector-sae.md).
 *
 * Mientras eso no exista, la historia se arma con **las fechas que ya están
 * cargadas en la ficha**, que son hechos del expediente con la misma forma que
 * va a tener una entrada: fecha, qué pasó y de dónde viene el dato. Así la
 * pestaña muestra algo verdadero desde el primer día y el dibujo queda hecho
 * para cuando las entradas sean de verdad.
 *
 * Solo entra lo que **ya pasó**: una audiencia futura es agenda, no historia.
 * Se lee de lo más reciente a lo más antiguo, que es como se abre un
 * expediente cuando se quiere saber en qué quedó.
 */

type OrigenEntrada = "abogado" | "juzgado";

interface Entrada {
  fecha: string;
  titulo: string;
  detalle?: string;
  origen: OrigenEntrada;
}

export default async function HistoriaExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/historia">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const tipo = await cargarTipoProceso(expediente.tipoProcesoId);
  const dia = hoy();
  const audiencia = audienciaFijada(expediente, dia);
  const etapa = tipo?.etapas.find((candidata) => candidata.clave === expediente.etapaActual);

  const entradas: Entrada[] = [
    {
      fecha: expediente.creadoEn.slice(0, 10),
      titulo: "Alta del expediente en el sistema",
      detalle: tipo ? `Tipo de proceso: ${tipo.nombre}` : undefined,
      origen: "abogado",
    },
  ];

  if (expediente.etapaDesde) {
    entradas.push({
      fecha: expediente.etapaDesde,
      titulo: `Pasa a la etapa ${etapa?.nombre ?? expediente.etapaActual}`,
      origen: "abogado",
    });
  }

  if (expediente.ultimoMovimiento) {
    entradas.push({
      fecha: expediente.ultimoMovimiento,
      titulo: "Último movimiento útil del expediente",
      detalle: "Es la fecha de la que se cuenta la caducidad de instancia",
      origen: "abogado",
    });
  }

  if (audiencia?.pasada) {
    entradas.push({
      fecha: audiencia.fecha,
      titulo: audiencia.tipo,
      detalle: audiencia.hora ? `Fijada a las ${audiencia.hora}` : undefined,
      origen: "juzgado",
    });
  }

  if (expediente.caducidadDeclarada) {
    entradas.push({
      fecha: expediente.caducidadDeclarada,
      titulo: "El juzgado declaró la caducidad de instancia",
      origen: "juzgado",
    });
  }

  entradas.sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Por ahora la historia se arma con las fechas cargadas en la ficha. Las actuaciones del
        juzgado, los escritos y los documentos entran acá cuando esté la carga de actuaciones.
      </p>

      {entradas.length === 0 ? (
        <div className="mt-4">
          <Vacio>Todavía no hay nada registrado en este expediente.</Vacio>
        </div>
      ) : (
        <ol className="mt-4">
          {entradas.map((entrada, posicion) => {
            const ultima = posicion === entradas.length - 1;
            return (
              <li key={`${entrada.fecha}-${entrada.titulo}`} className="flex gap-3">
                <span className="w-16 shrink-0 pt-0.5 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
                  {formatoFecha(entrada.fecha)}
                </span>
                {/* El hilo de la línea de tiempo: punto en cada entrada y la
                    línea hasta la siguiente, que la última no lleva. */}
                <span aria-hidden className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-linea-fuerte" />
                  {ultima ? null : <span className="w-px flex-1 bg-linea" />}
                </span>
                <div className={ultima ? "flex-1" : "flex-1 pb-5"}>
                  <p className="text-sm text-zinc-900 dark:text-zinc-50">
                    {entrada.titulo}
                    <Marca className="ml-2 align-middle">{entrada.origen}</Marca>
                  </p>
                  {entrada.detalle ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{entrada.detalle}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Pendientes
        items={[
          "Entradas de verdad: actuaciones del juzgado, escritos propios y de la contraria, documentos, eventos, notas, cambios de etapa e informes de agentes (§2.3).",
          "Carga manual asistida: pegar el texto de una actuación o subir el PDF, y que la IA lo clasifique, lo resuma y proponga los plazos.",
          "Ingesta desde el Portal del SAE con deduplicación por hash y vinculación automática al expediente (docs/09-conector-sae.md).",
          "Filtros por tipo y por origen, para ver solo lo que hizo el juzgado o solo lo que se presentó.",
          "Marca visible en las entradas de origen IA, con el agente y la aprobación del abogado.",
          "Indexación del texto para la búsqueda y para el RAG de los agentes.",
        ]}
      />
    </>
  );
}
