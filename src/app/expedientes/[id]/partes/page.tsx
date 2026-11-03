import { UserPlus } from "lucide-react";
import { Rotulo } from "@/components/Registro";
import { claseBotonAccion, claseSeparador, Pendientes, Vacio } from "@/components/ui";
import {
  etiquetaDe,
  hoy,
  listarPartes,
  obtenerEstudio,
  ROLES_PARTE,
  type Parte,
} from "@/lib/datos";
import {
  agruparPartes,
  AREAS_PARTE,
  faltantesDeCaratula,
  LADOS_PARTE,
  ladoDeRol,
  type AreaParte,
  type FaltanteDeCaratula,
  type GrupoPartes,
} from "@/lib/procesal";
import { agregarParteDeCaratula } from "../../acciones";
import { atajoDeLado, ATAJO_PARTE, TECLA_PARTE } from "../atajos";
import { cargarExpediente } from "../cargar";
import { Desplegable } from "../Desplegable";
import { AtajosDeLado } from "./AtajosDeLado";
import { FormularioParte } from "./FormularioParte";
import { TarjetaParte } from "./TarjetaParte";

/**
 * Pestaña **Partes**: quiénes litigan, con qué carácter, quién los lleva y de
 * qué lado está el cliente (docs/02-expedientes.md §2.14, `case_parties` en
 * docs/06-modelo-de-datos.md).
 *
 * **La nómina es un tablero y no una lista**, porque no se la lee de arriba
 * abajo: se la barre con la vista buscando a alguien. Cada parte es **un ícono
 * con su nombre debajo** y, más chico, quién la lleva y lo poco que haga falta
 * saber antes de abrirla. Entran cuatro por fila en la columna del pleito y dos
 * en la de los auxiliares, así que una nómina de veinte se ve casi entera. Lo
 * demás —documento, domicilios, teléfono y los letrados con sus datos— está
 * adentro, a un clic: la parte se abre en su lugar y se lleva la fila entera.
 *
 * **La pestaña no lleva encabezado**: el tablero arranca arriba de todo. El
 * cuadro del expediente ya puso la carátula y el número (`layout.tsx`), y una
 * línea que repitiera "el estudio interviene como actor, por Rogel" se lee una
 * vez y después hay que saltearla en cada visita. Las cuentas de lo que falta
 * tampoco están: decían cuántos y no cuáles, así que para resolverlas había que
 * barrer el tablero igual.
 *
 * **La pantalla se parte en dos áreas**: a la izquierda **el pleito** —los
 * cuatro lados que litigan, uno debajo del otro en el orden en que entran a la
 * causa—, a la derecha **los auxiliares del juzgado**, que intervienen sin
 * litigar. El pleito no lleva título propio: sus lados ya se nombran, y un "EL
 * PLEITO" arriba de todos ellos era un renglón que no agregaba nada.
 *
 *   PARTE ACTORA                           AUXILIARES DEL JUZGADO
 *     🗡        🗡                            🔬       🤝
 *   Rogel    Maidana                        Juárez   Carrizo
 *                                           PERITO   MEDIADOR
 *   PARTE DEMANDADA
 *     🛡        🛡                            🏛
 *   Swiss   Citrícola                        Paz
 *                                           SÍNDICO
 *   CITADA EN GARANTÍA
 *     ☂
 *   La Segunda
 *
 *   TERCEROS
 *     👥
 *   Maquinarias
 *
 * (lo que lleva cada parte debajo del nombre está en `TarjetaParte.tsx`)
 *
 * Es el reparto que tiene el juicio en la cabeza del abogado: **quiénes litigan
 * va de un lado y quiénes no, del otro**. La citada en garantía y los terceros
 * litigan —tienen su propia contestación y su propio letrado—, así que están en
 * la columna del pleito y no mezclados con el perito y la mediadora; y cada uno
 * con su lado propio, porque meterlos adentro de "parte demandada" obligaba a
 * leer el rol de cada uno para saber cuál era cuál. El pleito se lleva la
 * columna ancha porque es donde está el juicio, y por lo tanto le entran cuatro
 * por fila contra las dos de los auxiliares.
 *
 * **Adentro de cada área, el lado encabeza su grupo**. Dos cortes distintos
 * sobre la misma nómina: el área contesta "¿esto es el juicio o lo que lo
 * rodea?" y el lado "¿con quién o contra quién?" (`lib/procesal/partes`).
 *
 * **Los letrados no tienen tarjeta propia**: cuelgan de la parte que llevan,
 * que es como se los encuentra cuando hay que llamar a alguien. En el frente
 * de la tarjeta de su representado aparece el nombre del abogado actual, y
 * adentro están todos, con los que cesaron en un bloque aparte.
 *
 * **La carátula es el arranque de la nómina, no una copia**: mientras un lado
 * no tenga su parte cargada, la pestaña lo ofrece como una tarjeta punteada
 * que se suma con un clic, parada en la columna del lado que le toca.
 *
 * El alta se abre con `alt+p`, igual que el formulario del expediente con
 * `alt+e` en Datos: es el mismo `Desplegable` con otra tecla (`atajos.ts`).
 */

