import { normalizarParaBuscar } from "@/lib/formato/texto";
import {
  CARACTERES_PARTE,
  ROLES_PARTE,
  type CaracterParte,
  type Comparecencia,
  type Expediente,
  type Parte,
  type RolParte,
} from "@/lib/datos/tipos";

/**
 * Cómo se lee una nómina de partes (docs/02-expedientes.md §2.14).
 *
 * Una lista plana de nueve roles no se lee: el abogado piensa el juicio en
 * **lados** —acá los míos, enfrente los otros, alrededor los auxiliares del
 * juzgado— y dentro de cada lado, cada parte con su letrado. Este módulo hace
 * esas dos cosas: reparte los roles en lados y cuelga a cada representante de
 * su representado.
 *
 * Módulo puro, como el resto de `lib/procesal`: recibe el expediente y sus
 * partes y devuelve cómo mostrarlas, sin tocar el almacén.
 */

export type LadoParte = "actora" | "demandada" | "auxiliares";

/**
 * Las dos **áreas** de la pestaña: las partes del pleito de un lado, los
 * terceros y auxiliares del otro.
 *
 * El lado contesta "¿con quién o contra quién?" y el área contesta "¿esto es
 * el juicio o es lo que lo rodea?". Son dos cortes distintos y los dos se
 * usan: el área reparte la pantalla en dos columnas y el lado encabeza cada
 * grupo adentro de la suya.
 */
export type AreaParte = "principal" | "secundaria";

/**
 * Los tres lados, con los roles que caen en cada uno.
 *
 * El citado en garantía va del lado de la demandada porque lo trae el
 * demandado y litiga junto con él, aunque no haya sido demandado. El tercero
 * va con los auxiliares y no con un lado: hasta que no se resuelve cómo
 * interviene, no se sabe de qué lado está.
 *
 * `letrado_contraria` no figura en ninguna lista: no se muestra como una fila
 * propia sino colgando de la parte que representa. Si quedó sin representado,
 * cae en los auxiliares por el valor por defecto de `ladoDeRol`, porque lo que
 * no se puede colgar de nadie tiene que verse igual.
 */
export const LADOS_PARTE: ReadonlyArray<{
  lado: LadoParte;
  etiqueta: string;
  area: AreaParte;
  roles: ReadonlyArray<RolParte>;
}> = [
  { lado: "actora", etiqueta: "Parte actora", area: "principal", roles: ["actor"] },
  {
    lado: "demandada",
    etiqueta: "Parte demandada",
    area: "principal",
    roles: ["demandado", "citado_garantia"],
  },
  {
    lado: "auxiliares",
    etiqueta: "Terceros y auxiliares",
    area: "secundaria",
    roles: ["tercero", "sindico", "perito", "mediador", "otro"],
  },
];

/** Las dos áreas con su título, en el orden en que se leen. */
export const AREAS_PARTE: ReadonlyArray<{ area: AreaParte; etiqueta: string }> = [
  { area: "principal", etiqueta: "Partes principales" },
  { area: "secundaria", etiqueta: "Terceros y auxiliares" },
];

/**
 * Roles a los que el juicio les notifica, y que por lo tanto necesitan tener
 * cargada la casilla del SAE.
 *
 * Quedan afuera el perito y el mediador: al perito lo notifica el juzgado por
 * su propio canal y el mediador ya terminó su intervención cuando el
 * expediente llega al juzgado, así que reclamarles la casilla sería un aviso
 * que el abogado no puede ni necesita resolver.
 */
const ROLES_NOTIFICADOS: ReadonlyArray<RolParte> = [
  "actor",
  "demandado",
  "citado_garantia",
  "tercero",
  "sindico",
  "letrado_contraria",
];

/** Si a esa parte hay que poder notificarla electrónicamente. */
export function seNotifica(rol: RolParte): boolean {
  return ROLES_NOTIFICADOS.includes(rol);
}

/** Una parte con los letrados y apoderados que la representan. */
export interface ParteConRepresentantes {
  parte: Parte;
  representantes: Parte[];
}

export interface GrupoPartes {
  lado: LadoParte;
  etiqueta: string;
  area: AreaParte;
  partes: ParteConRepresentantes[];
}

