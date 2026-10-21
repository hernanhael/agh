import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clonarAgente,
  crearAgente,
  eliminarAgente,
  listarAgentes,
  obtenerAgente,
} from "./agentes";
import { hoy } from "./almacen";
import { FORMATO_ESCRITO } from "./tipos";
import { actualizarEstudio, obtenerEstudio } from "./estudio";
import {
  crearExpediente,
  listarExpedientes,
  obtenerExpediente,
} from "./expedientes";
import {
  actualizarEntradaHistoria,
  crearEntradaHistoria,
  eliminarEntradaHistoria,
  listarHistoria,
} from "./historia";
import {
  actualizarParte,
  crearParte,
  eliminarParte,
  listarPartes,
  sumarParteDeCaratula,
} from "./partes";
import {
  actualizarTipoProceso,
  crearTipoProceso,
  eliminarTipoProceso,
  listarTiposProceso,
} from "./procesos";

/**
 * Tests de los repositorios sobre un almacén temporal: verifican que lo que
 * carga el abogado se guarde normalizado y que las reglas de integridad
 * (números repetidos, tipo de proceso en uso) se respeten.
 */

let carpeta: string;

beforeEach(async () => {
  carpeta = await mkdtemp(join(tmpdir(), "agh-datos-"));
  process.env.AGH_ARCHIVO_DATOS = join(carpeta, "estudio.json");
});

afterEach(async () => {
  delete process.env.AGH_ARCHIVO_DATOS;
  await rm(carpeta, { recursive: true, force: true });
});

const EXPEDIENTE_BASE = {
  // Un número que no usan los expedientes de ejemplo, para no chocar con ellos.
  numero: "9001",
  anio: "2026",
  caratula: "NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y Perjuicios",
  tipoProcesoId: "tp-ordinario",
  etapaActual: "",
  centroJudicial: "capital" as const,
  fuero: "Civil y Comercial Común",
  materia: "danos y perjuicios",
  rolCliente: "actor" as const,
  estado: "en_tramite" as const,
  notas: "SE PRESENTO LA DEMANDA EL LUNES",
  juzgadoTipo: "civil y comercial comun",
  juzgadoNumero: "vi",
  oficinaGestion: "oga civil y comercial capital",
  clase: "principal" as const,
  // Vacías a propósito: así se ejercita que el alta resuelve el último
  // movimiento y que una audiencia sin fecha no se guarda.
  ultimoMovimiento: "",
  caducidadDeclarada: "",
  audienciaTipo: "",
  audienciaFecha: "",
  audienciaHora: "",
};

describe("almacén", () => {
  it("arranca con los ejemplos del sistema", async () => {
    const tipos = await listarTiposProceso();
    const agentes = await listarAgentes();
    expect(tipos.map((tipo) => tipo.nombre)).toContain("Conocimiento Ordinario");
    expect(tipos.map((tipo) => tipo.nombre)).toContain("Expropiación");
    expect(agentes).toHaveLength(5);
    expect(tipos.every((tipo) => tipo.origen === "ejemplo")).toBe(true);
  });
});

