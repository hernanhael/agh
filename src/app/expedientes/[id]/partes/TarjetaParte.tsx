import type { ReactNode } from "react";
import {
  Briefcase,
  CircleUserRound,
  Handshake,
  Info,
  Landmark,
  Microscope,
  Trash2,
  Umbrella,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Dato } from "@/components/ui";
import {
  CARACTERES_PARTE,
  COMPARECENCIAS,
  etiquetaDe,
  type Parte,
  type RolParte,
} from "@/lib/datos/tipos";
import {
  aclaracionDe,
  caracterDe,
  comparecenciaDe,
  letradosDe,
  llevaLetrado,
  particularidadDe,
  renglonesDeLetrado,
  rotuloDeRol,
  type ParteConRepresentantes,
} from "@/lib/procesal";
import { formatoFecha, haceCuanto } from "@/lib/plazos";
import { borrarParte } from "../../acciones";
import { FormularioParte } from "./FormularioParte";

/**
 * La **tarjeta de una parte** (docs/02-expedientes.md §2.14).
 *
 * Cerrada no es una tarjeta: es **un ícono con su nombre debajo**. Abierta es la
 * ficha completa de esa persona —datos, letrados y formulario— y se lleva la
 * fila entera del tablero. Las dos cosas en el mismo lugar: se abre donde está,
 * sin salir a otra pantalla y sin perder de vista el resto.
 *
 *        🗡                    ☂
 *   Nicolás Rogel      La Segunda Coop.
 *    El estudio         No compareció
 *
 *        🗡                   🔬
 *  Gabriela Maidana      Silvia Juárez
 *   Verónica Suárez          PERITO
 *  heredero de Hugo
 *     Maidana
 *
 * **El recuadro se fue.** En un tablero de veinte partes, veinte cuadros con su
 * borde y su papel eran más dibujo que información, y lo único que se viene a
 * leer es el nombre. Queda el ícono, el nombre y, más chico, lo poco que hace
 * falta saber antes de abrir. El recuadro vuelve solo cuando la tarjeta se abre,
 * porque entonces sí hay una hoja que delimitar.
 *
 * **Lo que va debajo del nombre, en este orden**: el rol —solo donde la sección
 * no lo dice—, quién la lleva, lo que falte de su comparecencia y la aclaración
 * del carácter. El rol no está en las partes del pleito porque el título de la
 * sección ya lo dice; en los auxiliares sí, porque esa columna mete cuatro roles
 * bajo un solo título (`rotuloDeRol`, en `lib/procesal/partes`). La aclaración
 * —"heredero de Hugo Maidana"— va al final: se lee después de saber quién es y
 * quién lo lleva, no antes (`aclaracionDe`).
 *
 * **La comparecencia aparece solo cuando falta.** Escribir "Compareció" en cada
 * parte gastaba un renglón en confirmar lo normal, que es la misma razón por la
 * que el carácter "por derecho propio" no se escribe. Y si la parte murió, al
 * pie va la fecha de su muerte y nada más: de un muerto no se dice quién lo
 * patrocina ni si se presentó.
 *
 * **Al cliente no se le pone etiqueta, y hoy nada lo marca.** Tuvo una pastilla
 * con la palabra "cliente", después el filete azul del borde y después el color
 * de su ícono; cada uno se fue por su motivo, y el último porque los íconos
 * pasaron a ser todos iguales. Es una pregunta sin contestar en el tablero —de
 * quién es este estudio en este juicio— y hay que decidir dónde vuelve a vivir.
 *
 * **La casilla del SAE no está en el frente**, aunque sea el dato más operativo
 * de la nómina: no se la mira barriendo el tablero sino cuando hay que
 * notificar, y entonces se abre la tarjeta, que es donde está.
 *
 * **El ícono dice de qué se trata**: una persona en las partes del pleito —el
 * actor y el demandado llevan el mismo, porque quién es quién lo dice la
 * sección—, el paraguas de la cobertura que trae la aseguradora, el microscopio
 * del perito. Es lo que quedó de la tarjeta y lo único que se reconoce sin
 * leer. **De color son todos iguales** (`COLOR_ICONO`): el del texto en reposo
 * —blancos en modo oscuro— y el azul del acento al pasar el mouse o al recibir
 * el foco.
 *
 * El azul se usa acá y no en la ficha de Datos porque **la parte sí se toca**:
 * se abre con un clic. Y lo que avisa que se toca es **el ícono, que se ilumina
 * al pasar el mouse o al recibir el foco**, en lugar del teñido del papel que
 * usa el resto de la aplicación: sin recuadro, teñir el fondo era pintar un
 * rectángulo que no existe, mientras que subirle el brillo al ícono señala
 * exactamente la cosa que se va a abrir. El foco se ve igual que el hover, para
 * que recorrer el tablero con `alt+a` se sienta como recorrerlo con el mouse.
 */

