import { Campo, claseBotonPrimario, claseEntrada } from "@/components/ui";
import { ROLES_PARTE, type Parte } from "@/lib/datos/tipos";
import { agregarParte, guardarParte } from "../../acciones";

/**
 * Formulario de una parte, el mismo para darla de alta y para editarla.
 *
 * Es el mismo formulario a propósito: la nómina se carga en dos momentos —el
 * nombre y el rol cuando se abre el expediente, el documento y los domicilios
 * cuando llegan— y tener dos formularios distintos haría que el segundo momento
 * se sintiera otra pantalla.
 *
 * Sin JavaScript de cliente: es un `form` con una acción de servidor, como el
 * resto de la aplicación.
 */
export function FormularioParte({
  expedienteId,
  parte,
  /** Las otras partes del expediente, para elegir a quién representa. */
  representables,
}: {
  expedienteId: string;
  /** La parte que se edita. Sin ella, el formulario es un alta. */
  parte?: Parte;
  representables: ReadonlyArray<Parte>;
}) {
  const edicion = Boolean(parte);

  return (
    <form action={edicion ? guardarParte : agregarParte} className="mt-4">
      <input type="hidden" name="expedienteId" value={expedienteId} />
      {parte ? <input type="hidden" name="id" value={parte.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" className="sm:col-span-2">
          <input
            type="text"
            name="nombre"
            defaultValue={parte?.nombre}
            placeholder="Nicolás Rogel"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Rol en el juicio">
          <select name="rol" defaultValue={parte?.rol ?? "demandado"} className={claseEntrada}>
            {ROLES_PARTE.map((rol) => (
              <option key={rol.valor} value={rol.valor}>
                {rol.etiqueta} — {rol.detalle}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="DNI o CUIT" ayuda="Como figura en el expediente.">
          <input
            type="text"
            name="documento"
            defaultValue={parte?.documento}
            placeholder="25.123.456"
            className={claseEntrada}
          />
        </Campo>
        <Campo
          etiqueta="Domicilio electrónico"
          ayuda="La casilla del SAE: por ahí llegan las notificaciones."
        >
          <input
            type="text"
            name="domicilioElectronico"
            defaultValue={parte?.domicilioElectronico}
            placeholder="20-12345678-9"
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Teléfono">
          <input
            type="text"
            name="telefono"
            defaultValue={parte?.telefono}
            placeholder="381 555 0000"
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Domicilio real" className="sm:col-span-2">
          <input
            type="text"
            name="domicilioReal"
            defaultValue={parte?.domicilioReal}
            placeholder="San Martín 450, San Miguel de Tucumán"
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Correo electrónico">
          <input
            type="email"
            name="email"
            defaultValue={parte?.email}
            placeholder="nombre@correo.com"
            className={claseEntrada}
          />
        </Campo>
        {/*
          El desplegable solo lista partes que no representan a nadie: un
          letrado del letrado no es algo que la nómina sepa dibujar, y el
          repositorio lo rechazaría igual.
        */}
        <Campo
          etiqueta="Representa a"
          ayuda="Para los letrados y apoderados: la parte que llevan."
        >
          <select
            name="representaA"
            defaultValue={parte?.representaA ?? ""}
            className={claseEntrada}
          >
            <option value="">A nadie</option>
            {representables.map((candidata) => (
              <option key={candidata.id} value={candidata.id}>
                {candidata.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Notas" className="sm:col-span-2">
          <input
            type="text"
            name="notas"
            defaultValue={parte?.notas}
            placeholder="Contestó la demanda el 12/09 y ofreció pericia médica."
            className={claseEntrada}
          />
        </Campo>
      </div>

      {/*
        La marca de cliente no es un campo más: define a quién se le rinde la
        contabilidad y a nombre de quién se redactan los escritos. Va aparte, con
        su explicación, y hay una sola por expediente.
      */}
      <label className="mt-4 flex items-start gap-2">
        <input
          type="checkbox"
          name="esCliente"
          defaultChecked={parte?.esCliente}
          className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 text-acento focus:ring-acento dark:border-zinc-700"
        />
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          Es el cliente del estudio en este expediente. Hay uno solo: marcar a esta parte se lo
          quita a cualquier otra.
        </span>
      </label>

      <button type="submit" className={`${claseBotonPrimario} mt-4`}>
        {edicion ? "Guardar cambios" : "Agregar parte"}
      </button>
    </form>
  );
}
