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
export {
  recorridoDeEtapas,
  type EstadoEtapa,
  type EtapaRecorrida,
  type Recorrido,
} from "./recorrido";
export {
  construirHistoria,
  esImpulsoProcesal,
  FILTROS_HISTORIA,
  filtrarHistoria,
  filtroValido,
  movimientoDesdeHistoria,
  ordenarHistoria,
  type FilaHistoria,
  type FiltroHistoria,
} from "./historia";
export {
  agruparPartes,
  clienteDeLaNomina,
  faltantesDeCaratula,
  LADOS_PARTE,
  ladoDeRol,
  seNotifica,
  type FaltanteDeCaratula,
  type GrupoPartes,
  type LadoParte,
  type ParteConRepresentantes,
} from "./partes";
