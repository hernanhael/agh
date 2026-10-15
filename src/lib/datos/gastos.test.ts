import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resumenContable } from "@/lib/contabilidad";
import { hoy } from "./almacen";
import { crearGasto, eliminarGasto, listarGastos, type EntradaGasto } from "./gastos";

/**
 * Tests de la contabilidad del expediente sobre un almacén temporal.
 *
 * Lo que se verifica es que el importe escrito a mano llegue al almacén en
 * centavos, que una partida no se pueda colgar de un expediente que no existe,
 * y que el almacén sembrado traiga la contabilidad de ejemplo: los expedientes
 * de ejemplo son los que el abogado usa para entender la pantalla.
 */

let carpeta: string;

beforeEach(async () => {
  carpeta = await mkdtemp(join(tmpdir(), "agh-gastos-"));
  process.env.AGH_ARCHIVO_DATOS = join(carpeta, "estudio.json");
});

afterEach(async () => {
  delete process.env.AGH_ARCHIVO_DATOS;
  await rm(carpeta, { recursive: true, force: true });
});

const PARTIDA_BASE: EntradaGasto = {
  expedienteId: "ex-gomez",
  tipo: "gasto",
  concepto: "tasa_justicia",
  detalle: "tasa de justicia de la demanda",
  importe: "1.234,56",
  fecha: "2026-09-10",
  estado: "pagado_estudio",
};

describe("contabilidad del expediente", () => {
  it("guarda el importe en centavos y el detalle como oración", async () => {
    const resultado = await crearGasto(PARTIDA_BASE);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.valor.importe).toBe(123456);
    // `oracion` arregla mayúsculas y espacios; no le agrega el punto final.
    expect(resultado.valor.detalle).toBe("Tasa de justicia de la demanda");
    expect(resultado.valor.moneda).toBe("ARS");
    expect(resultado.valor.expedienteId).toBe("ex-gomez");
  });

  it("rechaza un importe que no es un importe", async () => {
    const resultado = await crearGasto({ ...PARTIDA_BASE, importe: "como salga" });
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error).toMatch(/importe/i);
  });

  it("rechaza el importe en cero y la partida sin detalle", async () => {
    expect((await crearGasto({ ...PARTIDA_BASE, importe: "0" })).ok).toBe(false);
    expect((await crearGasto({ ...PARTIDA_BASE, detalle: "   " })).ok).toBe(false);
  });

  it("no cuelga una partida de un expediente que no existe", async () => {
    const resultado = await crearGasto({ ...PARTIDA_BASE, expedienteId: "no-existe" });
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error).toMatch(/expediente/i);
  });

  it("sin fecha válida usa la de hoy", async () => {
    const resultado = await crearGasto({ ...PARTIDA_BASE, fecha: "2026-02-31" });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.fecha).toBe(hoy());
  });

  it("lista solo las partidas del expediente, de la más reciente a la más antigua", async () => {
    await crearGasto({ ...PARTIDA_BASE, fecha: "2026-09-10", detalle: "la del medio" });
    await crearGasto({ ...PARTIDA_BASE, fecha: "2026-10-01", detalle: "la última" });
    await crearGasto({ ...PARTIDA_BASE, fecha: "2026-08-01", detalle: "la primera" });
    await crearGasto({ ...PARTIDA_BASE, expedienteId: "ex-diaz", detalle: "de otro expediente" });

    const gastos = await listarGastos("ex-gomez");
    expect(gastos.map((gasto) => gasto.detalle)).toEqual([
      "La última",
      "La del medio",
      "La primera",
    ]);
  });

  it("borra una partida y deja de contarla en el total", async () => {
    const creada = await crearGasto({ ...PARTIDA_BASE, importe: "1000" });
    expect(creada.ok).toBe(true);
    if (!creada.ok) return;

    expect(resumenContable(await listarGastos("ex-gomez")).total).toBe(100000);

    const borrada = await eliminarGasto(creada.valor.id);
    expect(borrada.ok).toBe(true);
    expect(await listarGastos("ex-gomez")).toEqual([]);
    expect(resumenContable(await listarGastos("ex-gomez")).total).toBe(0);
  });

  it("avisa cuando la partida que se quiere borrar no existe", async () => {
    expect((await eliminarGasto("no-existe")).ok).toBe(false);
  });

  it("el almacén sembrado trae la contabilidad de ejemplo del expediente Rogel", async () => {
    const gastos = await listarGastos("ex-rogel");
    expect(gastos.length).toBeGreaterThan(0);

    const resumen = resumenContable(gastos);
    // El ejemplo tiene gastos pagados, gastos previstos y honorarios: es lo que
    // hace que la pestaña muestre sus tres cifras con algo distinto de cero.
    expect(resumen.gastos).toBeGreaterThan(0);
    expect(resumen.honorarios).toBeGreaterThan(0);
    expect(resumen.pagado).toBeGreaterThan(0);
    expect(resumen.previsto).toBeGreaterThan(0);
    expect(resumen.aRendir).toBeGreaterThan(0);
    expect(resumen.total).toBe(resumen.gastos + resumen.honorarios);
    expect(resumen.total).toBe(resumen.pagado + resumen.previsto);
  });
});
