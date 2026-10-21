import Link from "next/link";
import { BellRing, Trash2 } from "lucide-react";
import { claseSeparador, Marca, Pendientes, Vacio } from "@/components/ui";
import {
  etiquetaDe,
  hoy,
  listarHistoria,
  listarPartes,
  obtenerEstudio,
  ORIGENES_ENTRADA,
  SUBTIPOS_ENTRADA,
  TIPOS_ENTRADA,
  type EntradaHistoria,
  type EtapaProceso,
} from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import {
  construirHistoria,
  FILTROS_HISTORIA,
  filtrarHistoria,
  filtroValido,
  recorridoDeEtapas,
  type FilaHistoria,
} from "@/lib/procesal";
import { borrarEntradaHistoria } from "../../acciones";
import { cargarExpediente, cargarTipoProceso } from "../cargar";
import { EditorEscrito } from "./EditorEscrito";
import { FormularioEntrada } from "./FormularioEntrada";
import { RecorridoEtapas } from "./RecorridoEtapas";

/**
 * Pestaña **Historia**: la línea de tiempo única del expediente
 * (docs/02-expedientes.md §2.3).
 *
 * Entra **todo lo que pasó en la causa**: los decretos y demás actuaciones del
 * juzgado —cédulas, mandamientos, oficios, informes del actuario—, lo que
 * presentó el estudio, lo que presentó la contraria, lo que presentaron los
 * auxiliares, los documentos, las audiencias celebradas y las notas. Cada una
 * guarda su **texto completo**, que es lo que se viene a consultar y lo que van
 * a leer los agentes, y se abre en la misma línea de tiempo sin salir de acá.
 *
 * **El decreto que abre una etapa se distingue de todos los demás**: es el que
 * da pie a la etapa siguiente, así que es un hito y no una actuación más. Lleva
 * el punto del hilo en el azul del acento, el cuadro teñido y un rótulo que
 * nombra la etapa que abre. Cargarlo mueve al expediente a esa etapa, con la
 * fecha del acto, en lugar de que el abogado la cambie a mano en Datos.
 *
 * A la historia se suman los hechos que cuenta la ficha —el alta, la caducidad
 * declarada—, apagados y sin acciones: pasaron, pero no son piezas del
 * expediente. Van desapareciendo a medida que una entrada los cuenta mejor
 * (`construirHistoria`).
 *
 * Abajo, el **editor de escritos** (§2.5): se redacta acá adentro porque un
 * escrito se escribe leyendo la historia, y lo que se presenta vuelve a esta
 * misma lista como una entrada más.
 *
 * Arriba, en la misma línea que los filtros, el **recorrido por las etapas** del
 * tipo de proceso: qué se cumplió y qué falta (`RecorridoEtapas`). Va acá y no
 * en la cabecera porque se lee junto con la historia —las etapas las abren las
 * actuaciones de esta misma lista—, mientras que la cabecera dice en qué etapa
 * está, que es otra pregunta.
 */

/** El punto del hilo. En acento y más grande cuando la fila abre una etapa. */
function Punto({ hito }: { hito: boolean }) {
  if (hito) {
    return (
      <span className="mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-acento-suave ring-1 ring-acento">
        <span className="size-1.5 rounded-full bg-acento" />
      </span>
    );
  }
  return <span className="mt-1.5 size-2 shrink-0 rounded-full bg-linea-fuerte" />;
}

/** Quién hizo la pieza, cuando no es el juzgado: lo demás ya lo dice el rótulo. */
function QuienLaHizo({ entrada }: { entrada: EntradaHistoria }) {
  if (entrada.tipo === "actuacion_juzgado") return null;
  return <Marca>{etiquetaDe(TIPOS_ENTRADA, entrada.tipo)}</Marca>;
}

/** De dónde salió el registro. Solo se muestra cuando no lo cargó el estudio. */
function DeDondeSalio({ entrada }: { entrada: EntradaHistoria }) {
  if (entrada.origen === "abogado") return null;
  return <Marca tono="aviso">{etiquetaDe(ORIGENES_ENTRADA, entrada.origen)}</Marca>;
}