/**
 * El lado de la carátula que todavía no está en la nómina, con la misma
 * anatomía que una tarjeta cargada —el rol arriba, el nombre en el medio— y el
 * botón de sumarla donde las otras llevan a su abogado. Es a propósito: dice
 * "acá va a haber una tarjeta y todavía no está", y el borde punteado es el
 * recurso con el que la aplicación marca lo que no es un dato.
 */
function TarjetaDeCaratula({
  faltante,
  expedienteId,
}: {
  faltante: FaltanteDeCaratula;
  expedienteId: string;
}) {
  return (
    <li className="min-w-0">
      <form
        action={agregarParteDeCaratula}
        className="flex h-full flex-col items-center gap-0.5 rounded-lg border border-dashed border-linea-fuerte p-1.5 text-center"
      >
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <input type="hidden" name="rol" value={faltante.rol} />
        <UserPlus aria-hidden className="size-5 shrink-0 text-zinc-300 dark:text-zinc-700" />
        <p className="min-w-0 text-sm font-semibold leading-snug text-zinc-700 dark:text-zinc-300">
          {faltante.nombre}
        </p>
        <button
          type="submit"
          className={`${claseBotonAccion} text-[11px]`}
          title={`Sumar a "${faltante.nombre}" a la nómina como ${etiquetaDe(ROLES_PARTE, faltante.rol).toLowerCase()}`}
        >
          Sumar a la nómina
        </button>
      </form>
    </li>
  );
}

/**
 * Una columna del tablero: el área con sus lados, cada uno con sus tarjetas.
 *
 * Recorre **los lados del área** y no los grupos que trajo `agruparPartes`,
 * porque un lado puede estar vacío y tener igual algo que mostrar: la parte
 * actora que todavía no se cargó y que la carátula ofrece sumar. Un lado sin
 * tarjetas ni ofrecimiento no se dibuja.
 *
 * Los lados llevan su rótulo y no un recuadro propio: la columna ya es el
 * recuadro, y encerrar cada lado adentro habría sido meter cuadros en cuadros,
 * que es lo que la ficha de Datos dejó de hacer.
 */
