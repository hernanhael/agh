import { randomUUID } from "node:crypto";
import { importeDesdeTexto } from "@/lib/contabilidad/importe";
import { oracion } from "@/lib/formato";
import { fechaValida } from "@/lib/plazos/calendario";
import { ahora, hoy, leerDatos, modificarDatos } from "./almacen";
import { correcto, fallo, type Resultado } from "./resultado";
import {
  CONCEPTOS_GASTO,
  ESTADOS_GASTO,
  TIPOS_GASTO,
  type ConceptoGasto,
  type EstadoGasto,
  type Gasto,
  type TipoGasto,
} from "./tipos";

/**
 * Contabilidad del expediente: alta, edición y baja de partidas
 * (`fees_expenses` en docs/06-modelo-de-datos.md, docs/02-expedientes.md §2.12).
 *
 * Los totales no viven acá: se calculan con `lib/contabilidad`, que es puro.
 * Este módulo solo guarda y devuelve hechos.
 */

export interface EntradaGasto {
  expedienteId: string;
  tipo: TipoGasto;
  concepto: ConceptoGasto;
  detalle: string;
  /** Tal como lo escribe el abogado: "1.234,56", "$ 980". */
  importe: string;
  /** 'YYYY-MM-DD'. Si viene vacía se usa la de hoy. */
  fecha: string;
  estado: EstadoGasto;
}

/** El valor pedido si está en el catálogo; si no, el primero de la lista. */
function deCatalogo<T extends string>(
  catalogo: ReadonlyArray<{ valor: T }>,
  valor: string,
  porDefecto: T,
): T {
  return catalogo.some((candidato) => candidato.valor === valor) ? (valor as T) : porDefecto;
}

/** Las partidas de un expediente, de la más reciente a la más antigua. */
export async function listarGastos(expedienteId: string): Promise<Gasto[]> {
  const datos = await leerDatos();
  return (datos.gastos ?? [])
    .filter((gasto) => gasto.expedienteId === expedienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn));
}

/** Todas las partidas del estudio. Es por donde va a entrar el promedio por materia. */
export async function listarTodosLosGastos(): Promise<Gasto[]> {
  const datos = await leerDatos();
  return datos.gastos ?? [];
}

export async function crearGasto(entrada: EntradaGasto): Promise<Resultado<Gasto>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find(
      (candidato) => candidato.id === entrada.expedienteId,
    );
    if (!expediente) return fallo<Gasto>("No se encontró el expediente.");

    const importe = importeDesdeTexto(entrada.importe);
    if (importe === undefined) {
      return fallo<Gasto>("Escribí el importe en pesos, por ejemplo 1.234,56.");
    }
    if (importe === 0) return fallo<Gasto>("El importe no puede ser cero.");

    const detalle = oracion(entrada.detalle);
    if (!detalle) return fallo<Gasto>("Escribí qué fue el gasto.");

    const marca = ahora();
    const gasto: Gasto = {
      id: randomUUID(),
      expedienteId: expediente.id,
      tipo: deCatalogo(TIPOS_GASTO, entrada.tipo, "gasto"),
      concepto: deCatalogo(CONCEPTOS_GASTO, entrada.concepto, "otro"),
      detalle,
      importe,
      // Mientras no haya selector de moneda en pantalla, toda partida es en
      // pesos. El campo existe para el día que haya una pericia en dólares.
      moneda: "ARS",
      fecha: fechaValida(entrada.fecha) || hoy(),
      estado: deCatalogo(ESTADOS_GASTO, entrada.estado, "pagado_estudio"),
      creadoEn: marca,
      actualizadoEn: marca,
    };

    // El almacén puede venir de una versión anterior, sin la lista.
    datos.gastos ??= [];
    datos.gastos.push(gasto);
    return correcto(gasto);
  });
}

export async function eliminarGasto(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    datos.gastos ??= [];
    const indice = datos.gastos.findIndex((gasto) => gasto.id === id);
    if (indice === -1) return fallo<string>("No se encontró la partida.");
    const [borrada] = datos.gastos.splice(indice, 1);
    return correcto(borrada.detalle);
  });
}
