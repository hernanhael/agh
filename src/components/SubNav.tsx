"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Seccion {
  href: string;
  label: string;
}

/** Navegación horizontal entre las secciones de un área. */
export function SubNav({
  secciones,
  className = "",
}: {
  secciones: ReadonlyArray<Seccion>;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={`flex flex-wrap gap-1 border-b border-linea ${className}`}>
      {secciones.map((seccion) => {
        const activo =
          pathname === seccion.href ||
          (seccion.href !== "/configuracion" && pathname.startsWith(`${seccion.href}/`));
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activo
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {seccion.label}
          </Link>
        );
      })}
    </nav>
  );
}
