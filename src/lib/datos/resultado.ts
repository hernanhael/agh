/**
 * Resultado de una operación que puede fallar por un motivo previsible
 * (un campo vacío, un número de expediente repetido, un tipo de proceso en
 * uso). Los fallos esperables se devuelven, no se lanzan: las excepciones
 * quedan para los errores de programa.
 */
export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string };

export function correcto<T>(valor: T): Resultado<T> {
  return { ok: true, valor };
}

export function fallo<T = never>(error: string): Resultado<T> {
  return { ok: false, error };
}
