/**
 * Tipos del motor de plazos (docs/07-arquitectura.md §4, docs/01-agenda.md §2.2).
 *
 * El motor es un módulo puro: no accede a red ni base de datos. Recibe el
 * calendario de días inhábiles y las reglas parametrizadas como argumentos,
 * lo que permite testearlo con calendarios sintéticos.
 */

/** Fecha en formato ISO simple, sin hora: 'YYYY-MM-DD'. */
export type FechaISO = string;

/** Hora en formato 'HH:mm' (24 horas). */
export type HoraHHmm = string;

/** Alcance de un día inhábil: a quién afecta. */
export type AlcanceDiaInhabil = "nacional" | "provincial" | "feria" | "centro_judicial";

/**
 * Un día (o rango, ya expandido a días individuales) en que no corren los
 * plazos. Corresponde a la tabla `holidays` de docs/06-modelo-de-datos.md.
 */
export interface DiaInhabil {
  fecha: FechaISO;
  motivo: string;
  alcance: AlcanceDiaInhabil;
  /** Solo si alcance === 'centro_judicial': a qué centro afecta. */
  centroJudicial?: string;
}

/** Tipo de acto que da origen al cómputo del plazo. */
export type TipoBasePlazo = "notificacion_digital" | "presentacion" | "actuacion";

/** Días hábiles judiciales (default) o corridos. */
export type TipoDias = "habiles" | "corridos";

/**
 * Reglas parametrizadas del motor. Los puntos marcados [a confirmar] en los
 * documentos de diseño (acordada de inicio de notificación digital, régimen
 * del plazo de gracia en la Ley 9531) se configuran acá, no se hardcodean.
 */
export interface ReglasPlazo {
  /**
   * Cuándo se considera practicada una notificación digital del Portal del
   * SAE [a confirmar acordada de la Corte Suprema de Justicia de Tucumán]:
   * - 'dia_disponible': el día en que aparece en la bandeja, aunque sea inhábil.
   * - 'dia_habil_siguiente': si aparece en día inhábil, se considera practicada
   *   el día hábil siguiente (antes de aplicar la regla general de inicio de cómputo).
   */
  inicioNotificacionDigital: "dia_disponible" | "dia_habil_siguiente";
  /** Horario de atención de tribunales, usado para presentaciones fuera de hora. */
  horarioTribunales: { horaInicio: HoraHHmm; horaFin: HoraHHmm };
  /**
   * Plazo de gracia [a confirmar artículo y alcance en Ley 9531]. `null` si
   * no aplica. Se informa siempre como fecha secundaria, nunca reemplaza el
   * vencimiento principal.
   */
  plazoGracia: { horas: number } | null;
}

export interface FechaHoraBase {
  fecha: FechaISO;
  /** Opcional: si no se especifica, se asume dentro del horario de tribunales. */
  hora?: HoraHHmm;
}

export interface CalcularPlazoInput {
  fechaBase: FechaHoraBase;
  tipoBase: TipoBasePlazo;
  dias: number;
  tipoDias: TipoDias;
  /** Si el acto admite plazo de gracia (lo decide el catálogo de plazos del abogado). */
  aplicaGracia: boolean;
  centroJudicial: string;
  reglas: ReglasPlazo;
  calendario: DiaInhabil[];
}

/** Un paso de la explicación auditable del cómputo. */
export interface PasoExplicacion {
  /** Fecha única 'DD/MM' o rango 'DD/MM al DD/MM'. */
  fecha: string;
  motivo: string;
}

export interface ResultadoPlazo {
  vencimiento: FechaISO;
  /** Presente solo si aplicaGracia && reglas.plazoGracia. */
  gracia?: FechaISO;
  pasos: PasoExplicacion[];
}
