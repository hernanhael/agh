import { describe, expect, it } from "vitest";
import type { EntradaHistoria, Expediente, TipoProceso } from "@/lib/datos/tipos";
import { recorridoDeEtapas } from "./recorrido";

const TIPO: TipoProceso = {
  id: "tp-ordinario",
  clave: "ordinario",
  nombre: "Conocimiento Ordinario",
  descripcion: "",
  materias: ["Daños y Perjuicios"],
  etapas: [
    { clave: "mediacion", nombre: "Mediación", orden: 1 },
    { clave: "demanda", nombre: "Demanda", orden: 2 },
    { clave: "traslado", nombre: "Traslado", orden: 3 },
    { clave: "contestacion", nombre: "Contestación", orden: 4 },
    { clave: "prueba", nombre: "Prueba", orden: 5 },
  ],
  activo: true,
  origen: "ejemplo",
  creadoEn: "2026-01-01T00:00:00.000Z",
  actualizadoEn: "2026-01-01T00:00:00.000Z",
};

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
    etapaActual: "contestacion",
    etapaDesde: "2026-09-15",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    materia: "Daños y Perjuicios",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "",
    creadoEn: "2026-08-01T00:00:00.000Z",
    actualizadoEn: "2026-08-01T00:00:00.000Z",
    ...parcial,
  };
}

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

describe("recorridoDeEtapas", () => {
  it("marca cumplidas las anteriores, actual la actual y pendientes las que faltan", () => {
    const recorrido = recorridoDeEtapas({
      tipo: TIPO,
      expediente: expediente({}),
      entradas: [],
    });

    expect(recorrido.etapas.map((etapa) => etapa.estado)).toEqual([
      "cumplida",
      "cumplida",
      "cumplida",
      "actual",
      "pendiente",
    ]);
    expect(recorrido.posicion).toBe(4);
    expect(recorrido.total).toBe(5);
    expect(recorrido.actual?.nombre).toBe("Contestación");
  });

  it("toma de la historia la fecha en que se abrió cada etapa", () => {
    const recorrido = recorridoDeEtapas({
      tipo: TIPO,
      expediente: expediente({}),
      entradas: [
        entrada({ id: "demanda", fecha: "2026-08-25", abreEtapa: "demanda" }),
        entrada({ id: "traslado", fecha: "2026-09-02", abreEtapa: "traslado" }),
      ],
    });

    const porClave = Object.fromEntries(recorrido.etapas.map((etapa) => [etapa.clave, etapa.fecha]));
    expect(porClave.demanda).toBe("2026-08-25");
    expect(porClave.traslado).toBe("2026-09-02");
    // La actual, sin entrada que la abra, usa la fecha de la ficha.
    expect(porClave.contestacion).toBe("2026-09-15");
    expect(porClave.prueba).toBeUndefined();
  });

  it("si dos actuaciones abren la misma etapa, vale la primera", () => {
    const recorrido = recorridoDeEtapas({
      tipo: TIPO,
      expediente: expediente({ etapaActual: "prueba" }),
      entradas: [
        entrada({ id: "segunda", fecha: "2026-09-20", abreEtapa: "traslado" }),
        entrada({ id: "primera", fecha: "2026-09-02", abreEtapa: "traslado" }),
      ],
    });
    expect(recorrido.etapas.find((etapa) => etapa.clave === "traslado")?.fecha).toBe("2026-09-02");
  });

  it("una etapa que la historia abrió queda cumplida aunque el proceso haya vuelto atrás", () => {
    // El expediente volvió a Traslado, pero la contestación ya ocurrió.
    const recorrido = recorridoDeEtapas({
      tipo: TIPO,
      expediente: expediente({ etapaActual: "traslado" }),
      entradas: [entrada({ id: "contesta", fecha: "2026-09-15", abreEtapa: "contestacion" })],
    });

    const porClave = Object.fromEntries(
      recorrido.etapas.map((etapa) => [etapa.clave, etapa.estado]),
    );
    expect(porClave.traslado).toBe("actual");
    expect(porClave.contestacion).toBe("cumplida");
    expect(porClave.prueba).toBe("pendiente");
  });

  it("sin tipo de proceso no hay recorrido", () => {
    const recorrido = recorridoDeEtapas({
      tipo: undefined,
      expediente: expediente({}),
      entradas: [],
    });
    expect(recorrido.etapas).toEqual([]);
    expect(recorrido.total).toBe(0);
    expect(recorrido.posicion).toBe(0);
    expect(recorrido.actual).toBeUndefined();
  });

  it("una etapa que no está en la plantilla deja todo pendiente y sin posición", () => {
    const recorrido = recorridoDeEtapas({
      tipo: TIPO,
      expediente: expediente({ etapaActual: "lanzamiento" }),
      entradas: [],
    });
    expect(recorrido.etapas.every((etapa) => etapa.estado === "pendiente")).toBe(true);
    expect(recorrido.posicion).toBe(0);
  });
});
