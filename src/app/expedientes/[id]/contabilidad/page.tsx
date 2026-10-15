import { Trash2 } from "lucide-react";
import {
  Campo,
  claseBotonPrimario,
  claseEntrada,
  claseSeparador,
  Marca,
  Pendientes,
  Vacio,
} from "@/components/ui";
import { formatoImporte, resumenContable } from "@/lib/contabilidad";
import {
  CONCEPTOS_GASTO,
  ESTADOS_GASTO,
  etiquetaDe,
  hoy,
  listarGastos,
  TIPOS_GASTO,
  type EstadoGasto,
} from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import { agregarGasto, borrarGasto } from "../../acciones";
import { cargarExpediente } from "../cargar";

/**
 * Pestaña **Contabilidad**: cuánto lleva gastado el juicio
 * (docs/02-expedientes.md §2.12, `fees_expenses` en docs/06-modelo-de-datos.md).
 *
 * Contesta dos preguntas distintas con los mismos datos. Hacia atrás, cuánto
 * salió **este** juicio, que es lo que hay que rendirle al cliente. Hacia
 * adelante, de qué se compone ese costo, que es el insumo del promedio por
 * materia con el que se le estima el costo a un cliente nuevo (pendiente).
 *
 * De las formas: el costo total es **una** cifra protagonista y no un gráfico
 * de una sola barra; lo pagado contra el total es un **medidor**, que es una
 * proporción contra un límite; y el desglose por concepto es una sola serie de
 * magnitudes, así que van barras horizontales ordenadas de mayor a menor, sin
 * leyenda —el título las nombra— y con la tabla de partidas debajo haciendo de
 * vista de datos.
 *
 * Las barras van en gris y no en el azul de acento a propósito: en esta
 * aplicación el color tiene significado reservado —el acento marca dónde estoy,
 * el semáforo marca el riesgo procesal— y acá la magnitud ya la lleva el largo
 * de la barra. Un azul decorativo le sacaría sentido a los otros dos.
 */

/** Una de las cifras de apoyo del encabezado. */
function Cifra({ rotulo, importe, ayuda }: { rotulo: string; importe: number; ayuda?: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-500">{rotulo}</dt>
      {/* `tabular-nums` acá sí: son una fila de números que deben alinearse. */}
      <dd className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {formatoImporte(importe)}
      </dd>
      {ayuda ? <dd className="text-xs text-zinc-500 dark:text-zinc-500">{ayuda}</dd> : null}
    </div>
  );
}

/** La situación de una partida: quién puso el dinero, o si todavía nadie. */
function SituacionPartida({ estado }: { estado: EstadoGasto }) {
  const etiqueta = etiquetaDe(ESTADOS_GASTO, estado);
  if (estado === "previsto") return <Marca tono="aviso">{etiqueta}</Marca>;
  if (estado === "pagado_estudio") return <Marca>{etiqueta}</Marca>;
  return <Marca tono="ok">{etiqueta}</Marca>;
}

