import type { ReactNode } from "react";
import { Info, Trash2 } from "lucide-react";
import { Dato } from "@/components/ui";
import {
  CARACTERES_PARTE,
  COMPARECENCIAS,
  etiquetaDe,
  ROLES_PARTE,
  type Parte,
} from "@/lib/datos/tipos";
import {
  caracterDe,
  comparecenciaDe,
  letradosDe,
  llevaLetrado,
  nombreCompleto,
  nombreDeNomina,
  particularidadDe,
  rotuloDeRol,
  type ParteConRepresentantes,
} from "@/lib/procesal";
import { formatoFecha, haceCuanto } from "@/lib/plazos";
import { borrarParte } from "../../acciones";
import { FormularioParte } from "./FormularioParte";

/**
 * Una **fila de la nómina** (docs/02-expedientes.md §2.14).
 *
 * Cerrada es **un renglón: el nombre de la parte y, al lado, en gris, quién la
 * lleva**. Abierta es la ficha completa de esa persona —datos, carácter,
 * letrados y formulario— y se despliega debajo de su renglón, sin salir a otra
 * pantalla y sin perder de vista el resto.
 *
 *   PARTE ACTORA ›
 *   Rogel Nicolás  El estudio
 *   Maidana Gabriela  Suárez Verónica
 *   Maidana Hugo  falleció el 2/10/2026
 *   PARTE DEMANDADA ›
 *   Swiss Medical ART  Ferreyra Lucía +1
 *   La Segunda Coop.                          ← citada, todavía no se presentó
 *   Citrícola del Valle SA  Demanda incontestada   (amarillo)
 *   TERCEROS ›
 *   Maquinarias del Norte SRL  Rebelde              (ámbar)
 *   AUXILIARES DEL JUZGADO ›
 *   Juárez Silvia  Perito
 *
 * **Lo de al lado va pegado al nombre y no en una columna aparte.** En una
 * columna lejana, el ojo tenía que cruzar media pantalla para saber de quién
 * era cada abogado, y en los renglones sin abogado quedaba un hueco que no
 * decía nada. Al lado del nombre se lee de corrido —"Rogel Nicolás, El
 * estudio"— y lo que no hay no ocupa lugar (`JuntoAlNombre`).
 *
 * **El apellido va primero**: "Rogel Nicolás", y la nómina se ordena por él
 * (`nombreDeNomina`). Una persona jurídica no tiene apellido y se lee tal cual.
 *
 * **El carácter no está en el renglón**: se lee en la ficha, con su
 * particularidad, que es donde se lo consulta.
 *
 * **El color del lado no está en el renglón**: va una sola vez, en la flecha
 * de la cabecera del lado (`LadoPlegable`), en vez de repetirse en cada
 * persona.
 *
 * **Lo que avisa que la fila se abre es el nombre**: se subraya en gris al
 * pasar el mouse y al seleccionarlo (`COLOR_NOMBRE`).
 *
 * **Al cliente no se le pone etiqueta, y hoy nada lo marca**; la casilla del
 * SAE tampoco está en el renglón: no se la mira barriendo la nómina sino cuando
 * hay que notificar, y entonces se abre la ficha, que es donde está.
 */

/*
 * **El nombre se subraya, con un trazo gris fino, al pasar el mouse y al
 * seleccionarlo** —con un atajo, con las flechas o con un clic—. Es el mismo
 * gesto para las dos cosas y no lleva color: el celeste que tenía la parte
 * seleccionada, sumado al título del lado que también cambiaba, encendía la
 * pantalla en varios lugares a la vez y se perdía cuál era la categoría y cuál
 * la parte. Subrayada dice "acá" sin levantar la voz.
 *
 * **Seleccionar una parte marca solo su nombre**: el renglón no lleva recuadro
 * de foco, porque un anillo alrededor de toda la fila se confundía con la fila
 * abierta, que es otra cosa. Entrar con Enter sí cambia el aspecto —la ficha
 * se despliega con su hoja—, y así se distingue "estoy parado acá" de "entré".
 *
 * El foco es `focus` y no `focus-visible` a propósito. `focus-visible` se
 * reserva para cuando el navegador cree que la navegación es de teclado, y con
 * un foco puesto por programa —que es lo que hace el atajo— esa heurística no
 * es confiable: el atajo movía el foco y no se veía nada, que desde afuera es
 * igual a que el atajo no ande.
 */
const COLOR_NOMBRE =
  "text-zinc-900 decoration-zinc-300 underline-offset-4 group-hover/cara:underline group-focus/cara:underline dark:text-zinc-50 dark:decoration-zinc-600";

