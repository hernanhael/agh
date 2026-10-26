import { UserPlus, Users } from "lucide-react";
import { Rotulo } from "@/components/Registro";
import { claseBotonAccion, claseSeparador, Pendientes, Vacio } from "@/components/ui";
import {
  etiquetaDe,
  hoy,
  listarPartes,
  obtenerEstudio,
  ROLES_CLIENTE,
  ROLES_PARTE,
  type Parte,
} from "@/lib/datos";
import {
  agruparPartes,
  AREAS_PARTE,
  clienteDeLaNomina,
  comparecenciaDe,
  faltantesDeCaratula,
  LADOS_PARTE,
  ladoDeRol,
  ladoDelCliente,
  seNotifica,
  type AreaParte,
  type FaltanteDeCaratula,
  type GrupoPartes,
  type LadoParte,
} from "@/lib/procesal";
import { agregarParteDeCaratula } from "../../acciones";
import { ATAJO_PARTE, TECLA_PARTE } from "../atajos";
import { cargarExpediente } from "../cargar";
import { Desplegable } from "../Desplegable";
import { FormularioParte } from "./FormularioParte";
import { TarjetaParte, type Costado } from "./TarjetaParte";

/**
 * Pestaña **Partes**: quiénes litigan, cómo se los notifica y de qué lado está
 * el cliente (docs/02-expedientes.md §2.14, `case_parties` en
 * docs/06-modelo-de-datos.md).
 *
 * **La nómina es un tablero de tarjetas y no una lista**, porque no se la lee
 * de arriba abajo: se la barre con la vista buscando a alguien. Una tarjeta
 * por persona, el ícono de su rol como distintivo y tres señales en el frente
 * —si compareció, si tiene domicilio digital y quién es su abogado hoy—, que
 * son las tres preguntas que se contestan sin abrir nada. Lo demás está
 * adentro, a un clic, y la tarjeta se abre en su lugar.
 *
 * **La pantalla se parte en dos áreas**: a la izquierda el pleito —la parte
 * actora y la demandada con su citada en garantía—, a la derecha lo que lo
 * rodea —los terceros y los auxiliares del juzgado—.
 *
 *   PARTES PRINCIPALES                      TERCEROS Y AUXILIARES
 *   PARTE ACTORA                            ┌╴🔬 Silvia Juárez        │
 *   ┌╴⚖  Nicolás Rogel          cliente │   │    PERITO              │
 *   │    ACTOR                           │   └────────────────────────┘
 *   │    ✔ Compareció  ✉ Digital  💼 …   │   ┌╴🤝 Ana Carrizo         │
 *   └────────────────────────────────────┘   │    MEDIADOR            │
 *   PARTE DEMANDADA                          └────────────────────────┘
 *   ┌╴🛡  Swiss Medical ART              │
 *   │    DEMANDADO                       │
 *   └────────────────────────────────────┘
 *
 * Es el reparto que tiene el juicio en la cabeza del abogado: enfrente hay una
 * contraria y alrededor hay gente que no litiga pero interviene, y mezclarlas
 * en una sola columna obligaba a leer el rol de cada fila para saber cuál era
 * cuál. El área principal se lleva la columna ancha porque es donde está el
 * pleito; los auxiliares son tarjetas cortas, casi siempre una señal sola.
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

/** El filete de la tarjeta, visto desde el cliente y no desde la carátula. */
function costadoDe(parte: Parte, ladoCliente: LadoParte | undefined): Costado {
  if (parte.esCliente) return "cliente";
  const lado = ladoDeRol(parte.rol);
  if (lado === "auxiliares") return "auxiliar";
  return lado === ladoCliente ? "propio" : "contrario";
}

