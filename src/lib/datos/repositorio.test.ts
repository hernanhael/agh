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
import { actualizarEstudio, obtenerEstudio } from "./estudio";
import {
  crearExpediente,
  listarExpedientes,
  obtenerExpediente,
} from "./expedientes";
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
  it("guarda el nombre como nombre propio y el domicilio en minúsculas", async () => {
    const resultado = await actualizarEstudio({
      nombre: "HERNAN ROGEL",
      matricula: " CAT 1234 ",
      cuit: "20-12345678-9",
      domicilioElectronico: "Estudio@Ejemplo.COM",
      telefono: "381 555 1234",
      centroJudicialHabitual: "concepcion",
      modeloPorDefecto: "anthropic/claude-opus-5",
      correccionDeTildes: true,
    });
    if (!resultado.ok) throw new Error(resultado.error);

    expect(resultado.valor.nombre).toBe("Hernán Rogel");
    expect(resultado.valor.matricula).toBe("CAT 1234");
    expect(resultado.valor.domicilioElectronico).toBe("estudio@ejemplo.com");
  });

  it("al desactivar la corrección de tildes, deja los nombres como se escribieron", async () => {
    await actualizarEstudio({
      nombre: "Hernán Rogel",
      matricula: "CAT 1234",
      cuit: "",
      domicilioElectronico: "",
      telefono: "",
      centroJudicialHabitual: "capital",
      modeloPorDefecto: "anthropic/claude-opus-5",
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
