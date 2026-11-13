/**
 * Tipos de la configuración del abogado y de los expedientes.
 *
 * Son el reflejo en TypeScript de las tablas de docs/06-modelo-de-datos.md:
 * `process_templates` + `process_template_stages` (acá `TipoProceso` con sus
 * `etapas`), `agents` (`Agente`), `cases` (`Expediente`) y `profiles`
 * (`Estudio`). Cuando se monte Supabase, estos tipos se reemplazan por los
 * generados desde el esquema y el resto de la aplicación no cambia.
 *
 * Se guardan solo los campos que la aplicación ya usa; el resto del modelo
 * (partes, historia, documentos, plazos) llega en las fases siguientes del
 * roadmap.
 */

/** Las filas de ejemplo que trae el sistema se pueden editar o borrar. */
export type Origen = "ejemplo" | "propio";

/** Una etapa de un tipo de proceso: `process_template_stages`. */
export interface EtapaProceso {
  /** Clave estable, generada desde el nombre: "audiencia_preliminar". */
  clave: string;
  nombre: string;
  orden: number;
}

/**
 * Tipo de proceso con sus etapas: la plantilla que configura el
 * comportamiento del expediente (ordinario, sumario, expropiación, etc.).
 */
export interface TipoProceso {
  id: string;
  clave: string;
  nombre: string;
  descripcion: string;
  /** Materias en las que suele usarse. */
  materias: string[];
  etapas: EtapaProceso[];
  activo: boolean;
  origen: Origen;
  creadoEn: string;
  actualizadoEn: string;
}

/** Qué hace el agente y cómo se comporta (docs/03-ia-agentes.md §1). */
export type RolAgente =
  | "procesalista"
  | "analista"
  | "redactor"
  | "especialista"
  | "investigador";

/** "Solo fuentes" es el modo por defecto: dominio cerrado. */
export type ModoConocimiento = "solo_fuentes" | "general";

/** Agente especializado configurado por el abogado: `agents`. */
export interface Agente {
  id: string;
  nombre: string;
  descripcion: string;
  rol: RolAgente;
  /** Rama del derecho: "Civil y Comercial", "Laboral", "Familia", "Penal". */
  rama: string;
  especialidades: string[];
  /** Tipos de proceso en los que actúa. Vacío significa "todos". */
  tiposProcesoIds: string[];
  /** Instrucciones de sistema del agente. */
  instrucciones: string;
  /** Guías de comportamiento libres del abogado. */
  guiasComportamiento: string;
  modoConocimiento: ModoConocimiento;
  /** Identificador `proveedor/modelo` del AI Gateway. */
  modelo: string;
  activo: boolean;
  origen: Origen;
  creadoEn: string;
  actualizadoEn: string;
}

export type CentroJudicial = "capital" | "concepcion" | "monteros";

export type EstadoExpediente =
  | "en_mediacion"
  | "en_tramite"
  | "suspendido"
  | "con_sentencia"
  | "en_ejecucion"
  | "archivado"
  | "paralizado";

export type RolCliente = "actor" | "demandado" | "tercero" | "heredero" | "acreedor" | "otro";

/**
 * Principal o incidente.
 *
 * No es una distinción decorativa: el plazo de caducidad de instancia es de
 * seis meses en el principal y de tres en los incidentes
 * (docs/02-expedientes.md §2.11).
 */
export type ClaseExpediente = "principal" | "incidente";

/** Expediente: `cases`. */
export interface Expediente {
  id: string;
  numero: string;
  /** Año de dos dígitos, como en el SAE: "26". */
  anio: string;
  /** Carátula formateada y lista para mostrar. */
  caratula: string;
  /** Componentes de la carátula, para poder rearmarla y buscar por parte. */
  actor: string;
  demandado: string;
  objeto: string;
  tipoProcesoId: string;
  /** Clave de la etapa actual dentro del tipo de proceso. */
  etapaActual: string;
  etapaDesde: string;
  centroJudicial: CentroJudicial;
  fuero: string;
  materia: string;
  rolCliente: RolCliente;
  estado: EstadoExpediente;
  notas: string;
  creadoEn: string;
  actualizadoEn: string;

  /*
   * Campos agregados después de la primera versión del almacén. Son
   * opcionales porque los expedientes que ya estaban guardados no los tienen,
   * igual que una columna que se agrega a una tabla con filas: el código que
   * los lee resuelve el valor faltante (`lib/procesal`, `nombreJuzgado`).
   */

  /**
   * Radicación. Tipo de juzgado ("Civil y Comercial Común") y su nominación
   * ("VI"), más la Oficina de Gestión Asociada que lo atiende. Cuando exista
   * el catálogo de juzgados y secretarías de Configuración (`courts` en
   * docs/06-modelo-de-datos.md), estos tres campos pasan a ser una referencia.
   */
  juzgadoTipo?: string;
  juzgadoNumero?: string;
  /** Oficina de Gestión Asociada (OGA) del juzgado. */
  oficinaGestion?: string;

  /** Principal o incidente. Si falta, se asume principal. */
  clase?: ClaseExpediente;
  /**
   * Fecha del último movimiento útil del expediente, de la que se cuenta la
   * caducidad de instancia. Hoy se carga a mano; cuando exista la historia del
   * expediente la va a escribir la última entrada (docs/02-expedientes.md §2.3).
   */
  ultimoMovimiento?: string;
  /** Fecha en que el juzgado declaró la caducidad. Vacío si no se declaró. */
  caducidadDeclarada?: string;

  /** Audiencia fijada: tipo, fecha y hora. Vacío si no hay ninguna fijada. */
  audienciaTipo?: string;
  audienciaFecha?: string;
  audienciaHora?: string;

  /**
   * Fechas clave de la causa (docs/02-expedientes.md §2.1). Vacías si no se
   * cargaron. No mueven nada por sí solas —el último movimiento y la etapa
   * tienen sus propios campos—: son mojones que el abogado quiere tener a mano.
   */
  fechaMediacion?: string;
  fechaDemanda?: string;
  fechaRadicacion?: string;
  fechaSentencia?: string;
  fechaFirmeza?: string;

  /**
   * Monto del juicio **en centavos**, como los importes de la contabilidad
   * (`lib/contabilidad/importe`). Sin monto, `montoCentavos` falta y los otros
   * tres no significan nada.
   */
  montoCentavos?: number;
  /** Qué es el monto: lo que se reclama o la base para regular honorarios. */
  montoConcepto?: ConceptoMonto;
  moneda?: Moneda;
  /** A qué fecha está expresado el monto: un peso de 2026 no vale lo que uno de 2029. */
  montoFecha?: string;

