import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Aviso,
  claseBotonPeligro,
  claseTarjeta,
  Encabezado,
  Marca,
  mensajes,
} from "@/components/ui";
import {
  CENTROS_JUDICIALES,
  ESTADOS_EXPEDIENTE,
  identificador,
  listarMaterias,
  listarTiposProceso,
  listarTiposProcesoActivos,
  obtenerEstudio,
  obtenerExpediente,
  ROLES_CLIENTE,
  sugerirAgentes,
} from "@/lib/datos";
import { borrarExpediente, guardarExpediente } from "../acciones";
import { FormularioExpediente } from "../FormularioExpediente";

function etiqueta(
  lista: ReadonlyArray<{ valor: string; etiqueta: string }>,
  valor: string,
): string {
  return lista.find((candidato) => candidato.valor === valor)?.etiqueta ?? valor;
}

/**
 * Ficha del expediente: identificación, tipo de proceso con su etapa actual y
 * agentes sugeridos.
 *
 * La historia unificada, los vencimientos, el editor de escritos y la
 * selección efectiva de agentes son las piezas siguientes del roadmap
 * (docs/02-expedientes.md §2.3 a §2.7).
 */
export default async function ExpedientePage({ params, searchParams }: PageProps<"/expedientes/[id]">) {
  const { id } = await params;
  const expediente = await obtenerExpediente(id);
  if (!expediente) notFound();

  const [tipos, tiposActivos, materias, estudio, agentes] = await Promise.all([
    listarTiposProceso(),
    listarTiposProcesoActivos(),
    listarMaterias(),
    obtenerEstudio(),
    sugerirAgentes(expediente.tipoProcesoId, expediente.materia),
  ]);

  const tipo = tipos.find((candidato) => candidato.id === expediente.tipoProcesoId);
  const { error, hecho } = mensajes(await searchParams);
  // Si el tipo de proceso está desactivado, se agrega igual a la lista para no
  // cambiárselo sin querer al guardar.
  const tiposDisponibles =
    tipo && !tiposActivos.some((candidato) => candidato.id === tipo.id)
      ? [tipo, ...tiposActivos]
      : tiposActivos;

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <Link
        href="/expedientes"
        className="text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-500"
      >
        ← Expedientes
      </Link>

      <div className="mt-3">
        <Encabezado titulo={expediente.caratula} descripcion={`Expediente ${identificador(expediente)}`} />
      </div>
      <Aviso error={error} hecho={hecho} />

      <div className={`${claseTarjeta} mb-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <Marca>{tipo?.nombre ?? "sin tipo de proceso"}</Marca>
          <Marca tono="ok">{tipo?.etapas.find((etapa) => etapa.clave === expediente.etapaActual)?.nombre ?? "sin etapa"}</Marca>
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            desde {expediente.etapaDesde}
          </span>
        </div>

        {tipo && tipo.etapas.length > 0 ? (
          <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs">
            {tipo.etapas.map((etapa, indice) => {
              const actual = etapa.clave === expediente.etapaActual;
              return (
                <li key={etapa.clave} className="flex items-center gap-1">
                  {indice > 0 ? <span className="text-zinc-400">→</span> : null}
                  <span
                    className={
                      actual
                        ? "rounded bg-zinc-900 px-2 py-1 font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "rounded bg-zinc-100 px-2 py-1 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }
                  >
                    {etapa.nombre}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}

        <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-2 dark:border-zinc-800">
          {[
            ["Actor", expediente.actor],
            ["Demandado", expediente.demandado || "—"],
            ["Objeto", expediente.objeto || "—"],
            ["Materia", expediente.materia || "—"],
            ["Centro judicial", etiqueta(CENTROS_JUDICIALES, expediente.centroJudicial)],
            ["Fuero", expediente.fuero],
            ["Rol del cliente", etiqueta(ROLES_CLIENTE, expediente.rolCliente)],
            ["Estado", etiqueta(ESTADOS_EXPEDIENTE, expediente.estado)],
          ].map(([titulo, valor]) => (
            <div key={titulo}>
              <dt className="text-xs text-zinc-500 dark:text-zinc-500">{titulo}</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{valor}</dd>
            </div>
          ))}
        </dl>

        {expediente.notas ? (
          <p className="mt-4 whitespace-pre-line border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            {expediente.notas}
          </p>
        ) : null}
      </div>

      <section className={`${claseTarjeta} mb-6`}>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Agentes sugeridos
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Por materia y tipo de proceso. La selección efectiva por expediente llega con el área IA.
        </p>
        {agentes.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Ninguno de los agentes configurados actúa en este tipo de proceso.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {agentes.map((agente) => (
              <li key={agente.id} className="text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{agente.nombre}</span>
                {agente.descripcion ? (
                  <span className="text-zinc-600 dark:text-zinc-400"> — {agente.descripcion}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className={claseTarjeta}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Editar expediente
        </summary>
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <FormularioExpediente
            expediente={expediente}
            tiposProceso={tiposDisponibles}
            materias={materias}
            centroJudicialHabitual={estudio.centroJudicialHabitual}
            acentuar={estudio.correccionDeTildes}
            accion={guardarExpediente}
            textoBoton="Guardar cambios"
          />
        </div>
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <form action={borrarExpediente}>
            <input type="hidden" name="id" value={expediente.id} />
            <button type="submit" className={claseBotonPeligro}>
              Borrar expediente
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}
