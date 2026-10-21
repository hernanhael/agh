import type {
  EntradaHistoria,
  Expediente,
  TipoEntrada,
  TipoProceso,
} from "@/lib/datos/tipos";
import { audienciaFijada } from "./audiencia";

/**
 * Cómo se lee la historia del expediente (docs/02-expedientes.md §2.3).
 *
 * Dos cosas que no son evidentes y que este módulo resuelve:
 *
 * 1. **No todo lo que pasa impulsa el proceso.** Una nota del abogado o un
 *    documento guardado no mueven el expediente; un decreto, un escrito propio
 *    o uno de la contraria sí. De eso depende la fecha del último movimiento
 *    útil, que es de la que se cuenta la caducidad de instancia (§2.11).
 * 2. **La ficha también cuenta hechos.** El alta del expediente o la caducidad
 *    declarada no son actuaciones que alguien vaya a cargar, pero pasaron. La
 *    historia los muestra junto a las entradas, marcados como lo que son, y
 *    deja de mostrar los que una entrada ya cuenta mejor.
 *
 * Módulo puro, como el resto de `lib/procesal`.
 */

/**
 * Los tipos de entrada que son **actos de impulso procesal**.
 *
 * Es la lista que decide qué entrada corre la fecha del último movimiento útil.
 * Un documento que se guarda, una nota o una audiencia que se celebra no
 * impulsan por sí mismos: lo que impulsa es lo que se presenta o lo que provee
 * el juzgado.
 */
const TIPOS_DE_IMPULSO: ReadonlyArray<TipoEntrada> = [
  "actuacion_juzgado",
  "escrito_propio",
  "escrito_contraria",
  "escrito_auxiliar",
];

/** Si la entrada mueve el expediente a los efectos de la caducidad. */
export function esImpulsoProcesal(tipo: TipoEntrada): boolean {
  return TIPOS_DE_IMPULSO.includes(tipo);
}

/**
 * De la más reciente a la más antigua, que es como se abre un expediente
 * cuando se quiere saber en qué quedó. Entre dos del mismo día manda el orden
 * de carga, porque dentro de un día la historia no tiene hora.
 */
export function ordenarHistoria(entradas: ReadonlyArray<EntradaHistoria>): EntradaHistoria[] {
  return [...entradas].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn),
  );
}

/** La fecha del último acto de impulso, o `undefined` si no hay ninguno. */
export function movimientoDesdeHistoria(
  entradas: ReadonlyArray<EntradaHistoria>,
): string | undefined {
  const fechas = entradas
    .filter((entrada) => esImpulsoProcesal(entrada.tipo))
    .map((entrada) => entrada.fecha)
    .sort();
  return fechas.at(-1);
}

/** Qué se mira: todo, o un solo lado de la causa. */
export type FiltroHistoria = "todo" | "juzgado" | "estudio" | "contraria";

export const FILTROS_HISTORIA: ReadonlyArray<{
  valor: FiltroHistoria;
  etiqueta: string;
  /** Vacío en "todo": no filtra nada. */
  tipos: ReadonlyArray<TipoEntrada>;
}> = [
  { valor: "todo", etiqueta: "Todo", tipos: [] },
  { valor: "juzgado", etiqueta: "El juzgado", tipos: ["actuacion_juzgado"] },
  { valor: "estudio", etiqueta: "El estudio", tipos: ["escrito_propio", "nota", "documento"] },
  {
    valor: "contraria",
    etiqueta: "La contraria y los auxiliares",
    tipos: ["escrito_contraria", "escrito_auxiliar"],
  },
];

/** El filtro pedido si existe; si no, "todo". */
export function filtroValido(valor: string | undefined): FiltroHistoria {
  return FILTROS_HISTORIA.some((filtro) => filtro.valor === valor)
    ? (valor as FiltroHistoria)
    : "todo";
}

/**
 * Una fila de la línea de tiempo.
 *
 * Con `entrada` es una entrada cargada: se puede consultar, editar y borrar.
 * Sin ella es un hecho que cuenta la ficha —el alta, la caducidad declarada—,
 * que se muestra apagado y no se toca desde acá.
 */