/**
 * El ícono de cada rol, que es **la cara de la parte en el tablero**: lo que se
 * reconoce sin leer, y lo único que queda de la tarjeta que había antes.
 *
 * **El actor y el demandado llevan el mismo ícono**, una persona, porque es lo
 * que son: la espada y el escudo que estuvieron un rato acá contaban el juicio
 * como una pelea, y lo que hay en esos dos lados es gente. No hace falta que se
 * distingan entre sí —quién es quién lo dice la sección, que es el mismo
 * argumento por el que la parte no lleva el rótulo de su rol—, así que el ícono
 * solo tiene que decir "acá hay una persona" y dejarse reconocer de lejos. Los
 * que sí se distinguen son los que no son partes: la aseguradora, el perito, la
 * mediadora.
 *
 * El paraguas es de la cobertura que la aseguradora trae al pleito, el apretón
 * de manos del mediador y el microscopio del perito. El maletín es del letrado.
 */
const ICONO_ROL: Record<RolParte, LucideIcon> = {
  actor: UserRound,
  demandado: UserRound,
  citado_garantia: Umbrella,
  tercero: Users,
  letrado_contraria: Briefcase,
  perito: Microscope,
  mediador: Handshake,
  sindico: Landmark,
  otro: CircleUserRound,
};

/*
 * **Todos los íconos del tablero son del color del texto, y se ponen azules al
 * pasar el mouse o al recibir el foco.**
 *
 * En modo oscuro eso quiere decir blancos, que es como se los pidió; en modo
 * claro toman el negro del papel, porque un ícono blanco sobre papel no se
 * vería. Lo que avisa que la parte se toca es el azul del acento, el mismo del
 * resto de la aplicación, y el foco se ve igual que el hover para que recorrer
 * el tablero con `alt+a` se sienta como recorrerlo con el mouse.
 *
 * El foco es `focus` y no `focus-visible` a propósito. `focus-visible` se
 * reserva para cuando el navegador cree que la navegación es de teclado, y con
 * un foco puesto por programa —que es lo que hace el atajo— esa heurística no
 * es confiable: el atajo movía el foco y no se veía nada, que desde afuera es
 * igual a que el atajo no ande. Con `focus` pelado, la parte enfocada siempre
 * se distingue, aunque el foco haya llegado por un clic.
 *
 * El color **ya no dice de qué lado está la parte**. Lo decía —azul el cliente,
 * azul apagado los suyos, gris los de enfrente— y antes de eso lo decía el
 * filete del borde. Con todos los íconos iguales, esa pregunta no tiene quién
 * la conteste en el tablero: hay que decidir dónde vuelve a vivir.
 */
const COLOR_ICONO =
  "text-zinc-900 group-hover/cara:text-acento group-focus/cara:text-acento dark:text-zinc-50 dark:group-hover/cara:text-acento dark:group-focus/cara:text-acento";

/**
 * Una **señal** del pie de la tarjeta: dos palabras, sin ícono.
 *
 * No lleva ícono y es a propósito. Un maletín al lado del nombre del abogado y
 * una silueta tachada al lado de "no compareció" repetían en dibujo lo que el
 * texto ya decía, y en una baldosa de dos renglones chicos cada ícono le come
 * ancho a lo único que importa, que es el nombre. El rol sí tiene ícono, porque
 * ahí el dibujo reemplaza la lectura; acá la acompañaba.
 *
 * Es la misma regla que el semáforo del registro (`components/Registro.tsx`):
 * *el color avisa, el hover explica*. La señal dice "Rebelde"; el detalle, la
 * fecha o los otros letrados están en el `title` y en la ficha, que es donde se
 * los va a buscar cuando hacen falta.
 *
 * El `detalle` también va oculto para el lector de pantalla, que no tiene
 * hover: lo que la señal abrevia no puede quedar solo en el gesto del mouse.
 */
function Senal({
  children,
  debajo,
  detalle,
  tono = "neutro",
}: {
  children: ReactNode;
  /** Segundo renglón, más chico: cuál es la Defensoría que interviene. */
  debajo?: string;
  detalle?: string;
  tono?: "neutro" | "ok" | "aviso";
}) {
  const tonos = {
    neutro: "text-zinc-500 dark:text-zinc-400",
    ok: "text-emerald-700 dark:text-emerald-500",
    aviso: "text-amber-700 dark:text-amber-500",
  } as const;
  return (
    <span className={`block max-w-full min-w-0 ${tonos[tono]}`} title={detalle}>
      <span className="block truncate">{children}</span>
      {debajo ? (
        <span className="block truncate text-[11px] text-zinc-400 dark:text-zinc-600">
          {debajo}
        </span>
      ) : null}
      {detalle ? <span className="sr-only"> — {detalle}</span> : null}
    </span>
  );
}

