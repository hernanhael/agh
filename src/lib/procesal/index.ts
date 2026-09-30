/**
 * Reglas de derecho procesal que el sistema aplica sobre el expediente.
 *
 * Son módulos **puros**, como `lib/plazos`: reciben el expediente y el día de
 * hoy, y devuelven una situación. No acceden al almacén, así que corren igual
 * en el servidor y en el cliente, y por eso el listado puede mostrar el semáforo
 * de caducidad mientras el abogado filtra.
 */
export {
  claseDeExpediente,
  DIAS_DE_AVISO,
  mesesDeCaducidad,
  MESES_SIN_MOVIMIENTO,
  situacionCaducidad,
  ultimoMovimiento,
  type EstadoProcesal,
  type SituacionCaducidad,
} from "./caducidad";
export { audienciaFijada, type AudienciaFijada } from "./audiencia";
