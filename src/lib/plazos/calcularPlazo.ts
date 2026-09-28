import {
  diaHabilOMismo,
  esFeria,
  esHabil,
  formatoCorto,
  motivoInhabil,
  siguienteHabil,
  sumarDias,
} from "./calendario";
import type { CalcularPlazoInput, PasoExplicacion, ResultadoPlazo } from "./tipos";

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function fueraDeHorario(
  hora: string | undefined,
  horario: { horaInicio: string; horaFin: string },
): boolean {
  if (!hora) return false;
  const minutos = horaAMinutos(hora);
  return minutos < horaAMinutos(horario.horaInicio) || minutos >= horaAMinutos(horario.horaFin);
}

/** Agrupa fechas consecutivas con el mismo motivo en un solo paso (rango). */
function agruparPasos(saltos: { fecha: string; motivo: string }[]): PasoExplicacion[] {
  const pasos: PasoExplicacion[] = [];
  let i = 0;
  while (i < saltos.length) {
    const inicio = saltos[i];
    let fin = inicio;
    let j = i + 1;
    while (
      j < saltos.length &&
      saltos[j].motivo === inicio.motivo &&
      saltos[j].fecha === sumarDias(fin.fecha, 1)
    ) {
      fin = saltos[j];
      j++;
    }
    pasos.push({
      fecha:
        fin.fecha === inicio.fecha
          ? formatoCorto(inicio.fecha)
          : `${formatoCorto(inicio.fecha)} al ${formatoCorto(fin.fecha)}`,
      motivo: inicio.motivo,
    });
    i = j;
  }
  return pasos;
}

/**
 * Calcula el vencimiento de un plazo procesal.
 *
 * Reglas (docs/01-agenda.md §2.2, docs/07-arquitectura.md §4):
 * 1. El plazo empieza a correr desde el día hábil siguiente a la notificación.
 * 2. Notificación digital: el día en que se considera practicada es un
 *    parámetro (`reglas.inicioNotificacionDigital`) [a confirmar acordada].
 * 3. Presentación fuera del horario de tribunales: se considera hecha el día
 *    hábil siguiente.
 * 4. Se saltean fines de semana, feriados, ferias y asuetos del centro judicial.
 * 5. Si el vencimiento (días corridos) cae en día inhábil, pasa al día hábil siguiente.
 * 6. La feria suspende el cómputo, tanto en días hábiles como en corridos.
 * 7. El plazo de gracia se informa como fecha secundaria, nunca como vencimiento principal.
 *
 * Módulo puro: no accede a red ni base de datos. Los agentes de IA lo
 * invocan y reportan su salida; nunca estiman un plazo por su cuenta.
 */
export function calcularPlazo(input: CalcularPlazoInput): ResultadoPlazo {
  const { fechaBase, tipoBase, dias, tipoDias, aplicaGracia, centroJudicial, reglas, calendario } =
    input;

  const saltos: { fecha: string; motivo: string }[] = [];

  // 1. Fecha efectiva del acto que da origen al plazo.
  let fechaActoEfectiva = fechaBase.fecha;
  if (tipoBase === "presentacion" && fueraDeHorario(fechaBase.hora, reglas.horarioTribunales)) {
    saltos.push({
      fecha: fechaBase.fecha,
      motivo: `presentación fuera de horario (${fechaBase.hora})`,
    });
    fechaActoEfectiva = siguienteHabil(fechaBase.fecha, centroJudicial, calendario);
  }

  // 2. Fecha en que se considera practicada la notificación.
  let fechaNotificacionRelevante = fechaActoEfectiva;
  if (tipoBase === "notificacion_digital" && reglas.inicioNotificacionDigital === "dia_habil_siguiente") {
    fechaNotificacionRelevante = diaHabilOMismo(fechaActoEfectiva, centroJudicial, calendario);
    if (fechaNotificacionRelevante !== fechaActoEfectiva) {
      saltos.push({
        fecha: fechaActoEfectiva,
        motivo: motivoInhabil(fechaActoEfectiva, centroJudicial, calendario),
      });
    }
  }

  // 3. El cómputo (día 1) empieza el día hábil siguiente a la notificación.
  const fechaInicioComputo = siguienteHabil(fechaNotificacionRelevante, centroJudicial, calendario);
  {
    let cursor = sumarDias(fechaNotificacionRelevante, 1);
    while (cursor !== fechaInicioComputo) {
      saltos.push({ fecha: cursor, motivo: motivoInhabil(cursor, centroJudicial, calendario) });
      cursor = sumarDias(cursor, 1);
    }
  }

  let vencimiento: string;

  if (tipoDias === "habiles") {
    let cursor = fechaInicioComputo;
    let contados = 0;
    while (contados < dias) {
      if (esHabil(cursor, centroJudicial, calendario)) {
        contados++;
        if (contados < dias) cursor = sumarDias(cursor, 1);
      } else {
        saltos.push({ fecha: cursor, motivo: motivoInhabil(cursor, centroJudicial, calendario) });
        cursor = sumarDias(cursor, 1);
      }
    }
    vencimiento = cursor;
  } else {
    // Días corridos: cuentan todos los días calendario, salvo los de feria
    // (rule 6, la feria suspende cualquier plazo en curso).
    let cursor = fechaInicioComputo;
    let contados = 0;
    while (contados < dias) {
      if (esFeria(cursor, calendario)) {
        saltos.push({ fecha: cursor, motivo: motivoInhabil(cursor, centroJudicial, calendario) });
        cursor = sumarDias(cursor, 1);
        continue;
      }
      contados++;
      if (contados < dias) cursor = sumarDias(cursor, 1);
    }
    // Rule 4: si el vencimiento cae en día inhábil, pasa al día hábil siguiente.
    if (!esHabil(cursor, centroJudicial, calendario)) {
      saltos.push({ fecha: cursor, motivo: motivoInhabil(cursor, centroJudicial, calendario) });
      cursor = siguienteHabil(cursor, centroJudicial, calendario);
    }
    vencimiento = cursor;
  }

  const resultado: ResultadoPlazo = {
    vencimiento,
    pasos: agruparPasos(saltos),
  };

  // 7. Plazo de gracia: fecha secundaria, día hábil siguiente al vencimiento.
  if (aplicaGracia && reglas.plazoGracia) {
    resultado.gracia = siguienteHabil(vencimiento, centroJudicial, calendario);
  }

  return resultado;
}
