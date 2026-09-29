import { describe, expect, it } from "vitest";
import { clavear, nombrePropio, numeroExpediente, oracion, titulo } from "./texto";

describe("nombrePropio", () => {
  it("corrige el texto en mayúsculas del Portal y las tildes faltantes", () => {
    expect(nombrePropio("NICOLAS ROGEL")).toBe("Nicolás Rogel");
    expect(nombrePropio("maria jose gutierrez")).toBe("María José Gutiérrez");
  });

  it("conserva las siglas que venían en mayúsculas", () => {
    expect(nombrePropio("SWISS MEDICAL ART")).toBe("Swiss Medical ART");
    expect(nombrePropio("TRANSPORTE SAN JUAN SRL")).toBe("Transporte San Juan SRL");
    expect(nombrePropio("EDET SA")).toBe("EDET SA");
  });

  it("deja en minúscula las partículas, salvo al principio", () => {
    expect(nombrePropio("MARIA DE LOS ANGELES PEREZ")).toBe("María de los Ángeles Pérez");
    expect(nombrePropio("DE LA VEGA, RAMON")).toBe("De la Vega, Ramón");
    expect(nombrePropio("ORTEGA Y GASSET")).toBe("Ortega y Gasset");
    expect(nombrePropio("JUAN PEREZ Y OTROS")).toBe("Juan Pérez y otros");
  });

  it("respeta iniciales, guiones, apóstrofos y prefijos Mc/Mac", () => {
    expect(nombrePropio("JUAN J PEREZ")).toBe("Juan J Pérez");
    expect(nombrePropio("GARCIA-LOPEZ, ANA")).toBe("García-López, Ana");
    expect(nombrePropio("O'BRIEN")).toBe("O'Brien");
    expect(nombrePropio("MCCARTHY")).toBe("McCarthy");
  });

  it("no confunde una inicial con una sigla ni 'MIL' con un número romano", () => {
    expect(nombrePropio("LUIS V GOMEZ")).toBe("Luis V Gómez");
    expect(nombrePropio("MIL HOJAS SRL")).toBe("Mil Hojas SRL");
    expect(nombrePropio("JUAN PABLO II")).toBe("Juan Pablo II");
  });

  it("reconoce los tipos societarios en cualquier caja, el resto solo en mayúsculas", () => {
    expect(nombrePropio("la casa sa")).toBe("La Casa SA");
    expect(nombrePropio("transporte del norte srl")).toBe("Transporte del Norte SRL");
    // "art" en minúsculas no se toma por sigla: podría ser "art." (artículo).
    expect(nombrePropio("swiss medical art")).toBe("Swiss Medical Art");
  });

  it("se puede desactivar la corrección de tildes", () => {
    expect(nombrePropio("NICOLAS ROGEL", { acentuar: false })).toBe("Nicolas Rogel");
  });

  it("normaliza espacios sobrantes y devuelve vacío si no hay texto", () => {
    expect(nombrePropio("  NICOLAS   ROGEL  ")).toBe("Nicolás Rogel");
    expect(nombrePropio("   ")).toBe("");
  });
});

describe("titulo", () => {
  it("capitaliza las palabras significativas y deja las menores en minúscula", () => {
    expect(titulo("daños y Perjuicios")).toBe("Daños y Perjuicios");
    expect(titulo("COBRO EJECUTIVO")).toBe("Cobro Ejecutivo");
    expect(titulo("DANOS Y PERJUICIOS POR ACCIDENTE DE TRANSITO")).toBe(
      "Daños y Perjuicios por Accidente de Tránsito",
    );
  });

  it("capitaliza la primera palabra aunque sea una palabra menor", () => {
    expect(titulo("de la prescripcion adquisitiva")).toBe("De la Prescripción Adquisitiva");
  });

  it("formatea nombres de etapa y de tipo de proceso", () => {
    expect(titulo("AUDIENCIA PRELIMINAR")).toBe("Audiencia Preliminar");
    expect(titulo("conocimiento sumarisimo")).toBe("Conocimiento Sumarisimo");
    expect(titulo("EXPROPIACION")).toBe("Expropiación");
  });
});

describe("oracion", () => {
  it("baja el texto que llegó todo en mayúsculas y capitaliza cada oración", () => {
    expect(oracion("SE NOTIFICA EL TRASLADO. VENCE EL LUNES")).toBe(
      "Se notifica el traslado. Vence el lunes",
    );
  });

  it("baja a los gritos oración por oración, no solo el texto entero", () => {
    expect(oracion("EL CLIENTE APORTO LA TASACION. Falta la pericia")).toBe(
      "El cliente aporto la tasacion. Falta la pericia",
    );
  });

  it("respeta el énfasis de una sola palabra y las siglas sueltas", () => {
    expect(oracion("Presentado ante la AFIP")).toBe("Presentado ante la AFIP");
    expect(oracion("Vence el lunes. URGENTE")).toBe("Vence el lunes. URGENTE");
  });

  it("no corrige la ortografía de las palabras", () => {
    expect(oracion("el juzgado publico el decreto")).toBe("El juzgado publico el decreto");
  });

  it("arregla el espaciado alrededor de los signos de puntuación", () => {
    expect(oracion("Hola   ,  mundo ; otra cosa")).toBe("Hola, mundo; otra cosa");
    expect(oracion("Se presentó el escrito.Vence mañana")).toBe(
      "Se presentó el escrito. Vence mañana",
    );
  });

  it("no separa las siglas con puntos", () => {
    expect(oracion("Demandada: Swiss Medical S.A.")).toBe("Demandada: Swiss Medical S.A.");
  });

  it("reduce los signos repetidos y los puntos suspensivos", () => {
    expect(oracion("Atención!!! falta la pericia....")).toBe("Atención! Falta la pericia...");
  });

  it("conserva los párrafos pero colapsa las líneas en blanco de más", () => {
    expect(oracion("primer párrafo\n\n\n\nsegundo párrafo")).toBe(
      "Primer párrafo\n\nSegundo párrafo",
    );
  });

  it("devuelve vacío si no hay texto", () => {
    expect(oracion("  \n  ")).toBe("");
  });
});

describe("numeroExpediente", () => {
  it("usa el formato del SAE con año de dos dígitos", () => {
    expect(numeroExpediente("1234", "26")).toBe("1234/26");
    expect(numeroExpediente("1234", 2026)).toBe("1234/26");
    expect(numeroExpediente(" 1234 ", "2026")).toBe("1234/26");
    expect(numeroExpediente("0123", "26")).toBe("123/26");
  });

  it("devuelve vacío si falta el número o el año", () => {
    expect(numeroExpediente("", "26")).toBe("");
    expect(numeroExpediente("1234", "")).toBe("");
  });
});

describe("clavear", () => {
  it("genera claves estables para etapas y tipos de proceso", () => {
    expect(clavear("Audiencia Preliminar")).toBe("audiencia_preliminar");
    expect(clavear("  Ejecución de Sentencia ")).toBe("ejecucion_de_sentencia");
    expect(clavear("Conocimiento sumarísimo")).toBe("conocimiento_sumarisimo");
  });
});
