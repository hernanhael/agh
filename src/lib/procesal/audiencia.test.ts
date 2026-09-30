import { describe, expect, it } from "vitest";
import type { Expediente } from "@/lib/datos/tipos";
import { audienciaFijada } from "./audiencia";

const HOY = "2026-09-29";

function expediente(parcial: Partial<Expediente>): Expediente {
  return {
    id: "x",
    numero: "1",
    anio: "26",
    caratula: "Actor c/ Demandado s/ Objeto",
    actor: "Actor",
    demandado: "Demandado",
    objeto: "Objeto",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "prueba",
    etapaDesde: "2026-01-10",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    materia: "",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "",
    creadoEn: "2026-01-02T00:00:00.000Z",
    actualizadoEn: "2026-01-02T00:00:00.000Z",
    ...parcial,
  };
}

describe("audienciaFijada", () => {
  it("sin fecha no hay audiencia fijada", () => {
    expect(audienciaFijada(expediente({}), HOY)).toBeUndefined();
    // El tipo suelto, sin fecha, tampoco alcanza.
    expect(audienciaFijada(expediente({ audienciaTipo: "Audiencia Preliminar" }), HOY)).toBeUndefined();
  });

  it("arma el texto con la fecha y la hora", () => {
    const audiencia = audienciaFijada(
      expediente({
        audienciaTipo: "Audiencia Preliminar",
        audienciaFecha: "2026-10-16",
        audienciaHora: "09:30",
      }),
      HOY,
    );
    expect(audiencia?.texto).toBe("Audiencia Preliminar — 16/10/2026 09:30");
    expect(audiencia?.dias).toBe(17);
    expect(audiencia?.pasada).toBe(false);
  });

  it("sin hora y sin tipo, muestra lo que hay", () => {
    const audiencia = audienciaFijada(expediente({ audienciaFecha: "2026-10-16" }), HOY);
    expect(audiencia?.texto).toBe("Audiencia — 16/10/2026");
  });

  it("marca la audiencia que ya pasó", () => {
    const audiencia = audienciaFijada(
      expediente({ audienciaTipo: "Audiencia de Vista de Causa", audienciaFecha: "2026-09-01" }),
      HOY,
    );
    expect(audiencia?.pasada).toBe(true);
    expect(audiencia?.dias).toBe(-28);
  });
});