describe("expedientes", () => {
  it("guarda la carátula normalizada y sus tres componentes", async () => {
    const resultado = await crearExpediente(EXPEDIENTE_BASE);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.valor.caratula).toBe(
      "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios",
    );
    expect(resultado.valor.actor).toBe("Nicolás Rogel");
    expect(resultado.valor.demandado).toBe("Swiss Medical ART");
    expect(resultado.valor.objeto).toBe("Daños y Perjuicios");
    // La materia es un título; las notas, texto libre.
    expect(resultado.valor.materia).toBe("Daños y Perjuicios");
    expect(resultado.valor.notas).toBe("Se presento la demanda el lunes");
    // El año se guarda con el formato del SAE.
    expect(resultado.valor.anio).toBe("26");
  });

  it("posiciona el expediente en la primera etapa del tipo de proceso elegido", async () => {
    const resultado = await crearExpediente(EXPEDIENTE_BASE);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.etapaActual).toBe("mediacion");
  });

  it("respeta la etapa pedida si existe en el tipo de proceso", async () => {
    const resultado = await crearExpediente({ ...EXPEDIENTE_BASE, etapaActual: "prueba" });
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.etapaActual).toBe("prueba");
  });

  it("descarta una etapa que no pertenece al tipo de proceso", async () => {
    const resultado = await crearExpediente({
      ...EXPEDIENTE_BASE,
      etapaActual: "lanzamiento", // es del desalojo
    });
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.etapaActual).toBe("mediacion");
  });

  it("no acepta un expediente sin tipo de proceso", async () => {
    const resultado = await crearExpediente({ ...EXPEDIENTE_BASE, tipoProcesoId: "" });
    expect(resultado).toEqual({ ok: false, error: "Elegí el tipo de proceso del juicio." });
  });

  it("no acepta el mismo número y año en el mismo centro judicial", async () => {
    expect((await crearExpediente(EXPEDIENTE_BASE)).ok).toBe(true);
    const repetido = await crearExpediente({ ...EXPEDIENTE_BASE, caratula: "OTRA CARATULA" });
    expect(repetido.ok).toBe(false);
    // El mismo número en otro centro judicial sí se puede.
    const otroCentro = await crearExpediente({
      ...EXPEDIENTE_BASE,
      centroJudicial: "monteros",
    });
    expect(otroCentro.ok).toBe(true);
  });

  it("exige número, año y carátula", async () => {
    expect((await crearExpediente({ ...EXPEDIENTE_BASE, numero: "" })).ok).toBe(false);
    expect((await crearExpediente({ ...EXPEDIENTE_BASE, anio: "" })).ok).toBe(false);
    expect((await crearExpediente({ ...EXPEDIENTE_BASE, caratula: "  " })).ok).toBe(false);
  });

  it("normaliza la radicación y resuelve el último movimiento", async () => {
    const resultado = await crearExpediente({
      ...EXPEDIENTE_BASE,
      audienciaTipo: "audiencia preliminar",
    });
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.juzgadoTipo).toBe("Civil y Comercial Común");
    // La nominación va en mayúsculas, como la muestra el SAE.
    expect(resultado.valor.juzgadoNumero).toBe("VI");
    expect(resultado.valor.oficinaGestion).toBe("OGA Civil y Comercial Capital");
    // El alta es un movimiento: sin fecha cargada, se usa la de hoy.
    expect(resultado.valor.ultimoMovimiento).toBe(hoy());
    // Un tipo de audiencia sin fecha no es una audiencia fijada.
    expect(resultado.valor.audienciaTipo).toBe("");
  });

  it("descarta las fechas mal escritas en lugar de guardarlas a medias", async () => {
    const resultado = await crearExpediente({
      ...EXPEDIENTE_BASE,
      ultimoMovimiento: "2026-02-31", // febrero no tiene 31
      caducidadDeclarada: "20/09/2026", // no es el formato que se guarda
      audienciaFecha: "2026-10-16",
      audienciaHora: "25:00",
    });
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.ultimoMovimiento).toBe(hoy());
    expect(resultado.valor.caducidadDeclarada).toBe("");
    expect(resultado.valor.audienciaFecha).toBe("2026-10-16");
    expect(resultado.valor.audienciaHora).toBe("");
  });

  it("persiste entre lecturas", async () => {
    const creado = await crearExpediente(EXPEDIENTE_BASE);
    if (!creado.ok) throw new Error(creado.error);
    const leido = await obtenerExpediente(creado.valor.id);
    expect(leido?.caratula).toBe("Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios");
    expect(await listarExpedientes()).toHaveLength(8); // siete de ejemplo + el nuevo
  });
});