  /** Etiquetas libres del abogado para agrupar expedientes. */
  etiquetas?: string[];

  /**
   * Cuándo se mandó a la papelera. Vacío o ausente si está vigente. Es la baja
   * lógica de `deleted_at` (docs/06-modelo-de-datos.md): un expediente en la
   * papelera no aparece en los listados pero conserva su historia, sus partes y
   * su contabilidad, y se puede restaurar.
   */
  enPapeleraDesde?: string;
}

export type ConceptoMonto = "reclamado" | "base_regulatoria";
export type Moneda = "ARS" | "USD";

export const CONCEPTOS_MONTO: ReadonlyArray<{ valor: ConceptoMonto; etiqueta: string }> = [
  { valor: "reclamado", etiqueta: "Monto reclamado" },
  { valor: "base_regulatoria", etiqueta: "Base regulatoria" },
];

export const MONEDAS: ReadonlyArray<{ valor: Moneda; etiqueta: string; simbolo: string }> = [
  { valor: "ARS", etiqueta: "Pesos", simbolo: "$" },
  { valor: "USD", etiqueta: "Dólares", simbolo: "US$" },
];

/**
 * Las fechas clave en el orden en que ocurren en un juicio. El formulario y la
 * ficha las recorren con esta lista, así que agregar una es agregar un renglón.
 */
export const FECHAS_CLAVE: ReadonlyArray<{
  campo: "fechaMediacion" | "fechaDemanda" | "fechaRadicacion" | "fechaSentencia" | "fechaFirmeza";
  etiqueta: string;
}> = [
  { campo: "fechaMediacion", etiqueta: "Inicio de mediación" },
  { campo: "fechaDemanda", etiqueta: "Demanda" },
  { campo: "fechaRadicacion", etiqueta: "Radicación" },
  { campo: "fechaSentencia", etiqueta: "Sentencia" },
  { campo: "fechaFirmeza", etiqueta: "Firmeza" },
];

/** Datos del estudio y preferencias: `profiles`. */
export interface Estudio {
  nombre: string;
  matricula: string;
  cuit: string;
  domicilioElectronico: string;
  telefono: string;
  centroJudicialHabitual: CentroJudicial;
  /** Modelo por defecto para los agentes nuevos. */
  modeloPorDefecto: string;
  /**
   * Si el normalizador corrige las tildes faltantes con su diccionario
   * ("NICOLAS" → "Nicolás"). El resto de la normalización (mayúsculas,
   * espacios, signos) se aplica siempre porque no admite ambigüedad.
   */
  correccionDeTildes: boolean;
  /**
   * Con qué forma salen los escritos. Opcional porque se agregó después de la
   * primera versión del almacén: quien lo lee resuelve el valor faltante con
   * `FORMATO_ESCRITO`.
   */
  formatoEscrito?: FormatoEscrito;
  actualizadoEn: string;
}

/** Contenido completo del almacén. */
export interface Datos {
  estudio: Estudio;
  tiposProceso: TipoProceso[];
  agentes: Agente[];
  expedientes: Expediente[];
  /**
   * Contabilidad de los expedientes. Opcional porque se agregó después de la
   * primera versión del almacén: los archivos ya guardados no la tienen, igual
   * que los campos opcionales de `Expediente`. Quien la lee resuelve el valor
   * faltante con una lista vacía.
   */
  gastos?: Gasto[];
  /** Nómina de partes de los expedientes. Opcional por lo mismo que los gastos. */
  partes?: Parte[];
  /** Historia de los expedientes. Opcional por lo mismo que los gastos. */
  historia?: EntradaHistoria[];
}

export const CENTROS_JUDICIALES: ReadonlyArray<{ valor: CentroJudicial; etiqueta: string }> = [
  { valor: "capital", etiqueta: "Capital" },
  { valor: "concepcion", etiqueta: "Concepción" },
  { valor: "monteros", etiqueta: "Monteros" },
];

/** Denominaciones de los fueros **[a confirmar]** (docs/08-roadmap.md, punto 9). */
export const FUEROS: ReadonlyArray<string> = [
  "Civil y Comercial Común",
  "Civil en Documentos y Locaciones",
  "Cobros y Apremios",
  "Familia y Sucesiones",
  "Paz",
];

export const CLASES_EXPEDIENTE: ReadonlyArray<{
  valor: ClaseExpediente;
  etiqueta: string;
  detalle: string;
}> = [
  { valor: "principal", etiqueta: "Principal", detalle: "La caducidad corre a los seis meses." },
  { valor: "incidente", etiqueta: "Incidente", detalle: "La caducidad corre a los tres meses." },
];

/**
 * Audiencias que se fijan en el fuero Civil y Comercial. Se ofrecen como
 * sugerencia en un campo libre: el nombre lo pone el juzgado y el abogado
 * puede escribir cualquiera.
 */
export const TIPOS_AUDIENCIA: ReadonlyArray<string> = [
  "Audiencia Preliminar",
  "Audiencia de Vista de Causa",
  "Audiencia de Mediación",
  "Audiencia de Conciliación",
  "Audiencia Testimonial",
  "Audiencia de Absolución de Posiciones",
];

export const ESTADOS_EXPEDIENTE: ReadonlyArray<{ valor: EstadoExpediente; etiqueta: string }> = [
  { valor: "en_mediacion", etiqueta: "En mediación" },
  { valor: "en_tramite", etiqueta: "En trámite" },
  { valor: "suspendido", etiqueta: "Suspendido" },
  { valor: "con_sentencia", etiqueta: "Con sentencia" },
  { valor: "en_ejecucion", etiqueta: "En ejecución" },
  { valor: "archivado", etiqueta: "Archivado" },
  { valor: "paralizado", etiqueta: "Paralizado" },
];

export const ROLES_CLIENTE: ReadonlyArray<{ valor: RolCliente; etiqueta: string }> = [
  { valor: "actor", etiqueta: "Actor" },
  { valor: "demandado", etiqueta: "Demandado" },
  { valor: "tercero", etiqueta: "Tercero" },
  { valor: "heredero", etiqueta: "Heredero" },
  { valor: "acreedor", etiqueta: "Acreedor" },
  { valor: "otro", etiqueta: "Otro" },
];

