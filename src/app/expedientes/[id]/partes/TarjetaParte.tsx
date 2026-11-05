import type { ReactNode } from "react";
import { ChevronRight, Trash2 } from "lucide-react";
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
  colorDeLado,
  ladoDeRol,
  comparecenciaDe,
  letradosDe,
  llevaLetrado,
  nombreCompleto,
  nombreDeNomina,
  palabraAbogado,
  rotuloDeRol,
  type ParteConRepresentantes,
} from "@/lib/procesal";
import { formatoFecha } from "@/lib/plazos";
import { borrarParte } from "../../acciones";
import { ATAJO_NOTA } from "../atajos";
import { DatoCopiable } from "./DatoCopiable";
import { FichaDeParte, RenglonParte } from "./FichaAbierta";
import { FormularioParte } from "./FormularioParte";
import { NotaDeParte } from "./NotaDeParte";

/**
 * Una **fila de la nómina** (docs/02-expedientes.md §2.14).
 *
 * En la nómina es **un renglón: el nombre de la parte y, al lado, en gris,
 * quién la lleva** (`TarjetaParte`). Abierta, la ficha completa de esa persona
 * —datos, carácter, abogados y formulario— se muestra en una ventana
 * superpuesta (`FichaParte`), sin salir a otra pantalla y sin perder el lugar
 * en la nómina.
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
 * **Al cliente no se le pone etiqueta, y hoy nada lo marca.**
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
 * abierta, que es otra cosa. Entrar con Enter sí cambia el aspecto —el renglón
 * toma el fondo de hoja y la ficha aparece encima—, y así se distingue
 * "estoy parado acá" de "entré".
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
 * - **Se presentó**: quién la lleva, en gris. El abogado actual —con "+1" si
 *   hay más de uno, y todos en el `title`—; "por derecho propio" si es abogada
 *   y litiga en causa propia; "El estudio" si es el cliente y no hay otro
 *   abogado cargado, que es el único caso en que la nómina sabe la respuesta
 *   sin que nadie la escriba; y "sin abogado" si se presentó y no hay ninguno
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

  // En un rojo terroso y apagado —más rojizo que el ámbar de "Rebelde", pero
  // sin encender la nómina—: es lo más grave
  // que le puede pasar a una parte, y el juicio se suspende hasta que
  // comparezcan los herederos.
  if (parte.fallecioEl) {
    return (
      <Al tono="text-[#a0564d] dark:text-[#c98a80]">
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
    const nombres = actuales.map((abogado) => nombreDeNomina(abogado));
    return (
      <Al tono={gris} detalle={`${palabraAbogado(actuales)}: ${nombres.join(", ")}.`}>
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
  // Al que no litiga con abogado —el síndico, el administrador— no se le
  // reclama ninguno: se presentan por su cargo.
  if (!llevaLetrado(parte.rol)) return null;
  return (
    <Al tono={gris} detalle="Se presentó y no hay abogado cargado.">
      sin abogado
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

/** El botón de quitar de la nómina, igual para una parte y para su abogado. */
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

/**
 * El desplegable de edición, igual para una parte y para su abogado.
 *
 * `representables` llega entera y acá se saca solo a quien se edita: si se
 * sacara también a la parte de la ficha, el "Representa a" de sus abogados no
 * encontraría su opción y al guardar los dejaría sin representado.
 */
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
 * Un abogado dentro de la ficha de su representado, en tres columnas:
 *
 *   Ferreyra Lucía        Teléfono          E-mail
 *   Patrocinante          381 555 0707      lucia@correo.com
 *
 * El nombre y, debajo, su carácter; a la derecha **el teléfono y el correo con
 * su rótulo arriba, con el mismo formato que los datos de la parte**, para que
 * la ficha se lea igual de punta a punta. Los dos se copian con un clic
 * (`DatoCopiable`).
 *
 * **El carácter va en letra común y no en versalitas.** En versalitas grises
 * era igual al título "ABOGADOS" de arriba, y el ojo no distinguía el título
 * del bloque del dato de cada persona: los títulos van en mayúsculas
 * espaciadas, los datos en texto.
 *
 * Por ahora no lleva cómo editarlo ni quitarlo: se resuelve aparte.
 */
