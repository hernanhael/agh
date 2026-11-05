"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import {
  notaVacia,
  parsearNota,
  serializarNota,
  type LineaNota,
  type Marca,
} from "@/lib/notas";
import { guardarNotas } from "../acciones";
import { ATAJO_NOTA, esAtajoNota } from "./atajos";

/**
 * Una **nota que se edita con un clic**: la del expediente en Datos
 * (docs/02-expedientes.md §2.1) y la de cada parte en su ficha (§2.14). Las
 * dos son el mismo editor (`NotaEditable`) con otro lugar donde guardarse.
 *
 * No hay botón de "editar" ni formulario: se hace clic sobre el texto y el
 * recuadro pasa a modo edición; se hace clic afuera —o se aprieta Escape— y se
 * guarda. Es la forma que corresponde a una nota, algo que se retoca diez
 * veces, frente al formulario del expediente, que se abre para cambiar varios
 * campos a la vez.
 *
 * **El modo edición se avisa con el papel y el borde punteado** de "Próximo en
 * esta pestaña" (`Pendientes` en `components/ui.tsx`): el mismo recurso que ya
 * usa la aplicación para decir "esto no es texto definitivo". No se usa el azul
 * del acento porque en esta aplicación es el color de lo que se puede tocar, y
 * acá el recuadro ya está tocado.
 *
 * Los controles aparecen **solo en modo edición**, en la esquina de arriba a la
 * derecha y adentro del recuadro. En modo lectura no hay nada: la nota se lee
 * como texto y los controles no ocupan lugar mientras no hacen falta.
 *
 * Es un componente de cliente porque el editor necesita selección de texto y
 * teclado. Es la única parte de la pestaña que lo es; el resto de la ficha se
 * sigue renderizando en el servidor.
 */

/**
 * Las tres variantes, con la letra que las representa.
 *
 * El control es la **letra escrita con su propio formato** —una B en negrita,
 * una I en itálica, una U subrayada— y no un ícono de biblioteca: dice lo que
 * hace sin tener que aprender un símbolo, y sale en la tipografía de la
 * aplicación, que es la misma que la nota que se está escribiendo.
 */
const FORMATOS: ReadonlyArray<{
  marca: Marca;
  letra: string;
  clase: string;
  titulo: string;
  comando: string;
}> = [
  { marca: "b", letra: "B", clase: "font-bold", titulo: "Negrita (Ctrl+B)", comando: "bold" },
  { marca: "i", letra: "I", clase: "italic", titulo: "Itálica (Ctrl+I)", comando: "italic" },
  {
    marca: "u",
    letra: "U",
    clase: "underline underline-offset-2",
    titulo: "Subrayado (Ctrl+U)",
    comando: "underline",
  },
];

/**
 * Cada control del borde: cuadrado de 24 px, para que los cuatro midan igual y
 * entren enteros en el renglón que les reserva el recuadro.
 *
 * Sin tipografía propia: hereda la de la aplicación, que es la misma con la
 * que se está escribiendo la nota. La B del control y la negrita que aplica
 * tienen que verse iguales.
 */
const claseControl =
  "inline-flex size-6 items-center justify-center rounded text-[13px] leading-none text-zinc-500 transition-colors hover:bg-superficie hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento dark:text-zinc-400 dark:hover:text-zinc-50";

/** Los elementos que `contentEditable` usa para separar renglones. */
const BLOQUES = new Set(["DIV", "P", "LI", "BLOCKQUOTE"]);

function esNegrita(elemento: HTMLElement): boolean {
  if (elemento.tagName === "B" || elemento.tagName === "STRONG") return true;
  const peso = elemento.style.fontWeight;
  return peso === "bold" || peso === "bolder" || Number(peso) >= 600;
}

function esItalica(elemento: HTMLElement): boolean {
  if (elemento.tagName === "I" || elemento.tagName === "EM") return true;
  return elemento.style.fontStyle === "italic";
}

