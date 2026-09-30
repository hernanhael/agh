import {
  claseColumnaEstado,
  claseDatoRegistro,
  claseNombreRegistro,
  claseRejillaRegistro,
  Meta,
  Registro,
  Rotulo,
  Semaforo,
  type TonoEstado,
} from "@/components/Registro";
import {
  Aviso,
  claseBotonPeligro,
  claseEtapa,
  claseSeparador,
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
 *
 * La lista usa el dibujo del registro (`components/Registro.tsx`), el mismo del
 * listado de expedientes.
 */

/**
 * Estado del tipo de proceso, con la regla del registro: el color avisa y el
 * hover explica. Un tipo activo sin etapas es el caso que hay que mirar —se
 * ofrece en las altas y dejaría al expediente sin etapa—, así que se informa
 * como aviso en lugar de esconderlo en una línea aparte.
 */
function estadoDelTipo(tipo: { activo: boolean; etapas: unknown[] }): {
  tono: TonoEstado;
  etiqueta: string;
  detalle: string;
} {
  if (!tipo.activo) {
    return {
      tono: "neutro",
      etiqueta: "Inactivo",
      detalle:
        "No se ofrece al dar de alta un expediente. Los expedientes que ya lo usan siguen igual.",
    };
  }
  if (tipo.etapas.length === 0) {
    return {
      tono: "aviso",
      etiqueta: "Sin etapas",
      detalle: "Está activo pero no tiene etapas: un expediente nuevo quedaría sin etapa.",
    };
  }
  return {
    tono: "ok",
    etiqueta: "Activo",
    detalle: "Se ofrece al dar de alta un expediente.",
  };
}
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
        <div className="mt-4 border-t border-linea pt-4">
          <FormularioTipoProceso accion={nuevoTipoProceso} textoBoton="Crear" />
        </div>
      </details>

      {tipos.length === 0 ? (
        <Vacio>No hay tipos de proceso. Creá el primero para poder dar de alta expedientes.</Vacio>
      ) : (
        <ul className="space-y-2.5">
          {tipos.map((tipo, orden) => {
            const enUso = usos.get(tipo.id) ?? 0;
            const estado = estadoDelTipo(tipo);
            return (
              <Registro key={tipo.id} orden={orden}>
                <div className={claseRejillaRegistro}>
                  <Rotulo className="sm:col-span-2">
                    {tipo.etapas.length > 0
                      ? `${tipo.etapas.length} ${tipo.etapas.length === 1 ? "etapa" : "etapas"}`
                      : "sin etapas"}
                  </Rotulo>

                  <h2 className={claseNombreRegistro}>
                    {tipo.nombre}
                    {tipo.origen === "ejemplo" ? (
                      <Marca className="ml-2 align-middle">ejemplo</Marca>
                    ) : null}
                  </h2>
                  <Semaforo
                    tono={estado.tono}
                    etiqueta={estado.etiqueta}
                    detalle={estado.detalle}
                    className={claseColumnaEstado}
                  />

                  {/*
                    Sin descripción se deja la celda vacía y no se omite: en una
                    rejilla, saltearla correría el dato de la derecha a esta
                    columna.
                  */}
                  {tipo.descripcion ? (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {tipo.descripcion}
                    </p>
                  ) : (
                    <span aria-hidden />
                  )}
                  <span
                    className={`mt-2 ${claseDatoRegistro} ${claseColumnaEstado}`}
                    title={
                      enUso > 0
                        ? "En uso: no se puede borrar, pero se puede desactivar."
                        : "No lo usa ningún expediente, así que se puede borrar."
                    }
                  >
                    {enUso > 0
                      ? `${enUso} ${enUso === 1 ? "expediente" : "expedientes"}`
                      : "sin expedientes"}
                  </span>
                </div>

                {tipo.materias.length > 0 ? (
                  <Meta className="mt-2">Materias: {tipo.materias.join(" · ")}</Meta>
                ) : null}

                {tipo.etapas.length > 0 ? (
                  <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs">
                    {tipo.etapas.map((etapa, indice) => (
                      <li key={etapa.clave} className="flex items-center gap-1">
                        {indice > 0 ? <span className="text-linea-fuerte">→</span> : null}
                        <span className={claseEtapa}>
                          {etapa.nombre}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                <details className={claseSeparador}>
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

                <div className={`${claseSeparador} flex flex-wrap items-center gap-2`}>
                  <form action={borrarTipoProceso}>
                    <input type="hidden" name="id" value={tipo.id} />
                    <button type="submit" className={claseBotonPeligro}>
                      Borrar
                    </button>
                  </form>
                  {enUso > 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      En uso: no se puede borrar, pero se puede desactivar.
                    </p>
                  ) : null}
                </div>
              </Registro>
            );
          })}
        </ul>
      )}
    </>
  );
}
