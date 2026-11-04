import { normalizarParaBuscar } from "@/lib/formato/texto";
import {
  CARACTERES_PARTE,
  etiquetaDe,
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

export type LadoParte = "actora" | "demandada" | "citada" | "terceros" | "auxiliares";

/**
 * Las dos **áreas** de la pestaña: las partes del pleito de un lado, los
 * auxiliares del juzgado del otro.
 *
 * El lado contesta "¿con quién o contra quién?" y el área contesta "¿esto es
 * el juicio o es lo que lo rodea?". Son dos cortes distintos y los dos se
 * usan: el área reparte la pantalla en dos columnas y el lado encabeza cada
 * grupo adentro de la suya.
 */
export type AreaParte = "principal" | "secundaria";

/**
 * Los cinco lados, con los roles que caen en cada uno.
 *
 * **Los cuatro primeros son el pleito** y van uno debajo del otro en la
 * columna ancha, en el orden en que entran a la causa: primero quien reclama,
 * después contra quién, después la citada en garantía que el demandado trae
 * para que responda por él, y al final los terceros. Los cuatro litigan, y por
 * eso están juntos: lo que se lee ahí es *contra quién va este juicio*.
 *
 * La citada en garantía y los terceros tienen **lado propio** y no cuelgan de
 * la demandada. Aunque la citada venga del lado del demandado, no es él: tiene
 * su propia póliza, su propio letrado y su propia contestación, y el tercero
 * menos todavía. Meterlos adentro de "parte demandada" obligaba a leer el rol
 * de cada tarjeta para saber cuál era cuál, que es justo lo que los lados
 * vinieron a evitar.
 *
 * **Debajo del pleito quedan los auxiliares del juzgado**: el síndico, el
 * perito, la mediadora y cualquier otro que intervenga sin litigar.
 *
 * **Cada lado tiene su color** (`color`): el del círculo que va adelante del
 * nombre de cada parte en la nómina, y el que la va a identificar en la
 * historia del expediente, para ver de un vistazo de qué lado viene cada
 * escrito. Es un color por lado y no por persona, a pedido del abogado: lo que
 * se quiere ver en la historia es si lo presentó la actora o la demandada, no
 * cuál de los tres actores. Azul la actora y naranja la demandada, que son los
 * dos que más se cruzan y tienen que distinguirse sin pensar; violeta la
 * citada, amarillo los terceros y gris los auxiliares, que no litigan.
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
  /** El color del lado, para el círculo de cada parte. */
  color: string;
}> = [
  {
    lado: "actora",
    etiqueta: "Parte actora",
    area: "principal",
    roles: ["actor"],
    color: "#3b82f6",
  },
  {
    lado: "demandada",
    etiqueta: "Parte demandada",
    area: "principal",
    roles: ["demandado"],
    color: "#f97316",
  },
  {
    lado: "citada",
    etiqueta: "Citada en garantía",
    area: "principal",
    roles: ["citado_garantia"],
    color: "#8b5cf6",
  },
  {
    lado: "terceros",
    etiqueta: "Terceros",
    area: "principal",
    roles: ["tercero"],
    color: "#eab308",
  },
  {
    lado: "auxiliares",
    etiqueta: "Auxiliares",
    area: "secundaria",
    roles: ["sindico", "perito", "mediador", "otro"],
    color: "#71717a",
  },
];

/** El color de un lado (`LADOS_PARTE`). */
export function colorDeLado(lado: LadoParte): string {
  return LADOS_PARTE.find((grupo) => grupo.lado === lado)?.color ?? "#71717a";
}

/**
 * El color con el que se identifica a una parte: el de su lado. **El letrado
 * lleva el de su representado**, porque el escrito que firma el abogado de
 * Rogel es un escrito de la actora; es lo que va a necesitar la historia, que
 * tiene escritos firmados por letrados y no por partes.
 */
export function colorDeParte(parte: Parte, partes: ReadonlyArray<Parte>): string {
  const representado = parte.representaA
    ? partes.find((candidata) => candidata.id === parte.representaA)
    : undefined;
  return colorDeLado(ladoDeRol((representado ?? parte).rol));
}

/** Las dos áreas con su título, en el orden en que se leen. */
export const AREAS_PARTE: ReadonlyArray<{ area: AreaParte; etiqueta: string }> = [
  // El área del pleito no lleva título: cada lado adentro ya dice qué es
  // —"parte actora", "parte demandada"— y un "EL PLEITO" arriba de todos
  // ellos era un renglón que no agregaba nada. Los auxiliares sí lo llevan,
  // porque su único lado se llama igual que el área y el rótulo está oculto.
  { area: "principal", etiqueta: "" },
  { area: "secundaria", etiqueta: "Auxiliares del juzgado" },
];

