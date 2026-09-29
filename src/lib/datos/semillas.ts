import { clavear } from "@/lib/formato";
import type { Agente, Datos, EtapaProceso, TipoProceso } from "./tipos";

/**
 * Ejemplos que trae el sistema, editables y borrables por el abogado
 * (docs/06-modelo-de-datos.md §5, docs/00-vision.md principio 2).
 *
 * Los identificadores son fijos y legibles para que las referencias entre
 * semillas (un agente que actúa en el ordinario, un expediente de ejemplo)
 * sean estables. Los registros que cree el abogado usan `randomUUID()`.
 *
 * Las nomenclaturas de tipos de proceso y etapas están **[a confirmar]**
 * contra el texto vigente de la Ley 9531 (docs/08-roadmap.md, punto 3): son
 * un punto de partida para que el abogado las corrija desde Configuración.
 */

const AHORA = "2026-09-28T00:00:00.000Z";

/** Convierte una lista de nombres en etapas ordenadas con su clave. */
export function etapasDesdeNombres(nombres: string[]): EtapaProceso[] {
  return nombres.map((nombre, indice) => ({
    clave: clavear(nombre),
    nombre,
    orden: indice + 1,
  }));
}

function tipoProceso(
  id: string,
  nombre: string,
  descripcion: string,
  materias: string[],
  etapas: string[],
): TipoProceso {
  return {
    id,
    clave: clavear(nombre),
    nombre,
    descripcion,
    materias,
    etapas: etapasDesdeNombres(etapas),
    activo: true,
    origen: "ejemplo",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  };
}

