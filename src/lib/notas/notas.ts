/**
 * Notas con formato: negrita, itálica y subrayado (docs/02-expedientes.md §2.1).
 *
 * La nota del expediente se escribe en la ficha y se guarda en `cases.notas`,
 * que es **una sola columna de texto**. Para que el formato sobreviva ahí sin
 * cambiar el modelo de datos, se guarda con marcas:
 *
 *     Reunión el 3/10. [b]Ojo[/b]: vence el plazo de [u]prueba[/u].
 *
 * Por qué marcas y no HTML: el texto guardado se vuelve a leer en el servidor
 * para mostrarlo, y guardar HTML obligaría a inyectarlo con
 * `dangerouslySetInnerHTML` o a arrastrar un sanitizador. Con marcas, quien lo
 * muestra construye los elementos él mismo —`<strong>`, `<em>`, `<u>` y nada
 * más— y **no hay forma de que lo escrito en una nota se convierta en
 * etiquetas**. Es la misma decisión que el resto de `lib/`: el formato vive en
 * funciones puras y testeables, y el almacén guarda texto.
 *
 * Las notas escritas antes de que esto existiera no tienen marcas y se leen
 * como una nota sin formato, que es exactamente lo que son.
 *
 * **Limitación conocida**: una nota que contenga literalmente "[b]" escrito a
 * mano se interpreta como marca y ese texto se pierde al leerlo. Se acepta
 * porque en una nota de un expediente no aparece, y evitarlo pediría un
 * escape que ensuciaría el texto guardado. Si alguna vez molesta, el lugar de
 * arreglarlo es acá y no en quien muestra la nota.
 */

/** Las tres variantes que ofrece el editor de la ficha. */
export type Marca = "b" | "i" | "u";

/** Un tramo de nota que comparte el mismo formato. */
export interface TrozoNota {
  texto: string;
  negrita: boolean;
  italica: boolean;
  subrayado: boolean;
}

/** Una línea de la nota. Vacía es un renglón en blanco. */
export type LineaNota = TrozoNota[];

/** Si el texto trae marcas de formato, y entonces no se puede normalizar. */
export function tieneMarcas(texto: string): boolean {
  return /\[\/?[biu]\]/.test(texto);
}

/** Dos trozos se pueden fusionar si llevan exactamente el mismo formato. */
function mismoFormato(uno: TrozoNota, otro: TrozoNota): boolean {
  return (
    uno.negrita === otro.negrita &&
    uno.italica === otro.italica &&
    uno.subrayado === otro.subrayado
  );
}

/**
 * Junta los trozos contiguos de igual formato y descarta los vacíos.
 *
 * Importa para que el texto guardado no crezca con el uso: escribir una
 * palabra en negrita letra por letra deja un trozo por letra, y sin fusionar
 * se guardaría `[b]O[/b][b]j[/b][b]o[/b]` en lugar de `[b]Ojo[/b]`.
 */
function fusionar(linea: LineaNota): LineaNota {
  const salida: LineaNota = [];
  for (const trozo of linea) {
    if (!trozo.texto) continue;
    const ultimo = salida[salida.length - 1];
    if (ultimo && mismoFormato(ultimo, trozo)) ultimo.texto += trozo.texto;
    else salida.push({ ...trozo });
  }
  return salida;
}

/**
 * Lee el texto guardado y lo parte en líneas y trozos con su formato.
 *
 * Las marcas se cuentan en lugar de prenderse y apagarse, así que una marca
 * repetida o sin cerrar no desordena el resto: `[b]` dos veces sigue en
 * negrita hasta los dos `[/b]`, y un cierre de más se ignora. Eso es lo que
 * permite confiar en el texto guardado sin validarlo antes.
 */
export function parsearNota(texto: string): LineaNota[] {
  const lineas: LineaNota[] = [[]];
  const abiertas: Record<Marca, number> = { b: 0, i: 0, u: 0 };

  function agregar(crudo: string): void {
    if (!crudo) return;
    // Un trozo puede abarcar varios renglones: el salto de línea corta línea
    // sin cerrar el formato, igual que en cualquier editor.
    const renglones = crudo.split("\n");
    renglones.forEach((renglon, indice) => {
      if (indice > 0) lineas.push([]);
      if (!renglon) return;
      lineas[lineas.length - 1].push({
        texto: renglon,
        negrita: abiertas.b > 0,
        italica: abiertas.i > 0,
        subrayado: abiertas.u > 0,
      });
    });
  }

  const marcas = /\[(\/?)([biu])\]/g;
  let desde = 0;
  for (const encontrada of texto.matchAll(marcas)) {
    agregar(texto.slice(desde, encontrada.index));
    const marca = encontrada[2] as Marca;
    if (encontrada[1] === "/") abiertas[marca] = Math.max(0, abiertas[marca] - 1);
    else abiertas[marca] += 1;
    desde = encontrada.index + encontrada[0].length;
  }
  agregar(texto.slice(desde));

  return lineas.map(fusionar);
}

/**
 * Vuelve a texto con marcas lo que se leyó del editor.
 *
 * El anidado va siempre en el mismo orden —negrita afuera, después itálica,
 * subrayado adentro— para que guardar dos veces la misma nota dé el mismo
 * texto. El orden no cambia cómo se lee: `parsearNota` cuenta las marcas sin
 * importar cómo estén anidadas.
 */
export function serializarNota(lineas: LineaNota[]): string {
  return lineas
    .map((linea) =>
      fusionar(linea)
        .map((trozo) => {
          let salida = trozo.texto;
          if (trozo.subrayado) salida = `[u]${salida}[/u]`;
          if (trozo.italica) salida = `[i]${salida}[/i]`;
          if (trozo.negrita) salida = `[b]${salida}[/b]`;
          return salida;
        })
        .join(""),
    )
    .join("\n")
    // Los editables dejan renglones en blanco al principio y al final al
    // escribir; los de adentro de la nota se conservan porque los puso quien
    // la escribió.
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

/** Si la nota no tiene nada escrito, más allá de renglones y espacios. */
export function notaVacia(texto: string): boolean {
  return parsearNota(texto).every((linea) =>
    linea.every((trozo) => trozo.texto.trim() === ""),
  );
}
