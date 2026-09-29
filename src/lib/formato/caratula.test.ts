import { describe, expect, it } from "vitest";
import { construirCaratula, formatearCaratula, partirCaratula } from "./caratula";

describe("partirCaratula", () => {
  it("parte la carátula completa en actor, demandado y objeto", () => {
    expect(partirCaratula("NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y Perjuicios")).toEqual({
      actor: "NICOLAS ROGEL",
      demandado: "SWISS MEDICAL ART",
      objeto: "daños y Perjuicios",
    });
  });

  it("acepta las variantes de los separadores", () => {
    const esperado = { actor: "A", demandado: "B", objeto: "DAÑOS" };
    expect(partirCaratula("A c/ B s/ DAÑOS")).toEqual(esperado);
    expect(partirCaratula("A C/B S/DAÑOS")).toEqual(esperado);
    expect(partirCaratula("A contra B sobre DAÑOS")).toEqual(esperado);
    expect(partirCaratula("A vs. B s/ DAÑOS")).toEqual(esperado);
  });

  it("tolera carátulas sin demandado o sin objeto", () => {
    expect(partirCaratula("ROSA DIAZ S/ SUCESION")).toEqual({
      actor: "ROSA DIAZ",
      demandado: "",
      objeto: "SUCESION",
    });
    expect(partirCaratula("ROGEL C/ SWISS MEDICAL")).toEqual({
      actor: "ROGEL",
      demandado: "SWISS MEDICAL",
      objeto: "",
    });
    expect(partirCaratula("EXPEDIENTE SIN FORMATO")).toEqual({
      actor: "EXPEDIENTE SIN FORMATO",
      demandado: "",
      objeto: "",
    });
  });

  it("no confunde la inicial de un nombre con el separador de contraparte", () => {
    expect(partirCaratula("JUAN C. PEREZ c/ LA SEGUNDA")).toEqual({
      actor: "JUAN C. PEREZ",
      demandado: "LA SEGUNDA",
      objeto: "",
    });
    expect(partirCaratula("LUIS V GOMEZ s/ AMPARO")).toEqual({
      actor: "LUIS V GOMEZ",
      demandado: "",
      objeto: "AMPARO",
    });
  });
});

describe("formatearCaratula", () => {
  it("es el caso de referencia del pedido del abogado", () => {
    expect(formatearCaratula("NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y Perjuicios")).toBe(
      "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios",
    );
  });

  it("formatea las partes como nombres y el objeto como título", () => {
    expect(formatearCaratula("PEREZ, JUAN Y OTROS CONTRA EDET SA SOBRE DANOS Y PERJUICIOS")).toBe(
      "Pérez, Juan y otros c/ EDET SA s/ Daños y Perjuicios",
    );
  });

  it("unifica la escritura sin importar cómo se haya cargado", () => {
    const variantes = [
      "nicolas rogel c/ swiss medical art s/ daños y perjuicios",
      "NICOLAS ROGEL CONTRA SWISS MEDICAL ART SOBRE DAÑOS Y PERJUICIOS",
      "  Nicolás  Rogel   C/Swiss Medical ART   S/Daños y Perjuicios  ",
    ];
    const formateadas = variantes.map((v) => formatearCaratula(v));
    // La primera variante viene en minúsculas: "art" no se reconoce como
    // sigla, es el único caso que no se puede deducir del texto.
    expect(formateadas[0]).toBe("Nicolás Rogel c/ Swiss Medical Art s/ Daños y Perjuicios");
    expect(formateadas[1]).toBe("Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios");
    expect(formateadas[2]).toBe("Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios");
  });

  it("mantiene las carátulas sin demandado u objeto", () => {
    expect(formatearCaratula("ROSA DIAZ S/ SUCESION")).toBe("Rosa Díaz s/ Sucesión");
    expect(formatearCaratula("MUNICIPALIDAD DE TUCUMAN C/ JUAN PEREZ S/ EXPROPIACION")).toBe(
      "Municipalidad de Tucumán c/ Juan Pérez s/ Expropiación",
    );
  });

  it("devuelve vacío si no hay texto", () => {
    expect(formatearCaratula("   ")).toBe("");
  });
});

describe("construirCaratula", () => {
  it("arma la carátula desde las partes del expediente", () => {
    expect(
      construirCaratula({
        actor: "NICOLAS ROGEL",
        demandado: "SWISS MEDICAL ART",
        objeto: "daños y perjuicios",
      }),
    ).toBe("Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios");
  });

  it("omite los tramos que faltan", () => {
    expect(construirCaratula({ actor: "ROSA DIAZ", objeto: "SUCESION" })).toBe(
      "Rosa Díaz s/ Sucesión",
    );
    expect(construirCaratula({ actor: "ROSA DIAZ" })).toBe("Rosa Díaz");
    expect(construirCaratula({})).toBe("");
  });
});
