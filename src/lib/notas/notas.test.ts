import { describe, expect, it } from "vitest";
import {
  notaVacia,
  parsearNota,
  serializarNota,
  tieneMarcas,
  type LineaNota,
} from "./notas";

/** Atajo para escribir los trozos esperados sin repetir los tres booleanos. */
function trozo(texto: string, formato: Partial<Omit<LineaNota[number], "texto">> = {}) {
  return {
    texto,
    negrita: formato.negrita ?? false,
    italica: formato.italica ?? false,
    subrayado: formato.subrayado ?? false,
  };
}

describe("parsearNota", () => {
  it("una nota sin marcas es una nota sin formato", () => {
    expect(parsearNota("Reunión el 3/10.")).toEqual([[trozo("Reunión el 3/10.")]]);
  });

  it("lee las tres marcas", () => {
    expect(parsearNota("[b]uno[/b] [i]dos[/i] [u]tres[/u]")).toEqual([
      [
        trozo("uno", { negrita: true }),
        trozo(" "),
        trozo("dos", { italica: true }),
        trozo(" "),
        trozo("tres", { subrayado: true }),
      ],
    ]);
  });

  it("acumula las marcas anidadas", () => {
    expect(parsearNota("[b][u]muy importante[/u][/b]")).toEqual([
      [trozo("muy importante", { negrita: true, subrayado: true })],
    ]);
  });

  it("parte en líneas y el formato cruza el salto", () => {
    expect(parsearNota("[b]uno\ndos[/b]")).toEqual([
      [trozo("uno", { negrita: true })],
      [trozo("dos", { negrita: true })],
    ]);
  });

  it("un renglón en blanco es una línea vacía", () => {
    expect(parsearNota("uno\n\ndos")).toEqual([[trozo("uno")], [], [trozo("dos")]]);
  });

  it("junta los trozos contiguos de igual formato", () => {
    expect(parsearNota("[b]O[/b][b]j[/b][b]o[/b]")).toEqual([
      [trozo("Ojo", { negrita: true })],
    ]);
  });

  /*
   * Las dos de abajo son la razón de contar las marcas en lugar de prenderlas
   * y apagarlas: el texto guardado se lee sin validarlo antes, así que una
   * marca de más o de menos no puede desordenar el resto de la nota.
   */
  it("una marca sin cerrar llega hasta el final", () => {
    expect(parsearNota("antes [b]después")).toEqual([
      [trozo("antes "), trozo("después", { negrita: true })],
    ]);
  });

  it("un cierre de más se ignora", () => {
    expect(parsearNota("[/b]texto[/b]")).toEqual([[trozo("texto")]]);
  });

  it("una nota vacía es una sola línea vacía", () => {
    expect(parsearNota("")).toEqual([[]]);
  });
});

describe("serializarNota", () => {
  it("escribe las marcas con la negrita afuera", () => {
    expect(serializarNota([[trozo("ojo", { negrita: true, subrayado: true })]])).toBe(
      "[b][u]ojo[/u][/b]",
    );
  });

  it("une las líneas con saltos", () => {
    expect(serializarNota([[trozo("uno")], [trozo("dos")]])).toBe("uno\ndos");
  });

  it("descarta los renglones en blanco de los extremos y conserva los del medio", () => {
    expect(serializarNota([[], [trozo("uno")], [], [trozo("dos")], []])).toBe("uno\n\ndos");
  });

  it("no deja trozos vacíos", () => {
    expect(serializarNota([[trozo(""), trozo("uno"), trozo("")]])).toBe("uno");
  });

  it("ida y vuelta: lo que se lee y se vuelve a escribir no cambia", () => {
    const texto = "Reunión el 3/10.\n\n[b]Ojo[/b]: vence el plazo de [u]prueba[/u].";
    expect(serializarNota(parsearNota(texto))).toBe(texto);
  });

  it("ida y vuelta de una nota vieja sin marcas", () => {
    const texto = "Expediente de ejemplo. Se puede editar o borrar.";
    expect(serializarNota(parsearNota(texto))).toBe(texto);
  });
});

describe("tieneMarcas", () => {
  it("distingue la nota con formato de la nota de texto plano", () => {
    expect(tieneMarcas("Se presentó la demanda.")).toBe(false);
    expect(tieneMarcas("Se presentó la [b]demanda[/b].")).toBe(true);
  });

  it("no confunde un corchete cualquiera con una marca", () => {
    expect(tieneMarcas("Ver fs. 12 [sic] del expediente.")).toBe(false);
  });
});

describe("notaVacia", () => {
  it("una nota con solo renglones y espacios está vacía", () => {
    expect(notaVacia("")).toBe(true);
    expect(notaVacia("\n  \n")).toBe(true);
    expect(notaVacia("[b][/b]")).toBe(true);
  });

  it("una nota con texto no está vacía", () => {
    expect(notaVacia("algo")).toBe(false);
  });
});
