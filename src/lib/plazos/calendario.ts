import type { DiaInhabil, FechaISO } from "./tipos";

/**
 * Utilidades de fecha y calendario para el motor de plazos.
 *
 * Todas las fechas se manejan como 'YYYY-MM-DD' y se calculan en UTC para
 * evitar que el huso horario de la máquina donde corre el código altere el
 * día calendario (Argentina no tiene horario de verano, pero el cómputo debe
 * ser determinístico sin importar dónde se ejecute).
 */

function partes(fecha: FechaISO): { y: number; m: number; d: number } {
  const [y, m, d] = fecha.split("-").map(Number);
  return { y, m, d };
}

function aTimestamp(fecha: FechaISO): number {
  const { y, m, d } = partes(fecha);
  return Date.UTC(y, m - 1, d);
}

function deTimestamp(ts: number): FechaISO {
  const date = new Date(ts);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Suma (o resta, con n negativo) días calendario a una fecha. */
export function sumarDias(fecha: FechaISO, n: number): FechaISO {
  return deTimestamp(aTimestamp(fecha) + n * 86_400_000);
}

/** 0 = domingo ... 6 = sábado. */
export function diaDeSemana(fecha: FechaISO): number {
  return new Date(aTimestamp(fecha)).getUTCDay();
}

export function esFinDeSemana(fecha: FechaISO): boolean {
  const dia = diaDeSemana(fecha);
  return dia === 0 || dia === 6;
}

/** Formatea 'YYYY-MM-DD' como 'DD/MM' para la explicación auditable. */
export function formatoCorto(fecha: FechaISO): string {
  const { d, m } = partes(fecha);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/**
 * Busca en el calendario la entrada que hace inhábil una fecha para un
 * centro judicial dado. Un asueto de alcance 'centro_judicial' solo afecta
 * al centro indicado en la propia entrada; el resto de los alcances
 * (nacional, provincial, feria) afectan a todos los centros.
 */
export function buscarDiaInhabil(
  fecha: FechaISO,
  centroJudicial: string,
  calendario: DiaInhabil[],
): DiaInhabil | undefined {
  return calendario.find((dia) => {
    if (dia.fecha !== fecha) return false;
    if (dia.alcance === "centro_judicial") return dia.centroJudicial === centroJudicial;
    return true;
  });
}

export function esFeria(fecha: FechaISO, calendario: DiaInhabil[]): boolean {
  return calendario.some((dia) => dia.fecha === fecha && dia.alcance === "feria");
}

/**
 * Un día es hábil si no es fin de semana y no figura en el calendario como
 * inhábil para el centro judicial dado (feriado nacional/provincial, feria
 * judicial o asueto propio del centro).
 */
export function esHabil(
  fecha: FechaISO,
  centroJudicial: string,
  calendario: DiaInhabil[],
): boolean {
  if (esFinDeSemana(fecha)) return false;
  return buscarDiaInhabil(fecha, centroJudicial, calendario) === undefined;
}

/**
 * Motivo legible de por qué una fecha es inhábil (para la explicación).
 *
 * Un motivo del calendario (feria, feriado, asueto) prima sobre "sábado" o
 * "domingo": si un fin de semana cae dentro de una feria, la explicación
 * debe leerse como un tramo continuo de feria, no interrumpido dos veces
 * por el fin de semana que ya queda incluido en ese tramo.
 */
export function motivoInhabil(
  fecha: FechaISO,
  centroJudicial: string,
  calendario: DiaInhabil[],
): string {
  const entrada = buscarDiaInhabil(fecha, centroJudicial, calendario);
  if (entrada) return entrada.motivo;
  if (esFinDeSemana(fecha)) {
    return diaDeSemana(fecha) === 0 ? "domingo" : "sábado";
  }
  return "día inhábil";
}

/** Primer día hábil estrictamente posterior a `fecha` (no incluye `fecha`). */
export function siguienteHabil(
  fecha: FechaISO,
  centroJudicial: string,
  calendario: DiaInhabil[],
): FechaISO {
  let cursor = sumarDias(fecha, 1);
  while (!esHabil(cursor, centroJudicial, calendario)) {
    cursor = sumarDias(cursor, 1);
  }
  return cursor;
}

/** `fecha` si ya es hábil; si no, el primer día hábil posterior (función "techo"). */
export function diaHabilOMismo(
  fecha: FechaISO,
  centroJudicial: string,
  calendario: DiaInhabil[],
): FechaISO {
  return esHabil(fecha, centroJudicial, calendario)
    ? fecha
    : siguienteHabil(fecha, centroJudicial, calendario);
}

/** Último día del mes de una fecha: 28, 29, 30 o 31. */
function ultimoDiaDelMes(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Suma (o resta, con n negativo) meses calendario.
 *
 * Si el día no existe en el mes de destino, se usa el último de ese mes
 * (31/03 + 1 mes = 30/04), como manda el artículo 6 del Código Civil y
 * Comercial para los plazos contados por meses. Es el cómputo que necesita la
 * caducidad de instancia, que corre por meses corridos y no por días hábiles.
 */
export function sumarMeses(fecha: FechaISO, n: number): FechaISO {
  const { y, m, d } = partes(fecha);
  const destino = new Date(Date.UTC(y, m - 1 + n, 1));
  const anio = destino.getUTCFullYear();
  const mes = destino.getUTCMonth() + 1;
  return deTimestamp(Date.UTC(anio, mes - 1, Math.min(d, ultimoDiaDelMes(anio, mes))));
}

/** Días calendario de `desde` a `hasta`. Negativo si `hasta` ya pasó. */
export function diasEntre(desde: FechaISO, hasta: FechaISO): number {
  return Math.round((aTimestamp(hasta) - aTimestamp(desde)) / 86_400_000);
}

/** Formatea 'YYYY-MM-DD' como 'DD/MM/AAAA' para mostrar en pantalla. */
export function formatoFecha(fecha: FechaISO): string {
  const { y, m, d } = partes(fecha);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}
