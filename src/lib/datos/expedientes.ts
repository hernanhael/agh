import { randomUUID } from "node:crypto";
import { importeDesdeTexto } from "@/lib/contabilidad/importe";
import {
  construirCaratula,
  nombrePropio,
  normalizarEspacios,
  normalizarParaBuscar,
  numeroExpediente,
  oracion,
  partirCaratula,
  titulo,
} from "@/lib/formato";
import { tieneMarcas } from "@/lib/notas";
import { fechaValida } from "@/lib/plazos/calendario";
import { ahora, hoy, leerDatos, modificarDatos } from "./almacen";
import { oficinaGestion } from "./filtros";
import { correcto, fallo, type Resultado } from "./resultado";
import type {
  CentroJudicial,
  ClaseExpediente,
  ConceptoMonto,
  EstadoExpediente,
  Expediente,
  Moneda,
  RolCliente,
  TipoProceso,
} from "./tipos";

/**
 * Expedientes: alta, edición y baja.
 *
 * Al dar de alta, el abogado elige el **tipo de proceso** y con eso el
 * expediente queda posicionado en la primera etapa de esa plantilla
 * (docs/02-expedientes.md §2.1). La carátula se escribe o se pega como venga
 * y se guarda ya normalizada, junto con sus tres componentes.
 */

export interface EntradaExpediente {
  numero: string;
  anio: string;
  /** Carátula tal como la escribe o la pega el abogado. */
  caratula: string;
  tipoProcesoId: string;
  /** Clave de etapa. Si viene vacía, se usa la primera del tipo de proceso. */
  etapaActual: string;
  centroJudicial: CentroJudicial;
  fuero: string;
  materia: string;
  rolCliente: RolCliente;
  estado: EstadoExpediente;
  notas: string;
  /** Radicación: tipo de juzgado, nominación y Oficina de Gestión Asociada. */
  juzgadoTipo: string;
  juzgadoNumero: string;
  oficinaGestion: string;
  /** Principal o incidente: decide el plazo de caducidad (seis o tres meses). */
  clase: ClaseExpediente;
  /** Fecha del último movimiento. Si viene vacía, se usa la de hoy. */
  ultimoMovimiento: string;
  /** Fecha en que el juzgado declaró la caducidad, si la declaró. */
  caducidadDeclarada: string;
  /** Audiencia fijada, si hay una. */
  audienciaTipo: string;
  audienciaFecha: string;
  audienciaHora: string;
  /** Fechas clave. Una fecha mal escrita se guarda vacía. */
  fechaMediacion: string;
  fechaDemanda: string;
  fechaRadicacion: string;
  fechaSentencia: string;
  fechaFirmeza: string;
  /** Monto escrito a mano ("$ 1.234.567,89"). Vacío si no hay monto. */
  monto: string;
  montoConcepto: ConceptoMonto;
  moneda: Moneda;
  /** Fecha a la que está expresado el monto. Si falta, la de hoy. */
  montoFecha: string;
  /** Etiquetas separadas por coma, tal como se escriben en el formulario. */
  etiquetas: string;
}

/** Si el expediente está en la papelera. */
export function enPapelera(expediente: Expediente): boolean {
  return Boolean(expediente.enPapeleraDesde);
}

/**
 * Los expedientes vigentes: los de la papelera no aparecen en ningún listado
 * hasta que se restauran.
 */
export async function listarExpedientes(): Promise<Expediente[]> {
  const { expedientes } = await leerDatos();
  return expedientes
    .filter((expediente) => !enPapelera(expediente))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

/** Los expedientes de la papelera, el último que entró primero. */
export async function listarPapelera(): Promise<Expediente[]> {
  const { expedientes } = await leerDatos();
  return expedientes
    .filter(enPapelera)
    .sort((a, b) => (b.enPapeleraDesde ?? "").localeCompare(a.enPapeleraDesde ?? ""));
}

/**
 * Un expediente por su identificador, **también si está en la papelera**: la
 * ficha de un expediente borrado se sigue pudiendo abrir, con el aviso y el
 * botón para restaurarlo.
 */
export async function obtenerExpediente(id: string): Promise<Expediente | undefined> {
  const { expedientes } = await leerDatos();
  return expedientes.find((expediente) => expediente.id === id);
}

/** Las etiquetas que ya se usaron, para sugerirlas en el formulario. */
export async function listarEtiquetas(): Promise<string[]> {
  const { expedientes } = await leerDatos();
  const etiquetas = new Set<string>();
  for (const expediente of expedientes) {
    for (const etiqueta of expediente.etiquetas ?? []) etiquetas.add(etiqueta);
  }
  return [...etiquetas].sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Juzgados y Oficinas de Gestión Asociada que ya se usaron, para sugerirlos en
 * el alta sin obligar a elegir de una lista cerrada. Es el mismo criterio que
 * `listarMaterias` y desaparece cuando exista el catálogo de juzgados de
 * Configuración (`courts` en docs/06-modelo-de-datos.md).
 */
export async function listarRadicaciones(): Promise<{
  juzgados: string[];
  nominaciones: string[];
  oficinasGestion: string[];
}> {
  const { expedientes } = await leerDatos();
  const ordenar = (valores: Set<string>) =>
    [...valores].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));

  return {
    juzgados: ordenar(new Set(expedientes.map((expediente) => expediente.juzgadoTipo ?? ""))),
    nominaciones: ordenar(new Set(expedientes.map((expediente) => expediente.juzgadoNumero ?? ""))),
    oficinasGestion: ordenar(new Set(expedientes.map(oficinaGestion))),
  };
}

