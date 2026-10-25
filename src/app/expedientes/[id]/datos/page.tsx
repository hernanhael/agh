import type { ReactNode } from "react";
import { StickyNote, type LucideIcon } from "lucide-react";
import { Rotulo } from "@/components/Registro";
import { claseBotonPeligro, claseSeparador, Dato, Marca, Pendientes } from "@/components/ui";
import {
  CENTROS_JUDICIALES,
  etiquetaDe,
  hoy,
  listarMaterias,
  listarRadicaciones,
  listarTiposProcesoActivos,
  nombreJuzgado,
  obtenerEstudio,
} from "@/lib/datos";
import { tipoProcesoBreve } from "@/lib/formato";
import { diasEntre, formatoFecha } from "@/lib/plazos";
import { borrarExpediente, guardarExpediente } from "../../acciones";
import { FormularioExpediente } from "../../FormularioExpediente";
import { ATAJO_EXPEDIENTE, ATAJO_NOTA } from "../atajos";
import { NotaExpediente } from "../NotaExpediente";
import { EditarExpediente } from "./EditarExpediente";
import { cargarExpediente, cargarTipoProceso } from "../cargar";

/**
 * Pestaña **Datos**: la ficha del expediente y el formulario para editarla
 * (docs/02-expedientes.md §2.1).
 *
 * La ficha son **siete datos y nada más**: objeto, juzgado, Centro Judicial,
 * Oficina de Gestión Asociada, etapa con su fecha, último movimiento y alta en
 * el sistema. Lo que el expediente guarda es bastante más, pero la ficha no es
 * el volcado del registro: cada dato que sobra es un dato que hay que descartar
 * para encontrar el que se busca.
 *
 * Lo que no está, está en otra parte, y casi todo a unos centímetros de acá.
 * **En la cabecera del cuadro**, que se ve desde cualquier pestaña: el número,
 * la carátula, el **tipo de proceso** y el **estado** —el chip del semáforo
 * muestra la etiqueta del estado cargado cuando no hay instancia en curso, y
 * "En trámite" cuando el expediente se mueve, que es la misma palabra que
 * `en_tramite` (`lib/procesal/caducidad`)—. En **Resumen**, la clase y la
 * caducidad resueltas en el cómputo. En **Partes**, las partes. Y el **fuero**
 * lo dice el juzgado, que se elige de la misma lista de fueros. Todo sigue
 * editándose en el formulario de abajo.
 *
 * **La ficha es una sola hoja.** Cinco grupos de una misma anatomía: cada uno
 * contesta una pregunta y la encabeza con su respuesta; los que necesitan
 * precisarla guardan debajo los datos que la precisan.
 *
 *   OBJETO
 *   Daños y Perjuicios                          ← solo encabeza: es el título
 *   ──────────────────────────────────────────── ← línea fina, no un recuadro
 *   JUZGADO              │ ETAPA         │ ÚLTIMO MOVIMIENTO
 *   Civil y Com. VI      │ Contestación  │ 15/09/2026      ← lo que encabeza
 *   Centro    Oficina    │ Desde         │ Alta en sistema ← lo que lo precisa
 *   Capital   OGA Civil  │ 15/09/2026    │ 28/09/2026
 *   ────────────────────────────────────────────
 *   📝 NOTAS                                    ← el único con ícono
 *
 * **Los tres grupos del medio van en una fila.** Dónde tramita, en qué va y
 * desde cuándo son las tres preguntas de una causa en curso, y las tres se
 * contestan en dos palabras: apilarlas dejaba dos tercios de hoja en blanco a
 * la derecha de cada una. La etapa está ahí y no como dato secundario del
 * objeto porque es una de esas tres preguntas, no un detalle de la materia.
 *
 * Los grupos se separan con **una línea fina y no con un recuadro cada uno**.
 * Cuadros sueltos eran objetos flotando dentro de la tarjeta de la pestaña
 * —recuadros dentro de un recuadro— y además contradecían el sistema visual de
 * la aplicación, que es de líneas finas en vez de recuadros (`app/globals.css`).
 *
 * **Los cinco salen del mismo componente, y eso es lo que los alinea**: la
 * sangría, el tamaño del rótulo y el de la rejilla se deciden en un solo lugar,
 * así que todos los rótulos, todos los encabezados y todas las rejillas
 * arrancan en la misma columna de su grupo. Mientras cada bloque traía su
 * propio dibujo —un filete al margen, un ícono suelto, una rejilla pelada— los
 * textos arrancaban en tres sangrías distintas y la pestaña se leía en
 * escalera.
 *
 * **Solo las notas llevan ícono**, y va en la línea de su rótulo. Los datos de
 * la ficha se encuentran por su rótulo, que ya los nombra; un ícono por grupo
 * era una segunda forma de decir lo mismo. La nota sí se distingue, porque no
 * es un dato que se lee sino un texto que se escribe (`NotaExpediente`).
 *
 * **No hay color en la ficha.** Ni fondos teñidos ni bordes de acento: los
 * cinco grupos se dibujan igual y la jerarquía la pone el cuerpo del texto
 * —el objeto encabeza un punto más grande— y el orden de lectura. El azul
 * tinta de la aplicación está reservado para lo que se puede tocar: el ícono
 * activo del riel, los botones de acción, el anillo de foco y el teñido del
 * *hover* de las filas del registro. Usarlo para destacar un dato que no es
 * interactivo hace que el grupo se lea como **seleccionado** y promete una
 * interacción que no existe.
 *
 * El semáforo verde/amarillo/rojo tampoco aparece acá: es de la caducidad y
 * vive en la cabecera y en Resumen.
 */

