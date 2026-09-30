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
  actualizadoEn: string;
}

/** Contenido completo del almacén. */
export interface Datos {
  estudio: Estudio;
  tiposProceso: TipoProceso[];
  agentes: Agente[];
  expedientes: Expediente[];
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