// La búsqueda, los filtros y `identificador` viven en `./filtros`, que es un
// módulo puro: el listado los usa en el cliente para filtrar mientras se tipea.

/** 'HH:mm' en formato de 24 horas; vacía si no lo es. */
function hora(valor: string): string {
  const limpio = normalizarEspacios(valor);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(limpio) ? limpio : "";
}

/**
 * Nominación del juzgado en mayúsculas: se escribe en números romanos ("VI") y
 * el SAE la muestra así, pero el abogado puede cargar "6" y se respeta.
 */
function nominacion(valor: string): string {
  return normalizarEspacios(valor).toUpperCase();
}

/**
 * Etiquetas escritas separadas por coma: cada una con forma de título, sin
 * repetidas —"urgente" y "URGENTE" son la misma— y en el orden en que se
 * escribieron.
 */
export function normalizarEtiquetas(texto: string, acentuar: boolean): string[] {
  const vistas = new Set<string>();
  const etiquetas: string[] = [];
  for (const cruda of texto.split(/[,;\n]/)) {
    const etiqueta = titulo(cruda, { acentuar });
    const clave = normalizarParaBuscar(etiqueta);
    if (!clave || vistas.has(clave)) continue;
    vistas.add(clave);
    etiquetas.push(etiqueta);
  }
  return etiquetas;
}

/**
 * El monto con sus datos, o todo vacío si no hay monto. Un monto que no se
 * puede leer es un error y no un vacío: perderlo en silencio al guardar sería
 * peor que pedir que se corrija.
 */
function monto(
  entrada: EntradaExpediente,
):
  | { ok: true; campos: Pick<Expediente, "montoCentavos" | "montoConcepto" | "moneda" | "montoFecha"> }
  | { ok: false; error: string } {
  if (!entrada.monto.trim()) {
    return {
      ok: true,
      campos: {
        montoCentavos: undefined,
        montoConcepto: undefined,
        moneda: undefined,
        montoFecha: undefined,
      },
    };
  }
  const centavos = importeDesdeTexto(entrada.monto);
  if (centavos === undefined) {
    return { ok: false, error: `No se entiende el monto "${entrada.monto.trim()}".` };
  }
  return {
    ok: true,
    campos: {
      montoCentavos: centavos,
      montoConcepto: entrada.montoConcepto === "base_regulatoria" ? "base_regulatoria" : "reclamado",
      moneda: entrada.moneda === "USD" ? "USD" : "ARS",
      // Sin fecha, el monto está expresado al día en que se cargó.
      montoFecha: fechaValida(entrada.montoFecha) || hoy(),
    },
  };
}

/**
 * Normaliza lo que cargó el abogado: la carátula se parte en actor,
 * demandado y objeto, cada uno se formatea según lo que es, y la carátula se
 * vuelve a armar desde esos componentes.
 */