/**
 * **Lo que va al lado del nombre**, en un renglón y sin ícono, o nada.
 *
 * En las partes del pleito depende de en qué anda su presentación:
 *
 * - **Se presentó**: quién la lleva, en gris. El letrado actual —con "+1" si
 *   hay más de uno, y todos en el `title`—; "por derecho propio" si es abogada
 *   y litiga en causa propia; "El estudio" si es el cliente y no hay otro
 *   letrado cargado, que es el único caso en que la nómina sabe la respuesta
 *   sin que nadie la escriba; y "sin letrado" si se presentó y no hay ninguno
 *   cargado, que es el único caso en que eso es un dato que falta.
 * - **Todavía no se presentó** —recién citada, o esperando—: **nada**. Es lo
 *   normal del trámite, y escribir "no compareció" en cada demandada recién
 *   emplazada gastaba un renglón en decir lo esperable.
 * - **Demanda incontestada**: en amarillo. Fue citada y dejó pasar el plazo
 *   sin contestar, y eso cambia cómo sigue el juicio.
 * - **Rebelde**: en ámbar, como estaba. La rebeldía la declara el juzgado y
 *   cambia cómo se notifica de ahí en más; es el aviso más fuerte de la
 *   nómina, y por eso el color más cálido.
 * - **Falleció**: la fecha, en gris, y nada más: de un muerto no se dice quién
 *   lo patrocina ni si se presentó.
 *
 * **Los auxiliares llevan su función de la misma manera**, en gris al lado del
 * nombre: "Perito", "Mediador", "Síndico". Su sección mete cuatro roles bajo un
 * solo título, y la función es lo que hace falta para saber quién es quién.
 *
 * El `title` explica lo que el texto abrevia, y va repetido para el lector de
 * pantalla, que no tiene hover.
 */
function JuntoAlNombre({
  parte,
  actuales,
  estudio,
  conAbogado,
}: {
  parte: Parte;
  actuales: ReadonlyArray<Parte>;
  estudio: string;
  conAbogado: boolean;
}) {
  const gris = "text-zinc-500 dark:text-zinc-500";

  if (parte.fallecioEl) {
    return (
      <Al tono={gris}>
        falleció el <span className="tabular-nums">{formatoFecha(parte.fallecioEl)}</span>
      </Al>
    );
  }

  if (!conAbogado) {
    const funcion = rotuloDeRol(parte.rol) || etiquetaDe(ROLES_PARTE, parte.rol);
    return <Al tono={gris}>{funcion}</Al>;
  }

  const estado = comparecenciaDe(parte);
  const detalle = COMPARECENCIAS.find((item) => item.valor === estado)?.detalle ?? "";
  if (estado === "rebelde") {
    return (
      <Al tono="text-amber-700 dark:text-amber-500" detalle={detalle}>
        Rebelde
      </Al>
    );
  }
  if (estado === "incontestada") {
    return (
      <Al tono="text-yellow-600 dark:text-yellow-400" detalle={detalle}>
        Demanda incontestada
      </Al>
    );
  }
  // Citada y todavía sin presentarse: lo normal del trámite, y no se escribe.
  if (estado === "pendiente") return null;

  if (actuales.length > 0) {
    const nombres = actuales.map((letrado) => nombreDeNomina(letrado));
    return (
      <Al tono={gris} detalle={`Letrado: ${nombres.join(", ")}.`}>
        {nombres[0]}
        {nombres.length > 1 ? ` +${nombres.length - 1}` : ""}
      </Al>
    );
  }
  if (parte.causaPropia) {
    return (
      <Al tono={gris} detalle="Es abogada y se representa a sí misma.">
        por derecho propio
      </Al>
    );
  }
  if (parte.esCliente) {
    return (
      <Al tono={gris} detalle={`${estudio} lleva este expediente.`}>
        El estudio
      </Al>
    );
  }
  // Al que no litiga con letrado —el síndico, el administrador— no se le
  // reclama ninguno: se presentan por su cargo.
  if (!llevaLetrado(parte.rol)) return null;
  return (
    <Al tono={gris} detalle="Se presentó y no hay letrado cargado.">
      sin letrado
    </Al>
  );
}

/** Un dato chico al lado del nombre, con su explicación en el `title`. */
function Al({
  tono,
  detalle,
  children,
}: {
  tono: string;
  detalle?: string;
  children: ReactNode;
}) {
  return (
    <span className={`min-w-0 text-xs ${tono}`} title={detalle}>
      {children}
      {detalle ? <span className="sr-only"> — {detalle}</span> : null}
    </span>
  );
}

/** El carácter, al lado del rol, cuando no es el caso normal. */
function ChipCaracter({ parte }: { parte: Parte }) {
  const caracter = caracterDe(parte);
  if (caracter === "por_si") return null;
  return (
    <span className="rotulo text-zinc-500 dark:text-zinc-500">
      {" · "}
      {etiquetaDe(CARACTERES_PARTE, caracter)}
    </span>
  );
}

