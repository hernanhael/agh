import { describe, expect, it } from "vitest";
import { calcularPlazo } from "./calcularPlazo";
import type { DiaInhabil, ReglasPlazo } from "./tipos";

/**
 * Calendarios y reglas usados en estos tests son sintéticos (fechas de 2026
 * elegidas por comodidad de cómputo), no el calendario oficial de Tucumán.
 * El calendario real (feriados, feria judicial según Acordada 840/26,
 * asuetos) es contenido a cargar en la Fase 3 (docs/08-roadmap.md).
 */

const reglasBase: ReglasPlazo = {
  inicioNotificacionDigital: "dia_disponible",
  horarioTribunales: { horaInicio: "08:00", horaFin: "13:00" },
  plazoGracia: { horas: 2 },
};

const CAPITAL = "Capital";

describe("calcularPlazo", () => {
  it("1. notificación un viernes: el plazo empieza el lunes", () => {
    const resultado = calcularPlazo({
      fechaBase: { fecha: "2026-07-03" }, // viernes
      tipoBase: "actuacion",
      dias: 1,
      tipoDias: "habiles",
      aplicaGracia: false,
      centroJudicial: CAPITAL,
      reglas: reglasBase,
      calendario: [],
    });
    expect(resultado.vencimiento).toBe("2026-07-06"); // lunes
  });

  it("2. notificación digital: la regla de inicio parametrizada cambia el resultado", () => {
    const base = {
      fechaBase: { fecha: "2026-06-27" }, // sábado
      tipoBase: "notificacion_digital" as const,
      dias: 1,
      tipoDias: "habiles" as const,
      aplicaGracia: false,
      centroJudicial: CAPITAL,
      calendario: [] as DiaInhabil[],
    };

    const conDisponible = calcularPlazo({
      ...base,
      reglas: { ...reglasBase, inicioNotificacionDigital: "dia_disponible" },
    });
    const conHabilSiguiente = calcularPlazo({
      ...base,
      reglas: { ...reglasBase, inicioNotificacionDigital: "dia_habil_siguiente" },
    });

    expect(conDisponible.vencimiento).toBe("2026-06-29"); // lunes
    expect(conHabilSiguiente.vencimiento).toBe("2026-06-30"); // martes: un día hábil más tarde
    expect(conDisponible.vencimiento).not.toBe(conHabilSiguiente.vencimiento);
  });

  it("3. presentación fuera del horario de tribunales: corre desde el día hábil siguiente", () => {
    const resultado = calcularPlazo({
      fechaBase: { fecha: "2026-08-04", hora: "15:00" }, // martes, después de las 13:00
      tipoBase: "presentacion",
      dias: 1,
      tipoDias: "habiles",
      aplicaGracia: false,
      centroJudicial: CAPITAL,
      reglas: reglasBase,
      calendario: [],
    });
    expect(resultado.vencimiento).toBe("2026-08-06"); // jueves
    expect(resultado.pasos.some((p) => p.motivo.includes("fuera de horario"))).toBe(true);
  });

  it("4. un plazo en días hábiles que atraviesa la feria de julio se suspende y reanuda", () => {
    const feria: DiaInhabil[] = [];
    for (let d = 13; d <= 24; d++) {
      feria.push({
        fecha: `2026-07-${String(d).padStart(2, "0")}`,
        motivo: "feria judicial de julio",
        alcance: "feria",
      });
    }

    const resultado = calcularPlazo({
      fechaBase: { fecha: "2026-07-06" }, // lunes
      tipoBase: "actuacion",
      dias: 5,
      tipoDias: "habiles",
      aplicaGracia: false,
      centroJudicial: CAPITAL,
      reglas: reglasBase,
      calendario: feria,
    });

    expect(resultado.vencimiento).toBe("2026-07-27"); // lunes siguiente a la feria
    expect(
      resultado.pasos.some(
        (p) => p.motivo === "feria judicial de julio" && p.fecha === "13/07 al 24/07",
      ),
    ).toBe(true);
  });

  it("5. un plazo en días corridos que vence en feriado provincial pasa al día hábil siguiente", () => {
    const calendario: DiaInhabil[] = [
      { fecha: "2026-09-18", motivo: "feriado provincial (fixture)", alcance: "provincial" },
    ];

    const resultado = calcularPlazo({
      fechaBase: { fecha: "2026-09-16" }, // miércoles
      tipoBase: "actuacion",
      dias: 2,
      tipoDias: "corridos",
      aplicaGracia: false,
      centroJudicial: CAPITAL,
      reglas: reglasBase,
      calendario,
    });

    expect(resultado.vencimiento).toBe("2026-09-21"); // lunes, tras feriado del viernes y el fin de semana
  });

  it("6. un asueto de un centro judicial no afecta a otro", () => {
    const calendario: DiaInhabil[] = [
      { fecha: "2026-11-06", motivo: "asueto Monteros (fixture)", alcance: "centro_judicial", centroJudicial: "Monteros" },
    ];

    const input = {
      fechaBase: { fecha: "2026-11-02" }, // lunes
      tipoBase: "actuacion" as const,
      dias: 4,
      tipoDias: "habiles" as const,
      aplicaGracia: false,
      reglas: reglasBase,
      calendario,
    };

    const capital = calcularPlazo({ ...input, centroJudicial: "Capital" });
    const monteros = calcularPlazo({ ...input, centroJudicial: "Monteros" });

    expect(capital.vencimiento).toBe("2026-11-06"); // viernes: el asueto no le aplica
    expect(monteros.vencimiento).toBe("2026-11-09"); // lunes: se salta el asueto del viernes
  });

  it("7. un plazo en días corridos que termina en fin de semana pasa al día hábil siguiente", () => {
    const resultado = calcularPlazo({
      fechaBase: { fecha: "2026-08-04" }, // martes
      tipoBase: "actuacion",
      dias: 4,
      tipoDias: "corridos",
      aplicaGracia: false,
      centroJudicial: CAPITAL,
      reglas: reglasBase,
      calendario: [],
    });
    expect(resultado.vencimiento).toBe("2026-08-10"); // lunes, tras el sábado
  });

  it("8. el plazo de gracia se informa como fecha secundaria, nunca como vencimiento principal", () => {
    const base = {
      fechaBase: { fecha: "2026-07-06" }, // lunes
      tipoBase: "actuacion" as const,
      dias: 1,
      tipoDias: "habiles" as const,
      centroJudicial: CAPITAL,
      reglas: reglasBase,
      calendario: [] as DiaInhabil[],
    };

    const conGracia = calcularPlazo({ ...base, aplicaGracia: true });
    const sinGracia = calcularPlazo({ ...base, aplicaGracia: false });

    expect(conGracia.vencimiento).toBe("2026-07-07");
    expect(conGracia.gracia).toBe("2026-07-08");
    expect(sinGracia.vencimiento).toBe("2026-07-07");
    expect(sinGracia.gracia).toBeUndefined();
  });

  it("no informa gracia si el catálogo no la habilita en las reglas, aunque el acto la admita", () => {
    const resultado = calcularPlazo({
      fechaBase: { fecha: "2026-07-06" },
      tipoBase: "actuacion",
      dias: 1,
      tipoDias: "habiles",
      aplicaGracia: true,
      centroJudicial: CAPITAL,
      reglas: { ...reglasBase, plazoGracia: null },
      calendario: [],
    });
    expect(resultado.gracia).toBeUndefined();
  });
});