function esSubrayado(elemento: HTMLElement): boolean {
  if (elemento.tagName === "U") return true;
  return elemento.style.textDecoration.includes("underline");
}

/**
 * Lee el contenido del editable y lo convierte en líneas con su formato.
 *
 * Se mira el **árbol** y no el HTML como texto porque lo que deja
 * `execCommand` no es predecible: según el navegador y lo que se haya pegado,
 * la misma negrita puede venir como `<b>`, como `<strong>` o como un `<span>`
 * con `font-weight`. Acá se reconocen las tres formas y se tira el resto, así
 * que lo que se guarda son siempre las tres marcas de `lib/notas` y nunca el
 * HTML que vino de afuera.
 */
function lineasDesdeDom(raiz: HTMLElement): LineaNota[] {
  const lineas: LineaNota[] = [[]];
  const actual = () => lineas[lineas.length - 1];
  const abrirLinea = () => {
    lineas.push([]);
  };

  function recorrer(
    nodo: Node,
    formato: { negrita: boolean; italica: boolean; subrayado: boolean },
  ): void {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const texto = nodo.textContent ?? "";
      if (texto) actual().push({ texto, ...formato });
      return;
    }
    if (!(nodo instanceof HTMLElement)) return;

    if (nodo.tagName === "BR") {
      abrirLinea();
      return;
    }

    const propio = {
      negrita: formato.negrita || esNegrita(nodo),
      italica: formato.italica || esItalica(nodo),
      subrayado: formato.subrayado || esSubrayado(nodo),
    };

    // Un bloque empieza renglón nuevo, salvo que el actual todavía esté vacío:
    // si no, el primer `<div>` del editable agregaría una línea en blanco.
    const bloque = BLOQUES.has(nodo.tagName);
    if (bloque && actual().length > 0) abrirLinea();
    for (const hijo of Array.from(nodo.childNodes)) recorrer(hijo, propio);
    if (bloque) abrirLinea();
  }

  for (const hijo of Array.from(raiz.childNodes)) {
    recorrer(hijo, { negrita: false, italica: false, subrayado: false });
  }
  return lineas;
}

/** Envuelve un nodo en una etiqueta de formato. */
function envolver(etiqueta: "strong" | "em" | "u", dentro: Node): HTMLElement {
  const elemento = document.createElement(etiqueta);
  elemento.appendChild(dentro);
  return elemento;
}

/**
 * Dibuja las líneas dentro del editable y deja el cursor al final.
 *
 * Se construyen nodos con `createTextNode` y `createElement` en lugar de armar
 * una cadena de HTML: así el texto de la nota **no puede volverse etiquetas**
 * ni haber que escaparlo. Es la contracara en el cliente de por qué el almacén
 * guarda marcas y no HTML (ver `lib/notas`).
 */
function pintar(contenedor: HTMLElement, lineas: LineaNota[]): void {
  contenedor.replaceChildren(
    ...lineas.map((linea) => {
      const renglon = document.createElement("div");
      // Un `<div>` vacío no se ve ni se puede poner el cursor adentro: el
      // `<br>` es lo que le da altura a un renglón en blanco.
      if (linea.length === 0) renglon.appendChild(document.createElement("br"));
      for (const trozo of linea) {
        let nodo: Node = document.createTextNode(trozo.texto);
        if (trozo.subrayado) nodo = envolver("u", nodo);
        if (trozo.italica) nodo = envolver("em", nodo);
        if (trozo.negrita) nodo = envolver("strong", nodo);
        renglon.appendChild(nodo);
      }
      return renglon;
    }),
  );
  contenedor.focus();
  const seleccion = window.getSelection();
  if (!seleccion) return;
  const rango = document.createRange();
  rango.selectNodeContents(contenedor);
  rango.collapse(false);
  seleccion.removeAllRanges();
  seleccion.addRange(rango);
}