function normalizar(entrada: EntradaExpediente, acentuar: boolean) {
  const opciones = { acentuar };
  const partes = partirCaratula(entrada.caratula);
  const identificacion = numeroExpediente(entrada.numero, entrada.anio);
  const [numero, anio] = identificacion ? identificacion.split("/") : ["", ""];
  // Sin fecha no hay audiencia fijada: el tipo y la hora sueltos serían un
  // resto de una audiencia que ya pasó o que se dio de baja.
  const audienciaFecha = fechaValida(entrada.audienciaFecha);

  return {
    numero,
    anio,
    actor: nombrePropio(partes.actor, opciones),
    demandado: nombrePropio(partes.demandado, opciones),
    objeto: titulo(partes.objeto, opciones),
    caratula: construirCaratula(partes, opciones),
    materia: titulo(entrada.materia, opciones),
    fuero: entrada.fuero,
    centroJudicial: entrada.centroJudicial,
    rolCliente: entrada.rolCliente,
    estado: entrada.estado,
    /*
     * La nota se normaliza como texto libre **solo si no tiene formato**. Una
     * nota con marcas (`lib/notas`) viene del editor de la ficha, y `oracion`
     * le sacaría el espacio antes de cada `]` y le recalcularía las mayúsculas
     * contando las marcas como parte de la oración: la dejaría desarmada. Las
     * notas sin marcas se siguen normalizando igual que antes.
     */
    notas: tieneMarcas(entrada.notas) ? entrada.notas.trim() : oracion(entrada.notas),
    juzgadoTipo: titulo(entrada.juzgadoTipo, opciones),
    juzgadoNumero: nominacion(entrada.juzgadoNumero),
    oficinaGestion: titulo(entrada.oficinaGestion, opciones),
    clase: entrada.clase === "incidente" ? ("incidente" as const) : ("principal" as const),
    // Una fecha mal escrita no se guarda a medias: queda vacía y el cómputo de
    // la caducidad cae en la fecha de la etapa, que es un dato que sí existe.
    ultimoMovimiento: fechaValida(entrada.ultimoMovimiento),
    caducidadDeclarada: fechaValida(entrada.caducidadDeclarada),
    audienciaFecha,
    audienciaTipo: audienciaFecha ? titulo(entrada.audienciaTipo, opciones) : "",
    audienciaHora: audienciaFecha ? hora(entrada.audienciaHora) : "",
    fechaMediacion: fechaValida(entrada.fechaMediacion),
    fechaDemanda: fechaValida(entrada.fechaDemanda),
    fechaRadicacion: fechaValida(entrada.fechaRadicacion),
    fechaSentencia: fechaValida(entrada.fechaSentencia),
    fechaFirmeza: fechaValida(entrada.fechaFirmeza),
    etiquetas: normalizarEtiquetas(entrada.etiquetas, acentuar),
  };
}

/**
 * El aviso de número repetido. Un expediente en la papelera también ocupa su
 * número —se puede restaurar—, y el aviso lo dice para que no se lo busque en
 * el listado.
 */
function yaExiste(repetido: Expediente, numero: string, anio: string): string {
  return enPapelera(repetido)
    ? `El expediente ${numero}/${anio} de ese centro judicial está en la papelera: restauralo en lugar de cargarlo de nuevo.`
    : `Ya hay un expediente ${numero}/${anio} en ese centro judicial.`;
}

/** La etapa pedida si existe en el tipo de proceso; si no, la primera. */
function etapaInicial(tipo: TipoProceso, etapaPedida: string): string {
  if (etapaPedida && tipo.etapas.some((etapa) => etapa.clave === etapaPedida)) return etapaPedida;
  return tipo.etapas[0]?.clave ?? "";
}

export async function crearExpediente(
  entrada: EntradaExpediente,
): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.numero || !campos.anio) {
      return fallo<Expediente>("El expediente necesita número y año (por ejemplo 1234 y 26).");
    }
    if (!campos.caratula) return fallo<Expediente>("El expediente necesita una carátula.");

    const tipo = datos.tiposProceso.find((candidato) => candidato.id === entrada.tipoProcesoId);
    if (!tipo) return fallo<Expediente>("Elegí el tipo de proceso del juicio.");

    const conMonto = monto(entrada);
    if (!conMonto.ok) return fallo<Expediente>(conMonto.error);

    const repetido = datos.expedientes.find(
      (expediente) =>
        expediente.numero === campos.numero &&
        expediente.anio === campos.anio &&
        expediente.centroJudicial === campos.centroJudicial,
    );
    if (repetido) return fallo<Expediente>(yaExiste(repetido, campos.numero, campos.anio));

    const marca = ahora();
    const nuevo: Expediente = {
      id: randomUUID(),
      ...campos,
      ...conMonto.campos,
      tipoProcesoId: tipo.id,
      etapaActual: etapaInicial(tipo, entrada.etapaActual),
      etapaDesde: hoy(),
      // Dar de alta el expediente cuenta como movimiento: sin esto, un
      // expediente nuevo con la fecha en blanco nacería para caducidad.
      ultimoMovimiento: campos.ultimoMovimiento || hoy(),
      creadoEn: marca,
      actualizadoEn: marca,
    };
    datos.expedientes.push(nuevo);
    return correcto(nuevo);
  });
}

