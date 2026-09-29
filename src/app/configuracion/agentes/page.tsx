import {
  Aviso,
  claseBotonPeligro,
  claseBotonSecundario,
  claseTarjeta,
  Encabezado,
  Marca,
  mensajes,
  Vacio,
} from "@/components/ui";
import {
  listarAgentes,
  listarTiposProceso,
  obtenerEstudio,
  ROLES_AGENTE,
  type TipoProceso,
} from "@/lib/datos";
import { borrarAgente, duplicarAgente, guardarAgente, nuevoAgente } from "../acciones";
import { FormularioAgente } from "./FormularioAgente";

function etiquetaRol(rol: string): string {
  return ROLES_AGENTE.find((candidato) => candidato.valor === rol)?.etiqueta ?? rol;
}

function nombresDeTipos(ids: string[], tipos: TipoProceso[]): string {
  if (ids.length === 0) return "todos los tipos de proceso";
  return ids
    .map((id) => tipos.find((tipo) => tipo.id === id)?.nombre ?? "—")
    .join(" · ");
}

/**
 * Agentes especializados: alta, edición, duplicado y baja.
 *
 * El abogado los crea acá y después los selecciona por expediente
 * (docs/03-ia-agentes.md §2.3, docs/02-expedientes.md §2.6).
 */
export default async function AgentesPage({ searchParams }: PageProps<"/configuracion/agentes">) {
  const [agentes, tipos, estudio] = await Promise.all([
    listarAgentes(),
    listarTiposProceso(),
    obtenerEstudio(),
  ]);
  const { error, hecho } = mensajes(await searchParams);

  return (
    <>
      <Encabezado
        titulo="Agentes especializados"
        descripcion="Cada agente es una configuración tuya: rol, rama, especialidades, tipos de proceso en los que actúa, instrucciones y guías de comportamiento. Los cinco que trae el sistema son ejemplos editables."
      />
      <Aviso error={error} hecho={hecho} />

      <details className={`${claseTarjeta} mb-8`}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Nuevo agente
        </summary>
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <FormularioAgente
            tiposProceso={tipos}
            modeloPorDefecto={estudio.modeloPorDefecto}
            accion={nuevoAgente}
            textoBoton="Crear"
          />
        </div>
      </details>

      {agentes.length === 0 ? (
        <Vacio>No hay agentes. Creá el primero para poder usarlo en un expediente.</Vacio>
      ) : (
        <ul className="space-y-4">
          {agentes.map((agente) => (
            <li key={agente.id} className={claseTarjeta}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {agente.nombre}
                </h2>
                <Marca>{etiquetaRol(agente.rol)}</Marca>
                {agente.origen === "ejemplo" ? <Marca>ejemplo</Marca> : null}
                {agente.activo ? null : <Marca tono="aviso">inactivo</Marca>}
                {agente.modoConocimiento === "general" ? (
                  <Marca tono="aviso">conocimiento general</Marca>
                ) : null}
              </div>

              {agente.descripcion ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {agente.descripcion}
                </p>
              ) : null}

              <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-zinc-500 sm:grid-cols-2 dark:text-zinc-500">
                <div>
                  <dt className="inline font-medium">Rama: </dt>
                  <dd className="inline">{agente.rama || "—"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Especialidades: </dt>
                  <dd className="inline">{agente.especialidades.join(" · ") || "—"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Actúa en: </dt>
                  <dd className="inline">{nombresDeTipos(agente.tiposProcesoIds, tipos)}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Modelo: </dt>
                  <dd className="inline">{agente.modelo}</dd>
                </div>
              </dl>

              {agente.guiasComportamiento ? (
                <p className="mt-3 border-l-2 border-zinc-200 pl-3 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                  {agente.guiasComportamiento}
                </p>
              ) : null}

              <details className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <summary className="cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Editar
                </summary>
                <div className="mt-4">
                  <FormularioAgente
                    agente={agente}
                    tiposProceso={tipos}
                    modeloPorDefecto={estudio.modeloPorDefecto}
                    accion={guardarAgente}
                    textoBoton="Guardar cambios"
                  />
                </div>
              </details>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <form action={duplicarAgente}>
                  <input type="hidden" name="id" value={agente.id} />
                  <button type="submit" className={claseBotonSecundario}>
                    Duplicar
                  </button>
                </form>
                <form action={borrarAgente}>
                  <input type="hidden" name="id" value={agente.id} />
                  <button type="submit" className={claseBotonPeligro}>
                    Borrar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
