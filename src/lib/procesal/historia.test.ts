import { describe, expect, it } from "vitest";
import type { EntradaHistoria, Expediente, TipoProceso } from "@/lib/datos/tipos";
import {
  construirHistoria,
  esImpulsoProcesal,
  filtrarHistoria,
  filtroValido,
  movimientoDesdeHistoria,
  ordenarHistoria,
} from "./historia";

const HOY = "2026-09-29";

function entrada(parcial: Partial<EntradaHistoria> & { id: string }): EntradaHistoria {
  return {
    expedienteId: "ex",
    fecha: "2026-09-02",
    fechaNotificacion: "",
    tipo: "actuacion_juzgado",
    subtipo: "decreto",
    origen: "abogado",
    titulo: parcial.id,
    texto: "",
    abreEtapa: "",
    creadoEn: "2026-09-02T00:00:00.000Z",
    actualizadoEn: "2026-09-02T00:00:00.000Z",
    ...parcial,
  };
}

function expediente(parcial: Partial<Expediente>): Expediente {
  return {
    id: "ex",
    numero: "1",
    anio: "26",
    caratula: "Actor c/ Demandado s/ Objeto",
    actor: "Actor",
    demandado: "Demandado",
    objeto: "Objeto",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "traslado",
    etapaDesde: "2026-09-02",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    materia: "",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "",
    creadoEn: "2026-08-01T00:00:00.000Z",
    actualizadoEn: "2026-08-01T00:00:00.000Z",
    ...parcial,
  };
}

const TIPO: TipoProceso = {
  id: "tp-ordinario",
  clave: "ordinario",
  nombre: "Conocimiento Ordinario",
  descripcion: "",
  materias: [],
  etapas: [
    { clave: "demanda", nombre: "Demanda", orden: 1 },
    { clave: "traslado", nombre: "Traslado", orden: 2 },
    { clave: "prueba", nombre: "Prueba", orden: 3 },
  ],
  activo: true,
  origen: "ejemplo",
  creadoEn: "2026-01-01T00:00:00.000Z",
  actualizadoEn: "2026-01-01T00:00:00.000Z",
};

describe("esImpulsoProcesal", () => {
  it("impulsan las actuaciones y las presentaciones", () => {
    expect(esImpulsoProcesal("actuacion_juzgado")).toBe(true);
    expect(esImpulsoProcesal("escrito_propio")).toBe(true);
    expect(esImpulsoProcesal("escrito_contraria")).toBe(true);
    expect(esImpulsoProcesal("escrito_auxiliar")).toBe(true);
  });

  it("no impulsan una nota, un documento guardado ni una audiencia celebrada", () => {
    expect(esImpulsoProcesal("nota")).toBe(false);
    expect(esImpulsoProcesal("documento")).toBe(false);
    expect(esImpulsoProcesal("evento")).toBe(false);
  });
});

describe("ordenarHistoria", () => {
  it("de la más reciente a la más antigua, y entre las del mismo día por carga", () => {
    const ordenadas = ordenarHistoria([
      entrada({ id: "vieja", fecha: "2026-08-25" }),
      entrada({ id: "primera-del-dia", fecha: "2026-09-02", creadoEn: "2026-09-02T10:00:00Z" }),
      entrada({ id: "segunda-del-dia", fecha: "2026-09-02", creadoEn: "2026-09-02T11:00:00Z" }),
    ]);
    expect(ordenadas.map((e) => e.id)).toEqual(["segunda-del-dia", "primera-del-dia", "vieja"]);
  });
});

describe("movimientoDesdeHistoria", () => {
  it("devuelve la fecha del último acto de impulso", () => {
    const fecha = movimientoDesdeHistoria([
      entrada({ id: "decreto", fecha: "2026-09-02" }),
      entrada({ id: "escrito", fecha: "2026-09-12", tipo: "escrito_contraria" }),
      // Una nota posterior no mueve el expediente.
      entrada({ id: "nota", fecha: "2026-09-20", tipo: "nota" }),
    ]);
    expect(fecha).toBe("2026-09-12");
  });

  it("sin actos de impulso no hay fecha", () => {
    expect(movimientoDesdeHistoria([])).toBeUndefined();
    expect(movimientoDesdeHistoria([entrada({ id: "nota", tipo: "nota" })])).toBeUndefined();
  });
});

