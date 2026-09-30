import {
  claseColumnaEstado,
  claseNombreRegistro,
  claseRejillaRegistro,
  Registro,
  Rotulo,
  Semaforo,
} from "@/components/Registro";
import {
  Aviso,
  claseBotonPeligro,
  claseBotonSecundario,
  claseSeparador,
  claseTarjeta,
  Encabezado,
  Marca,
  mensajes,
  Vacio,
} from "@/components/ui";
import {
  listarAgentes,
  listarTiposProceso,
  MODOS_CONOCIMIENTO,
  obtenerEstudio,
  ROLES_AGENTE,
  type Agente,
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
 * Modo de conocimiento como estado del registro: el dominio cerrado es el modo
 * por defecto y se informa en gris; el conocimiento general va en amarillo,
 * porque es el que permite al agente hablar de lo que no está en sus fuentes
 * (docs/03-ia-agentes.md §1). El detalle del catálogo explica cada uno al pasar
 * el mouse.
 */
function estadoDelModo(agente: Agente) {
  const modo = MODOS_CONOCIMIENTO.find((candidato) => candidato.valor === agente.modoConocimiento);
  return {
    tono: agente.modoConocimiento === "general" ? ("aviso" as const) : ("neutro" as const),
    etiqueta: modo?.etiqueta ?? agente.modoConocimiento,
    detalle: modo?.detalle,
  };
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
        <div className="mt-4 border-t border-linea pt-4">
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
        <ul className="space-y-2.5">
          {agentes.map((agente, orden) => {
            const modo = estadoDelModo(agente);
            return (
              <Registro key={agente.id} orden={orden}>
                <div className={claseRejillaRegistro}>
                  <Rotulo className="sm:col-span-2">{etiquetaRol(agente.rol)}</Rotulo>

                  <h2 className={claseNombreRegistro}>
                    {agente.nombre}
                    {agente.origen === "ejemplo" ? (
                      <Marca className="ml-2 align-middle">ejemplo</Marca>
                    ) : null}
                  </h2>
                  <Semaforo
                    tono={agente.activo ? "ok" : "neutro"}
                    etiqueta={agente.activo ? "Activo" : "Inactivo"}
                    detalle={
                      agente.activo
                        ? "Se ofrece para trabajar en un expediente."
                        : "No se ofrece en los expedientes. La configuración queda guardada."
                    }
                    className={claseColumnaEstado}
                  />

                  {/*
                    Sin descripción se deja la celda vacía y no se omite: en una
                    rejilla, saltearla correría el estado de la derecha a esta
                    columna.
                  */}
                  {agente.descripcion ? (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {agente.descripcion}
                    </p>
                  ) : (
                    <span aria-hidden />
                  )}
                  <Semaforo
                    tono={modo.tono}
                    etiqueta={modo.etiqueta}
                    detalle={modo.detalle}
                    className={`mt-2 ${claseColumnaEstado}`}
                  />
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-zinc-500 sm:grid-cols-2 dark:text-zinc-400">
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
                  <p className="mt-3 border-l-2 border-linea pl-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {agente.guiasComportamiento}
                  </p>
                ) : null}

                <details className={claseSeparador}>
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

                <div className={`${claseSeparador} flex flex-wrap gap-2`}>
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
              </Registro>
            );
          })}
        </ul>
      )}
    </>
  );
}
