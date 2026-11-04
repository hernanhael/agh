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
  colorDeLado,
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
import { LadoPlegable } from "./LadoPlegable";
import { TarjetaParte } from "./TarjetaParte";

/**
 * Pestaña **Partes**: quiénes litigan, con qué carácter, quién los lleva y de
 * qué lado está el cliente (docs/02-expedientes.md §2.14, `case_parties` en
 * docs/06-modelo-de-datos.md).
 *
 * **La nómina es una lista de renglones**, sin íconos y sin columnas: el nombre
 * de cada parte, con el apellido primero, y pegado a él, en gris, quién la
 * lleva —o, en los auxiliares, su función—. Los nombres quedan alineados uno
 * debajo del otro, que es como se busca a alguien con la vista. Lo demás
 * —documento, domicilios, teléfono, carácter y los letrados con sus datos—
 * está adentro, a un clic: el renglón se abre en su lugar y la ficha se
 * despliega debajo.
 *
 * **La pestaña no lleva encabezado**: el tablero arranca arriba de todo. El
 * cuadro del expediente ya puso la carátula y el número (`layout.tsx`), y una
 * línea que repitiera "el estudio interviene como actor, por Rogel" se lee una
 * vez y después hay que saltearla en cada visita. Las cuentas de lo que falta
 * tampoco están: decían cuántos y no cuáles, así que para resolverlas había que
 * barrer el tablero igual.
 *
 * **La nómina se parte en dos áreas, una debajo de la otra**: arriba **el
 * pleito** —los cuatro lados que litigan, en el orden en que entran a la
 * causa— y abajo **los auxiliares del juzgado**, que intervienen sin litigar.
 * El pleito no lleva título propio: sus lados ya se nombran, y un "EL PLEITO"
 * arriba de todos ellos era un renglón que no agregaba nada.
 *
 *   PARTE ACTORA ›
 *   Rogel Nicolás  El estudio
 *   Maidana Gabriela  Suárez Verónica
 *   ─────────────────────────────────────────────────────────
 *   PARTE DEMANDADA ›
 *   Swiss Medical ART  Ferreyra Lucía +1
 *   ─────────────────────────────────────────────────────────
 *   CITADA EN GARANTÍA ›
 *   La Segunda Coop.
 *   ─────────────────────────────────────────────────────────
 *   AUXILIARES DEL JUZGADO ›
 *   Juárez Silvia  Perito
 *   Carrizo Ana  Mediador
 *
 * (lo que va al lado de cada nombre está en `TarjetaParte.tsx`)
 *
 * Las únicas líneas son las que dividen un lado de otro: entre una persona y
 * la siguiente no hay ninguna, para que no se lea como una planilla.
 *
 * Es el reparto que tiene el juicio en la cabeza del abogado: **quiénes litigan
 * van primero y quiénes no, después**. La citada en garantía y los terceros
 * litigan —tienen su propia contestación y su propio letrado—, así que están
 * con el pleito y no mezclados con el perito y la mediadora; y cada uno con su
 * lado propio, porque meterlos adentro de "parte demandada" obligaba a leer el
 * rol de cada uno para saber cuál era cuál.
 *
 * **Adentro de cada área, el lado encabeza su grupo**. Dos cortes distintos
 * sobre la misma nómina: el área contesta "¿esto es el juicio o lo que lo
 * rodea?" y el lado "¿con quién o contra quién?" (`lib/procesal/partes`).
 *
 * **Los letrados no tienen tarjeta propia**: cuelgan de la parte que llevan,
 * que es como se los encuentra cuando hay que llamar a alguien. En el renglón
 * de su representado aparece el abogado actual, al lado de su nombre, y adentro
 * de la ficha están todos, con los que cesaron en un bloque aparte.
 *
 * **La carátula es el arranque de la nómina, no una copia**: mientras un lado
 * no tenga su parte cargada, la pestaña lo ofrece como un renglón punteado
 * que se suma con un clic, al pie del lado que le toca.
 *
 * El alta se abre con `alt+p`, igual que el formulario del expediente con
 * `alt+e` en Datos: es el mismo `Desplegable` con otra tecla (`atajos.ts`).
 */

/**
 * El lado de la carátula que todavía no está en la nómina, armado como un
 * renglón cargado —el nombre primero— y el botón de sumarla donde los otros
 * llevan a su abogado. Es a propósito: dice "acá va a
 * haber una parte y todavía no está", y el borde punteado es el recurso con el
 * que la aplicación marca lo que no es un dato. El nombre se escribe como lo
 * trae la carátula, entero: no hay cómo saber dónde empieza el apellido.
 */
function TarjetaDeCaratula({
  faltante,
  expedienteId,
}: {
  faltante: FaltanteDeCaratula;
  expedienteId: string;
}) {
  return (
    <li className="min-w-0 py-1">
      <form
        action={agregarParteDeCaratula}
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-dashed border-linea-fuerte px-2 py-1"
      >
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <input type="hidden" name="rol" value={faltante.rol} />
        <p className="min-w-0 text-sm font-medium leading-snug text-zinc-500 dark:text-zinc-400">
          {faltante.nombre}
        </p>
        <button
          type="submit"
          className={`${claseBotonAccion} justify-self-start text-[11px]`}
          title={`Sumar a "${faltante.nombre}" a la nómina como ${etiquetaDe(ROLES_PARTE, faltante.rol).toLowerCase()}`}
        >
          Sumar a la nómina
        </button>
      </form>
    </li>
  );
}