/** La nota en modo lectura: los mismos elementos, armados por React. */
function NotaLeida({ lineas }: { lineas: LineaNota[] }) {
  return (
    <>
      {lineas.map((linea, indice) => (
        // El índice alcanza como clave: las líneas no se reordenan ni se
        // editan de a una, se vuelve a dibujar la nota entera.
        <p key={indice} className="min-h-[1.5em]">
          {linea.map((trozo, orden) => {
            let contenido = <>{trozo.texto}</>;
            if (trozo.subrayado) contenido = <u>{contenido}</u>;
            if (trozo.italica) contenido = <em>{contenido}</em>;
            if (trozo.negrita) contenido = <strong className="font-semibold">{contenido}</strong>;
            return <span key={orden}>{contenido}</span>;
          })}
        </p>
      ))}
    </>
  );
}

/** Lo que devuelve guardar una nota: bien, o el error para mostrar. */
type ResultadoNota = { ok: true } | { ok: false; error: string };

export function NotaEditable({
  notas,
  guardarNota,
  etiqueta,
  conAtajo = true,
}: {
  /** La nota guardada, con las marcas de `lib/notas`. */
  notas: string;
  /** Guarda el texto con marcas donde corresponda. */
  guardarNota: (texto: string) => Promise<ResultadoNota>;
  /** Cómo la nombra el lector de pantalla: "Nota del expediente". */
  etiqueta: string;
  /**
   * Si `alt+n` la abre y la cierra. En la pestaña Partes hay una nota por
   * ficha y todas están montadas: solo la de la ficha abierta tiene el atajo,
   * para que una sola pulsación no abra todas a la vez.
   */
  conAtajo?: boolean;
}) {
  /*
   * `guardada` es la nota que se muestra. Arranca en la que vino del servidor
   * y se adelanta al guardar: `revalidatePath` tarda un viaje de ida y vuelta,
   * y sin esto el recuadro mostraría el texto viejo por un instante al salir
   * de la edición.
   *
   * `recibida` recuerda qué prop produjo ese estado, para volver a alinearse
   * cuando el servidor manda una nota distinta —se guardó desde el formulario
   * del expediente, o se revalidó la pestaña—. Es el reajuste de estado
   * durante el render que recomienda React para esto, y no un efecto: un
   * efecto que llama a `setState` dibuja dos veces cada vez que llega la prop.
   */
  const [guardada, setGuardada] = useState(notas);
  const [recibida, setRecibida] = useState(notas);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");
  /** La nota como estaba al abrir la edición: es lo que restaura la flecha. */
  const [respaldo, setRespaldo] = useState("");
  const editable = useRef<HTMLDivElement>(null);
  /** Evita guardar dos veces cuando Escape y el `blur` llegan juntos. */
  const guardando = useRef(false);

  if (recibida !== notas) {
    setRecibida(notas);
    setGuardada(notas);
  }

  const lineas = parsearNota(guardada);

  /*
   * El contenido del editable lo pone el DOM y no React. Mezclar las dos cosas
   * es el error clásico de `contentEditable`: React volvería a dibujar los
   * hijos mientras se escribe y el cursor saltaría al principio. Acá React solo
   * monta el `<div>` vacío y nosotros lo llenamos una vez, al entrar.
   */
  useEffect(() => {
    if (editando && editable.current) pintar(editable.current, parsearNota(guardada));
    // `guardada` queda afuera a propósito: si entrara, cada guardado volvería
    // a pintar el editable y movería el cursor mientras se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando]);

  /*
   * `Alt+N` abre la nota desde cualquier parte de la pestaña (ver `atajos.ts`,
   * que explica por qué no es `Ctrl+N`). Va en `window` y no en el recuadro
   * porque el sentido del atajo es justamente no tener que llegar hasta él.
   */
  const aplicar = useCallback((comando: string) => {
    // `execCommand` está marcado como obsoleto y sigue siendo la única forma de
    // aplicar formato a la selección que funciona en todos los navegadores. El
    // reemplazo —reconstruir la selección a mano— es mucho código para las tres
    // variantes que ofrece una nota. Si algún día deja de funcionar, lo que hay
    // que reescribir es esta función y nada más: lo que se guarda no depende de
    // cómo se aplicó el formato, porque `lineasDesdeDom` lee el árbol.
    document.execCommand(comando);
    editable.current?.focus();
  }, []);

  function abrir(): void {
    setRespaldo(guardada);
    setEditando(true);
  }

  /** Vuelve el editable a como estaba al abrir, sin salir de la edición. */
  function restaurar(): void {
    if (!editable.current) return;
    pintar(editable.current, parsearNota(respaldo));
  }

  /*
   * Va en `useCallback` y no como función suelta porque la usa el atajo de
   * teclado, que vive en un efecto: sin estabilizarla, el efecto tendría que
   * volver a enganchar el `keydown` en cada dibujo.
   */
  const guardar = useCallback(async (): Promise<void> => {
    if (!editable.current || guardando.current) return;
    const texto = serializarNota(lineasDesdeDom(editable.current));
    // Sin cambios no se escribe: entrar y salir de la nota sin tocarla no
    // tiene que mover `actualizadoEn` del expediente.
    if (texto === guardada) {
      setEditando(false);
      setError("");
      return;
    }
    guardando.current = true;
    const resultado = await guardarNota(texto);
    guardando.current = false;
    if (!resultado.ok) {
      // El recuadro se queda abierto con lo escrito: cerrarlo perdería la nota.
      setError(resultado.error);
      return;
    }
    setGuardada(texto);
    setEditando(false);
    setError("");
  }, [guardarNota, guardada]);

  /*
   * `alt+n` **abre y cierra** la nota desde cualquier parte de la pestaña (ver
   * `atajos.ts`, que explica por qué no es `Ctrl+N`). El mismo atajo para las
   * dos cosas, así no hay que acordarse de dos.
   *
   * Cerrar es guardar, igual que Escape y que el clic afuera: son las tres
   * formas de terminar de escribir y no tienen por qué hacer cosas distintas.
   * Lo que deshace un cambio es la flecha de restaurar, que no pierde el texto.
   *
   * Va en `window` y no en el recuadro porque el sentido del atajo es
   * justamente no tener que llegar hasta él. Y la rama de cerrar va **antes**
   * de cualquier otra consideración sobre el foco: cuando la nota está abierta
   * el foco está adentro del editable, que es exactamente el caso que hay que
   * atender.
   */
  useEffect(() => {
    if (!conAtajo) return;
    function alPresionar(evento: KeyboardEvent): void {
      if (!esAtajoNota(evento) || evento.repeat) return;
      evento.preventDefault();
      if (editando) {
        void guardar();
        return;
      }
      setRespaldo(guardada);
      setEditando(true);
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [conAtajo, editando, guardada, guardar]);

  function alSalir(evento: React.FocusEvent<HTMLDivElement>): void {
    // Pasar del editable a un control del borde no es salir de la nota. Los
    // controles además cancelan su `mousedown`, así que en la práctica el foco
    // no se mueve; esto cubre el recorrido con el tabulador.
    if (evento.currentTarget.contains(evento.relatedTarget as Node | null)) return;
    void guardar();
  }

  function alTeclear(evento: React.KeyboardEvent<HTMLDivElement>): void {
    if (evento.key === "Escape") {
      // Escape **guarda**, igual que el clic afuera: son las dos formas de
      // terminar de escribir y no tienen por qué hacer cosas distintas. Lo que
      // deshace un cambio es la flecha de restaurar, que no pierde el texto.
      evento.preventDefault();
      void guardar();
      return;
    }
    if (!evento.ctrlKey && !evento.metaKey) return;
    const formato = FORMATOS.find(
      (candidato) => candidato.marca === evento.key.toLowerCase(),
    );
    if (!formato) return;
    // Los navegadores ya aplican Ctrl+B, I y U dentro de un editable, pero no
    // todos los tres: se toma el atajo acá para que las tres variantes
    // respondan igual en todos y para no depender de ese comportamiento.
    evento.preventDefault();
    aplicar(formato.comando);
  }

  const vacia = notaVacia(guardada);

  /*
   * Las dos ramas llevan `key` y es imprescindible: las dos son un `<div>` en
   * la misma posición del árbol, así que sin `key` React reutiliza el nodo en
   * lugar de reemplazarlo. Y como el contenido del editable lo pusimos a mano,
   * React no lo conoce: al volver a lectura esos hijos quedaban en el DOM y
   * React agregaba los suyos al lado, con lo que la nota se veía dos veces.
   */
  return editando ? (
    <div
      key="editando"
      onBlur={alSalir}
      /*
        El borde punteado sobre el papel del fondo es el aviso de modo edición,
        prestado de `Pendientes`. El `pt-8` reserva el renglón de los controles
        para que no se monten sobre el borde ni sobre el texto.
      */
      className="relative -mx-2 rounded-md border border-dashed border-linea-fuerte bg-background px-2 pt-8 pb-1.5"
    >
      <div className="absolute top-1 right-1 flex items-center gap-0.5">
        {FORMATOS.map(({ marca, letra, clase, titulo, comando }) => (
          <button
            key={marca}
            type="button"
            title={titulo}
            aria-label={titulo}
            // Cancelar el `mousedown` es lo que mantiene la selección del
            // texto: sin esto, apretar el control saca el foco del editable y
            // el navegador pierde qué había seleccionado, así que el formato
            // no se aplicaría a nada.
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() => aplicar(comando)}
            className={claseControl}
          >
            <span className={clase}>{letra}</span>
          </button>
        ))}

        {/* Una línea fina separa el formato de la acción, que no es formato. */}
        <span aria-hidden className="mx-0.5 h-4 w-px bg-linea-fuerte" />

        <button
          type="button"
          title="Restaurar la nota como estaba al abrirla"
          aria-label="Restaurar la nota como estaba al abrirla"
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={restaurar}
          className={claseControl}
        >
          <Undo2 aria-hidden className="size-3.5" />
        </button>
      </div>

      <div
        ref={editable}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label={etiqueta}
        onKeyDown={alTeclear}
        className="text-sm whitespace-pre-wrap text-zinc-800 focus:outline-none dark:text-zinc-200 [&_strong]:font-semibold"
      />

      {error ? (
        <p role="status" className="mt-1.5 text-xs text-red-700 dark:text-red-400">
          {error} La nota sigue abierta: lo que escribiste no se perdió.
        </p>
      ) : null}
    </div>
  ) : (
    <div
      key="leyendo"
      role="button"
      tabIndex={0}
      // En la ficha de una parte, con la nota enfocada las flechas siguen
      // pasando de parte (`focoEnLaFicha` en `partes/FichaAbierta`).
      data-sigue-flechas
      onClick={abrir}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          abrir();
        }
      }}
      title={`Hacé clic para editar la nota (${ATAJO_NOTA})`}
      // El borde existe también acá, transparente, para que entrar a editar no
      // corra el texto un píxel para el costado.
      className="-mx-2 cursor-text rounded-md border border-transparent px-2 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-background focus-visible:border-dashed focus-visible:border-linea-fuerte focus-visible:bg-background focus-visible:outline-none dark:text-zinc-300"
    >
      {vacia ? (
        <span className="text-zinc-400 dark:text-zinc-600">
          Sin notas. Hacé clic para escribir.
        </span>
      ) : (
        <NotaLeida lineas={lineas} />
      )}
    </div>
  );
}

/** La nota del expediente, en la pestaña Datos. */
export function NotaExpediente({
  expedienteId,
  notas,
}: {
  expedienteId: string;
  notas: string;
}) {
  const guardarNota = useCallback(
    (texto: string) => guardarNotas(expedienteId, texto),
    [expedienteId],
  );
  return <NotaEditable notas={notas} guardarNota={guardarNota} etiqueta="Nota del expediente" />;
}