describe("tipos de proceso", () => {
  const NUEVO = {
    nombre: "proceso de amparo",
    descripcion: "PARA CASOS URGENTES",
    materias: ["amparo", " "],
    etapas: ["demanda", "INFORME DEL ART 8", "sentencia"],
    activo: true,
  };

  it("normaliza el nombre, la descripción, las materias y las etapas", async () => {
    const resultado = await crearTipoProceso(NUEVO);
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.nombre).toBe("Proceso de Amparo");
    expect(resultado.valor.clave).toBe("proceso_de_amparo");
    expect(resultado.valor.descripcion).toBe("Para casos urgentes");
    expect(resultado.valor.materias).toEqual(["Amparo"]);
    expect(resultado.valor.etapas).toEqual([
      { clave: "demanda", nombre: "Demanda", orden: 1 },
      { clave: "informe_del_art_8", nombre: "Informe del ART 8", orden: 2 },
      { clave: "sentencia", nombre: "Sentencia", orden: 3 },
    ]);
    expect(resultado.valor.origen).toBe("propio");
  });

  it("no acepta dos tipos de proceso con el mismo nombre", async () => {
    await crearTipoProceso(NUEVO);
    const repetido = await crearTipoProceso({ ...NUEVO, nombre: "PROCESO DE AMPARO" });
    expect(repetido.ok).toBe(false);
  });

  it("exige un nombre", async () => {
    expect((await crearTipoProceso({ ...NUEVO, nombre: "   " })).ok).toBe(false);
  });

  it("se puede desactivar para que no aparezca en las altas nuevas", async () => {
    const tipos = await listarTiposProceso();
    const ordinario = tipos.find((tipo) => tipo.id === "tp-ordinario");
    if (!ordinario) throw new Error("falta el ejemplo");

    const resultado = await actualizarTipoProceso(ordinario.id, {
      nombre: ordinario.nombre,
      descripcion: ordinario.descripcion,
      materias: ordinario.materias,
      etapas: ordinario.etapas.map((etapa) => etapa.nombre),
      activo: false,
    });
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.activo).toBe(false);
    // Las etapas sobreviven al ida y vuelta por el formulario.
    expect(resultado.valor.etapas).toEqual(ordinario.etapas);
  });

  it("no se puede borrar si algún expediente lo usa", async () => {
    const resultado = await eliminarTipoProceso("tp-ordinario");
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    // Dos ejemplos usan el ordinario: el principal de Rogel y el incidente.
    expect(resultado.error).toContain("2 expedientes lo usan");
  });

  it("al borrar uno libre, lo quita de los agentes que lo tenían asignado", async () => {
    const borrado = await eliminarTipoProceso("tp-sumarisimo");
    expect(borrado.ok).toBe(true);

    const agentes = await listarAgentes();
    expect(
      agentes.every((agente) => !agente.tiposProcesoIds.includes("tp-sumarisimo")),
    ).toBe(true);
  });
});

describe("agentes", () => {
  const NUEVO = {
    nombre: "especialista en prescripcion",
    descripcion: "ANALIZA PLAZOS DE PRESCRIPCION",
    rol: "especialista" as const,
    rama: "civil y comercial",
    especialidades: ["prescripcion", "danos y perjuicios"],
    tiposProcesoIds: ["tp-ordinario", "no-existe"],
    instrucciones: "RESPONDE SOLO CON LAS FUENTES CARGADAS.",
    guiasComportamiento: "NO ESTIMES PLAZOS",
    modoConocimiento: "solo_fuentes" as const,
    modelo: "anthropic/claude-opus-5",
    activo: true,
  };

  it("normaliza el nombre, la rama, las especialidades y los textos", async () => {
    const resultado = await crearAgente(NUEVO);
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.nombre).toBe("Especialista en Prescripción");
    expect(resultado.valor.rama).toBe("Civil y Comercial");
    expect(resultado.valor.especialidades).toEqual(["Prescripción", "Daños y Perjuicios"]);
    expect(resultado.valor.instrucciones).toBe("Responde solo con las fuentes cargadas.");
    expect(resultado.valor.guiasComportamiento).toBe("No estimes plazos");
  });

  it("descarta las referencias a tipos de proceso que no existen", async () => {
    const resultado = await crearAgente(NUEVO);
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.tiposProcesoIds).toEqual(["tp-ordinario"]);
  });

  it("duplicar deja una copia propia e independiente del original", async () => {
    const copiado = await clonarAgente("ag-danos");
    if (!copiado.ok) throw new Error(copiado.error);

    expect(copiado.valor.nombre).toBe("Especialista en Daños y Perjuicios (Copia)");
    expect(copiado.valor.origen).toBe("propio");
    expect(copiado.valor.tiposProcesoIds).toEqual(["tp-ordinario", "tp-sumario"]);
    expect(copiado.valor.instrucciones).toBe(
      (await obtenerAgente("ag-danos"))?.instrucciones,
    );
  });

  it("se puede borrar", async () => {
    const borrado = await eliminarAgente("ag-consumidor");
    expect(borrado).toEqual({ ok: true, valor: "Especialista en Consumidor" });
    expect(await listarAgentes()).toHaveLength(4);
  });
});