/** El lado de la carátula que todavía no está en la nómina. */
function TarjetaDeCaratula({
  faltante,
  expedienteId,
}: {
  faltante: FaltanteDeCaratula;
  expedienteId: string;
}) {
  return (
    <li className="rounded-lg border border-dashed border-linea-fuerte bg-background p-3">
      <p className="text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{faltante.nombre}</span>
        <span className="text-zinc-500 dark:text-zinc-500">
          {" "}
          está en la carátula y no en la nómina
        </span>
      </p>
      <form action={agregarParteDeCaratula} className="mt-1">
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <input type="hidden" name="rol" value={faltante.rol} />
        <button type="submit" className={`${claseBotonAccion} text-xs`}>
          <UserPlus aria-hidden className="size-3.5" />
          Sumar como {etiquetaDe(ROLES_PARTE, faltante.rol).toLowerCase()}
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
  ladoCliente,
  estudio,
  diaDeHoy,
}: {
  area: AreaParte;
  etiqueta: string;
  grupos: ReadonlyArray<GrupoPartes>;
  faltantes: ReadonlyArray<FaltanteDeCaratula>;
  expedienteId: string;
  representables: ReadonlyArray<Parte>;
  ladoCliente: LadoParte | undefined;
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
    <section>
      <h3 className="rotulo text-zinc-500 dark:text-zinc-500">{etiqueta}</h3>

      <div className="mt-2 space-y-4">
        {lados.map((lado) => (
          <div key={lado.lado}>
            {/*
              El rótulo del lado solo aparece donde hay más de uno: en la
              columna de los auxiliares el área y el lado se llaman igual, y
              escribirlo dos veces seguidas no agrega nada.
            */}
            {lados.length > 1 ? (
              <Rotulo className="block text-zinc-400 dark:text-zinc-600">{lado.etiqueta}</Rotulo>
            ) : null}
            <ul className={`space-y-2 ${lados.length > 1 ? "mt-1.5" : ""}`}>
              {lado.filas.map((fila) => (
                <TarjetaParte
                  key={fila.parte.id}
                  fila={fila}
                  expedienteId={expedienteId}
                  representables={representables.filter(
                    (candidata) => candidata.id !== fila.parte.id,
                  )}
                  costado={costadoDe(fila.parte, ladoCliente)}
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
  const cliente = clienteDeLaNomina(partes);
  const ladoCliente = ladoDelCliente(expediente, partes);
  // Un letrado no puede representar a otro letrado: el desplegable del
  // formulario ofrece solo a quienes no representan a nadie.
  const representables = partes.filter((parte) => !parte.representaA);

  // Las dos cuentas que la pestaña pone arriba: a cuántos no se puede
  // notificar y cuántos todavía no se presentaron. Son las mismas preguntas
  // que contestan las señales de cada tarjeta, sumadas, para no tener que
  // recorrer el tablero buscando ámbar.
  const sinCasilla = partes.filter(
    (parte) => seNotifica(parte.rol) && !parte.domicilioElectronico,
  ).length;
  const sinComparecer = partes.filter(
    (parte) => comparecenciaDe(parte) === "pendiente",
  ).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Users aria-hidden className="size-4 shrink-0 text-zinc-500 dark:text-zinc-500" />
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          El estudio interviene como{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {etiquetaDe(ROLES_CLIENTE, expediente.rolCliente).toLowerCase()}
          </span>
          {cliente ? (
            <>
              , por{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{cliente.nombre}</span>
            </>
          ) : null}
          .
          {sinCasilla > 0 || sinComparecer > 0 ? (
            <span className="text-zinc-500 dark:text-zinc-500">
              {sinCasilla > 0
                ? ` ${sinCasilla === 1 ? "Falta una casilla del SAE" : `Faltan ${sinCasilla} casillas del SAE`}.`
                : ""}
              {sinComparecer > 0
                ? ` ${
                    sinComparecer === 1
                      ? "Una parte no compareció"
                      : `${sinComparecer} partes no comparecieron`
                  }.`
                : ""}
            </span>
          ) : null}
        </p>
      </div>

      {partes.length === 0 && faltantes.length === 0 ? (
        <div className="mt-4">
          <Vacio>
            La nómina de partes de este expediente está vacía. Las notificaciones, los escritos y
            la rendición al cliente se arman con estos datos.
          </Vacio>
        </div>
      ) : null}

      {/*
        El tablero. En pantalla angosta las dos áreas se apilan —primero el
        pleito, después lo que lo rodea—, que es el mismo orden de lectura; a
        partir de `lg` se ponen una al lado de la otra y el pleito se lleva la
        columna ancha.
      */}
      <div className="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-[1.7fr_1fr]">
        {AREAS_PARTE.map((area) => (
          <Area
            key={area.area}
            area={area.area}
            etiqueta={area.etiqueta}
            grupos={grupos}
            faltantes={faltantes}
            expedienteId={expediente.id}
            representables={representables}
            ladoCliente={ladoCliente}
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
        ]}
      />
    </>
  );
}