/**
 * Lo que hay que tener presente por el carácter con el que interviene.
 *
 * Va con el papel y el borde punteado de "Próximo en esta pestaña"
 * (`Pendientes`), que es el recurso con el que la aplicación dice "esto no es
 * un dato". El carácter es lo único de la ficha que no se lee para copiarlo a
 * un escrito sino para acordarse de un trámite.
 */
function Particularidad({ parte }: { parte: Parte }) {
  const texto = particularidadDe(parte);
  if (!texto) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-md border border-dashed border-linea-fuerte bg-background px-3 py-2">
      <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-zinc-500 dark:text-zinc-500" />
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {etiquetaDe(CARACTERES_PARTE, caracterDe(parte))}.
        </span>{" "}
        {texto}
      </p>
    </div>
  );
}

/** El botón de quitar de la nómina, igual para una parte y para su letrado. */
function BotonQuitar({ parte, expedienteId }: { parte: Parte; expedienteId: string }) {
  return (
    <form action={borrarParte}>
      <input type="hidden" name="id" value={parte.id} />
      <input type="hidden" name="expedienteId" value={expedienteId} />
      <button
        type="submit"
        title={`Quitar a "${nombreCompleto(parte)}" de la nómina`}
        className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        <Trash2 aria-hidden className="size-3.5" />
        <span className="sr-only">Quitar de la nómina</span>
      </button>
    </form>
  );
}

/** El desplegable de edición, igual para una parte y para su letrado. */
function Editar({
  parte,
  expedienteId,
  representables,
}: {
  parte: Parte;
  expedienteId: string;
  representables: ReadonlyArray<Parte>;
}) {
  return (
    <details className="min-w-0 flex-1">
      <summary className="cursor-pointer list-none text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-500">
        Editar
      </summary>
      <div className="mb-2 border-t border-linea">
        <FormularioParte
          expedienteId={expedienteId}
          parte={parte}
          representables={representables.filter((candidata) => candidata.id !== parte.id)}
        />
      </div>
    </details>
  );
}

/**
 * Un letrado dentro de la ficha de su representado.
 *
 * No es una tarjeta propia: el letrado se encuentra *por la parte que lleva*,
 * así que vive adentro de ella, en una línea con su casilla y su teléfono, que
 * es lo que se busca cuando hay que llamarlo.
 */
function FilaLetrado({
  letrado,
  expedienteId,
  representables,
}: {
  letrado: Parte;
  expedienteId: string;
  representables: ReadonlyArray<Parte>;
}) {
  return (
    <li
      id={`parte-${letrado.id}`}
      className="border-t border-linea pt-2 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {nombreDeNomina(letrado)}
        </span>
        <ChipCaracter parte={letrado} />
        {letrado.cesoEl ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            cesó el <span className="tabular-nums">{formatoFecha(letrado.cesoEl)}</span>
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
        {letrado.domicilioElectronico ? (
          <span>
            <span className="text-zinc-400 dark:text-zinc-600">Casilla </span>
            {letrado.domicilioElectronico}
          </span>
        ) : null}
        {letrado.telefono ? (
          <span>
            <span className="text-zinc-400 dark:text-zinc-600">Tel. </span>
            {letrado.telefono}
          </span>
        ) : null}
        {letrado.email ? (
          <span>
            <span className="text-zinc-400 dark:text-zinc-600">Correo </span>
            {letrado.email}
          </span>
        ) : null}
      </p>
      {letrado.notas ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{letrado.notas}</p>
      ) : null}
      {/*
        La particularidad del letrado, igual que la de la parte: es la del
        apoderado —que firma solo y recibe las notificaciones— y la de la
        Defensoría —que se notifica en lugar de la parte—, que son
        consecuencias de trámite y no datos de contacto.
      */}
      <Particularidad parte={letrado} />
      <div className="mt-1.5 flex items-start gap-3">
        <Editar parte={letrado} expedienteId={expedienteId} representables={representables} />
        <BotonQuitar parte={letrado} expedienteId={expedienteId} />
      </div>
    </li>
  );
}

/** Los letrados de la parte: los de hoy en un bloque, los que cesaron en otro. */
function Letrados({
  titulo,
  letrados,
  expedienteId,
  representables,
}: {
  titulo: string;
  letrados: ReadonlyArray<Parte>;
  expedienteId: string;
  representables: ReadonlyArray<Parte>;
}) {
  if (letrados.length === 0) return null;
  return (
    <section className="mt-3 border-t border-linea pt-3">
      <h4 className="rotulo text-zinc-500 dark:text-zinc-500">{titulo}</h4>
      <ul className="mt-1.5 space-y-2">
        {letrados.map((letrado) => (
          <FilaLetrado
            key={letrado.id}
            letrado={letrado}
            expedienteId={expedienteId}
            representables={representables}
          />
        ))}
      </ul>
    </section>
  );
}