export const ROLES_AGENTE: ReadonlyArray<{ valor: RolAgente; etiqueta: string }> = [
  { valor: "procesalista", etiqueta: "Procesalista" },
  { valor: "analista", etiqueta: "Analista de expediente" },
  { valor: "redactor", etiqueta: "Redactor de escritos" },
  { valor: "especialista", etiqueta: "Especialista en una materia" },
  { valor: "investigador", etiqueta: "Investigador de jurisprudencia" },
];

export const MODOS_CONOCIMIENTO: ReadonlyArray<{
  valor: ModoConocimiento;
  etiqueta: string;
  detalle: string;
}> = [
  {
    valor: "solo_fuentes",
    etiqueta: "Solo fuentes",
    detalle: "Dominio cerrado: responde únicamente con lo que está en sus fuentes y en la historia del expediente.",
  },
  {
    valor: "general",
    etiqueta: "Conocimiento general",
    detalle: "Permite usar el conocimiento del modelo. Cada respuesta lleva un aviso visible.",
  },
];

/** Modelos ofrecidos por el AI Gateway con el formato `proveedor/modelo`. */
export const MODELOS: ReadonlyArray<{ valor: string; etiqueta: string }> = [
  { valor: "anthropic/claude-opus-5", etiqueta: "Claude Opus 5 — análisis y redacción" },
  { valor: "anthropic/claude-sonnet-5", etiqueta: "Claude Sonnet 5 — equilibrado" },
  { valor: "anthropic/claude-haiku-4-5", etiqueta: "Claude Haiku 4.5 — clasificación y resúmenes" },
];

/** Etiqueta legible de un estado del expediente. */
export function etiquetaEstado(estado: EstadoExpediente | string): string {
  return ESTADOS_EXPEDIENTE.find((candidato) => candidato.valor === estado)?.etiqueta ?? estado;
}

/**
 * Etiqueta legible de un valor de cualquiera de las listas de arriba
 * (centros judiciales, estados, roles, clases). Es la generalización de
 * `etiquetaEstado`, para las fichas que muestran varias de esas listas.
 */
export function etiquetaDe(
  lista: ReadonlyArray<{ valor: string; etiqueta: string }>,
  valor: string,
): string {
  return lista.find((candidato) => candidato.valor === valor)?.etiqueta ?? valor;
}

/*
 * Contabilidad del expediente: `fees_expenses` en docs/06-modelo-de-datos.md,
 * descrita en docs/01-agenda.md §2.6 y docs/02-expedientes.md §2.12.
 *
 * Se guarda en una lista propia y no dentro del expediente, igual que la tabla
 * del modelo lleva `case_id`: así se puede recorrer la contabilidad de todo el
 * estudio —que es lo que necesita el promedio por materia— sin abrir cada
 * expediente.
 */

/**
 * Qué es la partida. Los honorarios viajan en la misma lista que los gastos
 * porque la pregunta que contesta la pestaña —cuánto sale el juicio— los suma
 * a los dos; el `tipo` es lo que después permite separarlos, porque para el
 * abogado son ingreso y para el cliente, costo.
 */
export type TipoGasto = "gasto" | "honorario_pactado" | "honorario_regulado";

/**
 * Concepto, de un catálogo cerrado y no de texto libre: es la columna por la
 * que se va a promediar para estimar cuánto sale un juicio de una materia
 * (docs/02-expedientes.md §2.12), y dos formas de escribir "tasa de justicia"
 * serían dos conceptos distintos.
 *
 * Las denominaciones de los bonos y aportes están **[a confirmar]** contra lo
 * que cobran hoy el Colegio y la Caja (docs/08-roadmap.md, punto 8).
 */
export type ConceptoGasto =
  | "tasa_justicia"
  | "aportes_caja"
  | "bono"
  | "mediacion"
  | "pericia"
  | "notificaciones"
  | "edictos"
  | "informes"
  | "movilidad"
  | "sellados"
  | "honorarios"
  | "otro";

/**
 * En qué situación está la partida. `previsto` es la que hace posible el
 * estimativo: un gasto que todavía no se pagó pero que el juicio va a tener.
 * `pagado_estudio` es el "a rendir al cliente" de docs/01-agenda.md §2.6.
 */
export type EstadoGasto = "previsto" | "pagado_estudio" | "rendido" | "pagado_cliente";

/** Una partida de la contabilidad de un expediente. */
export interface Gasto {
  id: string;
  expedienteId: string;
  tipo: TipoGasto;
  concepto: ConceptoGasto;
  /** Qué fue: "Anticipo de gastos del perito médico". */
  detalle: string;
  /**
   * Importe **en centavos**, entero. Guardar pesos con decimales haría que la
   * suma de veinte partidas arrastre error de punto flotante, y acá el total
   * es justamente lo que se le informa al cliente.
   */
  importe: number;
  /**
   * Moneda del importe. Hoy siempre "ARS" y sin selector en pantalla; el campo
   * existe porque la tabla del modelo lo tiene y porque un juicio con una
   * pericia en dólares va a necesitarlo.
   */
  moneda: string;
  /** Fecha del comprobante, o la prevista si todavía no se pagó. */
  fecha: string;
  estado: EstadoGasto;
  creadoEn: string;
  actualizadoEn: string;
}

export const TIPOS_GASTO: ReadonlyArray<{ valor: TipoGasto; etiqueta: string }> = [
  { valor: "gasto", etiqueta: "Gasto" },
  { valor: "honorario_pactado", etiqueta: "Honorario pactado" },
  { valor: "honorario_regulado", etiqueta: "Honorario regulado" },
];

export const CONCEPTOS_GASTO: ReadonlyArray<{ valor: ConceptoGasto; etiqueta: string }> = [
  { valor: "tasa_justicia", etiqueta: "Tasa de justicia" },
  { valor: "aportes_caja", etiqueta: "Aportes a la Caja de Previsión" },
  { valor: "bono", etiqueta: "Bono de movilidad" },
  { valor: "mediacion", etiqueta: "Mediación: arancel y honorarios" },
  { valor: "pericia", etiqueta: "Pericia: anticipo y honorarios del perito" },
  { valor: "notificaciones", etiqueta: "Cédulas, oficios y notificaciones" },
  { valor: "edictos", etiqueta: "Edictos y publicaciones" },
  { valor: "informes", etiqueta: "Informes y certificados" },
  { valor: "movilidad", etiqueta: "Movilidad y viáticos" },
  { valor: "sellados", etiqueta: "Sellados y fotocopias" },
  { valor: "honorarios", etiqueta: "Honorarios del abogado" },
  { valor: "otro", etiqueta: "Otro" },
];