export async function actualizarExpediente(
  id: string,
  entrada: EntradaExpediente,
): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find((candidato) => candidato.id === id);
    if (!expediente) return fallo<Expediente>("No se encontró el expediente.");

    const campos = normalizar(entrada, datos.estudio.correccionDeTildes);
    if (!campos.numero || !campos.anio) {
      return fallo<Expediente>("El expediente necesita número y año (por ejemplo 1234 y 26).");
    }
    if (!campos.caratula) return fallo<Expediente>("El expediente necesita una carátula.");

    const tipo = datos.tiposProceso.find((candidato) => candidato.id === entrada.tipoProcesoId);
    if (!tipo) return fallo<Expediente>("Elegí el tipo de proceso del juicio.");

    const conMonto = monto(entrada);
    if (!conMonto.ok) return fallo<Expediente>(conMonto.error);

    const repetido = datos.expedientes.find(
      (otro) =>
        otro.id !== id &&
        otro.numero === campos.numero &&
        otro.anio === campos.anio &&
        otro.centroJudicial === campos.centroJudicial,
    );
    if (repetido) return fallo<Expediente>(yaExiste(repetido, campos.numero, campos.anio));

    const etapa = etapaInicial(tipo, entrada.etapaActual);
    const cambioDeEtapa = etapa !== expediente.etapaActual;

    Object.assign(expediente, campos, conMonto.campos, {
      tipoProcesoId: tipo.id,
      etapaActual: etapa,
      etapaDesde: cambioDeEtapa ? hoy() : expediente.etapaDesde,
      // Pasar de etapa es un movimiento del expediente, así que corre de nuevo
      // el plazo de caducidad. Si el abogado no tocó la fecha, se conserva la
      // que había en lugar de borrarla.
      ultimoMovimiento:
        campos.ultimoMovimiento || (cambioDeEtapa ? hoy() : (expediente.ultimoMovimiento ?? "")),
      actualizadoEn: ahora(),
    });
    return correcto(expediente);
  });
}

/**
 * Guarda la nota del expediente y nada más (docs/02-expedientes.md §2.1).
 *
 * Tiene su propia función y no pasa por `actualizarExpediente` por dos
 * motivos. Uno: la nota se edita con un clic en la ficha, así que guardarla no
 * puede exigir el resto del formulario ni fallar porque falte la carátula.
 * Dos: la nota lleva **marcas de formato** (`lib/notas`) y el normalizador de
 * texto libre las desarmaría —`oracion` saca los espacios antes de un `]` y
 * recalcula las mayúsculas de cada oración—, así que acá se guarda tal como
 * vino, sin más que recortar los extremos.
 */
export async function actualizarNotasExpediente(
  id: string,
  notas: string,
): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find((candidato) => candidato.id === id);
    if (!expediente) return fallo<Expediente>("No se encontró el expediente.");
    expediente.notas = notas.trim();
    expediente.actualizadoEn = ahora();
    return correcto(expediente);
  });
}

/**
 * Manda el expediente a la papelera: deja de aparecer en los listados, pero
 * conserva todo lo suyo y se puede restaurar (`restaurarExpediente`).
 */
export async function mandarAPapelera(id: string): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find((candidato) => candidato.id === id);
    if (!expediente) return fallo<Expediente>("No se encontró el expediente.");
    if (enPapelera(expediente)) return fallo<Expediente>("El expediente ya está en la papelera.");
    expediente.enPapeleraDesde = ahora();
    return correcto(expediente);
  });
}

/** Saca el expediente de la papelera y lo devuelve a su listado. */
export async function restaurarExpediente(id: string): Promise<Resultado<Expediente>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find((candidato) => candidato.id === id);
    if (!expediente) return fallo<Expediente>("No se encontró el expediente.");
    if (!enPapelera(expediente)) return fallo<Expediente>("El expediente no está en la papelera.");
    delete expediente.enPapeleraDesde;
    return correcto(expediente);
  });
}

/**
 * Borra el expediente **para siempre**, junto con sus partes, su historia y su
 * contabilidad, que sin el expediente no tienen a qué pertenecer.
 *
 * Solo se borra lo que ya está en la papelera: es el segundo paso de una baja,
 * nunca el primero.
 */
export async function eliminarExpediente(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    const indice = datos.expedientes.findIndex((expediente) => expediente.id === id);
    if (indice === -1) return fallo<string>("No se encontró el expediente.");
    if (!enPapelera(datos.expedientes[indice])) {
      return fallo<string>("Solo se borra definitivamente un expediente que está en la papelera.");
    }
    const [borrado] = datos.expedientes.splice(indice, 1);
    datos.partes = (datos.partes ?? []).filter((parte) => parte.expedienteId !== id);
    datos.historia = (datos.historia ?? []).filter((entrada) => entrada.expedienteId !== id);
    datos.gastos = (datos.gastos ?? []).filter((gasto) => gasto.expedienteId !== id);
    return correcto(borrado.caratula);
  });
}
