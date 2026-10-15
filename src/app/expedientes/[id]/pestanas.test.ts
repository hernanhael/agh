import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PESTANA_INICIAL, PESTANAS, rutaPestana, teclaDePestana } from "./pestanas";

/**
 * La lista de pestañas gobierna tres cosas a la vez: la tira del cuadro, los
 * atajos de teclado y las rutas. Estos tests son el candado de esa unión: si
 * alguien agrega o reordena una pestaña y se olvida de la carpeta, o deja dos
 * con la misma clave, falla acá y no en la pantalla.
 */

const carpeta = (clave: string) =>
  fileURLToPath(new URL(`./${clave}/page.tsx`, import.meta.url));

describe("pestañas del expediente", () => {
  it("cada pestaña tiene su ruta en el disco", () => {
    for (const pestana of PESTANAS) {
      expect(existsSync(carpeta(pestana.clave)), `falta ${pestana.clave}/page.tsx`).toBe(true);
    }
  });

  it("las claves no se repiten", () => {
    const claves = PESTANAS.map((pestana) => pestana.clave);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("las teclas van de F1 en adelante, sin huecos", () => {
    expect(PESTANAS.map((_, posicion) => teclaDePestana(posicion))).toEqual([
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6",
      "F7",
    ]);
  });

  it("se entra a la primera pestaña sin segmento en la URL", () => {
    expect(PESTANA_INICIAL).toBe(PESTANAS[0].clave);
    expect(rutaPestana("abc", PESTANA_INICIAL)).toBe("/expedientes/abc/datos");
  });

  it("las claves son segmentos de URL limpios", () => {
    for (const pestana of PESTANAS) {
      expect(pestana.clave).toMatch(/^[a-z]+$/);
    }
  });
});
