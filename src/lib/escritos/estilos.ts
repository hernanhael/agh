import type { CSSProperties } from "react";
import { FORMATO_ESCRITO, type FormatoEscrito } from "@/lib/datos/tipos";

/**
 * El formato del estudio convertido en estilos de la hoja
 * (docs/02-expedientes.md §2.5).
 *
 * Van como estilos en línea y no como clases porque son **medidas del
 * documento**, no decisiones de interfaz: centímetros de margen y puntos de
 * cuerpo que el abogado elige y que tienen que salir iguales en la pantalla y
 * en la impresora. Tailwind no puede generar clases para valores que recién se
 * conocen en tiempo de ejecución.
 *
 * Módulo puro.
 */

/** El formato del estudio, o el de fábrica si todavía no configuró el suyo. */
export function formatoVigente(formato: FormatoEscrito | undefined): FormatoEscrito {
  return { ...FORMATO_ESCRITO, ...formato };
}

/**
 * La hoja: ancho A4 y los cuatro márgenes como relleno.
 *
 * El color va fijo en blanco y negro y no en los tonos del sistema: una hoja
 * judicial es blanca aunque la aplicación esté en modo oscuro, y lo que se ve
 * en pantalla tiene que ser lo que sale impreso.
 */
export function estiloHoja(formato: FormatoEscrito): CSSProperties {
  return {
    width: "21cm",
    paddingTop: `${formato.margenSuperior}cm`,
    paddingBottom: `${formato.margenInferior}cm`,
    paddingLeft: `${formato.margenIzquierdo}cm`,
    paddingRight: `${formato.margenDerecho}cm`,
    fontFamily: `"${formato.fuente}", serif`,
    fontSize: `${formato.tamanio}pt`,
    lineHeight: formato.interlineado,
    background: "#ffffff",
    color: "#000000",
  };
}

/** Un párrafo del cuerpo: su sangría y su alineación. */
export function estiloParrafo(formato: FormatoEscrito): CSSProperties {
  return {
    textIndent: formato.sangria > 0 ? `${formato.sangria}cm` : undefined,
    textAlign: formato.textoJustificado ? "justify" : "left",
    margin: 0,
  };
}

/** La carátula en el encabezado, con la forma que eligió el abogado. */
export function estiloCaratula(formato: FormatoEscrito): CSSProperties {
  return {
    fontWeight: formato.caratulaNegrita ? 700 : 400,
    fontSize: `${formato.caratulaTamanio}pt`,
    textTransform: formato.caratulaMayusculas ? "uppercase" : "none",
  };
}
