import { Campo, claseBotonPrimario, claseEntrada } from "@/components/ui";
import {
  SUBTIPOS_ENTRADA,
  TIPOS_ENTRADA,
  type EntradaHistoria,
  type EtapaProceso,
} from "@/lib/datos/tipos";
import { agregarEntradaHistoria, guardarEntradaHistoria } from "../../acciones";

/**
 * Formulario de una actuación, el mismo para cargarla y para corregirla.
 *
 * El orden de los campos sigue el de la pieza que el abogado tiene delante:
 * **qué es** y **quién la hizo**, **cuándo** y cuándo se notificó, **qué dice**
 * en una línea, y el texto completo pegado del Portal. La etapa que abre va al
 * final porque es la excepción: casi ninguna actuación cambia de etapa.
 *
 * Sin JavaScript de cliente: un `form` con una acción de servidor.
 */
export function FormularioEntrada({
  expedienteId,
  entrada,
  /** Las etapas del tipo de proceso del expediente, para el decreto que abre una. */
  etapas,
  hoy,
}: {
  expedienteId: string;
  /** La actuación que se corrige. Sin ella, el formulario es una carga nueva. */
  entrada?: EntradaHistoria;
  etapas: ReadonlyArray<EtapaProceso>;
  hoy: string;
}) {
  const edicion = Boolean(entrada);

  return (
    <form
      action={edicion ? guardarEntradaHistoria : agregarEntradaHistoria}
      className="mt-4"
    >
      <input type="hidden" name="expedienteId" value={expedienteId} />
      {entrada ? <input type="hidden" name="id" value={entrada.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Qué es">
          <select
            name="subtipo"
            defaultValue={entrada?.subtipo ?? "decreto"}
            className={claseEntrada}
          >
            {SUBTIPOS_ENTRADA.map((subtipo) => (
              <option key={subtipo.valor} value={subtipo.valor}>
                {subtipo.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Quién la hizo">
          <select
            name="tipo"
            defaultValue={entrada?.tipo ?? "actuacion_juzgado"}
            className={claseEntrada}
          >
            {TIPOS_ENTRADA.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.etiqueta} — {tipo.detalle}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Fecha del acto" ayuda="La del decreto o la del cargo del escrito.">
          <input
            type="date"
            name="fecha"
            defaultValue={entrada?.fecha ?? hoy}
            className={claseEntrada}
          />
        </Campo>
        <Campo
          etiqueta="Fecha de notificación"
          ayuda="Solo si se notificó: es de la que corren los plazos."
        >
          <input
            type="date"
            name="fechaNotificacion"
            defaultValue={entrada?.fechaNotificacion}
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Qué dice, en una línea" className="sm:col-span-2">
          <input
            type="text"
            name="titulo"
            defaultValue={entrada?.titulo}
            placeholder="Provee la demanda y ordena traslado por diez días"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo
          etiqueta="Texto completo"
          ayuda="Pegado del Portal del SAE. Es lo que se consulta después y lo que van a leer los agentes."
          className="sm:col-span-2"
        >
          <textarea
            name="texto"
            rows={6}
            defaultValue={entrada?.texto}
            placeholder="San Miguel de Tucumán, …"
            className={claseEntrada}
          />
        </Campo>
        {/*
          La etapa que abre la actuación. Es el campo que convierte un decreto
          en un hito del expediente: lo mueve de etapa y deja la fecha del acto
          como fecha de la etapa nueva.
        */}
        <Campo
          etiqueta="¿Abre una etapa?"
          ayuda="Para el decreto que da pie a la etapa siguiente. Mueve al expediente."
          className="sm:col-span-2"
        >
          <select
            name="abreEtapa"
            defaultValue={entrada?.abreEtapa ?? ""}
            className={claseEntrada}
          >
            <option value="">No abre ninguna etapa</option>
            {etapas.map((etapa) => (
              <option key={etapa.clave} value={etapa.clave}>
                Abre la etapa {etapa.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <button type="submit" className={`${claseBotonPrimario} mt-4`}>
        {edicion ? "Guardar cambios" : "Cargar actuación"}
      </button>
    </form>
  );
}
