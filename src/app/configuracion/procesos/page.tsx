import {
  Aviso,
  claseBotonPeligro,
  claseTarjeta,
  Encabezado,
  Marca,
  mensajes,
  Vacio,
} from "@/components/ui";
import { listarExpedientes, listarTiposProceso } from "@/lib/datos";
import { borrarTipoProceso, guardarTipoProceso, nuevoTipoProceso } from "../acciones";
import { FormularioTipoProceso } from "./FormularioTipoProceso";

/**
 * Tipos de proceso: alta, edición, duplicado y baja.
 *
 * Es el catálogo que se ofrece al dar de alta un expediente. Cambiar un tipo
 * de proceso no altera los expedientes ya creados (docs/02-expedientes.md
 * §2.1); por eso un tipo en uso no se puede borrar, solo desactivar.
 */
export default async function ProcesosPage({ searchParams }: PageProps<"/configuracion/procesos">) {
  const [tipos, expedientes] = await Promise.all([listarTiposProceso(), listarExpedientes()]);
  const { error, hecho } = mensajes(await searchParams);

  const usos = new Map<string, number>();
  for (const expediente of expedientes) {
    usos.set(expediente.tipoProcesoId, (usos.get(expediente.tipoProcesoId) ?? 0) + 1);
  }

  return (
    <>
      <Encabezado
        titulo="Tipos de proceso"
        descripcion="Ordinario, sumario, expropiación y cualquier otro que necesites. Cada uno define las etapas por las que pasa el expediente. Los que trae el sistema son ejemplos: editalos, duplicalos o borralos."
      />
      <Aviso error={error} hecho={hecho} />

      <details className={`${claseTarjeta} mb-8`}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Nuevo tipo de proceso
        </summary>
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <FormularioTipoProceso accion={nuevoTipoProceso} textoBoton="Crear" />
        </div>
      </details>

      {tipos.length === 0 ? (
        <Vacio>No hay tipos de proceso. Creá el primero para poder dar de alta expedientes.</Vacio>
      ) : (
        <ul className="space-y-4">
          {tipos.map((tipo) => {
            const enUso = usos.get(tipo.id) ?? 0;
            return (
              <li key={tipo.id} className={claseTarjeta}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {tipo.nombre}
                  </h2>
                  {tipo.origen === "ejemplo" ? <Marca>ejemplo</Marca> : null}
                  {tipo.activo ? null : <Marca tono="aviso">inactivo</Marca>}
                  {enUso > 0 ? (
                    <Marca>
                      {enUso} {enUso === 1 ? "expediente" : "expedientes"}
                    </Marca>
                  ) : null}
                </div>

                {tipo.descripcion ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {tipo.descripcion}
                  </p>
                ) : null}

                {tipo.materias.length > 0 ? (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                    Materias: {tipo.materias.join(" · ")}
                  </p>
                ) : null}

                {tipo.etapas.length === 0 ? (
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                    Sin etapas todavía.
                  </p>
                ) : (
                  <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs">
                    {tipo.etapas.map((etapa, indice) => (
                      <li key={etapa.clave} className="flex items-center gap-1">
                        {indice > 0 ? <span className="text-zinc-400">→</span> : null}
                        <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {etapa.nombre}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <details className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Editar
                  </summary>
                  <div className="mt-4">
                    <FormularioTipoProceso
                      tipo={tipo}
                      accion={guardarTipoProceso}
                      textoBoton="Guardar cambios"
                    />
                  </div>
                </details>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <form action={borrarTipoProceso}>
                    <input type="hidden" name="id" value={tipo.id} />
                    <button type="submit" className={claseBotonPeligro}>
                      Borrar
                    </button>
                  </form>
                  {enUso > 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      En uso: no se puede borrar, pero se puede desactivar.
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
