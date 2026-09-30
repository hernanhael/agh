import { diasEntre, formatoFecha } from "@/lib/plazos/calendario";
import type { FechaISO } from "@/lib/plazos/tipos";
import type { Expediente } from "@/lib/datos/tipos";

/**
 * Audiencia fijada en el expediente.
 *
 * Mientras no existan la agenda ni la historia del expediente, la audiencia
 * próxima es un dato del propio expediente: el juzgado la fija y el abogado la
 * carga. Cuando esas piezas existan, esta función lee el evento en lugar de los
 * campos (docs/01-agenda.md §2.1, docs/02-expedientes.md §2.3) y lo que la usa
 * no cambia.
 *
 * Módulo puro, como el resto de `lib/procesal`.
 */

export interface AudienciaFijada {
  /** Nombre que le puso el juzgado: "Audiencia Preliminar". */
  tipo: string;
  fecha: FechaISO;
  /** Hora en formato de 24 horas, si el juzgado la fijó con hora. */
  hora?: string;
  /** Días hasta la audiencia; negativo si ya pasó. */
  dias: number;
  pasada: boolean;
  /** Listo para mostrar: "Audiencia Preliminar — 16/10/2026 09:30". */
  texto: string;
}

/** La audiencia fijada, o `undefined` si el expediente no tiene ninguna. */
export function audienciaFijada(
  expediente: Expediente,
  hoy: FechaISO,
): AudienciaFijada | undefined {
  const fecha = expediente.audienciaFecha;
  if (!fecha) return undefined;

  const tipo = expediente.audienciaTipo || "Audiencia";
  const hora = expediente.audienciaHora || undefined;
  const dias = diasEntre(hoy, fecha);

  return {
    tipo,
    fecha,
    hora,
    dias,
    pasada: dias < 0,
    texto: `${tipo} — ${formatoFecha(fecha)}${hora ? ` ${hora}` : ""}`,
  };
}