function FilaAbogado({ abogado }: { abogado: Parte }) {
  const caracter = caracterDe(abogado);
  return (
    <li id={`parte-${abogado.id}`}>
      <dl className="grid gap-x-5 gap-y-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0">
          <dt className="sr-only">Abogado</dt>
          <dd className="font-medium leading-snug text-zinc-900 dark:text-zinc-50">
            {nombreDeNomina(abogado)}
            {abogado.cesoEl ? (
              <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-500">
                cesó el <span className="tabular-nums">{formatoFecha(abogado.cesoEl)}</span>
              </span>
            ) : null}
          </dd>
          {caracter === "por_si" ? null : (
            <dd className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {etiquetaDe(CARACTERES_PARTE, caracter)}
            </dd>
          )}
        </div>
        <DatoCopiable rotulo="Teléfono" valor={abogado.telefono} />
        <DatoCopiable rotulo="E-mail" valor={abogado.email} />
      </dl>
    </li>
  );
}

/** Los abogados que llevan hoy a la parte. */
function Abogados({ abogados }: { abogados: ReadonlyArray<Parte> }) {
  if (abogados.length === 0) return null;
  return (
    <section className="mt-4 border-t border-linea pt-3">
      <h4 className="rotulo text-zinc-500 dark:text-zinc-500">{palabraAbogado(abogados)}</h4>
      <ul className="mt-2 space-y-4">
        {abogados.map((abogado) => (
          <FilaAbogado key={abogado.id} abogado={abogado} />
        ))}
      </ul>
    </section>
  );
}

/**
 * **Los abogados que cesaron, plegados y apagados.** Arrancan cerrados: se
 * consultan de vez en cuando —para saber a quién preguntar por algo que
 * presentaron— y abiertos competían con los de hoy, que son los que se vienen
 * a buscar. Desplegados se leen atenuados, como lo que ya no está en juego.
 */
function AbogadosAnteriores({ abogados }: { abogados: ReadonlyArray<Parte> }) {
  if (abogados.length === 0) return null;
  const titulo = `${palabraAbogado(abogados)} ${abogados.length > 1 ? "anteriores" : "anterior"}`;
  return (
    <details className="group/anteriores mt-4 border-t border-linea pt-3">
      <summary className="rotulo flex w-fit cursor-pointer list-none items-center gap-1 text-zinc-500 outline-none focus-visible:underline focus-visible:decoration-dotted dark:text-zinc-500 [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronRight
          aria-hidden
          strokeWidth={2.5}
          className="size-3.5 transition-transform duration-150 group-open/anteriores:rotate-90"
        />
        <span className="tabular-nums text-zinc-400 dark:text-zinc-600">· {abogados.length}</span>
      </summary>
      <ul className="mt-2 space-y-4 opacity-55 grayscale transition-opacity hover:opacity-80">
        {abogados.map((abogado) => (
          <FilaAbogado key={abogado.id} abogado={abogado} />
        ))}
      </ul>
    </details>
  );
}

/**
 * El **renglón** de una parte en la nómina: su nombre y, al lado, quién la
 * lleva. Es un botón que abre su ficha en la ventana superpuesta
 * (`FichaAbierta`).
 *
 * La parte cuya ficha está abierta queda con el fondo de hoja y el nombre
 * subrayado: al cerrarla se ve de dónde se venía.
 *
 * **La parte fallecida se apaga**: su nombre pierde fuerza, de modo
 * que se lee como lo que es —alguien que estuvo en el juicio y ya no está—. No
 * se borra porque lo que presentó sigue en el expediente y porque de ahí vienen
 * los herederos que comparecen después. Al lado, "falleció el" va en rojo.
 */
export function TarjetaParte({
  fila,
  estudio,
  conAbogado,
}: {
  fila: ParteConRepresentantes;
  /** Nombre del estudio: es el abogado del cliente mientras no haya otro. */
  estudio: string;
  /** Si al lado del nombre va su abogado (el pleito) o su función (los auxiliares). */
  conAbogado: boolean;
}) {
  const { parte, representantes } = fila;
  const { actuales } = letradosDe(representantes);

  return (
    <li id={`parte-${parte.id}`} className="min-w-0">
      <RenglonParte
        id={parte.id}
        className="group/cara flex w-full cursor-pointer flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1.5 text-left outline-none aria-expanded:bg-background"
      >
        {/*
          **El nombre de la parte fallecida se apaga** —a la mitad—, y no el
          renglón entero: así el "falleció el" de al lado conserva su rojo y
          se lee.
        */}
        <span
          className={`min-w-0 text-sm font-medium leading-snug transition-colors group-aria-expanded/cara:underline ${COLOR_NOMBRE} ${
            parte.fallecioEl ? "opacity-50" : ""
          }`}
        >
          {nombreDeNomina(parte)}
        </span>
        <JuntoAlNombre parte={parte} actuales={actuales} estudio={estudio} conAbogado={conAbogado} />
      </RenglonParte>
    </li>
  );
}

