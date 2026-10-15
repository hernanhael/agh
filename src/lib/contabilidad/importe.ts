/**
 * Importes de dinero, en centavos.
 *
 * Todo el dinero del sistema se guarda como un entero de centavos
 * (`Gasto.importe`): sumar veinte partidas con decimales de punto flotante
 * termina en un total que no cierra por un centavo, y el total es justamente
 * lo que se le informa al cliente.
 *
 * Módulo puro, sin `Intl`: el formato se escribe a mano para que dé exactamente
 * lo mismo en el servidor, en el navegador y en los tests, sin depender de la
 * versión de ICU que traiga cada uno.
 */

/** Centavos a pesos con separador de miles: 123456 → "$ 1.234,56". */
export function formatoImporte(centavos: number): string {
  const entero = Math.round(centavos);
  const signo = entero < 0 ? "-" : "";
  const absoluto = Math.abs(entero);
  const pesos = String(Math.floor(absoluto / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const resto = String(absoluto % 100).padStart(2, "0");
  return `${signo}$ ${pesos},${resto}`;
}

/**
 * Lee un importe escrito a mano y lo devuelve en centavos, o `undefined` si no
 * es un importe válido.
 *
 * Se acepta como se escribe en Argentina —"$ 1.234,56", con punto de miles y
 * coma decimal— y también "1234.56", que es lo que sale de copiar de una
 * planilla. La ambigüedad del punto se resuelve por la cantidad de dígitos que
 * lo siguen: "1.50" son un peso con cincuenta, "1.500" son mil quinientos.
 */
export function importeDesdeTexto(texto: string): number | undefined {
  const limpio = texto.replace(/[\s$]/g, "");
  if (!limpio) return undefined;
  // Nada de importes negativos: un reintegro se carga con su propio concepto,
  // no como un gasto en menos.
  if (!/^[\d.,]+$/.test(limpio)) return undefined;

  let normalizado: string;
  if (limpio.includes(",")) {
    // Con coma, la coma es el decimal y los puntos son separadores de miles.
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else {
    const puntos = limpio.split(".");
    normalizado =
      puntos.length === 2 && puntos[1].length === 2 ? limpio : limpio.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return undefined;
  const centavos = Math.round(Number(normalizado) * 100);
  return Number.isFinite(centavos) ? centavos : undefined;
}
