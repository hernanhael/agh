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
}

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
 * `letrado_contraria` el abogado de enfrente: no son partes en sentido estricto
 * pero son con quienes se litiga, así que van en la misma nómina.
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

/** Una parte del expediente. */
export interface Parte {
  id: string;
  expedienteId: string;
  rol: RolParte;
  nombre: string;
  /** DNI o CUIT, como lo escribe el abogado. */
  documento: string;
  /** Dónde vive o tiene su sede: el domicilio real del escrito. */
  domicilioReal: string;
  /**
   * Casilla del SAE por donde llegan las notificaciones electrónicas. Es el
   * dato operativo de la nómina: sin él no se puede notificar.
   */
  domicilioElectronico: string;
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
    etiqueta: "Letrado de la contraria",
    detalle: "El abogado de enfrente. Se vincula a la parte que representa.",
  },
  { valor: "perito", etiqueta: "Perito", detalle: "Auxiliar designado por el juzgado." },
  { valor: "mediador", etiqueta: "Mediador", detalle: "Quien condujo la mediación." },
  { valor: "sindico", etiqueta: "Síndico", detalle: "En los procesos concursales." },
  { valor: "otro", etiqueta: "Otro", detalle: "Martillero, depositario, interventor." },
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