/**
 * Lo que falte de su comparecencia. Es **el único estado que la tarjeta muestra
 * cerrada**, porque es el que dice con quién hay que contar: una demandada que
 * no se presentó no recibe traslados en su casilla, por más que la casilla esté
 * cargada.
 *
 * **Al que compareció no se le muestra nada**, y es lo que descargó la tarjeta:
 * presentarse es lo que se espera de una parte, así que escribirlo en cada una
 * gastaba un renglón en confirmar lo normal —la misma razón por la que el
 * carácter "por derecho propio" no se escribe—. Lo que queda escrito es lo que
 * falta, que es lo que se barre con la vista. La fecha de la presentación está
 * adentro, en la ficha.
 *
 * A quien no comparece —el perito, el mediador, el letrado— tampoco se le
 * muestra nada: un "no compareció" que no significa nada malo es la clase de
 * aviso que entrena a no mirar los avisos.
 *
 * La rebeldía va en ámbar y el "todavía no se presentó" en gris, y no al revés:
 * que una demandada recién emplazada no haya comparecido es lo normal del
 * trámite, mientras que una rebeldía declarada cambia cómo se notifica de ahí
 * en más. El ámbar se gasta si se lo pone en lo que todavía no pasó.
 */
function SenalComparecencia({ parte }: { parte: Parte }) {
  const estado = comparecenciaDe(parte);
  if (estado === "no_corresponde" || estado === "comparecio") return null;

  const detalle = COMPARECENCIAS.find((item) => item.valor === estado)?.detalle ?? "";
  return (
    <Senal tono={estado === "rebelde" ? "aviso" : "neutro"} detalle={detalle}>
      {estado === "rebelde" ? "Rebelde" : "No compareció"}
    </Senal>
  );
}

/**
 * Quién es su abogado hoy.
 *
 * Para el cliente del estudio, el abogado es el estudio mismo mientras no haya
 * un letrado cargado: es el único caso en que la nómina sabe la respuesta sin
 * que nadie la escriba, y dejarlo en "sin letrado" sería decir algo falso en la
 * única tarjeta sobre la que no hay ninguna duda.
 *
 * **"Sin letrado" se escribe solo en quien compareció**, que es la única parte
 * en la que eso es un dato que falta. A quien no litiga no se le pregunta quién
 * lo patrocina —el perito y la mediadora no llevan letrado, y un letrado no
 * tiene letrado propio—; y a quien todavía no se presentó o fue declarado
 * rebelde tampoco, porque no tener letrado en el expediente es la consecuencia
 * de no haberse presentado y no una omisión de la carga. Su tarjeta ya lo dice
 * en el renglón de abajo, y decir lo mismo dos veces es lo que carga una
 * baldosa chica.
 *
 * Las tres cosas las contesta `comparecenciaDe`: el que no comparece devuelve
 * "no corresponde" y el que no se presentó, "pendiente" o "rebelde".
 */