/**
 * Rejilla de los datos secundarios de un grupo: la primera columna se encoge
 * hasta lo que mide su rótulo (`auto`) en lugar de ocupar la mitad, y la
 * segunda arranca inmediatamente después.
 *
 * Es lo que deja "Oficina de Gestión Asociada" pegada a "Centro Judicial" y no
 * a media columna de distancia: con el rótulo midiendo lo que mide, el quiebre
 * cae por debajo de la "a" de "Comercial" del encabezado. Sale del contenido y
 * no de un número fijo, así que sigue cayendo bien si cambia el texto.
 */
const claseRejilla = "mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-[auto_1fr]";

/**
 * Un grupo de la ficha: rótulo, el dato que lo encabeza y debajo lo que lo
 * precisa.
 *
 * Todos se dibujan **igual**: mismo fondo —el de la tarjeta—, misma sangría.
 * `principal` es lo único que los distingue y mueve una sola cosa, el cuerpo
 * del encabezado.
 *
 * **El ícono es opcional y va en la línea del rótulo**, no en un canal al
 * margen. Es lo que permite que un solo grupo lo tenga sin desalinearse del
 * resto: con el ícono al margen, los grupos sin ícono empezarían 28 px más a
 * la izquierda que el que lo tiene, que es la escalera que esta ficha ya tuvo
 * una vez. Puesto en la línea del rótulo, los textos de todos los grupos
 * arrancan en el mismo borde y el ícono queda como una marca del rótulo.
 *
 * Nada va teñido ni recuadrado. En esta aplicación `acento-suave` es el fondo
 * del *hover* y del *focus* de las filas del registro (`Registro.tsx`,
 * `claseTarjetaEnlace`), así que un grupo teñido de forma permanente se lee
 * como un grupo **seleccionado**: el color promete una interacción que no
 * existe. La jerarquía la pone el cuerpo del texto y el orden de lectura, que
 * no prometen nada.
 *
 * El `py-4` es igual en todos y no se cancela en el primero: así dos grupos
 * puestos uno al lado del otro empiezan a la misma altura. El aire que eso
 * agrega arriba de la hoja lo absorbe el contenedor con un `-mt-4`.
 */
