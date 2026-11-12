import { describe, expect, it } from "vitest";
import {
  CATALOGO_FUEROS,
  expedientesDelFuero,
  fueroDe,
  fueroPorSlug,
  fuerosDisponibles,
  slugFuero,
} from "./fueros";
import type { Expediente } from "./tipos";

function expediente(id: string, fuero: string): Expediente {
  return { id, fuero } as Expediente;
}

describe("fueros", () => {
  it("arma la dirección sin tildes ni espacios", () => {
    expect(slugFuero("Civil y Comercial Común")).toBe("civil-y-comercial-comun");
    expect(slugFuero("Civil en Documentos y Locaciones")).toBe("civil-en-documentos-y-locaciones");
  });

  it("ofrece todo el catálogo, por orden alfabético del nombre que se ve", () => {
    expect(fuerosDisponibles([]).map((fuero) => fuero.nombre)).toEqual([
      "Civil y Comercial Común",
      "Cobros y Apremios",
      "Documentos y Locaciones",
      "Familia y Sucesiones",
      "Justicia de Paz",
    ]);
  });

  it("nombra con su forma corta a Documentos y Locaciones", () => {
    const fuero = fueroPorSlug("civil-en-documentos-y-locaciones", []);
    expect(fuero?.nombre).toBe("Documentos y Locaciones");
  });

  it("agrega, en su lugar alfabético, un fuero que está en los datos y no en el catálogo", () => {
    const fueros = fuerosDisponibles([expediente("a", "Laboral"), expediente("b", "Laboral")]);
    expect(fueros.map((fuero) => fuero.nombre).indexOf("Laboral")).toBe(5);
    expect(fueros.filter((fuero) => fuero.valor === "Laboral")).toHaveLength(1);
  });

  it("no duplica un fuero del catálogo escrito sin tildes", () => {
    const fueros = fuerosDisponibles([expediente("a", "civil y comercial comun")]);
    expect(fueros).toHaveLength(CATALOGO_FUEROS.length);
  });

  it("devuelve undefined para una dirección que no existe", () => {
    expect(fueroPorSlug("inexistente", [])).toBeUndefined();
  });

  it("separa los expedientes de cada fuero", () => {
    const todos = [
      expediente("a", "Civil y Comercial Común"),
      expediente("b", "Familia y Sucesiones"),
      expediente("c", "civil y comercial comun"),
    ];
    const civil = fueroPorSlug("civil-y-comercial-comun", todos)!;
    expect(expedientesDelFuero(todos, civil).map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("encuentra el fuero de un expediente", () => {
    expect(fueroDe(expediente("a", "Paz")).slug).toBe("paz");
    expect(fueroDe(expediente("a", "Paz")).filtros).not.toContain("oga");
  });
});
