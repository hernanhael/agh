import { describe, expect, it } from "vitest";
import type { EstadoGasto, Gasto, TipoGasto } from "@/lib/datos/tipos";
import { resumenContable } from "./resumen";

function gasto(parcial: Partial<Gasto>): Gasto {
  return {
    id: "g",
    expedienteId: "ex",
    tipo: "gasto" as TipoGasto,
    concepto: "otro",
    detalle: "",
    importe: 0,
    moneda: "ARS",
    fecha: "2026-01-01",
    estado: "pagado_estudio" as EstadoGasto,
    creadoEn: "2026-01-01T00:00:00.000Z",
    actualizadoEn: "2026-01-01T00:00:00.000Z",
    ...parcial,
  };
}

describe("resumenContable", () => {
  it("sin partidas da todo en cero", () => {
    const resumen = resumenContable([]);
    expect(resumen).toMatchObject({
      total: 0,
      gastos: 0,
      honorarios: 0,
      pagado: 0,
      previsto: 0,
      aRendir: 0,
      partidas: 0,
    });
    expect(resumen.porConcepto).toEqual([]);
  });

  it("separa gastos de honorarios", () => {
    const resumen = resumenContable([
      gasto({ importe: 50000, concepto: "tasa_justicia" }),
      gasto({ importe: 30000, concepto: "pericia" }),
      gasto({ importe: 400000, tipo: "honorario_regulado", concepto: "honorarios" }),
    ]);
    expect(resumen.total).toBe(480000);
    expect(resumen.gastos).toBe(80000);
    expect(resumen.honorarios).toBe(400000);
  });

  it("lo previsto es lo que todavía no se desembolsó", () => {
    const resumen = resumenContable([
      gasto({ importe: 10000, estado: "pagado_estudio" }),
      gasto({ importe: 20000, estado: "pagado_cliente" }),
      gasto({ importe: 40000, estado: "rendido" }),
      gasto({ importe: 80000, estado: "previsto" }),
    ]);
    expect(resumen.pagado).toBe(70000);
    expect(resumen.previsto).toBe(80000);
    expect(resumen.total).toBe(150000);
  });

  it("a rendir es solo lo que adelantó el estudio y no se reintegró", () => {
    const resumen = resumenContable([
      gasto({ importe: 10000, estado: "pagado_estudio" }),
      gasto({ importe: 25000, estado: "pagado_estudio" }),
      // Ya reintegrado: sale de lo pendiente de rendición.
      gasto({ importe: 99000, estado: "rendido" }),
      gasto({ importe: 99000, estado: "pagado_cliente" }),
    ]);
    expect(resumen.aRendir).toBe(35000);
  });

  it("agrupa por concepto y ordena de mayor a menor", () => {
    const resumen = resumenContable([
      gasto({ importe: 1000, concepto: "notificaciones" }),
      gasto({ importe: 1500, concepto: "notificaciones" }),
      gasto({ importe: 90000, concepto: "pericia" }),
      gasto({ importe: 2000, concepto: "bono" }),
    ]);
    expect(resumen.porConcepto).toEqual([
      { concepto: "pericia", total: 90000, cantidad: 1 },
      { concepto: "notificaciones", total: 2500, cantidad: 2 },
      { concepto: "bono", total: 2000, cantidad: 1 },
    ]);
  });

  it("los importes en centavos suman exacto", () => {
    // Con pesos decimales, 0.1 + 0.2 no da 0.3; en centavos no hay vuelta.
    const resumen = resumenContable([
      gasto({ importe: 10 }),
      gasto({ importe: 20 }),
      gasto({ importe: 3 }),
    ]);
    expect(resumen.total).toBe(33);
  });
});