/**
 * La **ficha** de una parte, en la ventana superpuesta: sus datos, sus
 * abogados y el formulario. El servidor las arma todas y `FichaDeParte`
 * muestra solo la abierta.
 *
 * Arranca con **el nombre y el carácter en que litiga** —actor, demandado,
 * perito—, para que se sepa de quién es sin mirar la nómina.
 *
 * Los datos van en este orden: DNI o CUIT, teléfono, domicilio real y la
 * fecha en que compareció. El teléfono y el domicilio se copian con un clic
 * (`DatoCopiable`). No hay domicilio electrónico ni correo, que al
 * estudio no le sirven de la contraria, ni recuadros que expliquen el
 * carácter: la ficha es para consultar datos, no una guía de trámite.
 *
 * **La parte fallecida tiñe la ventana** de un rojizo apagado
 * (`data-fallecida`, que lee `VentanaFicha`): se nota al abrirla sin tener que
 * leer la fecha.
 */
export function FichaParte({
  fila,
  expedienteId,
  representables,
}: {
  fila: ParteConRepresentantes;
  expedienteId: string;
  /** Las partes que pueden ser representadas, para el desplegable del form. */
  representables: ReadonlyArray<Parte>;
}) {
  const { parte, representantes, sucedido } = fila;
  const { actuales, anteriores } = letradosDe(representantes);

  return (
    <FichaDeParte id={parte.id} fallecida={Boolean(parte.fallecioEl)}>
      <article>
        <header className="border-b border-linea px-5 pt-4 pb-3 pr-12">
          <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            {nombreDeNomina(parte)}
          </h3>
          {/*
            El carácter en que litiga, con **el color de su lado** —el mismo de
            la flecha de la nómina—: dice de qué lado es la parte sin leer.
          */}
          <p className="rotulo mt-0.5" style={{ color: colorDeLado(ladoDeRol(parte.rol)) }}>
            {etiquetaDe(ROLES_PARTE, parte.rol)}
          </p>
        </header>

        <div className="px-5 pb-4">
          <dl className="mt-4 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
            <Dato rotulo="DNI o CUIT">{parte.documento}</Dato>
            <DatoCopiable rotulo="Teléfono" valor={parte.telefono} />
            <DatoCopiable
              rotulo="Domicilio real"
              valor={parte.domicilioReal}
              className="sm:col-span-2"
            />
            {comparecenciaDe(parte) === "comparecio" ? (
              <Dato rotulo="Compareció el">
                {parte.comparecioEl ? (
                  <span className="tabular-nums">{formatoFecha(parte.comparecioEl)}</span>
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

          {/*
            **La nota se edita en su lugar**, con un clic o con `alt+n`, igual
            que la del expediente en Datos (`NotaDeParte`). Se muestra siempre,
            también vacía: si desapareciera no habría dónde hacer el primer clic.
          */}
          <section className="group/nota mt-4 border-t border-linea pt-3">
            <h4 className="rotulo text-zinc-500 dark:text-zinc-500">
              Notas
              <span
                aria-hidden
                className="rotulo-tecla ml-2 text-zinc-300 opacity-0 transition-opacity duration-150 group-hover/nota:opacity-100 dark:text-zinc-700"
              >
                {ATAJO_NOTA}
              </span>
            </h4>
            <div className="mt-1">
              <NotaDeParte expedienteId={expedienteId} parteId={parte.id} notas={parte.notas} />
            </div>
          </section>

          <Abogados abogados={actuales} />
          <AbogadosAnteriores abogados={anteriores} />

          <div className="mt-4 flex items-start gap-3 border-t border-linea pt-3">
            <Editar parte={parte} expedienteId={expedienteId} representables={representables} />
            <BotonQuitar parte={parte} expedienteId={expedienteId} />
          </div>
        </div>
      </article>
    </FichaDeParte>
  );
}
