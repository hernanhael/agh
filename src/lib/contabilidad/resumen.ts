import type { ConceptoGasto, Gasto } from "@/lib/datos/tipos";

/**
 * Totales de la contabilidad de un expediente (docs/02-expedientes.md §2.12).
 *
 * Módulo puro, como `lib/plazos` y `lib/procesal`: recibe las partidas y
 * devuelve las sumas. Nada de esto se guarda —un total persistido queda viejo
 * con la primera partida que se agregue—, igual que la situación de caducidad
 * se deduce y no se almacena (§2.11).
 */

export interface ResumenConcepto {
  concepto: ConceptoGasto;
  total: number;
  cantidad: number;
}

export interface ResumenContable {
  /** Todo lo que lleva el juicio: gastos más honorarios. Es lo que paga el cliente. */
  total: number;
  /** Erogaciones del juicio, sin honorarios. */
  gastos: number;
  /** Honorarios pactados y regulados. */
  honorarios: number;
  /** Ya desembolsado, por el estudio o por el cliente. */
  pagado: number;
  /** Todavía no desembolsado: la parte estimada del total. */
  previsto: number;
  /** Lo que el estudio adelantó y el cliente no reintegró todavía. */
  aRendir: number;
  /** Cantidad de partidas cargadas. */
  partidas: number;
  /** Totales por concepto, de mayor a menor. Solo los conceptos con partidas. */
  porConcepto: ResumenConcepto[];
}

export function resumenContable(gastos: ReadonlyArray<Gasto>): ResumenContable {
  const porConcepto = new Map<ConceptoGasto, ResumenConcepto>();
  let total = 0;
  let honorarios = 0;
  let pagado = 0;
  let aRendir = 0;

  for (const gasto of gastos) {
    total += gasto.importe;
    if (gasto.tipo !== "gasto") honorarios += gasto.importe;
    if (gasto.estado !== "previsto") pagado += gasto.importe;
    if (gasto.estado === "pagado_estudio") aRendir += gasto.importe;

    const acumulado = porConcepto.get(gasto.concepto);
    if (acumulado) {
      acumulado.total += gasto.importe;
      acumulado.cantidad += 1;
    } else {
      porConcepto.set(gasto.concepto, {
        concepto: gasto.concepto,
        total: gasto.importe,
        cantidad: 1,
      });
    }
  }

  return {
    total,
    gastos: total - honorarios,
    honorarios,
    pagado,
    previsto: total - pagado,
    aRendir,
    partidas: gastos.length,
    porConcepto: [...porConcepto.values()].sort((a, b) => b.total - a.total),
  };
}
