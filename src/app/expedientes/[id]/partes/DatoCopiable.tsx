"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Un **dato de la ficha que se copia con un clic**: el teléfono, el domicilio,
 * el correo (docs/02-expedientes.md §2.14).
 *
 * Se ve igual que cualquier otro dato —el rótulo chico arriba, el valor
 * debajo—, pero el valor es un botón: al pasar el mouse aparece el ícono de
 * copiar al lado, y al hacer clic el texto queda en el portapapeles y el ícono
 * se vuelve un "Copiado" por un momento. Son los datos que se pegan en otro
 * lado —el teléfono en el celular, el domicilio en una cédula, el correo en el
 * cliente de mail— y seleccionarlos a mano con el mouse era el paso que
 * sobraba.
 *
 * Vacío no se copia nada: se muestra la raya, como en el resto de la ficha.
 *
 * Lleva `data-sigue-flechas` para que las flechas sigan recorriendo la nómina
 * después de copiar (`focoEnLaFicha` en `FichaAbierta`), aunque el foco haya
 * quedado en el botón.
 */
export function DatoCopiable({
  rotulo,
  valor,
  className = "",
}: {
  rotulo: string;
  valor: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const reloj = setTimeout(() => setCopiado(false), 1400);
    return () => clearTimeout(reloj);
  }, [copiado]);

  const texto = valor.trim();

  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs text-zinc-500 dark:text-zinc-500">{rotulo}</dt>
      <dd className="min-w-0">
        {texto ? (
          <button
            type="button"
            data-sigue-flechas
            title={`Copiar ${rotulo.toLowerCase()}`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(texto);
                setCopiado(true);
              } catch {
                // Sin permiso para el portapapeles no hay nada que avisar: el
                // texto sigue a la vista para seleccionarlo a mano.
              }
            }}
            className="group/copiar inline-flex max-w-full cursor-copy items-center gap-1.5 rounded text-left text-zinc-900 outline-none decoration-zinc-300 underline-offset-4 hover:underline focus-visible:underline dark:text-zinc-50 dark:decoration-zinc-600"
          >
            <span className="min-w-0 break-words">{texto}</span>
            {copiado ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Check aria-hidden className="size-3" />
                Copiado
              </span>
            ) : (
              <Copy
                aria-hidden
                className="size-3 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover/copiar:opacity-100 group-focus-visible/copiar:opacity-100 dark:text-zinc-500"
              />
            )}
            <span className="sr-only" aria-live="polite">
              {copiado ? "Copiado al portapapeles" : ""}
            </span>
          </button>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-600">—</span>
        )}
      </dd>
    </div>
  );
}