export const ESTADOS_GASTO: ReadonlyArray<{
  valor: EstadoGasto;
  etiqueta: string;
  detalle: string;
}> = [
  {
    valor: "previsto",
    etiqueta: "Previsto",
    detalle: "Todavía no se pagó. Es la parte estimada de lo que va a salir el juicio.",
  },
  {
    valor: "pagado_estudio",
    etiqueta: "Pagado por el estudio",
    detalle: "Lo adelantó el estudio y está pendiente de rendición al cliente.",
  },
  { valor: "rendido", etiqueta: "Rendido", detalle: "El cliente ya le reintegró al estudio." },
  {
    valor: "pagado_cliente",
    etiqueta: "Pagado por el cliente",
    detalle: "Lo pagó el cliente directamente; el estudio no puso dinero.",
  },
];

/*
 * Partes del expediente: `case_parties` en docs/06-modelo-de-datos.md, descrita
 * en docs/02-expedientes.md §2.14.
 *
 * En el modelo, la parte es el cruce entre el expediente y un **contacto**:
 * `case_parties` guarda el rol y a quién representa, y los datos de la persona
 * —documento, domicilios, teléfono— viven en `contacts`, que se comparte entre
 * expedientes. Mientras no exista esa agenda de contactos, la parte guarda esos
 * datos adentro, igual que el expediente guarda hoy el juzgado en sus propias
 * columnas hasta que exista `courts`. La migración es la misma: un `contacts`
 * por cada nombre distinto y acá queda la referencia.
 */

/**
 * Qué es esa persona en el juicio. Es la lista de `case_parties.rol`.
 *
 * `citado_garantia` es la aseguradora traída al pleito por el demandado, y
 * `letrado_contraria` el abogado de cualquiera de las partes: no son partes en
 * sentido estricto pero son con quienes se litiga, así que van en la misma
 * nómina.
 *
 * La clave `letrado_contraria` quedó con el nombre que tenía cuando la nómina
 * solo registraba al abogado de enfrente. Hoy el rol es **el letrado de quien
 * sea** —el de la contraria, el que un codemandado trajo después, la Defensoría
 * Oficial que asiste a un menor—, y así lo dice su etiqueta; la clave no se
 * renombra porque está escrita en los almacenes ya guardados y renombrarla
 * dejaría a esos letrados como "otro".
 */
export type RolParte =
  | "actor"
  | "demandado"
  | "tercero"
  | "citado_garantia"
  | "sindico"
  | "perito"
  | "letrado_contraria"
  | "mediador"
  | "otro";

/**
 * **Con qué carácter** interviene esa persona en el juicio.
 *
 * El rol dice *qué lugar ocupa* en la causa —actor, demandado, tercero—; el
 * carácter dice *cómo está parada ahí*, que es otra pregunta y la que cambia el
 * trámite: un actor por derecho propio y el heredero de ese mismo actor ocupan
 * el mismo lugar y no se litiga igual con los dos.
 *
 * Es un catálogo cerrado y no texto libre por la misma razón que los conceptos
 * de la contabilidad: cada carácter arrastra una **particularidad procesal**
 * —a quién hay que notificar además, qué hay que acreditar, quién más
 * interviene— y eso solo se puede escribir una vez si el valor es uno solo.
 *
 * `por_si` es el caso normal y por eso es el valor por defecto: la parte actúa
 * por derecho propio y no hay nada que advertir. Las fichas no lo muestran,
 * igual que no muestran los datos vacíos.
 */
export type CaracterParte =
  | "por_si"
  | "heredero"
  | "sucesion"
  | "menor"
  | "capacidad_restringida"
  | "defensoria_oficial"
  | "persona_juridica"
  | "organismo_estatal"
  | "citado_coactivo"
  | "citado_voluntario"
  | "litisconsorte"
  | "causante"
  | "acreedor"
  | "apoderado_civil"
  | "cesionario"
  | "curador"
  | "desistido"
  | "fallido"
  | "excluido"
  | "patrocinante"
  | "apoderado"
  | "otro";

/**
 * Si la parte se presentó en el juicio.
 *
 * Es el otro dato que se mira antes de abrir la ficha: con quién hay que
 * contar. Una demandada que no compareció no recibe traslados en su casilla
 * —todavía no la constituyó—, y una declarada rebelde cambia el trámite
 * entero.
 *
 * `no_corresponde` no es "no sabemos": es que la pregunta no se le hace a ese
 * rol. El perito no comparece, lo designa el juzgado; el letrado tampoco, es el
 * que hace comparecer a su representado.
 */
/**
 * Si la persona es mujer o varón, para nombrarla bien: "abogada" o "abogado".
 * Vacío mientras no se cargó, y entonces se usa el masculino, que es el
 * genérico de los escritos.
 */
export type Genero = "femenino" | "masculino";

export const GENEROS: ReadonlyArray<{ valor: Genero; etiqueta: string }> = [
  { valor: "femenino", etiqueta: "Femenino" },
  { valor: "masculino", etiqueta: "Masculino" },
];

export type Comparecencia =
  | "pendiente"
  | "comparecio"
  | "incontestada"
  | "rebelde"
  | "no_corresponde";

/** Una parte del expediente. */
export interface Parte {
  id: string;
  expedienteId: string;
  rol: RolParte;
  /**
   * El nombre de pila de una persona humana, o la razón social o la
   * denominación completa de una persona jurídica o un organismo, que no tienen
   * apellido.
   */
  nombre: string;
  /** DNI o CUIT, como lo escribe el abogado. */
  documento: string;
  /** Dónde vive o tiene su sede: el domicilio real del escrito. */
  domicilioReal: string;
  telefono: string;
  email: string;
  /**
   * Id de otra parte del mismo expediente a la que representa: el letrado de
   * la contraria con su representado. Vacío si no representa a nadie.
   */
  representaA: string;
  /**
   * Si esta persona es el cliente del estudio. Es `cases.client_id` del modelo
   * visto desde la parte, y hay una sola por expediente: `rol_cliente` dice de
   * qué lado está el estudio y esto dice quién es exactamente, que no es lo
   * mismo cuando de ese lado hay tres litisconsortes.
   */
  esCliente: boolean;
  notas: string;
  creadoEn: string;
  actualizadoEn: string;