function Bloque({
  Icono,
  rotulo,
  atajo,
  destacado,
  principal = false,
  className = "",
  children,
}: {
  /** Marca del rótulo. Solo lo lleva el grupo que necesita distinguirse. */
  Icono?: LucideIcon;
  rotulo: string;
  /** Atajo de teclado del grupo, si tiene uno. Se ve al pasar el mouse. */
  atajo?: string;
  /** El dato que encabeza. Si falta, el grupo arranca en su contenido. */
  destacado?: ReactNode;
  /** El grupo que abre la ficha: su encabezado va un cuerpo más grande. */
  principal?: boolean;
  /** Separación del grupo vecino cuando comparte fila con otro. */
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={`group py-4 ${className}`.trimEnd()}>
      <Rotulo className="flex items-center gap-1.5">
        {Icono ? (
          <Icono aria-hidden className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
        ) : null}
        {rotulo}
        {/*
          El atajo aparece al pasar el mouse por el grupo, igual que las teclas
          de función en la tira de pestañas: escrito, porque un atajo que no se
          ve no existe, y apagado el resto del tiempo, porque una vez aprendido
          es ruido. No cambia la altura del rótulo —la opacidad no ocupa—, así
          que nada se mueve al aparecer. `aria-hidden` porque el atajo ya está
          en el `title` del recuadro, que es de donde lo toma el lector de
          pantalla.
        */}
        {atajo ? (
          <span
            aria-hidden
            className="rotulo-tecla ml-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            {atajo}
          </span>
        ) : null}
      </Rotulo>
      {destacado ? (
        <p
          className={`mt-0.5 font-medium leading-snug text-zinc-900 dark:text-zinc-50 ${
            principal ? "text-lg" : "text-[15px]"
          }`}
        >
          {destacado}
        </p>
      ) : null}
      {children}
    </section>
  );
}

/** Lo que no se cargó, en el gris de los datos vacíos de `Dato`. */
function SinCargar({ children }: { children: string }) {
  return <span className="font-normal text-zinc-400 dark:text-zinc-600">{children}</span>;
}

/** Las marcas de tiempo del almacén son ISO completas: alcanza el día. */
function dia(marca: string): string {
  return formatoFecha(marca.slice(0, 10));
}

/**
 * Cuánto hace de una fecha, en palabras.
 *
 * Es lo que vuelve legible una fecha suelta: "21/09/2026" no dice nada por sí
 * solo y "hace 34 días" sí, que es justo lo que hay que saber del último
 * movimiento. Pasados los dos meses se cuenta en meses, porque "hace 213 días"
 * obliga a dividir mentalmente.
 *
 * Devuelve `undefined` para una fecha futura: no es un dato, es un error de
 * tipeo, y no se gana nada escribiéndole una leyenda al lado.
 */
function haceCuanto(fecha: string, diaDeHoy: string): string | undefined {
  const dias = diasEntre(fecha, diaDeHoy);
  if (dias < 0) return undefined;
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 60) return `hace ${dias} días`;
  const meses = Math.round(dias / 30.44);
  if (meses < 24) return `hace ${meses} meses`;
  const anios = Math.floor(meses / 12);
  return anios === 1 ? "hace un año" : `hace ${anios} años`;
}

