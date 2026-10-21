"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Campo, claseBotonPrimario, claseBotonSecundario, claseEntrada } from "@/components/ui";
import {
  SUBTIPOS_ENTRADA,
  type Estudio,
  type Expediente,
  type Parte,
  type SubtipoEntrada,
} from "@/lib/datos/tipos";
import {
  encabezadoDeEscrito,
  estiloCaratula,
  estiloHoja,
  estiloParrafo,
  formatoVigente,
  parrafosDelCuerpo,
} from "@/lib/escritos";
import { agregarEscrito } from "../../acciones";

/**
 * Editor de escritos del expediente (docs/02-expedientes.md §2.5).
 *
 * Arriba se escribe el **cuerpo** y nada más que el cuerpo; abajo se ve la
 * **hoja**, con el encabezado ya armado desde los metadatos del expediente y del
 * estudio, y con la letra, los márgenes y el interlineado que el abogado
 * configuró. Lo que se ve es lo que sale impreso.
 *
 * La hoja va abajo y no al costado porque mide 21 cm de ancho de verdad: en una
 * columna lateral entraría cortada, y achicarla con un zoom para que entre haría
 * que el abogado apruebe un escrito que no es el que va a imprimir.
 *
 * El encabezado no se escribe ni se copia de otro escrito: el juzgado, la
 * carátula, el número, la matrícula y el domicilio electrónico ya están
 * cargados, y copiarlos a mano es de donde sale el escrito presentado con la
 * carátula del expediente de al lado. Lo que falta se marca `[[COMPLETAR: …]]`
 * y se avisa arriba, con el nombre de la pantalla donde se completa.
 *
 * Es el único componente de cliente del expediente, y lo es por una sola razón:
 * la hoja se tiene que ver cambiar mientras se escribe.
 */

/** Los escritos que suele presentar un estudio, para la lista de "qué es". */
const SUBTIPOS_DE_ESCRITO: ReadonlyArray<SubtipoEntrada> = [
  "escrito",
  "demanda",
  "contestacion",
  "recurso",
  "oficio",
  "otro",
];

/** Separación entre bloques del escrito, proporcional al cuerpo de la letra. */
const BLOQUE = { marginBottom: "1em" } as const;