/** El lado en el que se muestra un rol. */
export function ladoDeRol(rol: RolParte): LadoParte {
  return LADOS_PARTE.find((grupo) => grupo.roles.includes(rol))?.lado ?? "auxiliares";
}

/**
 * Orden dentro de un lado: **el cliente primero**, después el catálogo de
 * roles y al final por nombre.
 *
 * El cliente encabeza su lado porque es la tarjeta que se busca: en un
 * litisconsorcio de tres actores, dejarlo donde caiga por orden alfabético
 * obliga a leer los tres nombres para encontrar al propio. En los lados donde
 * no hay cliente —que son todos menos uno— la regla no cambia nada y el orden
 * sigue siendo el del catálogo.
 */
function compararPartes(a: Parte, b: Parte): number {
  const indice = (parte: Parte) => ROLES_PARTE.findIndex((rol) => rol.valor === parte.rol);
  return (
    Number(b.esCliente) - Number(a.esCliente) ||
    indice(a) - indice(b) ||
    a.nombre.localeCompare(b.nombre, "es")
  );
}

/**
 * Reparte las partes en los tres lados y cuelga cada representante de su
 * representado.
 *
 * Un representante cuyo representado no está en la nómina —se borró la parte,
 * o se cargó al letrado primero— no desaparece: queda como una fila más del
 * lado que le toca por su rol, para que no se pierda de vista.
 */
export function agruparPartes(partes: ReadonlyArray<Parte>): GrupoPartes[] {
  const porId = new Map(partes.map((parte) => [parte.id, parte]));
  const representa = (parte: Parte) =>
    parte.representaA && porId.has(parte.representaA) ? parte.representaA : "";

  const representantes = new Map<string, Parte[]>();
  for (const parte of partes) {
    const representado = representa(parte);
    if (!representado) continue;
    representantes.set(representado, [...(representantes.get(representado) ?? []), parte]);
  }

  return LADOS_PARTE.map((grupo) => ({
    lado: grupo.lado,
    etiqueta: grupo.etiqueta,
    area: grupo.area,
    partes: partes
      .filter((parte) => !representa(parte) && ladoDeRol(parte.rol) === grupo.lado)
      .sort(compararPartes)
      .map((parte) => ({
        parte,
        representantes: [...(representantes.get(parte.id) ?? [])].sort(compararPartes),
      })),
  })).filter((grupo) => grupo.partes.length > 0);
}

/*
 * Los tres datos que la tarjeta de una parte muestra antes de abrirla
 * (docs/02-expedientes.md §2.14): si compareció, si se la puede notificar y
 * quién es su abogado hoy. Son las tres preguntas que se hacen de un vistazo
 * sobre una nómina, y las tres salen de acá y no de la pantalla, porque las
 * tres tienen una regla atrás.
 */

/**
 * Roles a los que **se les pregunta** si comparecieron.
 *
 * Al perito y al mediador los designa el juzgado, no comparecen; el letrado
 * tampoco, es el que hace comparecer a su representado. Preguntárselo sería
 * poner en la tarjeta un "no compareció" que no significa nada malo, que es
 * exactamente la clase de aviso que entrena a no mirar los avisos.
 */
const ROLES_QUE_COMPARECEN: ReadonlyArray<RolParte> = [
  "actor",
  "demandado",
  "citado_garantia",
  "tercero",
  "sindico",
];

/** Si a esa parte se le pregunta si compareció. */
export function comparece(rol: RolParte): boolean {
  return ROLES_QUE_COMPARECEN.includes(rol);
}

/**
 * En qué estado está la comparecencia de una parte.
 *
 * Resuelve el campo faltante, que es lo normal: las partes cargadas antes de
 * que el dato existiera no lo tienen, y las que se suman desde la carátula
 * tampoco. Quien no comparece devuelve `no_corresponde`; **el actor arranca
 * en "compareció"** porque presentar la demanda es su comparecencia, y el
 * resto arranca en "pendiente", que es el lado seguro del error: muestra un
 * trámite por hacer que tal vez ya esté hecho, en lugar de dar por presentada
 * a una demandada a la que todavía hay que emplazar.
 */
export function comparecenciaDe(parte: Parte): Comparecencia {
  if (parte.comparecencia) return parte.comparecencia;
  if (!comparece(parte.rol)) return "no_corresponde";
  return parte.rol === "actor" ? "comparecio" : "pendiente";
}