describe("estudio", () => {
  const ESTUDIO_BASE = {
    nombre: "",
    matricula: "",
    cuit: "",
    domicilioElectronico: "",
    telefono: "",
    centroJudicialHabitual: "capital" as const,
    modeloPorDefecto: "anthropic/claude-opus-5",
    correccionDeTildes: true,
    formatoEscrito: FORMATO_ESCRITO,
  };

  it("guarda el nombre como nombre propio y el domicilio en minúsculas", async () => {
    const resultado = await actualizarEstudio({
      ...ESTUDIO_BASE,
      nombre: "HERNAN ROGEL",
      matricula: " CAT 1234 ",
      cuit: "20-12345678-9",
      domicilioElectronico: "Estudio@Ejemplo.COM",
      telefono: "381 555 1234",
      centroJudicialHabitual: "concepcion",
    });
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.nombre).toBe("Hernán Rogel");
    expect(resultado.valor.matricula).toBe("CAT 1234");
    expect(resultado.valor.domicilioElectronico).toBe("estudio@ejemplo.com");
  });

  it("al desactivar la corrección de tildes, deja los nombres como se escribieron", async () => {
    await actualizarEstudio({
      ...ESTUDIO_BASE,
      nombre: "Hernán Rogel",
      matricula: "CAT 1234",
      correccionDeTildes: false,
    });

    const resultado = await crearExpediente({
      ...EXPEDIENTE_BASE,
      caratula: "NICOLAS ROGEL C/ SWISS MEDICAL ART S/ DANOS Y PERJUICIOS",
    });
    if (!resultado.ok) throw new Error(resultado.error);
    // Sigue corrigiendo mayúsculas y espacios, pero no agrega tildes.
    expect(resultado.valor.caratula).toBe("Nicolas Rogel c/ Swiss Medical ART s/ Danos y Perjuicios");
    expect((await obtenerEstudio()).correccionDeTildes).toBe(false);
  });
});

describe("formato de los escritos", () => {
  it("acota las medidas que no son de una hoja y respeta las que sí", async () => {
    const resultado = await actualizarEstudio({
      nombre: "Hernán Rogel",
      matricula: "CAT 1234",
      cuit: "",
      domicilioElectronico: "",
      telefono: "",
      centroJudicialHabitual: "capital",
      modeloPorDefecto: "anthropic/claude-opus-5",
      correccionDeTildes: true,
      formatoEscrito: {
        ...FORMATO_ESCRITO,
        fuente: "Comic Sans",
        tamanio: 80,
        interlineado: 7,
        margenIzquierdo: 3.5,
        margenDerecho: -2,
        sangria: 1,
        caratulaNegrita: false,
      },
    });
    if (!resultado.ok) throw new Error(resultado.error);
    const formato = resultado.valor.formatoEscrito;

    // Fuera del catálogo o fuera de rango: vuelve al valor de fábrica o al tope.
    expect(formato?.fuente).toBe(FORMATO_ESCRITO.fuente);
    expect(formato?.tamanio).toBe(18);
    expect(formato?.interlineado).toBe(FORMATO_ESCRITO.interlineado);
    expect(formato?.margenDerecho).toBe(0);
    // Lo que sí es una medida de hoja se guarda tal cual.
    expect(formato?.margenIzquierdo).toBe(3.5);
    expect(formato?.sangria).toBe(1);
    expect(formato?.caratulaNegrita).toBe(false);
  });
});

