import type { ReactNode } from "react";

interface AreaPlaceholderProps {
  titulo: string;
  descripcion: string;
  pendientes: string[];
  /** Contenido extra debajo de la lista de pendientes. */
  children?: ReactNode;
}

/**
 * Placeholder de una de las cinco áreas mientras se construye la Fase 1
 * (docs/08-roadmap.md). Se reemplaza área por área a medida que cada
 * funcionalidad queda lista.
 */
export function AreaPlaceholder({
  titulo,
  descripcion,
  pendientes,
  children,
}: AreaPlaceholderProps) {
  return (
    <div className="mx-auto max-w-2xl px-8 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{titulo}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{descripcion}</p>
      <div className="mt-8 rounded-lg border border-linea bg-superficie p-4">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500">
          Fase 1 — próximo en esta área
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {pendientes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}
