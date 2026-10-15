/**
 * Contabilidad del expediente: importes y totales.
 *
 * Módulos **puros**, como `lib/plazos` y `lib/procesal`. No acceden al almacén,
 * así que corren igual en el servidor y en el cliente y se testean sin montar
 * datos.
 */
export { formatoImporte, importeDesdeTexto } from "./importe";
export {
  resumenContable,
  type ResumenConcepto,
  type ResumenContable,
} from "./resumen";