  /*
   * Campos agregados después de la primera versión del almacén, igual que los
   * de `Expediente`: son opcionales porque las partes ya guardadas no los
   * tienen, y quien los lee resuelve el valor faltante (`lib/procesal/partes`).
   */

  /**
   * El apellido de una persona humana, aparte del nombre, porque la nómina se
   * lee **por apellido**: "Rogel Nicolás", como en una carátula o en una lista
   * del juzgado, y se ordena por él. Va en un campo propio y no se adivina
   * partiendo el nombre: "María de los Ángeles Pérez Lobo" no tiene una regla
   * que diga dónde termina un pedazo y empieza el otro, y una razón social no
   * tiene apellido. Vacío en las personas jurídicas, los organismos y las
   * partes cargadas antes de que existiera, que se muestran con el nombre tal
   * cual (`nombreDeNomina` en `lib/procesal/partes`).
   */
  apellido?: string;
  /** Con qué carácter interviene. Si falta, `por_si`. */
  caracter?: CaracterParte;
  /**
   * Si la parte **se representa a sí misma**: es abogada y litiga en causa
   * propia. Entonces la nómina la pone a ella en la columna del abogado, con el
   * carácter "por derecho propio", en lugar de reclamarle un letrado.
   */
  causaPropia?: boolean;
  /** Si se presentó en el juicio. Si falta, lo que corresponda a su rol. */
  comparecencia?: Comparecencia;
  /** Fecha de la presentación. Vacía mientras no haya comparecido. */
  comparecioEl?: string;
  /**
   * Fecha en que el letrado **cesó** en la representación: renuncia, revocación
   * del poder, cambio de abogado. Vacía mientras sigue siendo el letrado
   * actual, que es lo que la nómina muestra en la tarjeta de su representado.
   *
   * El letrado que cesó no se borra: queda en la ficha de la parte como letrado
   * anterior, porque lo que presentó mientras representaba sigue estando en el
   * expediente y es a quien hay que buscar para preguntar por eso.
   */
  cesoEl?: string;
  /**
   * Fecha de **fallecimiento** de la parte. Vacía mientras vive.
   *
   * La parte que muere no se borra de la nómina: su tarjeta se apaga y queda
   * con el nombre y esta fecha, porque todo lo que presentó sigue en el
   * expediente y porque es de quién vienen los herederos que comparecen
   * después. El juicio tampoco sigue igual: hay que suspenderlo y emplazar a
   * los herederos (docs/02-expedientes.md §2.14).
   */
  fallecioEl?: string;
  /**
   * Id de la parte **fallecida cuya posición continúa**: el heredero que
   * comparece en lugar de quien murió.
   *
   * No es lo mismo que `representaA`, que es el letrado con su representado: el
   * heredero no representa al causante, lo sucede. Con esto cargado, la tarjeta
   * del heredero dice de quién hereda —"heredero de Rosa Díaz"— en lugar de
   * decir "heredero" a secas.
   */
  sucedeA?: string;
  /** Femenino o masculino, para decir "abogada" o "abogado" (`Genero`). */
  genero?: Genero;
}

export const ROLES_PARTE: ReadonlyArray<{
  valor: RolParte;
  etiqueta: string;
  detalle: string;
}> = [
  { valor: "actor", etiqueta: "Actor", detalle: "Quien demanda." },
  { valor: "demandado", etiqueta: "Demandado", detalle: "Contra quien se demanda." },
  {
    valor: "citado_garantia",
    etiqueta: "Citado en garantía",
    detalle: "La aseguradora traída al pleito por el demandado.",
  },
  {
    valor: "tercero",
    etiqueta: "Tercero",
    detalle: "Quien interviene sin ser actor ni demandado.",
  },
  {
    valor: "letrado_contraria",
    etiqueta: "Abogado",
    detalle:
      "El abogado de una de las partes, patrocinante o apoderado según su carácter. Se vincula a la parte que representa.",
  },
  { valor: "perito", etiqueta: "Perito", detalle: "Auxiliar designado por el juzgado." },
  { valor: "mediador", etiqueta: "Mediador", detalle: "Quien condujo la mediación." },
  { valor: "sindico", etiqueta: "Síndico", detalle: "En los procesos concursales." },
  { valor: "otro", etiqueta: "Otro", detalle: "Martillero, depositario, interventor." },
];

/**
 * Los caracteres con los que se puede intervenir, con la **particularidad**
 * que cada uno arrastra.
 *
 * `particularidad` es el motivo por el que el catálogo existe: es lo que el
 * abogado necesita recordar de esa parte y que no está en ningún otro campo
 * —a quién más hay que notificar, qué hay que acreditar, quién interviene
 * además—. La ficha de la parte la muestra como aviso cuando el carácter la
 * tiene; `por_si` no la tiene, porque no hay nada que advertir.
 *
 * Los textos están **[a confirmar]** con el abogado (docs/08-roadmap.md): son
 * el recordatorio corto de un trámite, no la cita de la norma.
 */