function Area({
  area,
  etiqueta,
  grupos,
  faltantes,
  expedienteId,
  representables,
  estudio,
  diaDeHoy,
}: {
  area: AreaParte;
  etiqueta: string;
  grupos: ReadonlyArray<GrupoPartes>;
  faltantes: ReadonlyArray<FaltanteDeCaratula>;
  expedienteId: string;
  representables: ReadonlyArray<Parte>;
  estudio: string;
  diaDeHoy: string;
}) {
  const lados = LADOS_PARTE.filter((lado) => lado.area === area)
    .map((lado) => ({
      lado: lado.lado,
      etiqueta: lado.etiqueta,
      filas: grupos.find((grupo) => grupo.lado === lado.lado)?.partes ?? [],
      faltantes: faltantes.filter((faltante) => ladoDeRol(faltante.rol) === lado.lado),
    }))
    .filter((lado) => lado.filas.length > 0 || lado.faltantes.length > 0);

  if (lados.length === 0) return null;

  return (
    <section className="min-w-0">
      {/*
        El área del pleito no lleva título: cada lado adentro ya dice qué es
        —"parte actora", "parte demandada"— y un "EL PLEITO" arriba de todos
        ellos era un renglón que no agregaba nada (`AREAS_PARTE`). Los
        auxiliares sí lo llevan, porque su único lado se llama igual que el
        área y por eso tiene el rótulo oculto.
      */}
      {etiqueta ? (
        <h3 className="rotulo text-zinc-500 dark:text-zinc-500">{etiqueta}</h3>
      ) : null}

      {/*
        **Una línea separa un lado del siguiente.** Cuatro grupos de partes uno
        abajo del otro, con el rótulo de cada uno en versalitas grises, se leían
        como una sola lista larga: el rótulo decía dónde empezaba cada sección
        pero nada decía dónde terminaba la anterior. La línea es la misma de
        `claseSeparador`, que es con la que la aplicación separa bloques adentro
        de un cuadro, y por eso no hace falta ningún recuadro nuevo.
      */}
      <div className={etiqueta ? "mt-2" : ""}>
        {lados.map((lado, indice) => (
          <div key={lado.lado} className={`group/lado ${indice > 0 ? claseSeparador : ""}`}>
            {/*
              El rótulo del lado solo aparece donde hay más de uno: en la
              columna de los auxiliares el área y el lado se llaman igual, y
              escribirlo dos veces seguidas no agrega nada.

              Al lado del rótulo, **la pista de su atajo**, que aparece al pasar
              el mouse por el grupo: es la misma convención que el `alt+p` del
              alta y el `alt+e` de Datos —el atajo se muestra donde está lo que
              abre, y solo cuando se lo busca—.
            */}
            {lados.length > 1 ? (
              <Rotulo className="block text-zinc-400 dark:text-zinc-600">
                {lado.etiqueta}
                {atajoDeLado(lado.lado) ? (
                  <span
                    aria-hidden
                    className="rotulo-tecla ml-2 text-zinc-300 opacity-0 transition-opacity duration-150 group-hover/lado:opacity-100 dark:text-zinc-700"
                  >
                    {atajoDeLado(lado.lado)}
                  </span>
                ) : null}
              </Rotulo>
            ) : null}
            {/*
              Las partes se acomodan solas: `auto-fill` mete las que entren en
              el ancho que tenga la columna —cuatro en el área del pleito, dos
              en la de los auxiliares, una en un teléfono— sin que la pestaña
              tenga que saber cuántas ni en qué pantalla está. La que se abre se
              lleva la fila entera (`.tablero-partes` en `globals.css`).

              El `data-lado` es lo que leen los atajos para saber qué partes
              recorrer con `alt+a`, `alt+d`, `alt+g` y `alt+t`
              (`AtajosDeLado.tsx`): el orden del foco es el de la pantalla, sin
              una segunda lista que mantener al día.
            */}
            <ul
              data-lado={lado.lado}
              className={`tablero-partes grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2 ${
                lados.length > 1 ? "mt-1.5" : ""
              }`}
            >
              {lado.filas.map((fila) => (
                <TarjetaParte
                  key={fila.parte.id}
                  fila={fila}
                  expedienteId={expedienteId}
                  representables={representables.filter(
                    (candidata) => candidata.id !== fila.parte.id,
                  )}
                  estudio={estudio}
                  diaDeHoy={diaDeHoy}
                />
              ))}
              {/*
                La tarjeta punteada de la carátula va al pie de su lado,
                después de lo que sí está cargado: es una invitación a
                completar la nómina, no una parte más.
              */}
              {lado.faltantes.map((faltante) => (
                <TarjetaDeCaratula
                  key={faltante.rol}
                  faltante={faltante}
                  expedienteId={expedienteId}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function PartesExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/partes">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const [partes, estudio] = await Promise.all([listarPartes(expediente.id), obtenerEstudio()]);

  const diaDeHoy = hoy();
  const grupos = agruparPartes(partes);
  const faltantes = faltantesDeCaratula(expediente, partes);
  // Un letrado no puede representar a otro letrado: el desplegable del
  // formulario ofrece solo a quienes no representan a nadie.
  const representables = partes.filter((parte) => !parte.representaA);

  return (
    <>
      {partes.length === 0 && faltantes.length === 0 ? (
        <Vacio>
          La nómina de partes de este expediente está vacía. Las notificaciones, los escritos y
          la rendición al cliente se arman con estos datos.
        </Vacio>
      ) : null}

      {/*
        El tablero. En pantalla angosta las dos áreas se apilan —primero el
        pleito, después lo que lo rodea—, que es el mismo orden de lectura; a
        partir de `lg` se ponen una al lado de la otra y el pleito se lleva la
        columna ancha.

        Los dos tramos van en `minmax(0, …)` y no en `1.7fr` pelado. Un `fr`
        suelto es `minmax(auto, 1.7fr)`: su mínimo es el **ancho mínimo del
        contenido**, así que la columna se estira para que entre lo más ancho
        que tenga adentro —la ficha de una tarjeta abierta, con su formulario—
        y el tablero entero se va de la pantalla, con scroll lateral. Con el
        mínimo en cero la columna se queda del tamaño que le toca y lo de
        adentro se acomoda.
      */}
      {/*
        Los atajos que recorren el tablero con el teclado. No dibuja nada: va
        acá, al lado de lo que recorre, y no en el cuadro del expediente,
        porque son atajos de esta pestaña (`AtajosDeLado.tsx`).
      */}
      <AtajosDeLado />

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {AREAS_PARTE.map((area) => (
          <Area
            key={area.area}
            area={area.area}
            etiqueta={area.etiqueta}
            grupos={grupos}
            faltantes={faltantes}
            expedienteId={expediente.id}
            representables={representables}
            estudio={estudio.nombre}
            diaDeHoy={diaDeHoy}
          />
        ))}
      </div>

      <Desplegable codigo={TECLA_PARTE} className={claseSeparador}>
        {/*
          El `group` va en el `<summary>` y no en el `<details>`, igual que en
          Datos: con el desplegable abierto el mouse está la mayor parte del
          tiempo sobre el formulario, y la pista del atajo no tiene nada que
          hacer prendida mientras se completan los campos.
        */}
        <summary className="group cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Agregar parte
          <span
            aria-hidden
            className="rotulo-tecla ml-2 text-zinc-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-zinc-500"
          >
            {ATAJO_PARTE}
          </span>
        </summary>
        <div className="border-t border-linea">
          <FormularioParte expedienteId={expediente.id} representables={representables} />
        </div>
      </Desplegable>

      <Pendientes
        items={[
          "Agenda de contactos del estudio: hoy cada parte guarda sus datos adentro del expediente, así que un mismo cliente con tres juicios se carga tres veces (contacts en docs/06-modelo-de-datos.md).",
          "Vínculo del cliente con sus otros expedientes, y de la contraria con los juicios en los que ya litigó el estudio.",
          "Encabezado de escrito armado con esta nómina: carátula, partes, documentos y domicilios constituidos, sin volver a tipearlos.",
          "Cédulas y notificaciones a los domicilios electrónicos cargados.",
          "La comparecencia y el cese del letrado escritos por la historia: hoy los dos se cargan a mano, aunque la presentación y la renuncia ya son entradas del expediente.",
          "Caracteres y sus particularidades a confirmar con el abogado, y los que falten: cesionario, subrogante, concursado.",
          "Aseguradoras con su póliza y su cobertura, y peritos con su especialidad y su matrícula.",
          "Cómo se vuelve a ver de qué lado está cada parte, y quién es el cliente: lo dijo una pastilla, después el filete del borde y después el color del ícono, y con todos los íconos iguales quedó solo adentro de la ficha (la regla sigue en lib/procesal/partes).",
          "La sucesión indivisa es el único carácter sin ejemplo cargado: aparece cuando se demanda al acervo de alguien que murió, así que va en otro expediente y no en estos dos.",
          "El curador de una parte con capacidad restringida, que hoy va en las notas: la nómina solo sabe colgar letrados de una parte, y un curador no es un letrado.",
        ]}
      />
    </>
  );
}
