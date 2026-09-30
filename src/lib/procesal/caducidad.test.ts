import { describe, expect, it } from "vitest";
import type { Expediente } from "@/lib/datos/tipos";
import { situacionCaducidad, ultimoMovimiento } from "./caducidad";

/**
 * Tests de la caducidad de instancia.
 *
 * El día de hoy entra como argumento, así que los casos son fechas fijas y no
 * dependen de cuándo se corran. HOY es un martes cualquiera: la caducidad corre
 * por meses corridos, los días hábiles no intervienen.
 */

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

describe("ultimoMovimiento", () => {
  it("usa la fecha cargada", () => {
    expect(ultimoMovimiento(expediente({ ultimoMovimiento: "2026-07-01" }))).toBe("2026-07-01");
  });

  it("sin fecha cargada cae en la etapa, y sin etapa en la fecha de carga", () => {
    // Los expedientes guardados antes de que existiera el campo.
    expect(ultimoMovimiento(expediente({}))).toBe("2026-01-10");
    expect(ultimoMovimiento(expediente({ etapaDesde: "" }))).toBe("2026-01-02");
  });
});

describe("situacionCaducidad", () => {
  it("el principal se mueve hasta los seis meses", () => {
    // 29/03 + 6 meses = 29/09: hoy justo se cumple, así que ya está para caducidad.
    const alDia = situacionCaducidad(expediente({ ultimoMovimiento: "2026-09-01" }), HOY);
    expect(alDia.estado).toBe("en_movimiento");
    expect(alDia.etiqueta).toBe("En trámite");
    expect(alDia.vence).toBe("2027-03-01");

    const justo = situacionCaducidad(expediente({ ultimoMovimiento: "2026-03-29" }), HOY);
    expect(justo.estado).toBe("para_caducidad");
    expect(justo.dias).toBe(0);
  });

  it("el incidente queda para caducidad a los tres meses", () => {
    const entrada = { ultimoMovimiento: "2026-05-11" };
    // El mismo expediente, con la misma fecha, según sea principal o incidente.
    expect(situacionCaducidad(expediente({ ...entrada, clase: "principal" }), HOY).estado).toBe(
      "en_movimiento",
    );

    const incidente = situacionCaducidad(expediente({ ...entrada, clase: "incidente" }), HOY);
    expect(incidente.estado).toBe("para_caducidad");
    expect(incidente.etiqueta).toBe("Para caducidad");
    expect(incidente.vence).toBe("2026-08-11");
    expect(incidente.detalle).toBe("sin movimiento desde el 11/05/2026");
  });

  it("avisa cuando falta menos de un mes", () => {
    // 05/04 + 6 meses = 05/10: faltan seis días.
    const situacion = situacionCaducidad(expediente({ ultimoMovimiento: "2026-04-05" }), HOY);
    expect(situacion.estado).toBe("en_movimiento");
    expect(situacion.dias).toBe(6);
    expect(situacion.detalle).toBe("faltan 6 días para la caducidad");
  });

  it("la caducidad declarada tapa todo lo demás", () => {
    const situacion = situacionCaducidad(
      expediente({ ultimoMovimiento: HOY, caducidadDeclarada: "2026-09-20" }),
      HOY,
    );
    expect(situacion.estado).toBe("caduco");
    expect(situacion.etiqueta).toBe("Caduco");
    expect(situacion.detalle).toBe("caducidad declarada el 20/09/2026");
    // Un expediente caduco no informa un plazo por vencer.
    expect(situacion.vence).toBeUndefined();
  });

  it("no corre si no hay instancia en curso, por vieja que sea la fecha", () => {
    for (const estado of ["en_mediacion", "suspendido", "con_sentencia", "en_ejecucion", "archivado"] as const) {
      const situacion = situacionCaducidad(
        expediente({ estado, ultimoMovimiento: "2024-01-01" }),
        HOY,
      );
      expect(situacion.estado).toBe("sin_instancia");
      expect(situacion.vence).toBeUndefined();
    }
  });

  it("un expediente paralizado queda para caducidad aunque el plazo no se haya cumplido", () => {
    // La marca del abogado vale: él sabe que el expediente no se mueve.
    const situacion = situacionCaducidad(
      expediente({ estado: "paralizado", ultimoMovimiento: HOY }),
      HOY,
    );
    expect(situacion.estado).toBe("para_caducidad");
    expect(situacion.dias).toBeGreaterThan(0);
  });

  it("cuenta por meses calendario y no por días", () => {
    // 31/03 + 6 meses no existe como 31/09: el plazo se cumple el 30/09.
    expect(situacionCaducidad(expediente({ ultimoMovimiento: "2026-03-31" }), HOY).vence).toBe(
      "2026-09-30",
    );
    // 31/08 + 3 meses en un incidente: 30/11.
    expect(
      situacionCaducidad(
        expediente({ clase: "incidente", ultimoMovimiento: "2026-08-31" }),
        HOY,
      ).vence,
    ).toBe("2026-11-30");
  });
});
