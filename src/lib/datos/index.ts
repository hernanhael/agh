/**
 * Barril **del servidor**: reexporta los repositorios, que llegan al almacén y
 * por lo tanto a `node:fs`.
 *
 * Desde un componente de cliente hay que importar de los módulos puros:
 * `@/lib/datos/tipos` (tipos y constantes) y `@/lib/datos/filtros` (búsqueda,
 * filtros, `identificador`). Si se importa este archivo por error, el mensaje
 * lo aclara: `almacen.ts` está marcado como `server-only`.
 */
export * from "./tipos";
export { correcto, fallo, type Resultado } from "./resultado";
export { hoy } from "./almacen";
export {
  actualizarTipoProceso,
  crearTipoProceso,
  eliminarTipoProceso,
  listarTiposProceso,
  listarTiposProcesoActivos,
  obtenerTipoProceso,
  type EntradaTipoProceso,
} from "./procesos";
export {
  actualizarAgente,
  clonarAgente,
  crearAgente,
  eliminarAgente,
  listarAgentes,
  obtenerAgente,
  sugerirAgentes,
  type EntradaAgente,
} from "./agentes";
export {
  actualizarExpediente,
  crearExpediente,
  eliminarExpediente,
  listarExpedientes,
  listarRadicaciones,
  obtenerExpediente,
  type EntradaExpediente,
} from "./expedientes";
export {
  aplicarFiltros,
  coincide,
  FILTROS_VACIOS,
  hayFiltros,
  identificador,
  nombreJuzgado,
  oficinaGestion,
  opcionesDeFiltro,
  type Filtros,
  type OpcionFiltro,
} from "./filtros";
export {
  actualizarEstudio,
  listarMaterias,
  obtenerEstudio,
  resumenConfiguracion,
  type EntradaEstudio,
} from "./estudio";
