import { normalizarParaBuscar } from "@/lib/formato/texto";
import { ROLES_PARTE, type Expediente, type Parte, type RolParte } from "@/lib/datos/tipos";

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
  roles: ReadonlyArray<RolParte>;
}> = [
  { lado: "actora", etiqueta: "Parte actora", roles: ["actor"] },
  { lado: "demandada", etiqueta: "Parte demandada", roles: ["demandado", "citado_garantia"] },
  {
    lado: "auxiliares",
    etiqueta: "Terceros y auxiliares",
    roles: ["tercero", "sindico", "perito", "mediador", "otro"],
  },
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
  partes: ParteConRepresentantes[];
}

/** El lado en el que se muestra un rol. */
export function ladoDeRol(rol: RolParte): LadoParte {
  return LADOS_PARTE.find((grupo) => grupo.roles.includes(rol))?.lado ?? "auxiliares";
}

/** Orden dentro de un lado: el del catálogo de roles, y después por nombre. */
function compararPartes(a: Parte, b: Parte): number {
  const indice = (parte: Parte) => ROLES_PARTE.findIndex((rol) => rol.valor === parte.rol);
  return indice(a) - indice(b) || a.nombre.localeCompare(b.nombre, "es");
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
    partes: partes
      .filter((parte) => !representa(parte) && ladoDeRol(parte.rol) === grupo.lado)
      .sort(compararPartes)
      .map((parte) => ({
        parte,
        representantes: [...(representantes.get(parte.id) ?? [])].sort(compararPartes),
      })),
  })).filter((grupo) => grupo.partes.length > 0);
}

/** La parte marcada como cliente del estudio, si hay alguna cargada. */
export function clienteDeLaNomina(partes: ReadonlyArray<Parte>): Parte | undefined {
  return partes.find((parte) => parte.esCliente);
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
