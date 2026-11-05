import { Campo, claseBotonPrimario, claseEntrada } from "@/components/ui";
import {
  CARACTERES_PARTE,
  COMPARECENCIAS,
  GENEROS,
  ROLES_PARTE,
  type Parte,
} from "@/lib/datos/tipos";
import { nombreDeNomina } from "@/lib/procesal";
import { agregarParte, guardarParte } from "../../acciones";

/**
 * Formulario de una parte, el mismo para darla de alta y para editarla.
 *
 * Es el mismo formulario a propósito: la nómina se carga en dos momentos —el
 * nombre y el rol cuando se abre el expediente, el documento y el domicilio
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
        {/*
          El apellido va primero y aparte porque la nómina se lee por apellido
          —"Rogel Nicolás"— y no hay regla para partir un nombre entero en
          dos. Una persona jurídica deja el apellido vacío y escribe su razón
          social en el nombre.
        */}
        <Campo etiqueta="Apellido" ayuda="Vacío si es una persona jurídica o un organismo.">
          <input
            type="text"
            name="apellido"
            defaultValue={parte?.apellido}
            placeholder="Rogel"
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Nombre o razón social">
          <input
            type="text"
            name="nombre"
            defaultValue={parte?.nombre}
            placeholder="Nicolás"
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
        {/*
          El carácter va al lado del rol porque son la misma pregunta en dos
          mitades: qué lugar ocupa en la causa y cómo está parado ahí. "Por
          derecho propio" es el caso normal y encabeza la lista; los demás
          arrastran una particularidad que la ficha de la parte muestra como
          aviso en cuanto se los elige.
        */}
        <Campo etiqueta="Carácter con el que interviene">
          <select
            name="caracter"
            defaultValue={parte?.caracter ?? "por_si"}
            className={claseEntrada}
          >
            {CARACTERES_PARTE.map((caracter) => (
              <option key={caracter.valor} value={caracter.valor}>
                {caracter.etiqueta} — {caracter.detalle}
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
        {/*
          El género es para nombrar bien a la persona: "abogada" o "abogado"
          en la ficha de su representado. Sin cargar se usa el masculino.
        */}
        <Campo etiqueta="Género" ayuda="Para decir abogado o abogada.">
          <select name="genero" defaultValue={parte?.genero ?? ""} className={claseEntrada}>
            <option value="">Sin indicar</option>
            {GENEROS.map((genero) => (
              <option key={genero.valor} value={genero.valor}>
                {genero.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        {/*
          La comparecencia arranca **sin elegir**: lo que corresponde a cada rol
          lo resuelve `comparecenciaDe` al leer (`lib/procesal/partes`), así que
          la opción vacía no es un dato faltante sino "lo normal para este rol".
          Elegir una la fija y deja de depender del rol, que es lo que hace
          falta el día que la demandada se presenta.
        */}
        <Campo etiqueta="Comparecencia" ayuda="Vacío: lo que corresponda a su rol.">
          <select
            name="comparecencia"
            defaultValue={parte?.comparecencia ?? ""}
            className={claseEntrada}
          >
            <option value="">Según el rol</option>
            {COMPARECENCIAS.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.etiqueta} — {estado.detalle}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Compareció el" ayuda="Solo si se presentó.">
          <input
            type="date"
            name="comparecioEl"
            defaultValue={parte?.comparecioEl}
            className={claseEntrada}
          />
        </Campo>
        {/*
          La muerte de una parte y quién la sucede van juntas y pegadas a la
          comparecencia, porque son el mismo tramo de la historia: se presentó,
          después murió, después comparecieron sus herederos. La parte fallecida
          no se borra de la nómina —su tarjeta se apaga y queda con la fecha—,
          así que esto es lo único que hay que cargar.
        */}
        <Campo etiqueta="Falleció el" ayuda="Si la parte murió durante el juicio.">
          <input
            type="date"
            name="fallecioEl"
            defaultValue={parte?.fallecioEl}
            className={claseEntrada}
          />
        </Campo>
        {/*
          El heredero no representa al causante: lo sucede, así que esto es un
          campo aparte de "representa a". Ofrece las mismas partes, que son las
          que no representan a nadie; lo normal es que la elegida sea una que ya
          tenga cargada su fecha de fallecimiento.
        */}
        <Campo
          etiqueta="Continúa la posición de"
          ayuda="Para los herederos: la parte fallecida a la que suceden."
        >
          <select name="sucedeA" defaultValue={parte?.sucedeA ?? ""} className={claseEntrada}>
            <option value="">A nadie</option>
            {representables.map((candidata) => (
              <option key={candidata.id} value={candidata.id}>
                {nombreDeNomina(candidata)}
              </option>
            ))}
          </select>
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
          abogado del abogado no es algo que la nómina sepa dibujar, y el
          repositorio lo rechazaría igual.
        */}
        <Campo
          etiqueta="Representa a"
          ayuda="Para los abogados: la parte que llevan."
        >
          <select
            name="representaA"
            defaultValue={parte?.representaA ?? ""}
            className={claseEntrada}
          >
            <option value="">A nadie</option>
            {representables.map((candidata) => (
              <option key={candidata.id} value={candidata.id}>
                {nombreDeNomina(candidata)}
              </option>
            ))}
          </select>
        </Campo>
        {/*
          Cesar es dejar de representar, así que el campo va pegado a "representa
          a" y el repositorio lo descarta en quien no representa a nadie. El
          abogado que cesó **no se borra**: baja a "abogados anteriores" en la
          ficha de su representado, porque lo que presentó mientras lo
          representaba sigue en el expediente.
        */}
        <Campo
          etiqueta="Cesó en la representación el"
          ayuda="Renuncia, revocación del poder, cambio de abogado."
        >
          <input
            type="date"
            name="cesoEl"
            defaultValue={parte?.cesoEl}
            className={claseEntrada}
          />
        </Campo>
        {/*
          La nota no está en el formulario: se escribe en la ficha de la parte,
          con un clic o con alt+n, y con formato (`NotaDeParte`). Como el campo
          no viaja, guardar este formulario no la toca.
        */}
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

      {/*
        La parte que es abogada y litiga en causa propia: la nómina la pone a
        ella en la columna del abogado, "por derecho propio", en lugar de
        reclamarle un abogado.
      */}
      <label className="mt-2 flex items-start gap-2">
        <input
          type="checkbox"
          name="causaPropia"
          defaultChecked={parte?.causaPropia}
          className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 text-acento focus:ring-acento dark:border-zinc-700"
        />
        <span className="text-xs text-zinc-600 dark:text-zinc-400">
          Se representa a sí misma: es abogada y litiga por derecho propio, sin otro abogado.
        </span>
      </label>

      <button type="submit" className={`${claseBotonPrimario} mt-4`}>
        {edicion ? "Guardar cambios" : "Agregar parte"}
      </button>
    </form>
  );
}