export const CARACTERES_PARTE: ReadonlyArray<{
  valor: CaracterParte;
  etiqueta: string;
  detalle: string;
  /** Lo que hay que tener presente de esa parte. Vacío si no hay nada. */
  particularidad: string;
  /**
   * Si el carácter **nombra el lugar** que la parte ocupa en el juicio, y por
   * lo tanto se escribe en la cara de su tarjeta junto al rol: "heredero del
   * actor" no es un actor con una aclaración al costado, es otro lugar, y con
   * él se litiga distinto (`lugarDe` en `lib/procesal/partes`).
   *
   * Los demás no entran: "persona jurídica" dice de qué clase de persona se
   * trata y "citado coactivamente" cómo llegó al juicio, pero ninguno cambia
   * con quién se litiga, y en una tarjeta angosta le robaban el renglón al
   * nombre. Siguen adentro de la ficha, en su particularidad, que es donde se
   * los consulta.
   */
  /**
   * Cómo entra el carácter en **el nombre del lugar** que la parte ocupa, que
   * es lo que la tarjeta escribe arriba del nombre (`lugarDe` en
   * `lib/procesal/partes`). Sin valor no entra, y queda adentro de la ficha con
   * su particularidad: "persona jurídica" dice de qué clase de persona se trata
   * y "citado coactivamente" cómo llegó al juicio, pero ninguno cambia con
   * quién se litiga.
   *
   * - `sucede`: **toma el lugar del que lo ocupaba, y lo nombra** —"heredero de
   *   Rosa Díaz"—. Es el carácter de quien comparece porque una parte murió.
   *   Mientras no esté cargada la parte fallecida va solo —"heredero"—, que es
   *   lo que pasa en un sucesorio, donde el heredero promueve y no sucede a
   *   nadie en el juicio.
   * - `califica`: **se suma al rol sin reemplazarlo** —"actor menor"—, cuando
   *   lo que cambia es cómo hay que tratar a esa parte y no qué lugar ocupa.
   * - `reemplaza`: **es el lugar**, y el rol al lado sobra —"Defensoría
   *   Oficial"—.
   */
  enElLugar?: "sucede" | "califica" | "reemplaza";
  /**
   * Con qué palabra entra, cuando la etiqueta entera no sirve: "Menor de edad"
   * es la opción que el formulario necesita para que no se confunda con nada, y
   * "menor" es lo que entra en un renglón de versalitas.
   */
  palabraEnElLugar?: string;
}> = [
  {
    valor: "por_si",
    etiqueta: "Por derecho propio",
    detalle: "El caso normal: la parte actúa por sí misma.",
    particularidad: "",
  },
  {
    valor: "heredero",
    etiqueta: "Heredero",
    detalle: "Continúa la posición de una parte que falleció.",
    particularidad:
      "Hay que acreditar la vocación hereditaria —declaratoria de herederos o testamento aprobado— antes de que se lo tenga por parte.",
    enElLugar: "sucede",
  },
  {
    valor: "sucesion",
    etiqueta: "Sucesión indivisa",
    detalle: "El acervo todavía no partido, no una persona.",
    particularidad:
      "Se la emplaza en la persona del administrador de la sucesión; si no hay administrador designado, a todos los herederos.",
    enElLugar: "sucede",
  },
  {
    valor: "menor",
    etiqueta: "Menor de edad",
    detalle: "Niña, niño o adolescente.",
    particularidad:
      "Actúa por sus representantes legales y con intervención del Ministerio Pupilar, que se notifica aparte. Tiene derecho a ser oído y su opinión se pesa según su edad y madurez.",
    // Sigue siendo el actor: la minoría de edad no cambia el lugar, cambia
    // cómo hay que tratarlo. "Menor de edad" no entra en un renglón de
    // versalitas tan angosto, y "menor" dice lo mismo.
    enElLugar: "califica",
    palabraEnElLugar: "menor",
  },
  {
    valor: "capacidad_restringida",
    etiqueta: "Capacidad restringida",
    detalle: "Persona con apoyos o curador designados por sentencia.",
    particularidad:
      "Actúa con el apoyo o el curador que fijó la sentencia de restricción, y el Ministerio Público interviene en el juicio.",
  },
  {
    valor: "defensoria_oficial",
    etiqueta: "Defensoría Oficial",
    detalle: "Asiste o representa a quien no tiene abogado particular.",
    particularidad:
      "Las notificaciones van a la Defensoría y no al domicilio de la parte. Los plazos se cuentan desde que la Defensoría quedó notificada.",
    // Es el lugar, y el rol al lado sobra: lo que hace falta saber es que
    // interviene la Defensoría y cuál, no que sea "letrado".
    enElLugar: "reemplaza",
  },
  {
    valor: "persona_juridica",
    etiqueta: "Persona jurídica",
    detalle: "Sociedad, asociación, fundación, mutual.",
    particularidad:
      "Comparece por su representante legal o apoderado, que tiene que acreditar personería con el estatuto o el poder.",
  },
  {
    valor: "organismo_estatal",
    etiqueta: "Organismo estatal",
    detalle: "El Estado nacional, provincial o municipal, o un ente suyo.",
    particularidad:
      "Lleva sus propios abogados —Fiscalía de Estado, apoderado del organismo— y tiene formas de emplazamiento y plazos propios.",
  },
  {
    valor: "citado_coactivo",
    etiqueta: "Tercero citado coactivamente",
    detalle: "Lo trajo al pleito una de las partes, no vino por su cuenta.",
    particularidad:
      "La sentencia lo alcanza como si fuera parte. Hay que vigilar que el emplazamiento haya quedado bien notificado.",
  },
  {
    valor: "citado_voluntario",
    etiqueta: "Tercero de intervención voluntaria",
    detalle: "Se presentó por su propio interés en el resultado.",
    particularidad: "Toma la causa en el estado en que la encuentra: no se retrotraen etapas.",
  },
  {
    valor: "litisconsorte",
    etiqueta: "Litisconsorte",
    detalle: "Uno de varios que ocupan el mismo lado.",
    particularidad:
      "Si el litisconsorcio es necesario, los actos del juicio los tienen que alcanzar a todos: no se puede avanzar con uno solo notificado.",
  },
  /*
   * Los caracteres que el abogado pidió sumar para la columna **Carácter** de la
   * nómina. Unos dicen de dónde le viene el lugar (cesionario, acreedor), otros
   * en qué situación quedó (fallido, desistido, excluido del proceso). Las
   * denominaciones y sus particularidades están **[a confirmar]**.
   */
  {
    valor: "causante",
    etiqueta: "Causante",
    detalle: "La parte que falleció y de quien vienen los herederos.",
    particularidad:
      "El juicio se suspende hasta que comparezcan los herederos o se los declare rebeldes. Lo que presentó en vida sigue valiendo.",
  },
  {
    valor: "acreedor",
    etiqueta: "Acreedor",
    detalle: "Interviene por un crédito: en un concurso, una ejecución o un sucesorio.",
    particularidad: "Tiene que acreditar el crédito que invoca para que se lo tenga por parte.",
  },
  {
    valor: "apoderado_civil",
    etiqueta: "Apoderado civil",
    detalle: "Actúa por otra persona con un poder, sin ser su abogado.",
    particularidad:
      "Hay que agregar el poder y verificar que alcance para el acto. Necesita igualmente el patrocinio de un abogado.",
  },
  {
    valor: "cesionario",
    etiqueta: "Cesionario",
    detalle: "Recibió por cesión el derecho litigioso de una parte.",
    particularidad:
      "La cesión tiene que estar notificada y agregada; según el caso, la contraria puede oponerse a que el cedente se aparte.",
  },
  {
    valor: "curador",
    etiqueta: "Curador",
    detalle: "Representa a una persona declarada incapaz o con capacidad restringida.",
    particularidad:
      "Actúa dentro de las facultades que fijó la sentencia que lo designó, con intervención del Ministerio Público.",
  },
  {
    valor: "desistido",
    etiqueta: "Desistido",
    detalle: "Se desistió de la acción o del proceso respecto de esta parte.",
    particularidad:
      "Ya no se la notifica ni corre plazo para ella. Si fue desistimiento del proceso, puede volver a demandarse.",
  },
  {
    valor: "fallido",
    etiqueta: "Fallido",
    detalle: "Se le declaró la quiebra.",
    particularidad:
      "Queda desapoderado: en lo patrimonial actúa el síndico, y los juicios de contenido patrimonial pueden atraerse al juzgado de la quiebra.",
  },
  {
    valor: "excluido",
    etiqueta: "Excluido del proceso",
    detalle: "El juzgado lo apartó del juicio.",
    particularidad: "No se lo notifica más. Conviene dejar en las notas la resolución que lo excluyó.",
  },
  /*
   * Los dos caracteres del letrado, que contestan **con qué firma**: el
   * patrocinante asiste a la parte, que firma con él; el apoderado tiene poder
   * y firma solo, en nombre de ella. Es lo primero que hay que saber de un
   * abogado de enfrente, porque cambia a quién se notifica y si la parte tiene
   * que estar.
   *
   * Los dos reemplazan el rol en la cara de la tarjeta: "letrado" ya se ve en
   * que cuelga de su representado, y lo que hace falta leer es cuál de los dos
   * es. Las denominaciones y sus particularidades están **[a confirmar]**.
   */
  {
    valor: "patrocinante",
    etiqueta: "Patrocinante",
    detalle: "Asiste a la parte, que firma los escritos con él.",
    particularidad:
      "La parte firma con él y se la notifica en su propio domicilio: el patrocinio no la reemplaza en los actos que tiene que hacer en persona.",
    enElLugar: "reemplaza",
  },
  {
    valor: "apoderado",
    etiqueta: "Apoderado",
    detalle: "Tiene poder: actúa en nombre de la parte y firma solo.",
    particularidad:
      "Actúa en nombre de la parte y la obliga, así que las notificaciones van a él. Hay que ver que el poder esté agregado y que alcance para el acto: los de disposición y el allanamiento necesitan facultad expresa.",
    enElLugar: "reemplaza",
  },
  {
    valor: "otro",
    etiqueta: "Otro carácter",
    detalle: "Cualquier otro: cesionario, subrogante, administrador.",
    particularidad: "",
  },
];

