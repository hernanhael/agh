/**
 * Composición de escritos: el encabezado que sale de los metadatos del
 * expediente y el formato con el que el estudio los presenta
 * (docs/02-expedientes.md §2.5).
 *
 * Módulos **puros**, como `lib/formato` y `lib/procesal`: no tocan el almacén,
 * así que sirven igual en el servidor y en el editor, que corre en el cliente
 * para previsualizar mientras se escribe.
 */
export {
  encabezadoDeEscrito,
  parrafosDelCuerpo,
  type EncabezadoEscrito,
} from "./encabezado";
export { estiloCaratula, estiloHoja, estiloParrafo, formatoVigente } from "./estilos";