export default async function ContabilidadExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/contabilidad">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const gastos = await listarGastos(expediente.id);
  const resumen = resumenContable(gastos);

  // La escala de las barras es el concepto más caro y no el total: con el total,
  // el concepto más chico quedaría en una barra invisible.
  const escala = resumen.porConcepto[0]?.total ?? 0;
  const porcentajePagado =
    resumen.total > 0 ? Math.round((resumen.pagado / resumen.total) * 100) : 0;

  return (
    <>
      {gastos.length === 0 ? (
        <Vacio>
          Todavía no hay nada cargado en la contabilidad de este expediente. Agregá la primera
          partida abajo: la tasa de justicia, el bono, una cédula.
        </Vacio>
      ) : (
        <>
          <section>
            <p className="rotulo text-zinc-500 dark:text-zinc-500">Costo total del juicio</p>
            {/*
              La cifra protagonista de la pestaña: una sola, grande, en la misma
              tipografía que el resto y con las cifras proporcionales de la fuente
              (no `tabular-nums`, que a este tamaño se ve flojo). Baja de tamaño en
              pantalla angosta porque un importe de millones a 48px se sale del
              cuadro en un teléfono.
            */}
            <p className="mt-0.5 text-3xl font-semibold leading-none text-zinc-900 sm:text-5xl dark:text-zinc-50">
              {formatoImporte(resumen.total)}
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              {resumen.partidas} {resumen.partidas === 1 ? "partida" : "partidas"}
              {resumen.previsto > 0
                ? `, de las que ${formatoImporte(resumen.previsto)} todavía no se pagaron`
                : null}
              .
            </p>
          </section>

          {/*
            Medidor de lo pagado contra el total. La pista es la línea del papel y
            el relleno un gris más hondo: el mismo tono un paso más abajo, para
            que el estado se lea a lo largo de toda la barra.
          */}
          <div aria-hidden className="mt-4 h-2 w-full overflow-hidden rounded-full bg-linea">
            <div
              className="h-full rounded-r-[4px] bg-zinc-500 dark:bg-zinc-400"
              style={{ width: `${porcentajePagado}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            Pagado {formatoImporte(resumen.pagado)} de {formatoImporte(resumen.total)} (
            {porcentajePagado}%)
          </p>

          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-3">
            <Cifra rotulo="Gastos" importe={resumen.gastos} ayuda="Sin honorarios" />
            <Cifra rotulo="Honorarios" importe={resumen.honorarios} ayuda="Pactados y regulados" />
            <Cifra
              rotulo="Puso el estudio"
              importe={resumen.aRendir}
              ayuda="Adelantado y sin rendir"
            />
          </dl>

          <section className={claseSeparador}>
            <h3 className="rotulo text-zinc-500 dark:text-zinc-500">En qué se va</h3>
            <ul className="mt-3 space-y-2.5">
              {resumen.porConcepto.map((fila) => {
                const concepto = etiquetaDe(CONCEPTOS_GASTO, fila.concepto);
                const partidas = `${fila.cantidad} ${fila.cantidad === 1 ? "partida" : "partidas"}`;
                return (
                  <li
                    key={fila.concepto}
                    title={`${concepto}: ${formatoImporte(fila.total)} en ${partidas}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[13rem_minmax(0,1fr)_auto]"
                  >
                    <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                      {concepto}
                    </span>
                    {/*
                      La barra nace en una sola línea de base a la izquierda, con
                      el extremo del dato redondeado y el de la base en escuadra.
                      En pantalla angosta pasa a su propia fila, abajo del nombre.
                    */}
                    <span aria-hidden className="col-span-2 flex h-2.5 w-full sm:col-span-1">
                      <span
                        className="h-full rounded-r-[4px] bg-zinc-500 dark:bg-zinc-400"
                        style={{ width: escala > 0 ? `${(fila.total / escala) * 100}%` : "0%" }}
                      />
                    </span>
                    <span className="whitespace-nowrap text-right text-sm tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatoImporte(fila.total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={claseSeparador}>
            <h3 className="rotulo text-zinc-500 dark:text-zinc-500">Partidas</h3>
            <ul className="mt-2 divide-y divide-linea">
              {gastos.map((gasto) => (
                <li key={gasto.id} className="flex items-start gap-3 py-2.5">
                  <span className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
                    {formatoFecha(gasto.fecha)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">{gasto.detalle}</p>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                      <span>{etiquetaDe(CONCEPTOS_GASTO, gasto.concepto)}</span>
                      {gasto.tipo === "gasto" ? null : (
                        <Marca>{etiquetaDe(TIPOS_GASTO, gasto.tipo)}</Marca>
                      )}
                      <SituacionPartida estado={gasto.estado} />
                    </span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-sm tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatoImporte(gasto.importe)}
                  </span>
                  <form action={borrarGasto} className="shrink-0">
                    <input type="hidden" name="id" value={gasto.id} />
                    <input type="hidden" name="expedienteId" value={expediente.id} />
                    <button
                      type="submit"
                      title={`Borrar "${gasto.detalle}"`}
                      className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      <Trash2 aria-hidden className="size-3.5" />
                      <span className="sr-only">Borrar partida</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <details className={claseSeparador}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Agregar partida
        </summary>
        <form action={agregarGasto} className="mt-4 border-t border-linea pt-4">
          <input type="hidden" name="expedienteId" value={expediente.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Fecha"
              ayuda="La del comprobante, o la prevista si todavía no se pagó."
            >
              <input type="date" name="fecha" defaultValue={hoy()} className={claseEntrada} />
            </Campo>
            <Campo etiqueta="Importe en pesos" ayuda="Por ejemplo 1.234,56.">
              <input
                type="text"
                name="importe"
                inputMode="decimal"
                placeholder="0,00"
                required
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Concepto">
              <select name="concepto" defaultValue="tasa_justicia" className={claseEntrada}>
                {CONCEPTOS_GASTO.map((concepto) => (
                  <option key={concepto.valor} value={concepto.valor}>
                    {concepto.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Tipo" ayuda="Un honorario también es costo del juicio para el cliente.">
              <select name="tipo" defaultValue="gasto" className={claseEntrada}>
                {TIPOS_GASTO.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Detalle" className="sm:col-span-2">
              <input
                type="text"
                name="detalle"
                placeholder="Tasa de justicia sobre el monto reclamado"
                required
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Situación" className="sm:col-span-2">
              <select name="estado" defaultValue="pagado_estudio" className={claseEntrada}>
                {ESTADOS_GASTO.map((estado) => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.etiqueta} — {estado.detalle}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <button type="submit" className={`${claseBotonPrimario} mt-4`}>
            Agregar partida
          </button>
        </form>
      </details>

      <Pendientes
        items={[
          "Promedio por materia: cuánto salió en promedio un juicio de daños, de desalojo o de cobro, sacado de los expedientes ya cargados, para poder estimarle el costo al cliente antes de iniciar.",
          "Importes comparables en el tiempo: con la inflación, promediar pesos de 2026 con pesos de 2029 no da una cifra que sirva; hay que reexpresarlos (índice, JUS o UMA) antes de promediar.",
          "Comprobante adjunto de cada partida, que es lo que pide la rendición al cliente.",
          "Convenio de honorarios con cuota litis, y honorarios regulados con su instancia y la comunicación a la Caja de Previsión (Ley 5480).",
          "Costas: a cargo de quién quedaron y qué parte del gasto se recupera de la contraria.",
          "Totales por cliente y pendientes de cobro, en el área Agenda (docs/01-agenda.md §2.6).",
        ]}
      />
    </>
  );
}
