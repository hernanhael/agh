"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

/**
 * **Qué parte tiene la ficha abierta**, y la ventana en la que se lee
 * (docs/02-expedientes.md §2.14).
 *
 * La ficha se abre **encima de la aplicación**, en una ventana centrada sobre
 * un velo translúcido que desenfoca lo de atrás: la nómina sigue ahí, pero
 * lo que se lee es la ficha. Hay una sola abierta por vez:
 *
 * - **Clic o Enter sobre una parte** la abre; Enter otra vez, la cierra.
 * - **Con la ficha abierta, ↑ y ↓ pasan a la parte de al lado** —dentro del
 *   mismo lado, como en la nómina— y la ventana muestra la suya
 *   (`AtajosDeLado` llama a `seguir`). Cerrada, las flechas solo mueven la
 *   selección.
 * - **Escape, la ✕ o un clic en el velo la cierran**, y el foco vuelve al
 *   renglón de la parte.
 *
 * **El foco se queda en el renglón** mientras la ventana está abierta: por eso
 * Enter y las flechas siguen siendo los de la nómina. Si se hace clic adentro
 * de la ficha, el foco pasa a la ventana y desde ahí las flechas y Enter
 * siguen andando; adentro de un campo del formulario, en cambio, son del
 * campo.
 *
 * Las fichas las arma el servidor —todas— y este estado solo decide cuál se
 * ve: las demás quedan con `hidden`, así que una edición a medio hacer no se
 * pierde al mirar otra parte y volver.
 */

interface ValorFicha {
  abierta: string | null;
  /** Abre la ficha de la parte, o la cierra si ya era la abierta. */
  alternar: (id: string) => void;
  /** Si hay una ficha abierta, pasa a mostrar la de esta parte. */
  seguir: (id: string) => void;
  /** Cierra la ficha y devuelve el foco al renglón de la parte. */
  cerrar: () => void;
}

const ContextoFicha = createContext<ValorFicha | null>(null);

const SIN_FICHA: ValorFicha = {
  abierta: null,
  alternar: () => {},
  seguir: () => {},
  cerrar: () => {},
};

export function useFichaAbierta(): ValorFicha {
  return useContext(ContextoFicha) ?? SIN_FICHA;
}

