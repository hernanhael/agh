/**
 * Atajos de teclado del expediente.
 *
 * Las teclas de función de las pestañas viven en `pestanas.ts`, que es su
 * fuente de la verdad. Acá van los atajos de adentro de una pestaña: la nota
 * (`alt+n`) y el formulario del expediente (`alt+e`) en Datos, y el alta de
 * una parte (`alt+p`) en Partes.
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