export function EditorEscrito({
  expediente,
  estudio,
  cliente,
  hoy,
}: {
  expediente: Expediente;
  estudio: Estudio;
  /** La parte marcada como cliente, para la comparecencia. */
  cliente?: Parte;
  hoy: string;
}) {
  const [suma, setSuma] = useState("");
  const [cuerpo, setCuerpo] = useState("");

  /*
   * Borrador en este navegador. No es la versión del escrito —eso llega con
   * `documents` y `document_versions` (docs/06-modelo-de-datos.md)—, es una red
   * para no perder media hora de redacción si se cierra la pestaña. Cada lectura
   * y cada escritura van protegidas: en una ventana privada o con el
   * almacenamiento bloqueado, acceder tira excepción.
   */
  const clave = `escrito:${expediente.id}`;

  /*
   * El borrador se recupera **después** de montar y no en el valor inicial del
   * estado: el servidor no tiene `localStorage`, así que inicializar con él
   * haría que el primer dibujo del cliente no coincida con el del servidor y
   * React descarte la hidratación. Es el caso que un efecto resuelve y por eso
   * se desactiva acá la regla que, con razón, los desaconseja en general.
   */
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(clave);
      if (!guardado) return;
      const borrador = JSON.parse(guardado) as { suma?: string; cuerpo?: string };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver la nota de arriba
      setSuma(borrador.suma ?? "");
      setCuerpo(borrador.cuerpo ?? "");
    } catch {
      // Sin borrador recuperable se empieza en blanco, que es lo esperable.
    }
  }, [clave]);

  useEffect(() => {
    try {
      if (!suma && !cuerpo) window.localStorage.removeItem(clave);
      else window.localStorage.setItem(clave, JSON.stringify({ suma, cuerpo }));
    } catch {
      // Si no se puede guardar el borrador, el editor funciona igual.
    }
  }, [clave, suma, cuerpo]);

  function vaciar() {
    setSuma("");
    setCuerpo("");
  }

  const formato = formatoVigente(estudio.formatoEscrito);
  const encabezado = encabezadoDeEscrito({ expediente, estudio, cliente, suma });
  const parrafos = parrafosDelCuerpo(cuerpo);

  return (
    <div className="mt-4">
      {/* ------------------------------------------------ lo que se escribe */}
      <form action={agregarEscrito} className="no-imprimir">
        <input type="hidden" name="expedienteId" value={expediente.id} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Qué hace este escrito" ayuda="Va arriba de todo, como suma.">
            <input
              type="text"
              name="suma"
              value={suma}
              onChange={(evento) => setSuma(evento.target.value)}
              placeholder="Contesta traslado"
              required
              className={claseEntrada}
            />
          </Campo>
          <Campo etiqueta="Qué es">
            <select name="subtipo" defaultValue="escrito" className={claseEntrada}>
              {SUBTIPOS_DE_ESCRITO.map((valor) => (
                <option key={valor} value={valor}>
                  {SUBTIPOS_ENTRADA.find((subtipo) => subtipo.valor === valor)?.etiqueta ?? valor}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            etiqueta="Fecha de presentación"
            ayuda="Con esta fecha entra en la historia como presentado."
          >
            <input type="date" name="fecha" defaultValue={hoy} className={claseEntrada} />
          </Campo>
          <Campo
            etiqueta="Cuerpo del escrito"
            ayuda="Una línea en blanco separa un párrafo del siguiente."
            className="sm:col-span-3"
          >
            <textarea
              name="texto"
              rows={10}
              value={cuerpo}
              onChange={(evento) => setCuerpo(evento.target.value)}
              placeholder={"Que vengo a contestar el traslado conferido…"}
              className={`${claseEntrada} font-mono text-xs`}
            />
          </Campo>
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-500">
          Mientras escribís se guarda un borrador en este navegador.
          <button
            type="button"
            onClick={vaciar}
            className="underline decoration-dotted underline-offset-2"
          >
            Vaciar
          </button>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className={claseBotonPrimario}>
            Guardar en la historia
          </button>
          {/*
            Imprimir es del navegador: con los márgenes de la hoja puestos en la
            propia hoja y el resto de la pantalla oculto al imprimir, "Guardar
            como PDF" del diálogo de impresión da el archivo que se sube al
            Portal del SAE. La exportación a Word queda pendiente.
          */}
          <button
            type="button"
            onClick={() => window.print()}
            className={`${claseBotonSecundario} gap-1.5`}
          >
            <Printer aria-hidden className="size-4" />
            Imprimir o guardar en PDF
          </button>
        </div>
      </form>

      {/* ------------------------------------------------------- la hoja */}
      <div className="mt-6 min-w-0">
        {encabezado.faltantes.length > 0 ? (
          <div className="no-imprimir mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <p className="font-medium">Faltan datos para encabezar el escrito</p>
            <ul className="mt-1 list-disc pl-4">
              {encabezado.faltantes.map((falta) => (
                <li key={falta}>{falta}</li>
              ))}
            </ul>
            <p className="mt-1">
              Mientras tanto quedan marcados con <code>[[COMPLETAR]]</code>: el sistema no los
              inventa.
            </p>
          </div>
        ) : null}

        {/*
          A tamaño real, dentro de un marco que corre en horizontal cuando la
          pantalla no da —en un teléfono, por ejemplo—. El fondo gris alrededor
          es el escritorio contra el que se apoya la hoja.
        */}
        <div className="overflow-x-auto rounded-md border border-linea bg-zinc-200 p-4 dark:bg-zinc-800">
          <article className="hoja-escrito mx-auto shadow-sm" style={estiloHoja(formato)}>
            <p style={{ ...BLOQUE, fontWeight: 700, textTransform: "uppercase" }}>
              {encabezado.suma}
            </p>

            <p style={{ marginBottom: 0 }}>{encabezado.destinatario}</p>
            <p style={BLOQUE}>
              {encabezado.numero} — <span style={estiloCaratula(formato)}>«{encabezado.caratula}»</span>
            </p>

            <p style={{ ...estiloParrafo(formato), ...BLOQUE }}>{encabezado.comparecencia}</p>

            {parrafos.length > 0 ? (
              parrafos.map((parrafo, posicion) => (
                <p
                  // Los párrafos no tienen identidad propia: se reordenan al
                  // escribir y la posición es lo único estable que hay.
                  key={`${posicion}-${parrafo.slice(0, 12)}`}
                  style={{ ...estiloParrafo(formato), marginBottom: "0.5em" }}
                >
                  {parrafo}
                </p>
              ))
            ) : (
              <p className="no-imprimir" style={{ ...estiloParrafo(formato), opacity: 0.4 }}>
                Acá va el cuerpo del escrito.
              </p>
            )}

            <div style={{ marginTop: "2.5em", textAlign: "right" }}>
              {encabezado.firma.map((linea) => (
                <p key={linea} style={{ margin: 0 }}>
                  {linea}
                </p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