/**
 * Una columna de la pantalla: el área con sus lados, cada uno con su tablilla.
 *
 * Recorre **los lados del área** y no los grupos que trajo `agruparPartes`,
 * porque un lado puede estar vacío y tener igual algo que mostrar: la parte
 * actora que todavía no se cargó y que la carátula ofrece sumar. Un lado sin
 * partes ni ofrecimiento no se dibuja.
 *
 * Los lados llevan su cabecera y no un recuadro propio: encerrar cada lado
 * habría sido meter cuadros en cuadros, que es lo que la ficha de Datos dejó
 * de hacer.
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
        **Una línea separa un lado del siguiente.** Cuatro grupos de partes uno
        abajo del otro se leían como una sola lista larga: el rótulo decía
        dónde empezaba cada sección pero nada decía dónde terminaba la
        anterior. La línea es la misma de `claseSeparador`, que es con la que
        la aplicación separa bloques adentro de un cuadro.
      */}
      {lados.map((lado, indice) => (
        /*
          **Cada lado se pliega y se despliega** (`LadoPlegable`), con un clic
          en su nombre o con su atajo. La cabecera es el nombre del lado, sin
          títulos de columna: lo que acompaña a cada parte va pegado a su
          nombre, así que no hay columnas que titular.

          El color del lado va en la flecha de su cabecera y en ningún otro
          lado de la nómina: un círculo en cada persona repetía lo mismo tantas
          veces como partes hubiera.

          El pleito no necesita un título de área, porque sus lados se nombran;
          el lado único de los auxiliares lleva el del área, que dice qué hacen
          ahí.

          Un renglón por parte, **sin línea entre una persona y la siguiente**:
          con una raya debajo de cada renglón la nómina parecía una planilla de
          cálculo. Las únicas líneas son las que dividen un lado del otro.
        */
        <LadoPlegable
          key={lado.lado}
          lado={lado.lado}
          titulo={lados.length > 1 ? lado.etiqueta : etiqueta || lado.etiqueta}
          color={colorDeLado(lado.lado)}
          atajo={atajoDeLado(lado.lado)}
          cantidad={lado.filas.length}
          separado={indice > 0 ? claseSeparador : ""}
        >
          {lado.filas.map((fila) => (
            <TarjetaParte
              key={fila.parte.id}
              fila={fila}
              expedienteId={expedienteId}
              representables={representables.filter((candidata) => candidata.id !== fila.parte.id)}
              estudio={estudio}
              diaDeHoy={diaDeHoy}
              conAbogado={area !== "secundaria"}
            />
          ))}
          {/*
            El renglón punteado de la carátula va al pie de su lado, después de
            lo que sí está cargado: es una invitación a completar la nómina, no
            una parte más.
          */}
          {lado.faltantes.map((faltante) => (
            <TarjetaDeCaratula key={faltante.rol} faltante={faltante} expedienteId={expedienteId} />
          ))}
        </LadoPlegable>
      ))}
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
        Los atajos que recorren la nómina con el teclado. No dibuja nada: va
        acá, al lado de lo que recorre, y no en el cuadro del expediente,
        porque son atajos de esta pestaña (`AtajosDeLado.tsx`).
      */}
      <AtajosDeLado />

      {/*
        Las dos áreas, **una debajo de la otra**: primero el pleito y abajo los
        auxiliares del juzgado. Al costado, los auxiliares se llevaban una
        columna angosta donde sus tres columnas no entraban, y competían con el
        pleito por la mirada cuando lo que se viene a leer es el pleito. Abajo
        quedan en el orden de importancia y con las mismas columnas que los
        lados de arriba.

        El área de abajo se separa con la misma línea que divide un lado de
        otro (`claseSeparador`). Va como selector de hermano y no como clase
        de cada área porque un área sin partes no se dibuja, y la línea tiene
        que aparecer solo entre dos que sí estén.
      */}
      <div className="[&>section+section]:mt-4 [&>section+section]:border-t [&>section+section]:border-linea [&>section+section]:pt-4">
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
          "Caracteres y sus particularidades a confirmar con el abogado, sobre todo los recién sumados (causante, acreedor, apoderado civil, cesionario, curador, desistido, fallido, excluido del proceso), y los que falten: subrogante, concursado.",
          "Aseguradoras con su póliza y su cobertura, y peritos con su especialidad y su matrícula.",
          "Cómo se vuelve a ver quién es el cliente: el lado ya lo dice su sección, pero cuál de las partes de ese lado es el cliente quedó solo adentro de la ficha.",
          "El color de cada lado en la historia del expediente, al lado de cada escrito, para ver de un vistazo de qué lado viene.",
          "La sucesión indivisa es el único carácter sin ejemplo cargado: aparece cuando se demanda al acervo de alguien que murió, así que va en otro expediente y no en estos dos.",
          "El curador de una parte con capacidad restringida, que hoy va en las notas: la nómina solo sabe colgar letrados de una parte, y un curador no es un letrado.",
        ]}
      />
    </>
  );
}
