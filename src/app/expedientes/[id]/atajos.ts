/**
 * Atajos de teclado del expediente.
 *
 * Las teclas de función de las pestañas viven en `pestanas.ts`, que es su
 * fuente de la verdad. Acá van los atajos de adentro de una pestaña: la nota
 * (`alt+n`) y el formulario del expediente (`alt+e`) en Datos, y en Partes el
 * alta (`alt+p`) y los cuatro que recorren el tablero por lado —`alt+a`,
 * `alt+d`, `alt+g` y `alt+t`— que están al final del archivo.
 *
 * **Los dos van con Alt**, y la razón empieza en la nota: Chrome en Windows se
 * reserva `Ctrl+N` para abrir una ventana nueva y **no le entrega el evento a
 * la página**, así que no hay `preventDefault()` que lo evite —no es que no
 * funcione bien, es que el atajo nunca llega—. Con la nota forzada a `Alt`, el
 * expediente lo acompaña: dos atajos de la misma pantalla con modificadores
 * distintos se recuerdan peor que dos iguales.
 *
 * **`Alt+E` tiene una reserva**: en Chrome abre el menú de tres puntos, igual
 * que `Alt+F` y `F10`. A diferencia de `Ctrl+N`, el evento sí llega a la
 * página, pero que `preventDefault()` alcance para que el menú no se abra no
 * está documentado de forma confiable y cambió entre navegadores. Si llega a
 * abrirse el menú, lo único que hay que cambiar es la letra de acá: el atajo
 * está en un solo lugar y las pistas de la pantalla lo leen de estas
 * constantes.
 *
 * Los atajos se comparan por `evento.code` —la tecla física— y no por
 * `evento.key`: con un modificador apretado, `key` depende de la distribución
 * del teclado y en algunas devuelve otro carácter, mientras que `KeyN` es la
 * misma tecla en todas.
 */

/**
 * Lo que se muestra al pasar el mouse. Es el atajo escrito, no una clave.
 *
 * Va en minúscula, y hay que forzarlo donde se muestra: las pistas usan la
 * clase `.rotulo-tecla` (`app/globals.css`), que es el rótulo sin las
 * versalitas: la utilidad `normal-case` de Tailwind no alcanza, porque va en
 * `@layer utilities` y pierde contra el `uppercase` de `.rotulo`, que está sin
 * capa.
 */
export const ATAJO_NOTA = "alt+n";
export const ATAJO_EXPEDIENTE = "alt+e";
export const ATAJO_PARTE = "alt+p";

/** El código de tecla de cada atajo, que es con lo que se los compara. */
export const TECLA_EXPEDIENTE = "KeyE";
export const TECLA_PARTE = "KeyP";

/*
 * No hace falta preguntar si el foco está en un campo de texto, que es lo que
 * uno haría para que escribir una "n" en un domicilio no abra la nota.
 *
 * `Alt`+letra **no escribe texto**: lo que escribe es `AltGr`+letra —la arroba,
 * las comillas—, y `AltGr` prende `ctrlKey` además de `altKey`, así que las dos
 * funciones de abajo ya lo descartan al exigir `!evento.ctrlKey`. Sin ese
 * riesgo, los atajos tienen que andar también con el foco adentro de un campo:
 * si no, el mismo atajo que abre el formulario no podría cerrarlo, porque para
 * entonces el foco está en el primer campo.
 */

/** `Alt`+una tecla, y ningún otro modificador apretado. */
export function esAtajoAlt(evento: KeyboardEvent, codigo: string): boolean {
  if (!evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) return false;
  return evento.code === codigo;
}

/** `Alt+N`, el de la nota. */
export function esAtajoNota(evento: KeyboardEvent): boolean {
  return esAtajoAlt(evento, "KeyN");
}

/**
 * Los atajos de **cada lado de la nómina de partes**: `alt+a` la parte actora,
 * `alt+d` la demandada, `alt+g` la citada en garantía, `alt+t` —o `alt+5`—
 * los terceros y `alt+j` —o `alt+6`— los auxiliares del juzgado.
 *
 * **Abren y cierran el lado**, y al abrirlo ponen el foco en su primera parte;
 * de ahí en adelante se camina con las flechas, no repitiendo el atajo. Si el
 * lado ya está abierto y el foco está en otro lado, el atajo lleva a su
 * primera parte; si el foco ya está adentro, lo cierra (`AtajosDeLado.tsx`).
 *
 * Las letras son las iniciales de cada lado y por eso se acuerdan. Los terceros
 * llevan dos teclas porque la `t` es la inicial y el `5` es el número del lado
 * contando desde arriba; cuesta lo mismo aceptar las dos que elegir una.
 *
 * El lado se compara contra el atributo `data-lado` que la pestaña escribe en
 * cada grupo del tablero (`partes/page.tsx`), así que lo que decide qué parte
 * recibe el foco es el orden en que están en la pantalla y no una lista aparte
 * que haya que mantener sincronizada.
 */
export const ATAJOS_LADO: ReadonlyArray<{
  /** El lado del tablero, como lo nombra `LadoParte` en `lib/procesal`. */
  lado: string;
  /** El atajo escrito, para la pista que la pestaña muestra al pasar el mouse. */
  atajo: string;
  /** Las teclas físicas que lo disparan (`KeyboardEvent.code`). */
  codigos: ReadonlyArray<string>;
}> = [
  { lado: "actora", atajo: "alt+a", codigos: ["KeyA"] },
  { lado: "demandada", atajo: "alt+d", codigos: ["KeyD"] },
  { lado: "citada", atajo: "alt+g", codigos: ["KeyG"] },
  { lado: "terceros", atajo: "alt+t", codigos: ["KeyT", "Digit5", "Numpad5"] },
  // Los auxiliares del juzgado: la `j` de juzgado, porque la `a` es de la
  // actora, y el `6` por ser el sexto contando desde arriba, como el `5` de los
  // terceros. Ninguna de las dos escribe un carácter con AltGr.
  { lado: "auxiliares", atajo: "alt+j", codigos: ["KeyJ", "Digit6", "Numpad6"] },
];

/**
 * El atajo de un lado, **aceptando también el `Alt` de la derecha**.
 *
 * En los teclados latinoamericanos el Alt derecho es `AltGr`, que prende
 * `ctrlKey` además de `altKey`, así que `esAtajoAlt` lo rechaza —y con razón,
 * porque `AltGr`+tecla es lo que escribe la arroba y el numeral—. Pero ninguna
 * de las teclas de este tablero escribe un carácter con `AltGr` en esa
 * distribución, y pedirle a quien usa el Alt de la derecha que cambie de mano
 * para recorrer la nómina no tiene sentido: acá se aceptan los dos.
 */
export function esAtajoDeLado(evento: KeyboardEvent, codigo: string): boolean {
  if (!evento.altKey || evento.metaKey || evento.shiftKey) return false;
  return evento.code === codigo;
}

/** El atajo escrito de un lado, o cadena vacía si ese lado no tiene. */
export function atajoDeLado(lado: string): string {
  return ATAJOS_LADO.find((candidato) => candidato.lado === lado)?.atajo ?? "";
}