/** El cuerpo de una actuación cargada: su texto, su corrección y su baja. */
function Actuacion({
  entrada,
  expedienteId,
  etapas,
  dia,
}: {
  entrada: EntradaHistoria;
  expedienteId: string;
  etapas: ReadonlyArray<EtapaProceso>;
  dia: string;
}) {
  return (
    <>
      {entrada.fechaNotificacion ? (
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          <BellRing aria-hidden className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-600" />
          Notificada el {formatoFecha(entrada.fechaNotificacion)}
        </p>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {/*
          El texto se consulta acá mismo: abrir una actuación no saca al abogado
          de la línea de tiempo, que es desde donde está leyendo la causa. Si la
          actuación se cargó sin texto, no hay nada que abrir.
        */}
        {entrada.texto ? (
          <details className="w-full">
            <summary className="cursor-pointer list-none text-xs text-acento underline decoration-dotted underline-offset-2">
              Ver el texto
            </summary>
            {/*
              `whitespace-pre-line` conserva los párrafos del original: un
              decreto pegado del Portal se lee como vino.
            */}
            <p className="mt-1.5 whitespace-pre-line rounded-md border border-linea bg-superficie p-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {entrada.texto}
            </p>
          </details>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-600">
            Cargada sin el texto de la pieza
          </span>
        )}

        <details>
          <summary className="cursor-pointer list-none text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-500">
            Corregir
          </summary>
          <div className="mb-2 border-t border-linea">
            <FormularioEntrada
              expedienteId={expedienteId}
              entrada={entrada}
              etapas={etapas}
              hoy={dia}
            />
          </div>
        </details>

        <form action={borrarEntradaHistoria}>
          <input type="hidden" name="id" value={entrada.id} />
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <button
            type="submit"
            title={`Borrar "${entrada.titulo}" de la historia`}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <Trash2 aria-hidden className="size-3.5" />
            <span className="sr-only">Borrar de la historia</span>
          </button>
        </form>
      </div>
    </>
  );
}

/** Una fila de la línea de tiempo, con su punto y su hilo hasta la siguiente. */
function Fila({
  fila,
  ultima,
  expedienteId,
  etapas,
  dia,
}: {
  fila: FilaHistoria;
  ultima: boolean;
  expedienteId: string;
  etapas: ReadonlyArray<EtapaProceso>;
  dia: string;
}) {
  const { entrada } = fila;
  const hito = Boolean(fila.abreEtapa);

  return (
    <li id={entrada ? `entrada-${entrada.id}` : undefined} className="flex gap-3">
      <span className="w-16 shrink-0 pt-0.5 text-right text-xs tabular-nums text-zinc-500 dark:text-zinc-500">
        {formatoFecha(fila.fecha)}
      </span>
      {/*
        El hilo: punto en cada fila y la línea hasta la siguiente, que la última
        no lleva. Va en la línea fuerte y no en la fina porque ahora cada fila
        es alta —título, notificación, texto, acciones— y con la fina el hilo se
        perdía entre fila y fila, que es justo donde tiene que verse.
      */}
      <span aria-hidden className="flex flex-col items-center">
        <Punto hito={hito} />
        {ultima ? null : <span className="w-px flex-1 bg-linea-fuerte" />}
      </span>

      <div className={`min-w-0 flex-1 ${ultima ? "" : "pb-5"}`}>
        <div
          className={
            hito
              ? "rounded-md border border-acento/40 bg-acento-suave p-3"
              : entrada
                ? ""
                : "opacity-70"
          }
        >
          {hito ? (
            <p className="rotulo mb-1 text-acento">Abre la etapa {fila.abreEtapa}</p>
          ) : null}

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-900 dark:text-zinc-50">
            {entrada ? (
              <span className="rotulo text-zinc-500 dark:text-zinc-500">
                {etiquetaDe(SUBTIPOS_ENTRADA, entrada.subtipo)}
              </span>
            ) : null}
            <span className={entrada ? "font-medium" : ""}>{fila.titulo}</span>
            {entrada ? (
              <>
                <QuienLaHizo entrada={entrada} />
                <DeDondeSalio entrada={entrada} />
              </>
            ) : (
              /* Los hechos de la ficha se marcan como lo que son, para que no
                 se los confunda con una pieza del expediente. */
              <Marca>de la ficha</Marca>
            )}
          </p>

          {fila.detalle ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">{fila.detalle}</p>
          ) : null}

          {entrada ? (
            <Actuacion
              entrada={entrada}
              expedienteId={expedienteId}
              etapas={etapas}
              dia={dia}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default async function HistoriaExpedientePage({
  params,
  searchParams,
}: PageProps<"/expedientes/[id]/historia">) {
  const { id } = await params;
  const parametros = await searchParams;
  const expediente = await cargarExpediente(id);
  const tipo = await cargarTipoProceso(expediente.tipoProcesoId);
  const [entradas, estudio, partes] = await Promise.all([
    listarHistoria(expediente.id),
    obtenerEstudio(),
    listarPartes(expediente.id),
  ]);
  const dia = hoy();

  // El editor se puede abrir con un enlace (…/historia?redactar), para llegar
  // directo a redactar sin pasar por la lista.
  const redactando = parametros.redactar !== undefined;
  const filtro = filtroValido(
    Array.isArray(parametros.ver) ? parametros.ver[0] : parametros.ver,
  );
  const filas = filtrarHistoria(
    construirHistoria({ expediente, tipo, entradas, hoy: dia }),
    filtro,
  );
  const etapas = tipo?.etapas ?? [];
  const recorrido = recorridoDeEtapas({ tipo, expediente, entradas });
  // De dónde sale el recorrido: la plantilla del tipo de proceso, que el
  // abogado configuró para esa materia.
  const proceso = [tipo?.nombre, expediente.materia].filter(Boolean).join(" · ");

  return (
    <>
      {/*
        El filtro de §2.3: ver solo lo que hizo el juzgado o solo lo que se
        presentó. Son enlaces y no un control de cliente, así que la vista
        filtrada tiene su propia URL y el botón de atrás funciona.
      */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <nav className="flex flex-wrap gap-1.5">
          {FILTROS_HISTORIA.map((candidato) => {
            const activo = candidato.valor === filtro;
            return (
              <Link
                key={candidato.valor}
                href={
                  candidato.valor === "todo"
                    ? `/expedientes/${expediente.id}/historia`
                    : `/expedientes/${expediente.id}/historia?ver=${candidato.valor}`
                }
                aria-current={activo ? "page" : undefined}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  activo
                    ? "border-acento bg-acento-suave font-medium text-acento"
                    : "border-linea text-zinc-600 hover:border-linea-fuerte dark:text-zinc-400"
                }`}
              >
                {candidato.etiqueta}
              </Link>
            );
          })}
        </nav>

        <RecorridoEtapas recorrido={recorrido} proceso={proceso} />
      </div>

      {filas.length === 0 ? (
        <div className="mt-4">
          <Vacio>
            {filtro === "todo"
              ? "Todavía no hay nada registrado en este expediente. Cargá la primera actuación abajo: el decreto, la cédula, el escrito que se presentó."
              : "No hay actuaciones de ese lado de la causa todavía."}
          </Vacio>
        </div>
      ) : (
        <ol className="mt-4">
          {filas.map((fila, posicion) => (
            <Fila
              key={fila.clave}
              fila={fila}
              ultima={posicion === filas.length - 1}
              expedienteId={expediente.id}
              etapas={etapas}
              dia={dia}
            />
          ))}
        </ol>
      )}

      <details className={claseSeparador}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Cargar actuación
        </summary>
        <div className="border-t border-linea">
          <FormularioEntrada expedienteId={expediente.id} etapas={etapas} hoy={dia} />
        </div>
      </details>

      {/*
        El editor abre cerrado: ocupa dos columnas y no es lo que se viene a
        hacer cada vez que se entra a la historia. Al abrirlo, la hoja de la
        derecha muestra el escrito como va a salir impreso.
      */}
      <details open={redactando} className={claseSeparador}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Redactar escrito
        </summary>
        <div className="border-t border-linea">
          <EditorEscrito
            expediente={expediente}
            estudio={estudio}
            cliente={partes.find((parte) => parte.esCliente)}
            hoy={dia}
          />
        </div>
      </details>

      <Pendientes
        items={[
          "Carga manual asistida: pegar el texto de una actuación o subir el PDF, y que la IA proponga qué es, lo resuma y calcule los plazos que dispara (§2.4).",
          "Panel de IA en el editor de escritos: generar el borrador desde una plantilla y los datos del expediente, reescribir un párrafo, revisar los requisitos del escrito según la etapa (§2.5).",
          "Versiones del escrito y estado borrador / presentado: hoy el borrador vive en el navegador y a la historia entra lo presentado (documents y document_versions en docs/06-modelo-de-datos.md).",
          "Exportar a Word; hoy se imprime o se guarda en PDF desde el navegador, con los márgenes configurados.",
          "Ingesta desde el Portal del SAE con deduplicación por hash y vinculación automática al expediente (docs/09-conector-sae.md).",
          "Efectos de cada actuación: los vencimientos y las tareas que generó, visibles en la misma entrada y en Agenda.",
          "Adjuntos: el PDF del decreto, la cédula escaneada, el escrito presentado con su cargo.",
          "Historial de etapas: hoy la historia señala el decreto que abrió cada etapa, pero el expediente guarda solo la etapa actual y desde cuándo (stage_transitions en docs/06-modelo-de-datos.md).",
          "Informes de los agentes y conversaciones fijadas como entradas, con su marca de origen IA y la aprobación del abogado.",
          "Indexación del texto para la búsqueda y para el RAG de los agentes.",
        ]}
      />
    </>
  );
}