describe("partes del expediente", () => {
  const PARTE_BASE = {
    expedienteId: "",
    rol: "demandado" as const,
    nombre: "ELECTRONICA DEL NORTE SRL",
    documento: " 30-12345678-9 ",
    domicilioReal: "san martin 450, san miguel de tucuman",
    domicilioElectronico: " 20-25123456-7 ",
    telefono: "381 555 0101",
    email: " Contacto@Estudio.COM ",
    representaA: "",
    esCliente: false,
    notas: "CONTESTO LA DEMANDA EL LUNES",
  };

  /** Un expediente propio al que colgarle las partes de cada test. */
  async function expedientePropio(): Promise<string> {
    const resultado = await crearExpediente(EXPEDIENTE_BASE);
    if (!resultado.ok) throw new Error(resultado.error);
    return resultado.valor.id;
  }

  it("guarda la parte normalizada: nombre propio, domicilio como título y casilla en minúscula", async () => {
    const expedienteId = await expedientePropio();
    const resultado = await crearParte({ ...PARTE_BASE, expedienteId });
    if (!resultado.ok) throw new Error(resultado.error);

    // "Electronica" no está en el diccionario de acentos, así que la tilde no
    // se inventa: la normalización arregla lo que sabe y no adivina el resto
    // (docs/10-normalizacion-de-texto.md). La sigla SRL se respeta.
    expect(resultado.valor.nombre).toBe("Electronica del Norte SRL");
    expect(resultado.valor.documento).toBe("30-12345678-9");
    expect(resultado.valor.domicilioReal).toBe("San Martín 450, San Miguel de Tucumán");
    expect(resultado.valor.domicilioElectronico).toBe("20-25123456-7");
    expect(resultado.valor.email).toBe("contacto@estudio.com");
    expect(resultado.valor.notas).toBe("Contesto la demanda el lunes");
  });

  it("no guarda una parte sin nombre", async () => {
    const expedienteId = await expedientePropio();
    const resultado = await crearParte({ ...PARTE_BASE, expedienteId, nombre: "   " });
    expect(resultado.ok).toBe(false);
  });

  it("deja un solo cliente por expediente", async () => {
    const expedienteId = await expedientePropio();
    const primera = await crearParte({
      ...PARTE_BASE,
      expedienteId,
      nombre: "Ramón Gómez",
      rol: "actor",
      esCliente: true,
    });
    const segunda = await crearParte({
      ...PARTE_BASE,
      expedienteId,
      nombre: "Mirta Gómez",
      rol: "actor",
      esCliente: true,
    });
    if (!primera.ok || !segunda.ok) throw new Error("no se crearon las partes");

    const partes = await listarPartes(expedienteId);
    expect(partes.filter((parte) => parte.esCliente).map((parte) => parte.id)).toEqual([
      segunda.valor.id,
    ]);
  });

  it("acepta que un letrado represente a una parte y rechaza la cadena de dos saltos", async () => {
    const expedienteId = await expedientePropio();
    const demandada = await crearParte({ ...PARTE_BASE, expedienteId });
    if (!demandada.ok) throw new Error(demandada.error);

    const letrado = await crearParte({
      ...PARTE_BASE,
      expedienteId,
      nombre: "Fernando Ledesma",
      rol: "letrado_contraria",
      representaA: demandada.valor.id,
    });
    if (!letrado.ok) throw new Error(letrado.error);
    expect(letrado.valor.representaA).toBe(demandada.valor.id);

    // Representar a quien ya representa a otro no se guarda: la nómina no sabe
    // dibujar un letrado de un letrado.
    const segundo = await crearParte({
      ...PARTE_BASE,
      expedienteId,
      nombre: "Laura Paz",
      rol: "letrado_contraria",
      representaA: letrado.valor.id,
    });
    if (!segundo.ok) throw new Error(segundo.error);
    expect(segundo.valor.representaA).toBe("");
  });

  it("al borrar una parte, sus letrados quedan sin representado en lugar de apuntar al vacío", async () => {
    const expedienteId = await expedientePropio();
    const demandada = await crearParte({ ...PARTE_BASE, expedienteId });
    if (!demandada.ok) throw new Error(demandada.error);
    const letrado = await crearParte({
      ...PARTE_BASE,
      expedienteId,
      nombre: "Fernando Ledesma",
      rol: "letrado_contraria",
      representaA: demandada.valor.id,
    });
    if (!letrado.ok) throw new Error(letrado.error);

    const borrada = await eliminarParte(demandada.valor.id);
    expect(borrada.ok).toBe(true);

    const partes = await listarPartes(expedienteId);
    expect(partes).toHaveLength(1);
    expect(partes[0].representaA).toBe("");
  });

  it("edita la parte conservando su identidad", async () => {
    const expedienteId = await expedientePropio();
    const creada = await crearParte({ ...PARTE_BASE, expedienteId, domicilioElectronico: "" });
    if (!creada.ok) throw new Error(creada.error);

    const guardada = await actualizarParte(creada.valor.id, {
      ...PARTE_BASE,
      expedienteId,
      domicilioElectronico: "20-30111222-3",
    });
    if (!guardada.ok) throw new Error(guardada.error);
    expect(guardada.valor.id).toBe(creada.valor.id);
    expect(guardada.valor.domicilioElectronico).toBe("20-30111222-3");
    expect(await listarPartes(expedienteId)).toHaveLength(1);
  });

  it("suma desde la carátula al actor, con el nombre ya normalizado y marcado como cliente", async () => {
    const expedienteId = await expedientePropio();
    const resultado = await sumarParteDeCaratula(expedienteId, "actor");
    if (!resultado.ok) throw new Error(resultado.error);

    // El expediente de prueba tiene al estudio del lado del actor.
    expect(resultado.valor.nombre).toBe("Nicolás Rogel");
    expect(resultado.valor.rol).toBe("actor");
    expect(resultado.valor.esCliente).toBe(true);

    const demandada = await sumarParteDeCaratula(expedienteId, "demandado");
    if (!demandada.ok) throw new Error(demandada.error);
    expect(demandada.valor.nombre).toBe("Swiss Medical ART");
    expect(demandada.valor.esCliente).toBe(false);
  });

  it("no mezcla las partes de dos expedientes", async () => {
    const uno = await expedientePropio();
    const otro = await crearExpediente({ ...EXPEDIENTE_BASE, numero: "9002" });
    if (!otro.ok) throw new Error(otro.error);

    await crearParte({ ...PARTE_BASE, expedienteId: uno });
    expect(await listarPartes(uno)).toHaveLength(1);
    expect(await listarPartes(otro.valor.id)).toHaveLength(0);
  });
});

