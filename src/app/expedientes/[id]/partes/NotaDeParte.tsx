"use client";

import { useCallback } from "react";
import { guardarNotasParte } from "../../acciones";
import { NotaEditable } from "../NotaExpediente";
import { useFichaAbierta } from "./FichaAbierta";

/**
 * La **nota de una parte**, en su ficha (docs/02-expedientes.md §2.14).
 *
 * Es el mismo editor que la nota del expediente en Datos (`NotaEditable`): se
 * hace clic sobre el texto —o se aprieta `alt+n`— y se escribe, con negrita,
 * itálica y subrayado; Escape, `alt+n` otra vez o un clic afuera guardan.
 *
 * Las fichas de todas las partes están montadas a la vez (`FichaDeParte` solo
 * las oculta), así que **el atajo lo tiene solo la nota de la ficha abierta**:
 * si no, un `alt+n` abriría la nota de cada parte del expediente.
 */
export function NotaDeParte({
  expedienteId,
  parteId,
  notas,
}: {
  expedienteId: string;
  parteId: string;
  notas: string;
}) {
  const { abierta } = useFichaAbierta();
  const guardarNota = useCallback(
    (texto: string) => guardarNotasParte(expedienteId, parteId, texto),
    [expedienteId, parteId],
  );
  return (
    <NotaEditable
      notas={notas}
      guardarNota={guardarNota}
      etiqueta="Nota de la parte"
      conAtajo={abierta === parteId}
      compacta
    />
  );
}