function SenalLetrado({
  parte,
  actuales,
  estudio,
}: {
  parte: Parte;
  actuales: ReadonlyArray<Parte>;
  estudio: string;
}) {
  if (actuales.length > 0) {
    const nombres = actuales.map((letrado) => letrado.nombre);
    // La Defensoría se parte en dos renglones, pero solo cuando es el único
    // letrado: con dos o más, el frente muestra el primero y un "+1", y ahí lo
    // que importa es que hay varios y no cuál es cada uno.
    const { nombre, debajo } = renglonesDeLetrado(actuales[0]);
    return (
      <Senal
        detalle={`Letrado: ${nombres.join(", ")}.`}
        debajo={actuales.length === 1 ? debajo : ""}
      >
        {nombre}
        {nombres.length > 1 ? ` +${nombres.length - 1}` : ""}
      </Senal>
    );
  }

  if (parte.esCliente) {
    return (
      <Senal detalle={`${estudio} lleva este expediente.`}>
        El estudio
      </Senal>
    );
  }

  // Al que no litiga con letrado no se le reclama ninguno, y al que todavía no
  // se presentó tampoco: no tenerlo es la consecuencia de no haber comparecido.
  if (!llevaLetrado(parte.rol) || comparecenciaDe(parte) !== "comparecio") return null;

  return (
    <Senal detalle="No hay letrado cargado para esta parte.">
      Sin letrado
    </Senal>
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
        title={`Quitar a "${parte.nombre}" de la nómina`}
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
          {letrado.nombre}
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
}: {
  fila: ParteConRepresentantes;
  expedienteId: string;
  /** Las partes que pueden ser representadas, para el desplegable del form. */
  representables: ReadonlyArray<Parte>;
  /** Nombre del estudio: es el abogado del cliente mientras no haya otro. */
  estudio: string;
  diaDeHoy: string;
}) {
  const { parte, representantes, sucedido } = fila;
  const Icono = ICONO_ROL[parte.rol] ?? CircleUserRound;
  const { actuales, anteriores } = letradosDe(representantes);

  return (
    <li id={`parte-${parte.id}`} className="min-w-0">
      {/*
        La parte entera es el `<summary>`: se abre haciendo clic en cualquier
        parte de ella y no en un "ver más" al pie. Sin JavaScript de cliente,
        que es como funciona el resto de la aplicación.

        **Cerrada es un ícono con su nombre debajo; abierta, una hoja.** La
        tarjeta con borde se fue: en un tablero de veinte partes, veinte cuadros
        era más dibujo que información, y lo único que se viene a leer es el
        nombre. Lo que queda es el ícono del rol, el nombre debajo y, más chico,
        quién la lleva. El recuadro aparece solo cuando se abre, porque entonces
        sí hay una hoja que delimitar: la ficha se lleva la fila entera del
        tablero (la regla del `:has()` está en `globals.css`) y el frente, que
        estaba centrado, se alinea a la izquierda para leerse como su
        encabezado.

        **La parte fallecida se apaga**: todo lo suyo pierde fuerza, de modo que
        en el tablero se lee como lo que es —alguien que estuvo en el juicio y ya
        no está—. No se borra porque lo que presentó sigue en el expediente y
        porque de ahí vienen los herederos que comparecen después. Se apaga con
        opacidad y no con otro color, para no tener que inventar una paleta de la
        muerte.
      */}
      <details className="group/ficha rounded-lg transition-colors open:border open:border-linea open:bg-superficie">
        <summary
          className={`group/cara flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-lg p-1.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento group-open/ficha:items-start group-open/ficha:rounded-b-none group-open/ficha:bg-background group-open/ficha:text-left ${
            parte.fallecioEl ? "opacity-65" : ""
          }`}
        >
          {/*
            El ícono, que es la cara de la parte y lo que se reconoce sin leer:
            una persona en las partes del pleito, el paraguas de la aseguradora,
            el microscopio del perito. Todos del mismo color, que es el del texto
            —blanco en modo oscuro—, y azules al pasar el mouse o al recibir el
            foco (`COLOR_ICONO`).
          */}
          <Icono
            aria-hidden
            strokeWidth={1.5}
            className={`size-5 shrink-0 transition-colors ${COLOR_ICONO}`}
          />

          {/* El nombre, debajo del ícono: es lo único que se viene a leer. */}
          <p className="min-w-0 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {parte.nombre}
          </p>

          {/*
            Y debajo del nombre, en renglones chicos y en este orden: **el rol
            —solo donde la sección no lo dice—, quién la lleva, lo que falte de
            su comparecencia y la aclaración del carácter**.

            El rol no está en las partes del pleito porque el título de la
            sección ya lo dice: "ACTOR" arriba de un nombre que está debajo de
            "Parte actora" es decir dos veces lo mismo. En los auxiliares sí,
            porque esa columna mete cuatro roles bajo un solo título
            (`rotuloDeRol`).

            La aclaración va al final y no arriba: "heredero de Hugo Maidana" se
            lee después de saber quién es y quién lo lleva, no antes.

            Lo que no aplica no deja hueco: el `empty:hidden` saca el bloque
            entero —y con él el espacio que lo separa del nombre— en la tarjeta
            de la perito, que no lleva letrado, no se le pregunta si compareció
            y no tiene nada que aclarar.
          */}
          <div className="flex max-w-full min-w-0 flex-col items-center gap-0.5 text-[11px] empty:hidden group-open/ficha:items-start">
            {rotuloDeRol(parte.rol) ? (
              <span className="rotulo text-zinc-500 dark:text-zinc-500">
                {rotuloDeRol(parte.rol)}
              </span>
            ) : null}

            {parte.fallecioEl ? (
              <span className="text-zinc-500 dark:text-zinc-500">
                falleció el{" "}
                <span className="tabular-nums">{formatoFecha(parte.fallecioEl)}</span>
              </span>
            ) : (
              <>
                <SenalLetrado parte={parte} actuales={actuales} estudio={estudio} />
                <SenalComparecencia parte={parte} />
              </>
            )}

            {aclaracionDe(parte, sucedido) ? (
              <span className="text-zinc-500 dark:text-zinc-500">
                {aclaracionDe(parte, sucedido)}
              </span>
            ) : null}
          </div>
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
              <Dato rotulo="Continúa la posición de">{sucedido.nombre}</Dato>
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