describe("historia del expediente", () => {
  const DECRETO = {
    expedienteId: "",
    fecha: "2026-09-02",
    fechaNotificacion: "2026-09-04",
    tipo: "actuacion_juzgado" as const,
    subtipo: "decreto" as const,
    titulo: "PROVEE LA DEMANDA Y ORDENA TRASLADO POR DIEZ DIAS",
    texto: "SAN MIGUEL DE TUCUMAN, 2 DE SEPTIEMBRE DE 2026.",
    abreEtapa: "",
  };

  /** Un expediente propio al que cargarle la historia de cada test. */
  async function expedientePropio(): Promise<string> {
    const resultado = await crearExpediente(EXPEDIENTE_BASE);
    if (!resultado.ok) throw new Error(resultado.error);
    return resultado.valor.id;
  }

  it("guarda el título y el texto como oraciones, no como nombres propios", async () => {
    const expedienteId = await expedientePropio();
    const resultado = await crearEntradaHistoria({ ...DECRETO, expedienteId });
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.titulo).toBe("Provee la demanda y ordena traslado por diez dias");
    expect(resultado.valor.texto).toBe("San miguel de tucuman, 2 de septiembre de 2026.");
    expect(resultado.valor.origen).toBe("abogado");
  });

  it("no guarda una actuación sin una línea que diga qué fue", async () => {
    const expedienteId = await expedientePropio();
    const resultado = await crearEntradaHistoria({ ...DECRETO, expedienteId, titulo: "  " });
    expect(resultado.ok).toBe(false);
  });

  it("el decreto que abre una etapa mueve al expediente con la fecha del acto", async () => {
    const expedienteId = await expedientePropio();
    const antes = await obtenerExpediente(expedienteId);
    // El alta lo deja en la primera etapa del ordinario.
    expect(antes?.etapaActual).toBe("mediacion");

    const resultado = await crearEntradaHistoria({
      ...DECRETO,
      expedienteId,
      abreEtapa: "traslado",
    });
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.abreEtapa).toBe("traslado");

    const despues = await obtenerExpediente(expedienteId);
    expect(despues?.etapaActual).toBe("traslado");
    expect(despues?.etapaDesde).toBe("2026-09-02");
  });

  it("descarta una etapa que no es del tipo de proceso del expediente", async () => {
    const expedienteId = await expedientePropio();
    const resultado = await crearEntradaHistoria({
      ...DECRETO,
      expedienteId,
      abreEtapa: "lanzamiento", // es del desalojo
    });
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.valor.abreEtapa).toBe("");

    const expediente = await obtenerExpediente(expedienteId);
    expect(expediente?.etapaActual).toBe("mediacion");
  });

  it("un acto de impulso adelanta la fecha del último movimiento y una nota no", async () => {
    const expedienteId = await expedientePropio();

    await crearEntradaHistoria({ ...DECRETO, expedienteId });
    expect((await obtenerExpediente(expedienteId))?.ultimoMovimiento).toBe("2026-09-02");

    await crearEntradaHistoria({
      ...DECRETO,
      expedienteId,
      fecha: "2026-09-20",
      tipo: "nota",
      subtipo: "nota",
      titulo: "Llamó el cliente para preguntar cómo venía",
    });
    expect((await obtenerExpediente(expedienteId))?.ultimoMovimiento).toBe("2026-09-02");
  });

  it("la historia manda sobre la fecha que traía la ficha", async () => {
    const expedienteId = await expedientePropio();
    // El alta deja la fecha del último movimiento en el día de hoy.
    expect((await obtenerExpediente(expedienteId))?.ultimoMovimiento).toBe(hoy());

    await crearEntradaHistoria({ ...DECRETO, expedienteId });

    // Con un impulso cargado, la fecha pasa a ser la del acto aunque sea
    // anterior: si la historia está incompleta, el expediente se ve más quieto
    // de lo que está y el semáforo avisa de más, que es el lado seguro.
    expect((await obtenerExpediente(expedienteId))?.ultimoMovimiento).toBe("2026-09-02");
  });

  it("entre dos actuaciones, la fecha del último movimiento es la del acto más reciente", async () => {
    const expedienteId = await expedientePropio();
    await crearEntradaHistoria({ ...DECRETO, expedienteId, fecha: "2026-09-02" });
    await crearEntradaHistoria({ ...DECRETO, expedienteId, fecha: "2026-05-11" });
    // No manda el orden en que se cargaron sino la fecha de los actos.
    expect((await obtenerExpediente(expedienteId))?.ultimoMovimiento).toBe("2026-09-02");
  });

  it("corregir una actuación conserva su identidad y vuelve a repercutir", async () => {
    const expedienteId = await expedientePropio();
    const creada = await crearEntradaHistoria({ ...DECRETO, expedienteId });
    if (!creada.ok) throw new Error(creada.error);

    const guardada = await actualizarEntradaHistoria(creada.valor.id, {
      ...DECRETO,
      expedienteId,
      abreEtapa: "prueba",
    });
    if (!guardada.ok) throw new Error(guardada.error);
    expect(guardada.valor.id).toBe(creada.valor.id);

    const expediente = await obtenerExpediente(expedienteId);
    expect(expediente?.etapaActual).toBe("prueba");
    expect(await listarHistoria(expedienteId)).toHaveLength(1);
  });

  it("borrar la actuación la saca de la historia sin deshacer lo que ya movió", async () => {
    const expedienteId = await expedientePropio();
    const creada = await crearEntradaHistoria({
      ...DECRETO,
      expedienteId,
      abreEtapa: "traslado",
    });
    if (!creada.ok) throw new Error(creada.error);

    const borrada = await eliminarEntradaHistoria(creada.valor.id);
    expect(borrada.ok).toBe(true);
    expect(await listarHistoria(expedienteId)).toHaveLength(0);

    // La etapa y la fecha quedan donde estaban: se corrigen desde Datos.
    const expediente = await obtenerExpediente(expedienteId);
    expect(expediente?.etapaActual).toBe("traslado");
    expect(expediente?.ultimoMovimiento).toBe("2026-09-02");
  });

  it("devuelve la historia de la más reciente a la más antigua", async () => {
    const expedienteId = await expedientePropio();
    await crearEntradaHistoria({ ...DECRETO, expedienteId, fecha: "2026-08-25" });
    await crearEntradaHistoria({ ...DECRETO, expedienteId, fecha: "2026-09-12" });
    await crearEntradaHistoria({ ...DECRETO, expedienteId, fecha: "2026-09-02" });

    const historia = await listarHistoria(expedienteId);
    expect(historia.map((entrada) => entrada.fecha)).toEqual([
      "2026-09-12",
      "2026-09-02",
      "2026-08-25",
    ]);
  });

  it("no mezcla la historia de dos expedientes", async () => {
    const uno = await expedientePropio();
    const otro = await crearExpediente({ ...EXPEDIENTE_BASE, numero: "9003" });
    if (!otro.ok) throw new Error(otro.error);

    await crearEntradaHistoria({ ...DECRETO, expedienteId: uno });
    expect(await listarHistoria(uno)).toHaveLength(1);
    expect(await listarHistoria(otro.valor.id)).toHaveLength(0);
  });
});
