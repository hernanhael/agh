import { ChipProcesal } from "@/components/SituacionProcesal";
import { claseEtapa, claseSeparador, Marca, Pendientes } from "@/components/ui";
import { etiquetaDe, ESTADOS_EXPEDIENTE, hoy } from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import { audienciaFijada, situacionCaducidad } from "@/lib/procesal";
import { cargarExpediente, cargarTipoProceso } from "../cargar";

/**
 * Pestaña **Resumen**: en qué estado está la causa (docs/02-expedientes.md §2.7).
 *
 * Contesta las tres preguntas con las que el abogado abre un expediente: en qué
 * estado está, qué vence y cuándo, y qué tiene que hacer ahora. De las tres, el
 * sistema ya contesta las dos primeras.
 *
 * El semáforo de caducidad aparece acá con **el cómputo escrito** —de qué fecha
 * se cuenta, cuándo se cumple el plazo y cuánto falta—, que es lo que hace falta
 * para decidir si hay que impulsar el expediente hoy. En la cabecera del cuadro
 * está el mismo semáforo sin explicación, para tenerlo a la vista en cualquier
 * pestaña; en el listado, solo el color (§2.11).
 */
export default async function ResumenExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/resumen">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const tipo = await cargarTipoProceso(expediente.tipoProcesoId);
  const dia = hoy();
  const situacion = situacionCaducidad(expediente, dia);
  const audiencia = audienciaFijada(expediente, dia);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Marca>{tipo?.nombre ?? "sin tipo de proceso"}</Marca>
        <Marca tono="ok">
          {tipo?.etapas.find((etapa) => etapa.clave === expediente.etapaActual)?.nombre ??
            "sin etapa"}
        </Marca>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          desde {formatoFecha(expediente.etapaDesde)}
        </span>
        <ChipProcesal situacion={situacion} yaExplicado className="ml-auto" />
      </div>

      {/*
        El único color es el del semáforo: la explicación va en gris, igual que
        en el listado.
      */}
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{situacion.detalle}</span>
        {situacion.vence ? (
          <>
            <span className="px-1.5 text-linea-fuerte">·</span>
            {situacion.dias !== undefined && situacion.dias > 0
              ? `caduca el ${formatoFecha(situacion.vence)}, en ${situacion.dias} días`
              : `el plazo se cumplió el ${formatoFecha(situacion.vence)}`}
          </>
        ) : null}
      </p>

      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Estado cargado: {etiquetaDe(ESTADOS_EXPEDIENTE, expediente.estado)}
      </p>

      {audiencia ? (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          {audiencia.texto}
          {audiencia.pasada ? (
            <span className="text-zinc-500 dark:text-zinc-500"> (ya pasó)</span>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-500">
              {audiencia.dias === 0 ? " (es hoy)" : ` (en ${audiencia.dias} días)`}
            </span>
          )}
        </p>
      ) : null}

      {tipo && tipo.etapas.length > 0 ? (
        <section className={claseSeparador}>
          <h3 className="rotulo text-zinc-500 dark:text-zinc-500">Etapas del proceso</h3>
          <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs">
            {tipo.etapas.map((etapa, indice) => {
              const actual = etapa.clave === expediente.etapaActual;
              return (
                <li key={etapa.clave} className="flex items-center gap-1">
                  {indice > 0 ? <span className="text-zinc-400">→</span> : null}
                  <span
                    className={
                      actual
                        ? "rounded bg-zinc-900 px-2 py-1 font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : claseEtapa
                    }
                  >
                    {etapa.nombre}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <Pendientes
        items={[
          "Próximo vencimiento con los días hábiles que faltan, y las tareas abiertas del expediente.",
          "Última entrada de la historia y última sincronización con el Portal del SAE.",
          "Sugerencias de la IA pendientes de aprobación y el último informe de estado.",
          "Acciones rápidas: registrar actuación, subir documento, redactar escrito, calcular plazo, pedir informe de estado.",
          "Checklist del trámite de la etapa actual.",
        ]}
      />
    </>
  );
}
