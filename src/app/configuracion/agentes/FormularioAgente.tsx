import { Campo, claseBotonPrimario, claseEntrada } from "@/components/ui";
import {
  MODELOS,
  MODOS_CONOCIMIENTO,
  ROLES_AGENTE,
  type Agente,
  type TipoProceso,
} from "@/lib/datos";

/**
 * Formulario de un agente especializado, compartido por el alta y la edición.
 *
 * Cubre la identidad del agente y su comportamiento (docs/03-ia-agentes.md
 * §2.2, puntos 1, 2, 5 y 6). Las fuentes ítem por ítem, las herramientas y el
 * panel de prueba llegan con el RAG en la Fase 2: sin índice de fragmentos no
 * hay nada que asignar todavía.
 */
export function FormularioAgente({
  agente,
  tiposProceso,
  modeloPorDefecto,
  accion,
  textoBoton,
}: {
  agente?: Agente;
  tiposProceso: TipoProceso[];
  modeloPorDefecto: string;
  accion: (datos: FormData) => Promise<void>;
  textoBoton: string;
}) {
  return (
    <form action={accion} className="space-y-4">
      {agente ? <input type="hidden" name="id" value={agente.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <input
            name="nombre"
            defaultValue={agente?.nombre ?? ""}
            placeholder="Procesalista Tucumán"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Rol">
          <select name="rol" defaultValue={agente?.rol ?? "analista"} className={claseEntrada}>
            {ROLES_AGENTE.map((rol) => (
              <option key={rol.valor} value={rol.valor}>
                {rol.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Rama del derecho">
          <input
            name="rama"
            defaultValue={agente?.rama ?? "Civil y Comercial"}
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Especialidades" ayuda="Separadas por comas.">
          <input
            name="especialidades"
            defaultValue={agente?.especialidades.join(", ") ?? ""}
            placeholder="Daños y Perjuicios, Consumidor"
            className={claseEntrada}
          />
        </Campo>
      </div>

      <Campo etiqueta="Descripción" ayuda="Para qué lo usás. Se muestra al elegirlo.">
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={agente?.descripcion ?? ""}
          className={claseEntrada}
        />
      </Campo>

      <fieldset>
        <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Tipos de proceso en los que actúa
        </legend>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Sin ninguno marcado, actúa en todos.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {tiposProceso.map((tipo) => (
            <label key={tipo.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="tiposProcesoIds"
                value={tipo.id}
                defaultChecked={agente?.tiposProcesoIds.includes(tipo.id) ?? false}
                className="size-4 rounded border-zinc-300 dark:border-zinc-700"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{tipo.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Campo
        etiqueta="Instrucciones"
        ayuda="Quién es, qué responde y con qué reglas de citación."
      >
        <textarea
          name="instrucciones"
          rows={5}
          defaultValue={agente?.instrucciones ?? ""}
          className={claseEntrada}
        />
      </Campo>

      <Campo
        etiqueta="Guías de comportamiento"
        ayuda='Reglas propias, por ejemplo: "cuando detectes una cédula, calculá el plazo con el catálogo y nunca lo estimes".'
      >
        <textarea
          name="guiasComportamiento"
          rows={3}
          defaultValue={agente?.guiasComportamiento ?? ""}
          className={claseEntrada}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Modo de conocimiento">
          <select
            name="modoConocimiento"
            defaultValue={agente?.modoConocimiento ?? "solo_fuentes"}
            className={claseEntrada}
          >
            {MODOS_CONOCIMIENTO.map((modo) => (
              <option key={modo.valor} value={modo.valor}>
                {modo.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Modelo">
          <select
            name="modelo"
            defaultValue={agente?.modelo ?? modeloPorDefecto}
            className={claseEntrada}
          >
            {MODELOS.map((modelo) => (
              <option key={modelo.valor} value={modelo.valor}>
                {modelo.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        {MODOS_CONOCIMIENTO[0].detalle} Con &ldquo;conocimiento general&rdquo;, cada respuesta lleva
        un aviso visible.
      </p>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={agente?.activo ?? true}
            className="size-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Activo — se puede seleccionar en un expediente
          </span>
        </label>
        <button type="submit" className={claseBotonPrimario}>
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