/**
 * Los cuatro estados de la comparecencia, con lo que significa cada uno.
 *
 * `rebelde` es el único que no se deduce del expediente: lo declara el juzgado
 * a pedido de parte, y mientras no haya resolución la demandada que no se
 * presentó sigue estando `pendiente`.
 */
export const COMPARECENCIAS: ReadonlyArray<{
  valor: Comparecencia;
  etiqueta: string;
  detalle: string;
}> = [
  {
    valor: "pendiente",
    etiqueta: "No compareció",
    detalle: "Todavía no se presentó en el juicio.",
  },
  {
    valor: "comparecio",
    etiqueta: "Compareció",
    detalle: "Se presentó y constituyó domicilio en el expediente.",
  },
  {
    /*
     * Fue citada y no contestó en el plazo: se le dio por decaído el derecho
     * a contestar. No es lo mismo que la rebeldía, que requiere que no haya
     * comparecido en absoluto y la declara el juzgado a pedido de parte; una
     * demandada puede presentarse tarde y no haber contestado.
     */
    valor: "incontestada",
    etiqueta: "Demanda incontestada",
    detalle: "Fue citada y no contestó la demanda en el plazo.",
  },
  {
    valor: "rebelde",
    etiqueta: "Declarado rebelde",
    detalle: "El juzgado lo declaró rebelde: el juicio sigue sin su presencia.",
  },
  {
    valor: "no_corresponde",
    etiqueta: "No comparece",
    detalle: "No es algo que se le pregunte a ese rol: el perito, el mediador, el abogado.",
  },
];

/*
 * Historia del expediente: `history_entries` en docs/06-modelo-de-datos.md,
 * descrita en docs/02-expedientes.md §2.3.
 *
 * Es la línea de tiempo única: todo lo que pasó en la causa en una sola lista,
 * sin importar si lo hizo el juzgado, el estudio, la contraria o un auxiliar.
 * Es además la fuente principal de comprensión de los agentes, así que cada
 * entrada guarda el **texto completo** de la pieza y no solo su título.
 */

/**
 * Quién produjo la pieza. Es `history_entries.tipo` del modelo, con una
 * agregada: `escrito_auxiliar`, para lo que presentan el perito, el martillero
 * o el mediador, que no es ni del juzgado ni de las partes.
 */
export type TipoEntrada =
  | "actuacion_juzgado"
  | "escrito_propio"
  | "escrito_contraria"
  | "escrito_auxiliar"
  | "documento"
  | "evento"
  | "nota";

/**
 * Qué pieza es. Es `history_entries.subtipo`: el nombre con el que el abogado
 * la pide ("mandá la cédula", "salió el decreto").
 */
export type SubtipoEntrada =
  | "decreto"
  | "interlocutoria"
  | "sentencia"
  | "cedula"
  | "mandamiento"
  | "oficio"
  | "informe_actuarial"
  | "acta"
  | "demanda"
  | "contestacion"
  | "escrito"
  | "recurso"
  | "pericia"
  | "documento"
  | "nota"
  | "otro";

/**
 * De dónde salió el **registro**, que no es lo mismo que quién firmó la pieza:
 * hoy todo lo carga el abogado, el conector del SAE escribirá `sae`
 * (docs/09-conector-sae.md) y lo que proponga un agente y el abogado apruebe
 * quedará como `ia_aprobada`, siempre con su marca visible (§2.3).
 */
export type OrigenEntrada = "abogado" | "sae" | "ia_aprobada";

