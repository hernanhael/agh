import { clavear } from "@/lib/formato";
import type {
  Agente,
  Datos,
  EntradaHistoria,
  EtapaProceso,
  Gasto,
  Parte,
  TipoProceso,
} from "./tipos";

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
 * Expedientes de ejemplo. El primero es el caso que pidió el abogado: cargado
 * en mayúsculas y sin tildes, se guarda ya normalizado.
 *
 * Están elegidos para que se vea **todo el semáforo de la caducidad de
 * instancia** (`lib/procesal/caducidad`, docs/02-expedientes.md §2.11) con
 * datos que se pueden tocar:
 *
 * | Ejemplo | Situación |
 * |---|---|
 * | Rogel (principal) | verde, con audiencia preliminar fijada |
 * | Díaz (sucesorio) | verde |
 * | Gómez (sumario) | verde con aviso: faltan menos de treinta días |
 * | Rogel (incidente) | amarillo: pasaron los tres meses del incidente |
 * | Municipalidad (expropiación) | amarillo: pasaron los seis meses del principal |
 * | Nieva (ejecutivo) | rojo: el juzgado declaró la caducidad |
 * | Sosa (desalojo) | gris: con sentencia, no hay instancia que pueda caducar |
 *
 * Las fechas son fijas, así que con el paso del tiempo el ejemplo del aviso
 * pasa a amarillo y los amarillos se hacen más viejos: es el comportamiento
 * esperado, y el abogado los edita o los borra como cualquier otro.
 *
 * Los juzgados y las Oficinas de Gestión Asociada son **[a confirmar]** contra
 * los nombres que usa el Portal del SAE (docs/08-roadmap.md, punto 9).
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
    juzgadoTipo: "Civil y Comercial Común",
    juzgadoNumero: "VI",
    oficinaGestion: "OGA Civil y Comercial Capital",
    materia: "Daños y Perjuicios",
    rolCliente: "actor",
    estado: "en_tramite",
    clase: "principal",
    ultimoMovimiento: "2026-09-15",
    caducidadDeclarada: "",
    audienciaTipo: "Audiencia Preliminar",
    audienciaFecha: "2026-10-16",
    audienciaHora: "09:30",
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
    juzgadoTipo: "Familia y Sucesiones",
    juzgadoNumero: "II",
    oficinaGestion: "OGA Familia Concepción",
    materia: "Sucesiones",
    rolCliente: "heredero",
    estado: "en_tramite",
    clase: "principal",
    ultimoMovimiento: "2026-08-04",
    caducidadDeclarada: "",
    audienciaTipo: "",
    audienciaFecha: "",
    audienciaHora: "",
    notas: "Expediente de ejemplo. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ex-gomez",
    numero: "3120",
    anio: "26",
    caratula: "Ramón Gómez c/ Electrónica del Norte SRL s/ Cumplimiento de Contrato",
    actor: "Ramón Gómez",
    demandado: "Electrónica del Norte SRL",
    objeto: "Cumplimiento de Contrato",
    tipoProcesoId: "tp-sumario",
    etapaActual: "prueba",
    etapaDesde: "2026-04-05",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    // Otra nominación del mismo fuero: el filtro por juzgado los distingue.
    juzgadoTipo: "Civil y Comercial Común",
    juzgadoNumero: "IV",
    oficinaGestion: "OGA Civil y Comercial Capital",
    materia: "Consumidor",
    rolCliente: "actor",
    estado: "en_tramite",
    clase: "principal",
    ultimoMovimiento: "2026-04-05",
    caducidadDeclarada: "",
    audienciaTipo: "",
    audienciaFecha: "",
    audienciaHora: "",
    notas:
      "Expediente de ejemplo: se acerca a los seis meses sin movimiento, así que la burbuja avisa cuántos días faltan. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ex-rogel-incidente",
    numero: "2210",
    anio: "26",
    caratula: "Nicolás Rogel c/ Swiss Medical ART s/ Incidente de Nulidad",
    actor: "Nicolás Rogel",
    demandado: "Swiss Medical ART",
    objeto: "Incidente de Nulidad",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "prueba",
    etapaDesde: "2026-05-11",
    // El incidente se tramita ante el mismo juzgado que el principal 1234/26,
    // con su propio número.
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    juzgadoTipo: "Civil y Comercial Común",
    juzgadoNumero: "VI",
    oficinaGestion: "OGA Civil y Comercial Capital",
    materia: "Daños y Perjuicios",
    rolCliente: "actor",
    estado: "en_tramite",
    clase: "incidente",
    ultimoMovimiento: "2026-05-11",
    caducidadDeclarada: "",
    audienciaTipo: "",
    audienciaFecha: "",
    audienciaHora: "",
    notas:
      "Expediente de ejemplo: incidente del principal 1234/26, sin movimiento hace más de tres meses. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ex-muni",
    numero: "4870",
    anio: "26",
    caratula: "Municipalidad de San Miguel de Tucumán c/ María de los Ángeles Pérez s/ Expropiación",
    actor: "Municipalidad de San Miguel de Tucumán",
    demandado: "María de los Ángeles Pérez",
    objeto: "Expropiación",
    tipoProcesoId: "tp-expropiacion",
    etapaActual: "tasacion_y_prueba",
    etapaDesde: "2026-02-10",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    juzgadoTipo: "Civil y Comercial Común",
    juzgadoNumero: "II",
    oficinaGestion: "OGA Civil y Comercial Capital",
    materia: "Expropiación",
    rolCliente: "demandado",
    estado: "en_tramite",
    clase: "principal",
    ultimoMovimiento: "2026-02-10",
    caducidadDeclarada: "",
    audienciaTipo: "",
    audienciaFecha: "",
    audienciaHora: "",
    notas:
      "Expediente de ejemplo: principal sin movimiento hace más de seis meses. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ex-nieva",
    numero: "640",
    anio: "25",
    caratula: "Cooperativa de Crédito El Norte Ltda. c/ Hugo Nieva s/ Cobro Ejecutivo",
    actor: "Cooperativa de Crédito El Norte Ltda.",
    demandado: "Hugo Nieva",
    objeto: "Cobro Ejecutivo",
    tipoProcesoId: "tp-ejecutivo",
    etapaActual: "excepciones",
    etapaDesde: "2025-09-01",
    centroJudicial: "capital",
    fuero: "Cobros y Apremios",
    juzgadoTipo: "Cobros y Apremios",
    juzgadoNumero: "II",
    oficinaGestion: "OGA Cobros y Apremios Capital",
    materia: "Ejecuciones",
    rolCliente: "demandado",
    estado: "en_tramite",
    clase: "principal",
    ultimoMovimiento: "2025-09-01",
    caducidadDeclarada: "2026-06-12",
    audienciaTipo: "",
    audienciaFecha: "",
    audienciaHora: "",
    notas:
      "Expediente de ejemplo: el juzgado declaró la caducidad de la instancia. Se puede editar o borrar.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ex-sosa",
    numero: "1502",
    anio: "26",
    caratula: "Marta Sosa c/ Julio Barrionuevo s/ Desalojo",
    actor: "Marta Sosa",
    demandado: "Julio Barrionuevo",
    objeto: "Desalojo",
    tipoProcesoId: "tp-desalojo",
    etapaActual: "sentencia",
    etapaDesde: "2026-09-08",
    centroJudicial: "monteros",
    fuero: "Civil y Comercial Común",
    juzgadoTipo: "Civil y Comercial Común",
    juzgadoNumero: "I",
    oficinaGestion: "OGA Monteros",
    materia: "Locaciones",
    rolCliente: "actor",
    estado: "con_sentencia",
    clase: "principal",
    ultimoMovimiento: "2026-09-08",
    caducidadDeclarada: "",
    // Audiencia ya celebrada: no ocupa la burbuja, y en la ficha se ve marcada.
    audienciaTipo: "Audiencia de Vista de Causa",
    audienciaFecha: "2026-08-20",
    audienciaHora: "10:00",
    notas:
      "Expediente de ejemplo: con sentencia, así que no hay instancia en curso que pueda caducar. Se puede editar o borrar.",
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
    gastos: GASTOS_EJEMPLO,
    partes: PARTES_EJEMPLO,
    historia: HISTORIA_EJEMPLO,
  });
}