export const TIPOS_PROCESO_EJEMPLO: TipoProceso[] = [
  tipoProceso(
    "tp-ordinario",
    "Conocimiento Ordinario",
    "Proceso de conocimiento pleno con audiencia preliminar y vista de causa.",
    ["Daños y Perjuicios", "Contratos", "Consumidor"],
    [
      "Mediación",
      "Demanda",
      "Traslado",
      "Contestación",
      "Audiencia Preliminar",
      "Prueba",
      "Audiencia de Vista de Causa",
      "Alegatos",
      "Sentencia",
      "Recursos",
      "Ejecución de Sentencia",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-sumarisimo",
    "Conocimiento Sumarísimo",
    "Proceso abreviado, con plazos más breves y prueba limitada.",
    ["Consumidor", "Locaciones"],
    ["Demanda", "Traslado", "Contestación", "Prueba", "Sentencia", "Recursos", "Archivo"],
  ),
  tipoProceso(
    "tp-sumario",
    "Sumario",
    "Proceso sumario del código anterior. Se incluye como ejemplo porque el estudio lo usa; su vigencia y denominación en la Ley 9531 está a confirmar.",
    ["Daños y Perjuicios", "Contratos"],
    [
      "Demanda",
      "Traslado",
      "Contestación",
      "Prueba",
      "Alegatos",
      "Sentencia",
      "Recursos",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-ejecutivo",
    "Ejecutivo",
    "Cobro de título ejecutivo: mandamiento de pago y embargo, excepciones y sentencia de remate.",
    ["Ejecuciones"],
    [
      "Demanda Ejecutiva",
      "Mandamiento de Pago y Embargo",
      "Excepciones",
      "Sentencia de Remate",
      "Liquidación",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-monitorio",
    "Monitorio",
    "Sentencia monitoria inicial y traslado para oposición.",
    ["Ejecuciones", "Contratos"],
    [
      "Demanda",
      "Sentencia Monitoria",
      "Oposición",
      "Trámite de la Oposición",
      "Sentencia",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-expropiacion",
    "Expropiación",
    "Expropiación por causa de utilidad pública, con etapa previa de avenimiento y tasación.",
    ["Expropiación"],
    [
      "Avenimiento",
      "Demanda",
      "Traslado",
      "Contestación",
      "Tasación y Prueba",
      "Sentencia",
      "Pago y Toma de Posesión",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-sucesorio",
    "Sucesorio",
    "Proceso sucesorio: declaratoria de herederos, inventario, partición e inscripción.",
    ["Sucesiones"],
    [
      "Apertura",
      "Declaratoria de Herederos",
      "Inventario y Avalúo",
      "Partición",
      "Inscripción",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-desalojo",
    "Desalojo",
    "Desalojo por falta de pago o vencimiento de contrato, con lanzamiento.",
    ["Locaciones"],
    [
      "Mediación",
      "Demanda",
      "Traslado",
      "Contestación",
      "Prueba",
      "Sentencia",
      "Lanzamiento",
      "Archivo",
    ],
  ),
  tipoProceso(
    "tp-personalizado",
    "Personalizado",
    "Punto de partida vacío: el abogado arma las etapas desde cero.",
    [],
    [],
  ),
];

function agente(
  id: string,
  nombre: string,
  descripcion: string,
  rol: Agente["rol"],
  especialidades: string[],
  tiposProcesoIds: string[],
  instrucciones: string,
  guiasComportamiento: string,
  modelo: string,
): Agente {
  return {
    id,
    nombre,
    descripcion,
    rol,
    rama: "Civil y Comercial",
    especialidades,
    tiposProcesoIds,
    instrucciones,
    guiasComportamiento,
    modoConocimiento: "solo_fuentes",
    modelo,
    activo: true,
    origen: "ejemplo",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  };
}

const REGLA_DOMINIO_CERRADO =
  "Trabajás en dominio cerrado: solo podés afirmar lo que esté en las fuentes que te asignó el abogado y en la historia del expediente. Si algo no está, decí que no lo encontrás en las fuentes. Nunca estimes un plazo: llamá al motor de plazos y reportá su resultado con la explicación.";

export const AGENTES_EJEMPLO: Agente[] = [
  agente(
    "ag-procesalista",
    "Procesalista Tucumán",
    "Qué recurso corresponde, en qué plazo y con qué forma; requisitos de cada escrito; qué pasa en cada etapa.",
    "procesalista",
    ["Procesal Civil y Comercial"],
    [],
    `Sos procesalista civil y comercial en Tucumán. Respondés sobre trámite, recursos, requisitos de escritos y etapas del proceso, citando el artículo de la norma cargada que lo respalda. ${REGLA_DOMINIO_CERRADO}`,
    "Cuando detectes una cédula o una notificación, calculá siempre el plazo con el catálogo de plazos del abogado y nunca lo estimes. No opines sobre estrategia.",
    "anthropic/claude-opus-5",
  ),
  agente(
    "ag-analista",
    "Analista de Expediente",
    "Lee la historia del expediente y explica qué pasa. Es la base del informe de estado.",
    "analista",
    ["Análisis de expediente"],
    [],
    `Leés la historia del expediente y explicás el estado procesal: qué pasó, qué quedó pendiente, qué plazos corren y qué conviene hacer. Cada punto lleva su fuente (entrada de la historia, norma, guía). ${REGLA_DOMINIO_CERRADO}`,
    "Ordená siempre el informe por: estado, pendientes, plazos, advertencias y propuestas. Un punto sin fuente va a 'sin respaldo' y no se propone como acción.",
    "anthropic/claude-opus-5",
  ),
  agente(
    "ag-redactor",
    "Redactor de Escritos",
    "Redacta borradores en el estilo forense de Tucumán dentro del editor del expediente.",
    "redactor",
    ["Redacción forense"],
    [],
    `Redactás escritos judiciales en el estilo forense de Tucumán, partiendo de las plantillas de escritos del abogado y de los datos del expediente. ${REGLA_DOMINIO_CERRADO}`,
    "Todo dato que no esté en la historia del expediente se marca [[COMPLETAR: qué falta]] y nunca se inventa. Respetá el encabezado con juzgado, carátula, número y partes.",
    "anthropic/claude-opus-5",
  ),
  agente(
    "ag-danos",
    "Especialista en Daños y Perjuicios",
    "Rubros reclamados, prueba que los respalda, qué falta acreditar y riesgo de prescripción.",
    "especialista",
    ["Daños y Perjuicios", "Responsabilidad Civil"],
    ["tp-ordinario", "tp-sumario"],
    `Sos analista y consultor en responsabilidad civil. Informás qué rubros se reclamaron, con qué prueba, qué falta acreditar y si hay riesgo de prescripción, según las normas y guías que te asignó el abogado. ${REGLA_DOMINIO_CERRADO}`,
    "Distinguí siempre daño patrimonial de extrapatrimonial y citá el artículo de la norma cargada en el que apoyás cada rubro.",
    "anthropic/claude-opus-5",
  ),
  agente(
    "ag-consumidor",
    "Especialista en Consumidor",
    "Requisitos de la relación de consumo, cargas probatorias y daño punitivo, según las fuentes cargadas.",
    "especialista",
    ["Consumidor"],
    ["tp-ordinario", "tp-sumarisimo"],
    `Sos especialista en derecho del consumidor. Verificás en la historia del expediente los requisitos de la relación de consumo y advertís sobre cargas probatorias y daño punitivo, según las normas y guías que te asignó el abogado. ${REGLA_DOMINIO_CERRADO}`,
    "No afirmes que corresponde daño punitivo si la fuente cargada no lo respalda: dejalo como observación.",
    "anthropic/claude-haiku-4-5",
  ),
];

/**
 * Dos expedientes de ejemplo. El primero es el caso que pidió el abogado:
 * cargado en mayúsculas y sin tildes, se guarda ya normalizado.
 */
export const EXPEDIENTES_EJEMPLO: Datos["expedientes"] = [
  {
    id: "ex-rogel",
    numero: "1234",
    anio: "26",
    caratula: "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios",
    actor: "Nicolás Rogel",
    demandado: "Swiss Medical ART",
    objeto: "Daños y Perjuicios",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "contestacion",
    etapaDesde: "2026-09-15",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    materia: "Daños y Perjuicios",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "Expediente de ejemplo. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ex-diaz",
    numero: "845",
    anio: "26",
    caratula: "Rosa Díaz s/ Sucesión",
    actor: "Rosa Díaz",
    demandado: "",
    objeto: "Sucesión",
    tipoProcesoId: "tp-sucesorio",
    etapaActual: "declaratoria_de_herederos",
    etapaDesde: "2026-08-04",
    centroJudicial: "concepcion",
    fuero: "Familia y Sucesiones",
    materia: "Sucesiones",
    rolCliente: "heredero",
    estado: "en_tramite",
    notas: "Expediente de ejemplo. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
];

/**
 * Estado inicial completo del almacén.
 *
 * Devuelve una copia profunda: el almacén modifica los datos en el lugar, así
 * que si entregara las listas de ejemplo directamente, la primera edición del
 * abogado alteraría las semillas del módulo y la próxima inicialización
 * arrancaría con datos ya tocados.
 */
export function datosIniciales(): Datos {
  return structuredClone({
    estudio: {
      nombre: "",
      matricula: "",
      cuit: "",
      domicilioElectronico: "",
      telefono: "",
      centroJudicialHabitual: "capital",
      modeloPorDefecto: "anthropic/claude-opus-5",
      correccionDeTildes: true,
      actualizadoEn: AHORA,
    },
    tiposProceso: TIPOS_PROCESO_EJEMPLO,
    agentes: AGENTES_EJEMPLO,
    expedientes: EXPEDIENTES_EJEMPLO,
  });
}