/** El carácter con el que interviene. Si no se cargó, por derecho propio. */
export function caracterDe(parte: Parte): CaracterParte {
  return parte.caracter ?? "por_si";
}

/**
 * Lo que hay que tener presente de esa parte por el carácter con el que
 * interviene, o cadena vacía si no hay nada que advertir.
 */
export function particularidadDe(parte: Parte): string {
  const caracter = caracterDe(parte);
  return CARACTERES_PARTE.find((candidato) => candidato.valor === caracter)?.particularidad ?? "";
}

/** Los letrados de una parte, separados en los de hoy y los de antes. */
export interface Letrados {
  /** Quienes la representan hoy. Puede haber más de uno, y puede no haber. */
  actuales: Parte[];
  /** Quienes la representaron y cesaron, del más reciente al más viejo. */
  anteriores: Parte[];
}

/**
 * Reparte los representantes de una parte entre los actuales y los que
 * cesaron.
 *
 * Que el letrado anterior no desaparezca no es un detalle de archivo: lo que
 * presentó mientras representaba sigue en el expediente, y cuando hay que
 * preguntar por eso hay que saber a quién llamar. Por eso el cese es una
 * fecha y no un borrado.
 *
 * Los anteriores salen **del más reciente al más viejo**, que es el orden en
 * que se los busca: el que cesó el mes pasado antes que el de hace tres años.
 */
export function letradosDe(representantes: ReadonlyArray<Parte>): Letrados {
  return {
    actuales: representantes.filter((letrado) => !letrado.cesoEl),
    anteriores: representantes
      .filter((letrado) => Boolean(letrado.cesoEl))
      .sort((a, b) => (b.cesoEl ?? "").localeCompare(a.cesoEl ?? "")),
  };
}

/** La parte marcada como cliente del estudio, si hay alguna cargada. */
export function clienteDeLaNomina(partes: ReadonlyArray<Parte>): Parte | undefined {
  return partes.find((parte) => parte.esCliente);
}

/**
 * De qué lado del pleito está el estudio, para teñir el filete de las
 * tarjetas.
 *
 * Lo dice primero **la nómina**: el lado de la parte marcada como cliente es
 * el lado del estudio, y es el dato más confiable porque alguien lo marcó
 * mirando el expediente. Si todavía no hay cliente cargado, cae en el rol del
 * cliente de la ficha, que solo sirve cuando es actor o demandado: un cliente
 * "heredero" o "acreedor" no dice de qué lado litiga, y en ese caso la
 * pestaña prefiere no pintar nada antes que pintarlo mal.
 */
export function ladoDelCliente(
  expediente: Expediente,
  partes: ReadonlyArray<Parte>,
): LadoParte | undefined {
  const cliente = clienteDeLaNomina(partes);
  if (cliente) return ladoDeRol(cliente.rol);
  if (expediente.rolCliente === "actor") return "actora";
  if (expediente.rolCliente === "demandado") return "demandada";
  return undefined;
}

/** Un lado de la carátula que todavía no está en la nómina. */
export interface FaltanteDeCaratula {
  /** `actor` o `demandado`, que es el rol con el que se va a dar de alta. */
  rol: Extract<RolParte, "actor" | "demandado">;
  /** El nombre tal como está escrito en la carátula. */
  nombre: string;
}

/**
 * Los lados de la carátula que no tienen una parte cargada.
 *
 * La carátula ya nombra al actor y al demandado, así que la nómina no arranca
 * en blanco: arranca con esos dos nombres esperando que alguien les ponga el
 * documento y el domicilio. Se comparan normalizados —sin tildes, sin signos y
 * en minúsculas, igual que el buscador del listado— para que "Swiss Medical
 * ART" y "swiss medical art" sean la misma persona y no se duplique.
 */
export function faltantesDeCaratula(
  expediente: Expediente,
  partes: ReadonlyArray<Parte>,
): FaltanteDeCaratula[] {
  const lados: FaltanteDeCaratula[] = [
    { rol: "actor", nombre: expediente.actor },
    { rol: "demandado", nombre: expediente.demandado },
  ];

  return lados.filter((lado) => {
    if (!lado.nombre) return false;
    const buscado = normalizarParaBuscar(lado.nombre);
    return !partes.some((parte) => normalizarParaBuscar(parte.nombre) === buscado);
  });
}