export function TarjetaParte({
  fila,
  expedienteId,
  representables,
  estudio,
  diaDeHoy,
  conAbogado,
}: {
  fila: ParteConRepresentantes;
  expedienteId: string;
  /** Las partes que pueden ser representadas, para el desplegable del form. */
  representables: ReadonlyArray<Parte>;
  /** Nombre del estudio: es el abogado del cliente mientras no haya otro. */
  estudio: string;
  diaDeHoy: string;
  /** Si al lado del nombre va su abogado (el pleito) o su función (los auxiliares). */
  conAbogado: boolean;
}) {
  const { parte, representantes, sucedido } = fila;
  const { actuales, anteriores } = letradosDe(representantes);

  return (
    <li id={`parte-${parte.id}`} className="min-w-0">
      {/*
        El renglón entero es el `<summary>`: se abre haciendo clic en cualquier
        parte de él y no en un "ver más" al costado. Sin JavaScript de cliente,
        que es como funciona el resto de la aplicación. Abierta, la fila se
        vuelve una hoja con su recuadro, porque entonces sí hay algo que
        delimitar: el renglón queda arriba como su encabezado y la ficha debajo.

        **La parte fallecida se apaga**: el renglón entero pierde fuerza, de modo
        que se lee como lo que es —alguien que estuvo en el juicio y ya no
        está—. No se borra porque lo que presentó sigue en el expediente y
        porque de ahí vienen los herederos que comparecen después. Se apaga con
        opacidad y no con otro color, para no tener que inventar una paleta de
        la muerte.
      */}
      <details className="group/ficha rounded-lg open:my-1.5 open:border open:border-linea open:bg-superficie">
        <summary
          className={`group/cara flex cursor-pointer list-none flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 outline-none group-open/ficha:rounded-b-none group-open/ficha:bg-background group-open/ficha:py-2 [&::-webkit-details-marker]:hidden ${
            parte.fallecioEl ? "opacity-65" : ""
          }`}
        >
          {/*
            La parte, apellido primero: es lo único que se viene a leer y lo
            que se subraya al pasar el mouse o al seleccionarla
            (`COLOR_NOMBRE`). Al lado, en gris, quién la lleva o en qué anda
            (`JuntoAlNombre`).
          */}
          <span
            className={`min-w-0 text-sm font-medium leading-snug transition-colors ${COLOR_NOMBRE}`}
          >
            {nombreDeNomina(parte)}
          </span>
          <JuntoAlNombre
            parte={parte}
            actuales={actuales}
            estudio={estudio}
            conAbogado={conAbogado}
          />
        </summary>

        <div className="border-t border-linea px-3 pb-3">
          <Particularidad parte={parte} />

          <dl className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
            <Dato rotulo="DNI o CUIT">{parte.documento}</Dato>
            <Dato rotulo="Domicilio electrónico">{parte.domicilioElectronico}</Dato>
            <Dato rotulo="Teléfono">{parte.telefono}</Dato>
            <Dato rotulo="Correo electrónico">{parte.email}</Dato>
            <Dato rotulo="Domicilio real" className="sm:col-span-2">
              {parte.domicilioReal}
            </Dato>
            {comparecenciaDe(parte) === "comparecio" ? (
              <Dato rotulo="Compareció el">
                {parte.comparecioEl ? (
                  <>
                    <span className="tabular-nums">{formatoFecha(parte.comparecioEl)}</span>
                    <span className="text-zinc-500 dark:text-zinc-500">
                      {" · "}
                      {haceCuanto(parte.comparecioEl, diaDeHoy)}
                    </span>
                  </>
                ) : undefined}
              </Dato>
            ) : null}
            {parte.fallecioEl ? (
              <Dato rotulo="Falleció el">
                <span className="tabular-nums">{formatoFecha(parte.fallecioEl)}</span>
              </Dato>
            ) : null}
            {sucedido ? (
              <Dato rotulo="Continúa la posición de">{nombreCompleto(sucedido)}</Dato>
            ) : null}
          </dl>

          {parte.notas ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{parte.notas}</p>
          ) : null}

          <Letrados
            titulo={actuales.length > 1 ? "Letrados" : "Letrado"}
            letrados={actuales}
            expedienteId={expedienteId}
            representables={representables}
          />
          <Letrados
            titulo="Letrados anteriores"
            letrados={anteriores}
            expedienteId={expedienteId}
            representables={representables}
          />

          <div className="mt-3 flex items-start gap-3 border-t border-linea pt-3">
            <Editar parte={parte} expedienteId={expedienteId} representables={representables} />
            <BotonQuitar parte={parte} expedienteId={expedienteId} />
          </div>
        </div>
      </details>
    </li>
  );
}