/**
 * Roles a los que el juicio les notifica, y que por lo tanto necesitan tener
 * cargada la casilla del SAE.
 *
 * Quedan afuera el perito y el mediador: al perito lo notifica el juzgado por
 * su propio canal y el mediador ya terminó su intervención cuando el
 * expediente llega al juzgado, así que reclamarles la casilla sería un aviso
 * que el abogado no puede ni necesita resolver.
 *
 * Hoy **ninguna pantalla lo usa**: la tarjeta dejó de reclamar la casilla en su
 * frente (§2.14), porque en un expediente recién cargado faltaba en casi todas
 * y el ámbar que aparece en todas partes deja de avisar. La regla se queda acá
 * porque es de a quién se notifica y no de cómo se dibuja una tarjeta: es la
 * que va a decidir a quién hay que librar cédula cuando eso se construya.
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

/** Una parte con los letrados que la representan y a quién sucede. */
export interface ParteConRepresentantes {
  parte: Parte;
  representantes: Parte[];
  /** La parte fallecida cuya posición continúa, si está cargada en la nómina. */
  sucedido?: Parte;
}

export interface GrupoPartes {
  lado: LadoParte;
  etiqueta: string;
  area: AreaParte;
  partes: ParteConRepresentantes[];
}

/**
 * El nombre como se lo lee **en la nómina**: el apellido primero y el nombre
 * después —"Rogel Nicolás"—, que es como se lo busca con la vista en una
 * columna. **Sin coma en el medio**: en un renglón de la nómina la coma no
 * aclaraba nada y ensuciaba la columna, y el apellido ya se distingue por ir
 * primero.
 *
 * Sin apellido se devuelve el nombre tal cual: una persona jurídica o un
 * organismo no tienen apellido que adelantar ("Swiss Medical ART"), y una
 * parte cargada antes de que el apellido fuera un campo propio no se parte a
 * ojo, porque no hay regla que diga dónde termina el nombre de "María de los
 * Ángeles Pérez Lobo".
 */
export function nombreDeNomina(parte: Pick<Parte, "nombre" | "apellido">): string {
  const apellido = parte.apellido?.trim() ?? "";
  const nombre = parte.nombre.trim();
  if (!apellido) return nombre;
  return nombre ? `${apellido} ${nombre}` : apellido;
}

/**
 * El nombre **en el orden en que se dice**: "Nicolás Rogel". Es el que va en
 * una frase —"heredero de Rosa Díaz", "Quitar a Nicolás Rogel de la nómina"—,
 * donde el apellido adelante se leería como una lista y no como una persona.
 */
export function nombreCompleto(parte: Pick<Parte, "nombre" | "apellido">): string {
  return [parte.nombre.trim(), parte.apellido?.trim() ?? ""].filter(Boolean).join(" ");
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
    // Alfabético por apellido, que es como se lee la nómina (`nombreDeNomina`).
    nombreDeNomina(a).localeCompare(nombreDeNomina(b), "es")
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
        // La parte a la que sucede se resuelve acá y no en la pantalla, igual
        // que los representantes: es otra referencia dentro de la misma nómina
        // y se cae de la misma manera si apunta a alguien que ya no está.
        sucedido: parte.sucedeA ? porId.get(parte.sucedeA) : undefined,
      })),
  })).filter((grupo) => grupo.partes.length > 0);
}

/*
 * Los dos datos que la tarjeta de una parte muestra antes de abrirla
 * (docs/02-expedientes.md §2.14): quién es su abogado hoy y si compareció. Son
 * las dos preguntas que se hacen de un vistazo sobre una nómina, y las dos
 * salen de acá y no de la pantalla, porque las dos tienen una regla atrás.
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
 * Roles que **litigan con letrado**, y a los que por lo tanto la tarjeta puede
 * reclamarles el que falta.
 *
 * No son los mismos que comparecen. El síndico del concurso y el administrador
 * de la sucesión se presentan en el juicio —comparecen— pero actúan por su
 * cargo y no con un patrocinio: ponerles "sin letrado" es inventarles un dato
 * faltante que nunca van a tener. Al perito y a la mediadora, menos.
 */
const ROLES_CON_LETRADO: ReadonlyArray<RolParte> = [
  "actor",
  "demandado",
  "citado_garantia",
  "tercero",
];