export default async function DatosExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/datos">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const [tipo, tiposActivos, materias, radicaciones, estudio] = await Promise.all([
    cargarTipoProceso(expediente.tipoProcesoId),
    listarTiposProcesoActivos(),
    listarMaterias(),
    listarRadicaciones(),
    obtenerEstudio(),
  ]);

  const diaDeHoy = hoy();
  const etapa = tipo?.etapas.find((candidata) => candidata.clave === expediente.etapaActual);
  const juzgado = nombreJuzgado(expediente);
  const desdeUltimoMovimiento = expediente.ultimoMovimiento
    ? haceCuanto(expediente.ultimoMovimiento, diaDeHoy)
    : undefined;
  // Si el tipo de proceso está desactivado, se agrega igual a la lista del
  // formulario para no cambiárselo sin querer al guardar.
  const tiposDisponibles =
    tipo && !tiposActivos.some((candidato) => candidato.id === tipo.id)
      ? [tipo, ...tiposActivos]
      : tiposActivos;

  return (
    <>
      {/*
        La hoja. `divide-y` pone la línea fina **entre** los grupos y no
        alrededor de cada uno: es un solo bloque de lectura continua, no cuatro
        cuadros apilados.

        El `-mt-4` absorbe el `py-4` del primer grupo para que la hoja arranque
        a ras del borde de la pestaña, que ya trae su propio margen. Se hace acá
        y no con un `first:pt-0` en el grupo porque los grupos que comparten
        fila también son "primeros" de su rejilla, y ese recorte los dejaría
        arrancando a distinta altura, que es justo lo que no se quiere.
      */}
      <div className="-mt-4 divide-y divide-linea">
        {/*
          De qué se trata el juicio y en qué va. Encabeza la ficha.

          El dato se llama **objeto** y no materia porque así lo nombran el SAE
          y el abogado: es lo que dice la carátula después del "s/" —"DAÑOS Y
          PERJUICIOS"—. La columna que se lee sigue siendo `materia`, que es el
          nombre del modelo (docs/06-modelo-de-datos.md) y el que usan los
          agentes para sugerirse por especialidad; el formulario ya le propone
          el objeto que partió de la carátula, así que son el mismo dato con dos
          nombres y acá gana el del abogado.

          El **estado** cargado no está, porque el chip de la cabecera ya lo
          dice unos centímetros más arriba: cuando no hay instancia en curso
          —mediación, suspendido, con sentencia, en ejecución, archivado— el
          semáforo muestra esa misma etiqueta, y cuando el expediente se mueve
          dice "En trámite", que es la misma palabra que el estado `en_tramite`
          (`lib/procesal/caducidad`). Era leer dos veces lo mismo. Queda un solo
          estado que el chip nunca nombra: `paralizado`, que se informa como
          "Para caducidad" porque es lo que significa.
        */}
        {/*
          El grupo no lleva datos debajo: es el título de la ficha. La etapa
          bajó a la fila, donde es una pregunta por derecho propio. Acá van a
          entrar el monto y las fechas clave cuando existan (ver `Pendientes`).

          El **tipo de proceso** va al lado del objeto y no como dato aparte:
          entre guiones, en minúscula y en el gris y el cuerpo de los rótulos de
          la rejilla, para que se lea como una aclaración del objeto —"daños y
          perjuicios, de los ordinarios"— y no como un dato más que hay que
          recorrer. `tipoProcesoBreve` es el que le saca el género.
        */}
        <Bloque
          principal
          rotulo="Objeto"
          destacado={
            <>
              {expediente.materia || <SinCargar>Sin objeto cargado</SinCargar>}
              {tipo ? (
                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-500">
                  -{tipoProcesoBreve(tipo.nombre)}-
                </span>
              ) : null}
            </>
          }
        />

        {/*
          **Dónde tramita, en qué va y desde cuándo**: las tres preguntas de una
          causa en curso, en una fila y a la misma altura.

          Son los tres grupos cortos de la ficha: apilados dejaban dos tercios
          de hoja en blanco a la derecha de cada uno. En la fila, la línea fina
          se pone vertical entre ellos (`sm:divide-x`) y vuelve a ser horizontal
          cuando la pantalla se angosta y se apilan (`divide-y sm:divide-y-0`),
          que es la misma línea haciendo el mismo trabajo en las dos formas.

          Las columnas son desiguales a propósito: el juzgado es el único de los
          tres que lleva dos datos uno al lado del otro —Centro Judicial y la
          OGA—, así que se lleva la columna ancha, y la etapa, que son dos
          palabras y una fecha, la más angosta.
        */}
        <div className="grid divide-y divide-linea sm:grid-cols-[1.25fr_0.85fr_1fr] sm:divide-x sm:divide-y-0">
          {/*
            El **fuero** no está, y es por lo que antes se confundía con el
            juzgado: `juzgadoTipo` se elige de la misma lista de fueros, así que
            el juzgado ya lo dice —"Civil y Comercial Común VI" contra fuero
            "Civil y Comercial Común"—. Sigue guardado y editable en el
            formulario, y el listado lo muestra cuando un expediente no tiene
            juzgado cargado (`FilaExpediente`), que es el único caso en que
            aporta algo.
          */}
          <Bloque
            className="sm:pr-6"
            rotulo="Juzgado"
            destacado={juzgado || <SinCargar>Sin juzgado cargado</SinCargar>}
          >
            <dl className={claseRejilla}>
              <Dato rotulo="Centro Judicial">
                {etiquetaDe(CENTROS_JUDICIALES, expediente.centroJudicial)}
              </Dato>
              <Dato rotulo="Oficina de Gestión Asociada">{expediente.oficinaGestion}</Dato>
            </dl>
          </Bloque>

          {/*
            En qué va. El mojón de `Milestone` es el ícono: la etapa es un hito
            del recorrido que define el tipo de proceso, no un estado suelto.

            Encabeza con el nombre de la etapa y la fecha baja a un dato con su
            rótulo, en lugar de ir colgada en letra chica: "desde cuándo" es una
            pregunta aparte de "en qué etapa está", y acá hay lugar para las dos.
          */}
          <Bloque
            className="sm:px-6"
            rotulo="Etapa"
            destacado={etapa?.nombre ?? <SinCargar>Sin etapa</SinCargar>}
          >
            <dl className={claseRejilla}>
              <Dato rotulo="Desde">
                {expediente.etapaDesde ? (
                  <span className="tabular-nums">{formatoFecha(expediente.etapaDesde)}</span>
                ) : undefined}
              </Dato>
            </dl>
          </Bloque>

          {/*
            El último movimiento encabeza —es de donde se cuenta la caducidad— y
            el alta en el sistema queda debajo, que es un dato administrativo de
            la aplicación y no de la causa.
          */}
          <Bloque
            className="sm:pl-6"
            rotulo="Último movimiento"
            destacado={
              expediente.ultimoMovimiento ? (
                <>
                  <span className="tabular-nums">{formatoFecha(expediente.ultimoMovimiento)}</span>
                  {desdeUltimoMovimiento ? (
                    <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-500">
                      {desdeUltimoMovimiento}
                    </span>
                  ) : null}
                </>
              ) : (
                <SinCargar>Sin movimiento registrado</SinCargar>
              )
            }
          >
            <dl className={claseRejilla}>
              <Dato rotulo="Alta en el sistema">
                <span className="tabular-nums text-zinc-500 dark:text-zinc-500">
                  {dia(expediente.creadoEn)}
                </span>
              </Dato>
            </dl>
          </Bloque>
        </div>

        {/*
          Las notas no son un dato de la ficha sino texto que escribió el
          abogado, así que no encabezan nada: el grupo va sin destacado y con
          el texto tal como se escribió. Entra en la misma anatomía para no
          romper la sangría de la pestaña, que era el problema de fondo.

          Se edita con un clic en el propio recuadro (`NotaExpediente`), que es
          lo que corresponde a algo que se retoca diez veces, y por eso el grupo
          se muestra **siempre**, también sin nota cargada: si desapareciera al
          estar vacío no habría dónde hacer el primer clic.
        */}
        <Bloque Icono={StickyNote} rotulo="Notas" atajo={ATAJO_NOTA}>
          <div className="mt-1.5">
            <NotaExpediente expedienteId={expediente.id} notas={expediente.notas} />
          </div>
        </Bloque>
      </div>

      <Pendientes
        items={[
          "Fecha de inicio y el resto de las fechas clave: inicio de mediación, demanda, radicación, sentencia y firmeza (§2.1).",
          "Monto reclamado o base regulatoria, con moneda y fecha.",
          "Etiquetas para agrupar expedientes.",
          "Juzgado y secretaría tomados del catálogo de Configuración, en lugar de dos campos libres.",
          "Baja lógica y archivo: hoy borrar un expediente es definitivo.",
        ]}
      />

      {/*
        `EditarExpediente` es un `<details>` con el atajo `Ctrl+E` enganchado.
        Lo de adentro —el formulario y el botón de borrar— se sigue
        renderizando en el servidor y entra como `children`.
      */}
      <EditarExpediente className={claseSeparador}>
        {/*
          El `group` va en el `<summary>` y no en el `<details>`: con el
          desplegable abierto, el mouse está la mayor parte del tiempo sobre el
          formulario, y la pista del atajo no tiene nada que hacer prendida
          mientras se completan los campos.

          La pista va **al lado del texto** y no empujada al borde derecho
          porque un `<summary>` con `display: flex` pierde el triangulito que
          dibuja el navegador, y el triangulito es lo que dice que esto se
          abre.
        */}
        <summary className="group cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Editar expediente
          <span
            aria-hidden
            className="rotulo-tecla ml-2 text-zinc-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-zinc-500"
          >
            {ATAJO_EXPEDIENTE}
          </span>
        </summary>
        <div className="mt-4 border-t border-linea pt-4">
          <FormularioExpediente
            expediente={expediente}
            tiposProceso={tiposDisponibles}
            materias={materias}
            radicaciones={radicaciones}
            centroJudicialHabitual={estudio.centroJudicialHabitual}
            hoy={diaDeHoy}
            acentuar={estudio.correccionDeTildes}
            accion={guardarExpediente}
            textoBoton="Guardar cambios"
          />
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-linea pt-4">
          <form action={borrarExpediente}>
            <input type="hidden" name="id" value={expediente.id} />
            <button type="submit" className={claseBotonPeligro}>
              Borrar expediente
            </button>
          </form>
          <Marca tono="aviso">No se puede deshacer</Marca>
        </div>
      </EditarExpediente>
    </>
  );
}
