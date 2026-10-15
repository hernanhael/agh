import { describe, expect, it } from "vitest";
import { formatoImporte, importeDesdeTexto } from "./importe";

describe("formatoImporte", () => {
  it("escribe los centavos como pesos con coma decimal", () => {
    expect(formatoImporte(123456)).toBe("$ 1.234,56");
    expect(formatoImporte(100)).toBe("$ 1,00");
    expect(formatoImporte(5)).toBe("$ 0,05");
    expect(formatoImporte(0)).toBe("$ 0,00");
  });

  it("separa los miles con punto", () => {
    expect(formatoImporte(100000000)).toBe("$ 1.000.000,00");
    expect(formatoImporte(99999)).toBe("$ 999,99");
  });

  it("conserva el signo", () => {
    expect(formatoImporte(-123456)).toBe("-$ 1.234,56");
  });
});

describe("importeDesdeTexto", () => {
  it("lee el importe como se escribe en Argentina", () => {
    expect(importeDesdeTexto("1.234,56")).toBe(123456);
    expect(importeDesdeTexto("$ 1.234,56")).toBe(123456);
    expect(importeDesdeTexto("1234,5")).toBe(123450);
    expect(importeDesdeTexto("1234")).toBe(123400);
  });

  it("resuelve el punto por la cantidad de dígitos que lo siguen", () => {
    // Dos dígitos: es un decimal copiado de una planilla.
    expect(importeDesdeTexto("1.50")).toBe(150);
    expect(importeDesdeTexto("1234.56")).toBe(123456);
    // Tres dígitos: es el separador de miles de siempre.
    expect(importeDesdeTexto("1.500")).toBe(150000);
    expect(importeDesdeTexto("1.234.567")).toBe(123456700);
  });

  it("ignora los espacios y el signo de pesos", () => {
    expect(importeDesdeTexto(" $ 980 ")).toBe(98000);
  });

  it("rechaza lo que no es un importe", () => {
    expect(importeDesdeTexto("")).toBeUndefined();
    expect(importeDesdeTexto("   ")).toBeUndefined();
    expect(importeDesdeTexto("mil pesos")).toBeUndefined();
    expect(importeDesdeTexto("-500")).toBeUndefined();
    expect(importeDesdeTexto("1,234,56")).toBeUndefined();
    expect(importeDesdeTexto("1,2345")).toBeUndefined();
  });
});