/** Si a esa parte la nómina le puede reclamar el letrado que falta. */
export function llevaLetrado(rol: RolParte): boolean {
  return ROLES_CON_LETRADO.includes(rol);
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
 * El **rótulo del rol**, pero solo cuando la sección del tablero no lo dice ya.
 *
 * Cada lado del pleito agrupa un solo rol, así que escribir "ACTOR" arriba de
 * un nombre que está debajo del título "Parte actora" es decir dos veces lo
 * mismo, y en una tarjeta que es un ícono con dos renglones eso se nota. Donde
 * sí hace falta es en los auxiliares, que meten cuatro roles bajo un solo
 * título: ahí la tarjeta tiene que decir si es el perito, la mediadora o el
 * síndico. Un rol que no cae en ningún lado —el letrado que quedó sin
 * representado— también lo dice, porque va a parar a esa misma columna.
 */
export function rotuloDeRol(rol: RolParte): string {
  const lado = LADOS_PARTE.find((grupo) => grupo.roles.includes(rol));
  if (lado && lado.roles.length < 2) return "";
  return etiquetaDe(ROLES_PARTE, rol);
}

/**
 * La **aclaración del carácter** que va al pie de la tarjeta, debajo del
 * abogado y de la comparecencia, o cadena vacía si no hay nada que aclarar.
 *
 * El rol no entra acá: lo dice la sección. Lo que entra es el carácter cuando
 * cambia el lugar que la parte ocupa, y de las tres maneras que decide el
 * catálogo con `enElLugar` (`lib/datos/tipos`):
 *
 * - **Sucede**: "heredero de Rosa Díaz" cuando la parte fallecida está cargada
 *   y vinculada, y "heredero" a secas cuando no. Las dos son ciertas y dicen
 *   cosas distintas: el primero comparece porque murió una parte del juicio;
 *   el segundo es el heredero que promueve un sucesorio, que no sucede a nadie
 *   en el expediente.
 * - **Califica**: "menor", que es cómo hay que tratar a esa parte.
 * - **Reemplaza**: "Defensoría Oficial".
 *
 * Los demás caracteres no entran —"persona jurídica" dice de qué clase de
 * persona se trata y "citado coactivamente" cómo llegó al juicio, y ninguno
 * cambia con quién se litiga— y quedan adentro de la ficha, con su
 * particularidad, que es donde se los va a buscar.
 */
export function aclaracionDe(parte: Parte, sucedido?: Parte): string {
  const caracter = CARACTERES_PARTE.find((candidato) => candidato.valor === caracterDe(parte));
  if (!caracter?.enElLugar) return "";

  const palabra = caracter.palabraEnElLugar ?? caracter.etiqueta;
  if (caracter.enElLugar !== "sucede") return palabra;
  return sucedido ? `${palabra} de ${nombreCompleto(sucedido)}` : palabra;
}

/**
 * El nombre de un letrado partido en los **dos renglones** con que se lee una
 * Defensoría: el organismo arriba y cuál es debajo.
 *
 * "Defensoría Oficial Civil de Concepción" en un solo renglón angosto se
 * corta en "Defensoría Oficial Civ…", que es justo donde empieza lo
 * que distingue a una defensoría de otra. Partido, los dos pedazos entran. El
 * prefijo se saca del nombre si está escrito, así que da igual cargarla como
 * "Defensoría Oficial Civil de Concepción" o como "Civil de Concepción".
 */
export function renglonesDeLetrado(letrado: Parte): { nombre: string; debajo: string } {
  if (caracterDe(letrado) !== "defensoria_oficial") {
    return { nombre: nombreDeNomina(letrado), debajo: "" };
  }
  const cual = letrado.nombre.replace(/^\s*defensor[íi]a(\s+oficial)?\s*/i, "").trim();
  return { nombre: "Defensoría Oficial", debajo: cual };
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
 * De qué lado del pleito está el estudio.
 *
 * Hoy **ninguna pantalla lo usa**, igual que `seNotifica`: lo pedía el filete
 * del borde de la tarjeta para teñirlo, y después el color del ícono, y los dos
 * se fueron cuando los íconos pasaron a ser todos iguales (§2.14). La regla se
 * queda acá porque es de dónde está parado el estudio y no de cómo se dibuja
 * una tarjeta: es la que va a contestar de nuevo "quién es de los míos" cuando
 * se decida dónde vuelve a verse.
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
  if (expediente.rolCliente === "tercero") return "terceros";
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
    // La carátula puede nombrar a la persona en cualquiera de los dos órdenes
    // —"Nicolás Rogel" o "Rogel Nicolás"— y la nómina la guarda partida en
    // nombre y apellido, así que se la busca de las dos maneras.
    return !partes.some((parte) =>
      [nombreCompleto(parte), `${parte.apellido ?? ""} ${parte.nombre}`].some(
        (forma) => normalizarParaBuscar(forma) === buscado,
      ),
    );
  });
}