describe("filtroValido", () => {
  it("cae en 'todo' ante cualquier valor que no sea un filtro", () => {
    expect(filtroValido(undefined)).toBe("todo");
    expect(filtroValido("cualquiera")).toBe("todo");
    expect(filtroValido("juzgado")).toBe("juzgado");
  });
});

describe("construirHistoria", () => {
  it("mezcla las entradas con los hechos de la ficha, de la más reciente a la más antigua", () => {
    const filas = construirHistoria({
      expediente: expediente({ ultimoMovimiento: "", etapaDesde: "" }),
      tipo: TIPO,
      entradas: [entrada({ id: "decreto", fecha: "2026-09-02" })],
      hoy: HOY,
    });
    expect(filas.map((fila) => fila.clave)).toEqual(["decreto", "alta"]);
    expect(filas[1].titulo).toBe("Alta del expediente en el sistema");
  });

  it("nombra la etapa que abre la entrada", () => {
    const filas = construirHistoria({
      expediente: expediente({}),
      tipo: TIPO,
      entradas: [entrada({ id: "decreto", abreEtapa: "traslado" })],
      hoy: HOY,
    });
    expect(filas[0].abreEtapa).toBe("Traslado");
  });

  it("deja de mostrar el hecho de la ficha que una entrada ya cuenta mejor", () => {
    const base = {
      expediente: expediente({ etapaActual: "traslado", ultimoMovimiento: "2026-09-02" }),
      tipo: TIPO,
      hoy: HOY,
    };

    // Sin entradas, la ficha cuenta la etapa y el último movimiento.
    const sinEntradas = construirHistoria({ ...base, entradas: [] });
    expect(sinEntradas.map((fila) => fila.clave)).toContain("etapa");
    expect(sinEntradas.map((fila) => fila.clave)).toContain("movimiento");

    // El decreto que abrió la etapa esa misma fecha cuenta las dos cosas.
    const conDecreto = construirHistoria({
      ...base,
      entradas: [entrada({ id: "decreto", fecha: "2026-09-02", abreEtapa: "traslado" })],
    });
    expect(conDecreto.map((fila) => fila.clave)).not.toContain("etapa");
    expect(conDecreto.map((fila) => fila.clave)).not.toContain("movimiento");
  });

  it("una nota en la fecha del último movimiento no reemplaza al hecho de la ficha", () => {
    const filas = construirHistoria({
      expediente: expediente({ ultimoMovimiento: "2026-09-02", etapaDesde: "" }),
      tipo: TIPO,
      entradas: [entrada({ id: "nota", fecha: "2026-09-02", tipo: "nota" })],
      hoy: HOY,
    });
    // La nota no es un impulso, así que no explica esa fecha.
    expect(filas.map((fila) => fila.clave)).toContain("movimiento");
  });

  it("una audiencia que todavía no pasó es agenda y no historia", () => {
    const futura = construirHistoria({
      expediente: expediente({ audienciaTipo: "Audiencia Preliminar", audienciaFecha: "2026-10-16" }),
      tipo: TIPO,
      entradas: [],
      hoy: HOY,
    });
    expect(futura.map((fila) => fila.clave)).not.toContain("audiencia");

    const pasada = construirHistoria({
      expediente: expediente({ audienciaTipo: "Audiencia Preliminar", audienciaFecha: "2026-08-20" }),
      tipo: TIPO,
      entradas: [],
      hoy: HOY,
    });
    expect(pasada.map((fila) => fila.clave)).toContain("audiencia");
  });
});

describe("filtrarHistoria", () => {
  const filas = construirHistoria({
    expediente: expediente({}),
    tipo: TIPO,
    entradas: [
      entrada({ id: "decreto" }),
      entrada({ id: "escrito", tipo: "escrito_propio", fecha: "2026-08-25" }),
      entrada({ id: "contestacion", tipo: "escrito_contraria", fecha: "2026-09-12" }),
    ],
    hoy: HOY,
  });

  it("sin filtro no saca nada", () => {
    expect(filtrarHistoria(filas, "todo")).toHaveLength(filas.length);
  });

  it("con filtro deja solo las entradas de ese lado, sin los hechos de la ficha", () => {
    expect(filtrarHistoria(filas, "juzgado").map((fila) => fila.clave)).toEqual(["decreto"]);
    expect(filtrarHistoria(filas, "estudio").map((fila) => fila.clave)).toEqual(["escrito"]);
    expect(filtrarHistoria(filas, "contraria").map((fila) => fila.clave)).toEqual(["contestacion"]);
  });
});
