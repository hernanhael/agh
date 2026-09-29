import { Campo, claseBotonPrimario, claseEntrada } from "@/components/ui";
import type { TipoProceso } from "@/lib/datos";

/**
 * Formulario de un tipo de proceso, compartido por el alta y la edición.
 *
 * Las etapas se escriben una por línea. Es deliberadamente simple: el orden
 * es el de las líneas y la clave se genera del nombre, así que no hace falta
 * arrastrar filas ni inventar identificadores. Las transiciones, plazos y
 * escritos típicos de cada etapa (docs/02-expedientes.md §2.1) se agregan
 * cuando existan esos catálogos.
 */
export function FormularioTipoProceso({
  tipo,
  accion,
  textoBoton,
}: {
  tipo?: TipoProceso;
  accion: (datos: FormData) => Promise<void>;
  textoBoton: string;
}) {
  return (
    <form action={accion} className="space-y-4">
      {tipo ? <input type="hidden" name="id" value={tipo.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            name="nombre"
            defaultValue={tipo?.nombre ?? ""}
            placeholder="Conocimiento Ordinario"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo
          etiqueta="Materias en las que se usa"
          ayuda="Separadas por comas. Sirven para sugerir agentes."
        >
          <input
            name="materias"
            defaultValue={tipo?.materias.join(", ") ?? ""}
            placeholder="Daños y Perjuicios, Contratos"
            className={claseEntrada}
          />
        </Campo>
      </div>

      <Campo etiqueta="Descripción">
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={tipo?.descripcion ?? ""}
          placeholder="Para qué sirve este tipo de proceso y cuándo lo usás."
          className={claseEntrada}
        />
      </Campo>

      <Campo
        etiqueta="Etapas"
        ayuda="Una por línea, en orden. El expediente arranca en la primera."
      >
        <textarea
          name="etapas"
          rows={8}
          defaultValue={tipo?.etapas.map((etapa) => etapa.nombre).join("\n") ?? ""}
          placeholder={"Mediación\nDemanda\nTraslado\nContestación"}
          className={claseEntrada}
        />
      </Campo>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={tipo?.activo ?? true}
            className="size-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Activo — aparece al dar de alta un expediente
          </span>
        </label>
        <button type="submit" className={claseBotonPrimario}>
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