export interface FilaHistoria {
  /** Estable entre renders: el id de la entrada, o una clave del hecho. */
  clave: string;
  fecha: string;
  titulo: string;
  detalle?: string;
  entrada?: EntradaHistoria;
  /** Nombre de la etapa que abre esta fila, si abre alguna. */
  abreEtapa?: string;
}

/**
 * Las filas que corresponden al filtro elegido.
 *
 * Con un filtro puesto quedan solo las entradas cargadas de esos tipos: los
 * hechos de la ficha se van, porque la pregunta "qué hizo el juzgado" no se
 * contesta con el alta del expediente.
 */
export function filtrarHistoria(
  filas: ReadonlyArray<FilaHistoria>,
  filtro: FiltroHistoria,
): FilaHistoria[] {
  const tipos = FILTROS_HISTORIA.find((candidato) => candidato.valor === filtro)?.tipos ?? [];
  if (tipos.length === 0) return [...filas];
  return filas.filter((fila) => fila.entrada && tipos.includes(fila.entrada.tipo));
}

/**
 * La historia completa: las entradas cargadas más los hechos de la ficha,
 * en una sola línea de tiempo.
 *
 * Los hechos de la ficha se omiten cuando una entrada ya los cuenta mejor: si
 * un decreto abrió la etapa actual, sobra la fila "pasa a la etapa X", y si hay
 * un impulso cargado el mismo día del último movimiento, sobra la fila que
 * repite esa fecha. La historia de verdad le va ganando lugar a la ficha a
 * medida que se carga.
 *
 * Solo entra lo que **ya pasó**: una audiencia futura es agenda, no historia.
 */
export function construirHistoria({
  expediente,
  tipo,
  entradas,
  hoy,
}: {
  expediente: Expediente;
  tipo: TipoProceso | undefined;
  entradas: ReadonlyArray<EntradaHistoria>;
  hoy: string;
}): FilaHistoria[] {
  const nombreEtapa = (clave: string) =>
    tipo?.etapas.find((etapa) => etapa.clave === clave)?.nombre ?? clave;

  const filas: FilaHistoria[] = entradas.map((entrada) => ({
    clave: entrada.id,
    fecha: entrada.fecha,
    titulo: entrada.titulo,
    entrada,
    abreEtapa: entrada.abreEtapa ? nombreEtapa(entrada.abreEtapa) : undefined,
  }));

  filas.push({
    clave: "alta",
    fecha: expediente.creadoEn.slice(0, 10),
    titulo: "Alta del expediente en el sistema",
    detalle: tipo ? `Tipo de proceso: ${tipo.nombre}` : undefined,
  });

  // La etapa actual ya está contada si alguna entrada la abrió.
  const etapaContada = entradas.some((entrada) => entrada.abreEtapa === expediente.etapaActual);
  if (expediente.etapaDesde && !etapaContada) {
    filas.push({
      clave: "etapa",
      fecha: expediente.etapaDesde,
      titulo: `Pasa a la etapa ${nombreEtapa(expediente.etapaActual)}`,
    });
  }

  // Lo mismo con el último movimiento: si hay un impulso cargado ese día, la
  // historia ya dice qué fue, que es más de lo que decía la ficha.
  const movimientoContado = entradas.some(
    (entrada) => esImpulsoProcesal(entrada.tipo) && entrada.fecha === expediente.ultimoMovimiento,
  );
  if (expediente.ultimoMovimiento && !movimientoContado) {
    filas.push({
      clave: "movimiento",
      fecha: expediente.ultimoMovimiento,
      titulo: "Último movimiento útil del expediente",
      detalle: "Es la fecha de la que se cuenta la caducidad de instancia",
    });
  }

  const audiencia = audienciaFijada(expediente, hoy);
  if (audiencia?.pasada) {
    filas.push({
      clave: "audiencia",
      fecha: audiencia.fecha,
      titulo: audiencia.tipo,
      detalle: audiencia.hora ? `Fijada a las ${audiencia.hora}` : undefined,
    });
  }

  if (expediente.caducidadDeclarada) {
    filas.push({
      clave: "caducidad",
      fecha: expediente.caducidadDeclarada,
      titulo: "El juzgado declaró la caducidad de instancia",
    });
  }

  return filas.sort(
    (a, b) =>
      b.fecha.localeCompare(a.fecha) ||
      (b.entrada?.creadoEn ?? "").localeCompare(a.entrada?.creadoEn ?? ""),
  );
}
