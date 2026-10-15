import { AlarmClock, CalendarClock, type LucideIcon } from "lucide-react";
import { Pendientes, Vacio } from "@/components/ui";
import { hoy } from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import { audienciaFijada, mesesDeCaducidad, situacionCaducidad } from "@/lib/procesal";
import { cargarExpediente } from "../cargar";

/**
 * Pestaña **Agenda**: las fechas de esta causa.
 *
 * Es la vista del área Agenda (docs/01-agenda.md) recortada a un expediente.
 * Hoy el sistema conoce dos fechas futuras: la **audiencia** que fijó el
 * juzgado y el día en que se **cumple el plazo de caducidad** de instancia, que
 * no es un vencimiento procesal pero sí una fecha límite para actuar
 * (docs/02-expedientes.md §2.11). Los vencimientos del motor de plazos y las
 * tareas se suman cuando exista el catálogo de plazos.
 */

/** Una fecha de la causa: qué es, cuándo y cuánto falta. */
function Fecha({
  Icono,
  titulo,
  detalle,
  fecha,
  dias,
}: {
  Icono: LucideIcon;
  titulo: string;
  detalle?: string;
  fecha: string;
  /** Días hasta la fecha; negativo o cero si ya pasó. */
  dias: number;
}) {
  const pasada = dias < 0;
  return (
    <li className="flex items-start gap-3 py-3">
      <Icono
        aria-hidden
        className={`mt-0.5 size-4 shrink-0 ${
          pasada ? "text-zinc-400 dark:text-zinc-600" : "text-acento"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{titulo}</p>
        {detalle ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{detalle}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatoFecha(fecha)}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          {dias > 1
            ? `en ${dias} días`
            : dias === 1
              ? "mañana"
              : dias === 0
                ? "hoy"
                : `hace ${Math.abs(dias)} días`}
        </p>
      </div>
    </li>
  );
}

export default async function AgendaExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/agenda">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const dia = hoy();
  const audiencia = audienciaFijada(expediente, dia);
  const situacion = situacionCaducidad(expediente, dia);
  const meses = mesesDeCaducidad(expediente);

  const hayFechas = Boolean(audiencia) || situacion.vence !== undefined;

  return (
    <>
      {hayFechas ? (
        <ul className="divide-y divide-linea">
          {audiencia ? (
            <Fecha
              Icono={CalendarClock}
              titulo={audiencia.tipo}
              detalle={
                audiencia.hora
                  ? `${audiencia.pasada ? "Fue" : "Es"} a las ${audiencia.hora}`
                  : "Sin hora fijada"
              }
              fecha={audiencia.fecha}
              dias={audiencia.dias}
            />
          ) : null}

          {situacion.vence !== undefined ? (
            <Fecha
              Icono={AlarmClock}
              titulo="Se cumplen los meses sin movimiento"
              detalle={`${meses} meses desde el último movimiento, del ${formatoFecha(situacion.desde)}`}
              fecha={situacion.vence}
              dias={situacion.dias ?? 0}
            />
          ) : null}
        </ul>
      ) : (
        <Vacio>
          Este expediente no tiene audiencia fijada ni plazo de caducidad corriendo. La audiencia se
          carga desde Datos.
        </Vacio>
      )}

      <Pendientes
        items={[
          "Vencimientos calculados por el motor de plazos, en días hábiles y con los feriados de Tucumán (docs/01-agenda.md).",
          "Tareas del expediente, con responsable y estado.",
          "Los eventos de esta causa en la agenda general del estudio, y la audiencia como evento en lugar de un campo de la ficha.",
          "Recordatorios y avisos antes de cada vencimiento.",
        ]}
      />
    </>
  );
}