/**
 * Contabilidad de ejemplo, toda sobre el expediente Rogel: un ordinario de
 * daños que ya pagó lo del inicio y tiene la pericia y los honorarios
 * previstos (docs/02-expedientes.md §2.12).
 *
 * Sirve para ver de qué se compone el costo de un juicio y cómo se separa lo
 * pagado de lo estimado. **Los importes son inventados**: no son aranceles
 * reales, son un ejemplo editable como cualquier otra semilla.
 */
export const GASTOS_EJEMPLO: Gasto[] = [
  {
    id: "ga-rogel-mediacion",
    expedienteId: "ex-rogel",
    tipo: "gasto",
    concepto: "mediacion",
    detalle: "Arancel de la mediación prejudicial obligatoria.",
    importe: 2_500_000,
    moneda: "ARS",
    fecha: "2026-08-20",
    estado: "pagado_cliente",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ga-rogel-tasa",
    expedienteId: "ex-rogel",
    tipo: "gasto",
    concepto: "tasa_justicia",
    detalle: "Tasa de justicia sobre el monto reclamado en la demanda.",
    importe: 18_500_000,
    moneda: "ARS",
    fecha: "2026-09-01",
    estado: "pagado_cliente",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ga-rogel-bono",
    expedienteId: "ex-rogel",
    tipo: "gasto",
    concepto: "bono",
    detalle: "Bono de movilidad del inicio de demanda.",
    importe: 1_200_000,
    moneda: "ARS",
    fecha: "2026-09-01",
    estado: "pagado_estudio",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ga-rogel-aportes",
    expedienteId: "ex-rogel",
    tipo: "gasto",
    concepto: "aportes_caja",
    detalle: "Aportes a la Caja de Previsión por inicio de juicio.",
    importe: 950_000,
    moneda: "ARS",
    fecha: "2026-09-02",
    estado: "pagado_estudio",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ga-rogel-cedula",
    expedienteId: "ex-rogel",
    tipo: "gasto",
    concepto: "notificaciones",
    detalle: "Cédula de traslado de la demanda al domicilio del demandado.",
    importe: 450_000,
    moneda: "ARS",
    fecha: "2026-09-12",
    estado: "rendido",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ga-rogel-pericia",
    expedienteId: "ex-rogel",
    tipo: "gasto",
    concepto: "pericia",
    detalle: "Anticipo de gastos del perito médico, para cuando se abra a prueba.",
    importe: 15_000_000,
    moneda: "ARS",
    fecha: "2026-11-15",
    estado: "previsto",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "ga-rogel-honorarios",
    expedienteId: "ex-rogel",
    tipo: "honorario_pactado",
    concepto: "honorarios",
    detalle: "Honorarios pactados con el cliente en el convenio inicial.",
    importe: 60_000_000,
    moneda: "ARS",
    fecha: "2026-08-20",
    estado: "previsto",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
];

/**
 * Nóminas de partes de ejemplo, sobre dos expedientes: el ordinario de daños
 * contra una ART (Rogel) y el sucesorio (Díaz) (docs/02-expedientes.md §2.14).
 *
 * Entre los dos están **los nueve roles y trece de los catorce caracteres**, a
 * propósito: la nómina es el lugar donde el catálogo se lee en voz alta, y
 * tenerlo entero cargado es lo que permite revisar si cada denominación y cada
 * particularidad dicen lo que tienen que decir. Cada parte está puesta para
 * mostrar un estado distinto de la tarjeta.
 *
 * El de Rogel es un accidente de trabajo demandado contra la ART y contra la
 * empleadora, con la aseguradora de la empleadora citada en garantía, la dueña
 * de la máquina traída como tercero, el coactor que murió en el medio y el
 * síndico del concurso de la empleadora:
 *
 * | Parte | Lo que muestra |
 * |---|---|
 * | Nicolás Rogel | el cliente, con "el estudio" como abogado |
 * | Hugo Maidana | **la parte que murió**: la tarjeta apagada, con su fecha |
 * | Gabriela Maidana | **heredera de una parte fallecida**, con el vínculo cargado |
 * | Swiss Medical ART | dos letrados actuales ("+1"), uno apoderado y otra patrocinante, y una letrada que cesó |
 * | Citrícola del Valle SA | la codemandada, con su propio letrado |
 * | La Segunda Seguros | la citada en garantía, que todavía no compareció |
 * | Maquinarias del Norte SRL | el tercero citado, declarado **rebelde** |
 * | Silvia Juárez | la perito: no comparece y no lleva letrado |
 * | Ana Carrizo | la mediadora: una tarjeta sin ninguna señal |
 * | Ramón Paz | el **síndico** del concurso de la empleadora |
 *
 * Dos quedan **sin domicilio electrónico** a propósito, que es el dato que la
 * ficha muestra vacío cuando falta la casilla del SAE.
 *
 * El de Díaz es el que muestra **los caracteres de la parte**: una heredera que
 * es la clienta, un heredero menor de edad asistido por la Defensoría Oficial,
 * una hija con capacidad restringida, el fisco provincial que denunció su
 * crédito, una acreedora que todavía no compareció y el administrador de la
 * sucesión, que es la tarjeta del rol "otro".
 *
 * **Falta un solo carácter**: la sucesión indivisa, que no tiene lugar natural
 * en un daños ni en un sucesorio —aparece cuando se demanda al acervo de una
 * persona muerta, como en un cobro ejecutivo— y que se cargará en el expediente
 * donde corresponda.
 *
 * Los documentos, domicilios y teléfonos son **inventados**: son un ejemplo
 * editable como cualquier otra semilla.
 */
export const PARTES_EJEMPLO: Parte[] = [
  {
    id: "pa-rogel-actor",
    expedienteId: "ex-rogel",
    rol: "actor",
    nombre: "Nicolás",
    apellido: "Rogel",
    documento: "25.123.456",
    domicilioReal: "San Martín 450, San Miguel de Tucumán",
    telefono: "381 555 0101",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "por_si",
    // Presentar la demanda es su comparecencia: la fecha es la del escrito
    // que está en la historia de este mismo expediente.
    comparecencia: "comparecio",
    comparecioEl: "2026-08-25",
    esCliente: true,
    notas: "Accidente de trabajo del 12/03/2026. Alta médica con incapacidad parcial.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * El compañero de trabajo accidentado en el mismo hecho, que demandó junto
     * con el cliente y **murió con el juicio en prueba**. Es la tarjeta que se
     * apaga: queda con su nombre y la fecha, sin abogado y sin comparecencia,
     * porque lo que presentó sigue en el expediente y porque de él viene la
     * heredera que comparece después.
     */
    id: "pa-rogel-coactor",
    expedienteId: "ex-rogel",
    rol: "actor",
    nombre: "Hugo",
    apellido: "Maidana",
    documento: "27.998.112",
    domicilioReal: "Pasaje Las Piedras 77, Banda del Río Salí",
    telefono: "381 555 0505",
    email: "",
    representaA: "",
    cesoEl: "",
    fallecioEl: "2026-10-02",
    caracter: "litisconsorte",
    comparecencia: "comparecio",
    comparecioEl: "2026-08-25",
    esCliente: false,
    notas: "Accidentado en el mismo hecho. Demandó junto con el cliente.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * La hija del coactor que murió: comparece a tomar su lugar, y es la que
     * muestra **el vínculo con la parte fallecida**, así que su tarjeta dice de
     * quién hereda en lugar de decir "heredero" a secas. Es, además, la que
     * está del lado del estudio pero no es la clienta, así que la contabilidad y
     * la rendición no son suyas.
     */
    id: "pa-rogel-heredera",
    expedienteId: "ex-rogel",
    rol: "actor",
    nombre: "Gabriela",
    apellido: "Maidana",
    documento: "35.447.908",
    domicilioReal: "Pasaje Las Piedras 77, Banda del Río Salí",
    telefono: "381 555 0506",
    email: "",
    representaA: "",
    cesoEl: "",
    sucedeA: "pa-rogel-coactor",
    caracter: "heredero",
    comparecencia: "comparecio",
    comparecioEl: "2026-10-20",
    esCliente: false,
    notas:
      "Hija de Hugo Maidana. Acreditó la declaratoria de herederos y continúa el reclamo de su padre.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-rogel-letrada-coactor",
    genero: "femenino",
    expedienteId: "ex-rogel",
    rol: "letrado_contraria",
    nombre: "Verónica",
    apellido: "Suárez",
    documento: "",
    domicilioReal: "",
    telefono: "381 555 0606",
    email: "",
    representaA: "pa-rogel-heredera",
    cesoEl: "",
    caracter: "apoderado",
    comparecioEl: "",
    esCliente: false,
    notas:
      "Firmó la demanda junto con el estudio por el coactor, y hoy es la apoderada de su heredera.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-rogel-demandada",
    expedienteId: "ex-rogel",
    rol: "demandado",
    nombre: "Swiss Medical ART",
    documento: "30-68340002-5",
    domicilioReal: "Avenida Mitre 320, San Miguel de Tucumán",
    // Sin casilla del SAE: es el dato que la pestaña reclama cuando falta.
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "persona_juridica",
    comparecencia: "comparecio",
    comparecioEl: "2026-09-12",
    esCliente: false,
    notas: "",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-rogel-letrado",
    genero: "masculino",
    expedienteId: "ex-rogel",
    rol: "letrado_contraria",
    nombre: "Fernando",
    apellido: "Ledesma",
    documento: "",
    domicilioReal: "",
    telefono: "381 555 0202",
    email: "",
    representaA: "pa-rogel-demandada",
    cesoEl: "",
    caracter: "apoderado",
    comparecioEl: "",
    esCliente: false,
    notas: "Apoderado de la ART. Contestó la demanda el 12/09/2026.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    // La segunda letrada actual de la ART: es la que hace que la señal del
    // abogado diga "Fernando Ledesma +1" en lugar de un nombre solo.
    id: "pa-rogel-letrada-2",
    genero: "femenino",
    expedienteId: "ex-rogel",
    rol: "letrado_contraria",
    nombre: "Lucía",
    apellido: "Ferreyra",
    documento: "",
    domicilioReal: "",
    telefono: "381 555 0707",
    email: "",
    representaA: "pa-rogel-demandada",
    cesoEl: "",
    caracter: "patrocinante",
    comparecioEl: "",
    esCliente: false,
    notas: "Apoderada de la ART, junto con Ledesma.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    // La letrada que llevaba el caso antes: no se borra, baja a "letrados
    // anteriores" en la ficha de su representada, porque lo que presentó
    // mientras la representaba sigue en el expediente.
    id: "pa-rogel-letrada-anterior",
    genero: "femenino",
    expedienteId: "ex-rogel",
    rol: "letrado_contraria",
    nombre: "Marta",
    apellido: "Villagra",
    documento: "",
    domicilioReal: "",
    telefono: "381 555 0404",
    email: "",
    representaA: "pa-rogel-demandada",
    cesoEl: "2026-09-10",
    caracter: "patrocinante",
    comparecioEl: "",
    esCliente: false,
    notas: "Renunció al patrocinio antes de la contestación.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    // La empleadora, demandada junto con la ART por la acción civil. La
    // carátula no la nombra porque nombra al primero de cada lado.
    id: "pa-rogel-empleadora",
    expedienteId: "ex-rogel",
    rol: "demandado",
    nombre: "Citrícola del Valle SA",
    documento: "30-71234567-2",
    domicilioReal: "Ruta 301 km 8, Lules",
    telefono: "381 555 0808",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "litisconsorte",
    comparecencia: "comparecio",
    comparecioEl: "2026-09-12",
    esCliente: false,
    notas: "Empleadora al momento del accidente. Citó en garantía a su aseguradora.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-rogel-letrado-empleadora",
    genero: "masculino",
    expedienteId: "ex-rogel",
    rol: "letrado_contraria",
    nombre: "Ignacio",
    apellido: "Brizuela",
    documento: "",
    domicilioReal: "",
    telefono: "381 555 0909",
    email: "",
    representaA: "pa-rogel-empleadora",
    cesoEl: "",
    caracter: "patrocinante",
    comparecioEl: "",
    esCliente: false,
    notas: "Apoderado de la empleadora.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * La aseguradora que la empleadora trajo al pleito: es la única tarjeta
     * con el ícono del paraguas, y la que muestra el "no compareció" en gris
     * —todavía está corriendo su plazo— junto al ámbar de la casilla faltante.
     */
    id: "pa-rogel-citada-garantia",
    expedienteId: "ex-rogel",
    rol: "citado_garantia",
    nombre: "La Segunda Cooperativa Limitada de Seguros",
    documento: "30-50001234-0",
    domicilioReal: "Avenida Sarmiento 1020, San Miguel de Tucumán",
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "persona_juridica",
    comparecencia: "pendiente",
    comparecioEl: "",
    esCliente: false,
    notas: "Citada en garantía por la empleadora. Póliza de responsabilidad civil.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * La dueña de la máquina, traída al pleito sin que haya venido por su
     * cuenta. Es la tarjeta de la **rebeldía**, que es el único estado de la
     * comparecencia que la nómina muestra en ámbar.
     */
    id: "pa-rogel-tercero",
    expedienteId: "ex-rogel",
    rol: "tercero",
    nombre: "Maquinarias del Norte SRL",
    documento: "30-70998877-4",
    domicilioReal: "Avenida Roca 2450, San Miguel de Tucumán",
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "citado_coactivo",
    comparecencia: "rebelde",
    comparecioEl: "",
    esCliente: false,
    notas: "Dueña de la máquina. Declarada rebelde el 25/09/2026.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-rogel-perito",
    expedienteId: "ex-rogel",
    rol: "perito",
    nombre: "Silvia",
    apellido: "Juárez",
    documento: "",
    domicilioReal: "",
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "por_si",
    comparecioEl: "",
    esCliente: false,
    notas: "Perito médica designada de oficio. Pericia pendiente de realización.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-rogel-mediadora",
    expedienteId: "ex-rogel",
    rol: "mediador",
    nombre: "Ana",
    apellido: "Carrizo",
    documento: "",
    domicilioReal: "",
    telefono: "381 555 0303",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "por_si",
    comparecioEl: "",
    esCliente: false,
    notas: "Condujo la mediación prejudicial, cerrada sin acuerdo el 20/08/2026.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * El síndico del concurso de la empleadora, que entró en concurso
     * preventivo con el juicio en prueba. Es la tarjeta del rol **síndico**, y
     * está acá y no en un concursal porque es así como aparece: el juicio de
     * daños sigue, y el crédito contra la concursada se verifica en el otro
     * expediente.
     */
    id: "pa-rogel-sindico",
    expedienteId: "ex-rogel",
    rol: "sindico",
    nombre: "Ramón",
    apellido: "Paz",
    documento: "22.447.019",
    domicilioReal: "Córdoba 230, San Miguel de Tucumán",
    telefono: "381 555 0808",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "por_si",
    comparecencia: "comparecio",
    comparecioEl: "2026-10-15",
    esCliente: false,
    notas:
      "Síndico del concurso preventivo de Citrícola del Valle SA. Se presentó a tomar intervención en este juicio.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },

  /*
   * Sucesorio de Rosa Díaz: el ejemplo de los **caracteres**. Los herederos
   * están del lado actor porque son quienes promueven, y la acreedora que
   * denunció su crédito va como tercero, que es donde la nómina pone a quien
   * interviene sin ser actor ni demandado.
   */
  {
    id: "pa-diaz-heredera",
    expedienteId: "ex-diaz",
    rol: "actor",
    nombre: "Carla",
    apellido: "Díaz",
    documento: "28.456.789",
    domicilioReal: "Laprida 180, Concepción",
    telefono: "3865 55 0110",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "heredero",
    comparecencia: "comparecio",
    comparecioEl: "2026-07-14",
    esCliente: true,
    notas: "Hija de la causante. Promovió el sucesorio.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-diaz-heredero-menor",
    expedienteId: "ex-diaz",
    rol: "actor",
    nombre: "Tomás",
    apellido: "Díaz",
    documento: "55.123.456",
    domicilioReal: "Laprida 180, Concepción",
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    // El carácter que más cambia el trámite: la tarjeta avisa que interviene
    // el Ministerio Pupilar y que el niño tiene derecho a ser oído.
    caracter: "menor",
    comparecencia: "comparecio",
    comparecioEl: "2026-07-14",
    esCliente: false,
    notas: "Nieto de la causante, por la porción de su padre premuerto.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-diaz-defensoria",
    expedienteId: "ex-diaz",
    rol: "letrado_contraria",
    nombre: "Defensoría Oficial Civil de Concepción",
    documento: "",
    domicilioReal: "",
    telefono: "3865 55 0222",
    email: "",
    representaA: "pa-diaz-heredero-menor",
    cesoEl: "",
    caracter: "defensoria_oficial",
    comparecioEl: "",
    esCliente: false,
    notas: "Asiste al heredero menor de edad.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "pa-diaz-acreedora",
    expedienteId: "ex-diaz",
    rol: "tercero",
    nombre: "Mutual del Sur",
    documento: "30-70112233-6",
    domicilioReal: "Alberdi 95, Concepción",
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "citado_voluntario",
    comparecencia: "pendiente",
    comparecioEl: "",
    esCliente: false,
    notas: "Denunció un crédito contra la causante. Todavía no se presentó.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * La otra hija, con **capacidad restringida**: actúa con la curadora que le
     * fijó la sentencia y el Ministerio Público interviene en el juicio. Es el
     * caso que muestra que el carácter es uno solo por parte: es heredera igual
     * que su hermana, pero lo que cambia el trámite es su capacidad, así que es
     * eso lo que la tarjeta dice.
     */
    id: "pa-diaz-hermana",
    expedienteId: "ex-diaz",
    rol: "actor",
    nombre: "Mirta",
    apellido: "Díaz",
    documento: "24.660.901",
    domicilioReal: "Laprida 980, Concepción",
    telefono: "3865 55 0404",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "capacidad_restringida",
    comparecencia: "comparecio",
    comparecioEl: "2026-07-10",
    esCliente: false,
    notas: "Hija de la causante. Actúa con su curadora designada por sentencia.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * El fisco provincial, que denunció la deuda de impuesto inmobiliario de la
     * causante: es el **organismo estatal**, con su propia representación
     * letrada y sus formas de emplazamiento.
     */
    id: "pa-diaz-fisco",
    expedienteId: "ex-diaz",
    rol: "tercero",
    nombre: "Dirección General de Rentas de Tucumán",
    documento: "30-99900011-7",
    domicilioReal: "San Martín 515, San Miguel de Tucumán",
    telefono: "",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "organismo_estatal",
    comparecencia: "pendiente",
    comparecioEl: "",
    esCliente: false,
    notas: "Denunció deuda de impuesto inmobiliario del inmueble del acervo.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    /*
     * El administrador de la sucesión: no es parte ni letrado, es quien
     * administra el acervo mientras no se parte. Es la tarjeta del rol **otro**,
     * el que la nómina reserva para quien interviene sin encajar en ninguno de
     * los ocho anteriores.
     */
    id: "pa-diaz-administrador",
    expedienteId: "ex-diaz",
    rol: "otro",
    nombre: "Raúl",
    apellido: "Correa",
    documento: "20.114.773",
    domicilioReal: "Bolívar 120, Concepción",
    telefono: "3865 55 0707",
    email: "",
    representaA: "",
    cesoEl: "",
    caracter: "otro",
    comparecencia: "comparecio",
    comparecioEl: "2026-09-05",
    esCliente: false,
    notas:
      "Contador designado administrador de la sucesión a propuesta de los herederos. Aceptó el cargo el 05/09/2026.",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
];

/**
 * Historia de ejemplo, toda sobre el expediente Rogel: un ordinario de daños
 * contra una ART que ya pasó la mediación, la demanda, el traslado y la
 * contestación (docs/02-expedientes.md §2.3).
 *
 * Está armada para que se vea la pestaña entera con un trámite típico: los dos
 * **decretos que abren etapa** —que son los que la historia distingue—, la
 * cédula con la que se notificó el traslado, un oficio, el informe del
 * actuario, lo que presentó el estudio, lo que presentó la contraria y el acta
 * del mediador.
 *
 * Las dos fechas que el expediente guarda en su ficha salen de acá: la etapa
 * `contestacion` desde el 15/09 la abrió el último decreto, y el último
 * movimiento útil es la fecha de ese mismo decreto, que es el acto de impulso
 * más reciente. Los textos son **inventados** y están recortados: alcanzan para
 * ver cómo se consulta una actuación, no son modelos de redacción judicial.
 */
export const HISTORIA_EJEMPLO: EntradaHistoria[] = [
  {
    id: "hi-rogel-mediacion",
    expedienteId: "ex-rogel",
    fecha: "2026-08-20",
    fechaNotificacion: "",
    tipo: "escrito_auxiliar",
    subtipo: "acta",
    origen: "abogado",
    titulo: "Acta de cierre de la mediación prejudicial, sin acuerdo",
    texto:
      "En la ciudad de San Miguel de Tucumán, a los veinte días del mes de agosto de 2026, en el centro de mediación, comparecen el requirente y la requerida por medio de apoderado. Abierto el acto, la requerida manifiesta que no formulará propuesta. Se da por cerrada la mediación sin acuerdo, quedando expedita la vía judicial.",
    abreEtapa: "",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-demanda",
    expedienteId: "ex-rogel",
    fecha: "2026-08-25",
    fechaNotificacion: "",
    tipo: "escrito_propio",
    subtipo: "demanda",
    origen: "abogado",
    titulo: "Demanda de daños y perjuicios contra la ART",
    texto:
      "Interpone demanda de daños y perjuicios por el accidente de trabajo del 12 de marzo de 2026. Reclama incapacidad parcial permanente, daño moral y gastos de tratamiento. Ofrece prueba documental, informativa y pericial médica. Acompaña acta de cierre de la mediación.",
    abreEtapa: "demanda",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-traslado",
    expedienteId: "ex-rogel",
    fecha: "2026-09-02",
    fechaNotificacion: "2026-09-04",
    tipo: "actuacion_juzgado",
    subtipo: "decreto",
    origen: "abogado",
    titulo: "Provee la demanda y ordena traslado por diez días",
    texto:
      "San Miguel de Tucumán, 2 de septiembre de 2026. Por presentado, por parte en el carácter invocado y con el domicilio legal constituido. Téngase por interpuesta la demanda. Córrase traslado de la misma a la demandada por el término de diez días, bajo apercibimiento de ley. Notifíquese.",
    abreEtapa: "traslado",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-cedula",
    expedienteId: "ex-rogel",
    fecha: "2026-09-04",
    fechaNotificacion: "2026-09-04",
    tipo: "actuacion_juzgado",
    subtipo: "cedula",
    origen: "abogado",
    titulo: "Cédula de notificación del traslado, diligenciada en el domicilio de la demandada",
    texto:
      "Se notifica a la demandada del decreto de fecha 2 de septiembre de 2026, que ordena el traslado de la demanda por diez días. Se deja copia de la demanda y de la documental acompañada.",
    abreEtapa: "",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-oficio",
    expedienteId: "ex-rogel",
    fecha: "2026-09-08",
    fechaNotificacion: "",
    tipo: "actuacion_juzgado",
    subtipo: "oficio",
    origen: "abogado",
    titulo: "Oficio al hospital para que remita la historia clínica del actor",
    texto:
      "Se libra oficio al establecimiento asistencial a fin de que remita copia íntegra y certificada de la historia clínica del actor, correspondiente a la atención del 12 de marzo de 2026.",
    abreEtapa: "",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-contestacion",
    expedienteId: "ex-rogel",
    fecha: "2026-09-12",
    fechaNotificacion: "",
    tipo: "escrito_contraria",
    subtipo: "contestacion",
    origen: "abogado",
    titulo: "La ART contesta la demanda, niega el nexo causal y ofrece prueba",
    texto:
      "Contesta demanda. Niega todos y cada uno de los hechos que no sean objeto de expreso reconocimiento. Reconoce la cobertura vigente y la denuncia del siniestro. Niega el grado de incapacidad invocado y el nexo causal con las tareas. Ofrece prueba pericial médica y documental.",
    abreEtapa: "",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-actuario",
    expedienteId: "ex-rogel",
    fecha: "2026-09-14",
    fechaNotificacion: "",
    tipo: "actuacion_juzgado",
    subtipo: "informe_actuarial",
    origen: "abogado",
    titulo: "El actuario informa que la contestación se presentó en término",
    texto:
      "Informo que, notificado el traslado el 4 de septiembre de 2026, el plazo de diez días hábiles venció el 18 de septiembre de 2026, y que la contestación de demanda fue presentada el 12 de septiembre de 2026, es decir, en término. Conste.",
    abreEtapa: "",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
  {
    id: "hi-rogel-preliminar",
    expedienteId: "ex-rogel",
    fecha: "2026-09-15",
    fechaNotificacion: "2026-09-17",
    tipo: "actuacion_juzgado",
    subtipo: "decreto",
    origen: "abogado",
    titulo: "Tiene por contestada la demanda y fija la audiencia preliminar",
    texto:
      "San Miguel de Tucumán, 15 de septiembre de 2026. Téngase por contestada la demanda en tiempo y forma. Téngase presente la prueba ofrecida para su oportunidad. Fíjase audiencia preliminar para el día 16 de octubre de 2026 a las 09:30 horas, debiendo comparecer las partes personalmente, bajo apercibimiento de ley. Notifíquese.",
    abreEtapa: "contestacion",
    creadoEn: AHORA,
    actualizadoEn: AHORA,
  },
];