export function renglonDe(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-parte="${CSS.escape(id)}"]`,
  );
}

/**
 * Si el foco está "en la ficha" y no en algo que use las teclas: la ventana
 * misma o el fondo de la página (adonde va el foco al hacer clic en texto
 * suelto). Ahí ↑, ↓ y Enter son de la nómina.
 *
 * Con `flechas`, también lo que lleva `data-sigue-flechas`: un dato que se
 * copia con un clic (`DatoCopiable`) o la nota en modo lectura. Después de
 * copiar o de hacer clic ahí el foco queda en ese elemento, y las flechas
 * tienen que seguir pasando de parte. Enter no los cuenta, porque sobre ellos
 * Enter es copiar o empezar a escribir.
 */
export function focoEnLaFicha(
  activo: Element | null,
  { flechas = false }: { flechas?: boolean } = {},
): boolean {
  if (!activo || activo === document.body) return true;
  if (!(activo instanceof HTMLElement)) return false;
  if (activo.hasAttribute("data-ventana-ficha")) return true;
  return flechas && activo.hasAttribute("data-sigue-flechas");
}

export function FichaAbierta({ children }: { children: ReactNode }) {
  const [abierta, setAbierta] = useState<string | null>(null);

  const alternar = useCallback(
    (id: string) => setAbierta((actual) => (actual === id ? null : id)),
    [],
  );
  const seguir = useCallback(
    (id: string) => setAbierta((actual) => (actual === null ? null : id)),
    [],
  );
  const cerrar = useCallback(() => {
    setAbierta((actual) => {
      if (actual !== null) {
        // El foco vuelve al renglón después del pintado, cuando la ventana ya
        // no está encima.
        requestAnimationFrame(() => renglonDe(actual)?.focus());
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (abierta === null) return;

    function alPresionar(evento: KeyboardEvent): void {
      if (evento.defaultPrevented || evento.repeat) return;
      const destino = evento.target;
      if (destino instanceof HTMLElement && destino.isContentEditable) return;

      if (evento.key === "Escape") {
        // Escape en el formulario de "Agregar parte" es de ese desplegable.
        if (
          destino instanceof HTMLElement &&
          destino.closest("form") &&
          !destino.closest("[data-ventana-ficha]")
        ) {
          return;
        }
        evento.preventDefault();
        cerrar();
        return;
      }

      // Enter con el foco en la ventana —no en un botón ni en un campo—
      // cierra, igual que Enter sobre el renglón.
      if (evento.key === "Enter" && focoEnLaFicha(document.activeElement)) {
        evento.preventDefault();
        cerrar();
      }
    }

    // La página de atrás no se desplaza mientras la ficha está encima.
    const raiz = document.documentElement;
    const antes = raiz.style.overflow;
    raiz.style.overflow = "hidden";

    window.addEventListener("keydown", alPresionar);
    return () => {
      window.removeEventListener("keydown", alPresionar);
      raiz.style.overflow = antes;
    };
  }, [abierta, cerrar]);

  const valor = useMemo(
    () => ({ abierta, alternar, seguir, cerrar }),
    [abierta, alternar, seguir, cerrar],
  );
  return (
    <ContextoFicha.Provider value={valor}>{children}</ContextoFicha.Provider>
  );
}

/**
 * El renglón de una parte en la nómina: un botón que abre y cierra su ficha.
 * Lleva `data-parte` para que los atajos lo encuentren (`AtajosDeLado`).
 */
export function RenglonParte({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const { abierta, alternar } = useFichaAbierta();
  return (
    <button
      type="button"
      data-parte={id}
      aria-expanded={abierta === id}
      aria-controls="ventana-ficha"
      onClick={() => alternar(id)}
      className={className}
    >
      {children}
    </button>
  );
}

/**
 * La ficha de una parte adentro de la ventana: se ve solo si es la abierta.
 * `data-fallecida` es lo que tiñe la ventana (`VentanaFicha`).
 */
export function FichaDeParte({
  id,
  fallecida,
  children,
}: {
  id: string;
  fallecida: boolean;
  children: ReactNode;
}) {
  const { abierta } = useFichaAbierta();
  return (
    <div hidden={abierta !== id} data-fallecida={fallecida || undefined}>
      {children}
    </div>
  );
}

/**
 * **El tinte de la parte fallecida**: un rojizo terroso y apagado en el fondo
 * y el borde de la tarjeta, que se nota sin alarmar. Se aplica cuando la ficha
 * visible lleva `data-fallecida`, así que al pasar con las flechas de una
 * parte viva a una fallecida la tarjeta cambia de tono sola.
 */
const TINTE_FALLECIDA =
  "has-[>[data-fallecida]:not([hidden])]:border-[#e5d2c8] has-[>[data-fallecida]:not([hidden])]:bg-[#f7ede8] dark:has-[>[data-fallecida]:not([hidden])]:border-[#4a362e] dark:has-[>[data-fallecida]:not([hidden])]:bg-[#2a1f1b]";

/** Dónde se apoya la tarjeta: debajo de la tira de pestañas y a su ancho. */
interface Apoyo {
  arriba: number;
  izquierda: number;
  ancho: number;
}

/** Lo que queda entre la línea de las pestañas y el borde de la tarjeta. */
const SEPARACION = 8;

function medirApoyo(): Apoyo | null {
  const pestanas = document.querySelector("[data-pestanas-expediente]");
  if (!pestanas) return null;
  const caja = pestanas.getBoundingClientRect();
  return {
    // Si la tira quedó arriba, fuera de la pantalla, la tarjeta no se va con
    // ella: se queda a un margen del borde.
    arriba: Math.max(caja.bottom + SEPARACION, 16),
    izquierda: caja.left,
    ancho: caja.width,
  };
}

/**
 * La **ventana superpuesta**: un velo translúcido y desenfocado sobre toda la
 * aplicación y, encima, la tarjeta con la ficha. Está siempre montada y se
 * oculta con `hidden`, para que las fichas de adentro conserven lo que se
 * escribió; aparece con un fundido y un leve acercamiento (`starting:`), y al
 * pasar de una parte a otra con las flechas cambia el contenido sin repetir
 * la animación.
 *
 * **La tarjeta se apoya justo debajo de la línea que cierra la tira de
 * pestañas** y se centra sobre el cuadro del expediente, no sobre la
 * pantalla: se lee como el contenido de la pestaña puesto en primer plano. La
 * posición se mide al abrir y al cambiar el tamaño de la ventana
 * (`data-pestanas-expediente` en `PestanasExpediente`); sin la tira —la
 * pestaña renderizada suelta— queda centrada con un margen arriba.
 *
 * No es un `<dialog>` modal a propósito: uno modal vuelve inerte a la página,
 * y el foco tiene que poder quedarse en el renglón para que las flechas y
 * Enter sigan recorriendo la nómina.
 */
export function VentanaFicha({ children }: { children: ReactNode }) {
  const { abierta, cerrar } = useFichaAbierta();
  const visible = abierta !== null;
  const [apoyo, setApoyo] = useState<Apoyo | null>(null);

  // Antes del pintado, para que la tarjeta no aparezca en un lugar y salte a
  // otro.
  useLayoutEffect(() => {
    if (!visible) return;
    const medir = () => setApoyo(medirApoyo());
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [visible]);

  const alClicEnElVelo = (evento: MouseEvent) => {
    if (evento.target === evento.currentTarget) cerrar();
  };

  return (
    <div
      hidden={!visible}
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/25 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0 dark:bg-black/50"
      onMouseDown={alClicEnElVelo}
    >
      <div
        onMouseDown={alClicEnElVelo}
        className="flex justify-center px-4 pb-12"
        style={
          apoyo
            ? {
                paddingTop: apoyo.arriba,
                marginLeft: apoyo.izquierda,
                width: apoyo.ancho,
              }
            : { paddingTop: 48 }
        }
      >
        <div
          id="ventana-ficha"
          data-ventana-ficha
          role="dialog"
          aria-label="Ficha de la parte"
          tabIndex={-1}
          className={`relative w-full max-w-2xl rounded-xl border border-linea bg-superficie shadow-2xl outline-none transition-[opacity,scale,background-color] duration-200 starting:scale-95 starting:opacity-0 ${TINTE_FALLECIDA}`}
        >
          <button
            type="button"
            onClick={cerrar}
            title="Cerrar (Escape)"
            className="absolute top-2.5 right-2.5 rounded p-1 text-zinc-400 transition-colors hover:bg-background hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-acento dark:hover:text-zinc-200"
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">Cerrar la ficha</span>
          </button>
          {children}
          <p
            aria-hidden
            className="border-t border-linea px-5 py-2 text-[11px] text-zinc-400 dark:text-zinc-600"
          >
            <span className="rotulo-tecla">↑ ↓</span> otra parte del lado ·{" "}
            <span className="rotulo-tecla">Enter</span> o{" "}
            <span className="rotulo-tecla">Esc</span> cierra
          </p>
        </div>
      </div>
    </div>
  );
}