/** Una entrada de la historia del expediente. */
export interface EntradaHistoria {
  id: string;
  expedienteId: string;
  /** Fecha del acto: la del decreto, la del cargo del escrito. */
  fecha: string;
  /**
   * Fecha en que se notificó, si la pieza se notifica. Es de la que corren los
   * plazos, y por eso se guarda aparte de la fecha del acto.
   */
  fechaNotificacion: string;
  tipo: TipoEntrada;
  subtipo: SubtipoEntrada;
  origen: OrigenEntrada;
  /** Una línea: "Provee la demanda y ordena traslado por diez días". */
  titulo: string;
  /**
   * El texto completo de la pieza, que es lo que se viene a consultar y lo que
   * van a leer los agentes. En el modelo es `texto`, y `titulo` es su `resumen`.
   */
  texto: string;
  /**
   * Clave de la etapa que **abre** esta entrada, si abre alguna. Es el enlace
   * que en el modelo produce la fila de `stage_transitions`: el decreto que da
   * pie a la etapa nueva queda señalado en la historia y mueve al expediente.
   * Vacío en las entradas que no cambian de etapa, que son casi todas.
   */
  abreEtapa: string;
  creadoEn: string;
  actualizadoEn: string;
}

export const TIPOS_ENTRADA: ReadonlyArray<{
  valor: TipoEntrada;
  etiqueta: string;
  detalle: string;
}> = [
  {
    valor: "actuacion_juzgado",
    etiqueta: "Actuación del juzgado",
    detalle: "Decretos, resoluciones, cédulas, oficios, informes del actuario.",
  },
  {
    valor: "escrito_propio",
    etiqueta: "Presentación del estudio",
    detalle: "Lo que presentó el estudio.",
  },
  {
    valor: "escrito_contraria",
    etiqueta: "Presentación de la contraria",
    detalle: "Lo que presentó la otra parte.",
  },
  {
    valor: "escrito_auxiliar",
    etiqueta: "Presentación de un auxiliar",
    detalle: "Pericias, informes del perito, actas del mediador.",
  },
  { valor: "documento", etiqueta: "Documento", detalle: "Prueba documental, poder, comprobante." },
  { valor: "evento", etiqueta: "Evento", detalle: "Audiencia celebrada, reunión, diligencia." },
  { valor: "nota", etiqueta: "Nota", detalle: "Una observación del abogado, una llamada." },
];

export const SUBTIPOS_ENTRADA: ReadonlyArray<{ valor: SubtipoEntrada; etiqueta: string }> = [
  { valor: "decreto", etiqueta: "Decreto" },
  { valor: "interlocutoria", etiqueta: "Interlocutoria" },
  { valor: "sentencia", etiqueta: "Sentencia" },
  { valor: "cedula", etiqueta: "Cédula" },
  { valor: "mandamiento", etiqueta: "Mandamiento" },
  { valor: "oficio", etiqueta: "Oficio" },
  { valor: "informe_actuarial", etiqueta: "Informe del actuario" },
  { valor: "acta", etiqueta: "Acta" },
  { valor: "demanda", etiqueta: "Demanda" },
  { valor: "contestacion", etiqueta: "Contestación" },
  { valor: "escrito", etiqueta: "Escrito" },
  { valor: "recurso", etiqueta: "Recurso" },
  { valor: "pericia", etiqueta: "Pericia" },
  { valor: "documento", etiqueta: "Documento" },
  { valor: "nota", etiqueta: "Nota" },
  { valor: "otro", etiqueta: "Otro" },
];

export const ORIGENES_ENTRADA: ReadonlyArray<{ valor: OrigenEntrada; etiqueta: string }> = [
  { valor: "abogado", etiqueta: "Cargado por el estudio" },
  { valor: "sae", etiqueta: "Importado del SAE" },
  { valor: "ia_aprobada", etiqueta: "Propuesto por un agente y aprobado" },
];

/*
 * Formato de los escritos: cómo quiere el abogado que salgan sus escritos
 * (docs/02-expedientes.md §2.5).
 *
 * Es configuración del estudio y no de cada escrito: el estudio presenta
 * siempre con la misma letra, los mismos márgenes y la misma forma de encabezar.
 * En el modelo va en `profiles.preferencias jsonb`.
 */

/** Medidas de página y tipografía con las que se compone un escrito. */
export interface FormatoEscrito {
  /** Familia tipográfica, de las que hay en cualquier computadora. */
  fuente: string;
  /** Cuerpo del texto, en puntos. */
  tamanio: number;
  /** Interlineado: 1, 1.15, 1.5 o 2. */
  interlineado: number;
  /** Márgenes de la hoja, en centímetros. */
  margenSuperior: number;
  margenInferior: number;
  margenIzquierdo: number;
  margenDerecho: number;
  /** Sangría de la primera línea de cada párrafo, en centímetros. 0 la saca. */
  sangria: number;
  textoJustificado: boolean;
  /** La carátula en el encabezado: negrita, mayúsculas y su tamaño en puntos. */
  caratulaNegrita: boolean;
  caratulaMayusculas: boolean;
  caratulaTamanio: number;
}

/**
 * El formato con el que arranca un estudio que todavía no configuró el suyo:
 * la hoja oficio de cualquier escrito judicial, a doble espacio y con el margen
 * izquierdo ancho para el cosido del expediente.
 *
 * Son valores de uso corriente, no una exigencia reglamentaria: el abogado los
 * cambia desde Configuración → Estudio.
 */
export const FORMATO_ESCRITO: FormatoEscrito = {
  fuente: "Times New Roman",
  tamanio: 12,
  interlineado: 1.5,
  margenSuperior: 3,
  margenInferior: 2.5,
  margenIzquierdo: 4,
  margenDerecho: 2,
  sangria: 1.25,
  textoJustificado: true,
  caratulaNegrita: true,
  caratulaMayusculas: false,
  caratulaTamanio: 12,
};

/** Familias que existen en cualquier computadora, para que el escrito se vea igual. */
export const FUENTES_ESCRITO: ReadonlyArray<string> = [
  "Times New Roman",
  "Arial",
  "Calibri",
  "Georgia",
  "Verdana",
  "Courier New",
];

export const INTERLINEADOS: ReadonlyArray<{ valor: number; etiqueta: string }> = [
  { valor: 1, etiqueta: "Sencillo" },
  { valor: 1.15, etiqueta: "1,15" },
  { valor: 1.5, etiqueta: "1,5" },
  { valor: 2, etiqueta: "Doble" },
];
