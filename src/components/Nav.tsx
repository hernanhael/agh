"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const AREAS = [
  { href: "/hoy", label: "Hoy" },
  { href: "/agenda", label: "Agenda" },
  { href: "/expedientes", label: "Expedientes" },
  { href: "/ia", label: "IA" },
  { href: "/guias", label: "Guías" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-56 flex-col justify-between border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">agh-IAwyer</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Estudio jurídico virtual</p>
        </div>
        <ul className="flex flex-col gap-1">
          {AREAS.map((area) => {
            const activo = pathname === area.href || pathname.startsWith(`${area.href}/`);
            return (
              <li key={area.href}>
                <Link
                  href={area.href}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activo
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {area.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <Link
        href="/configuracion"
        className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          pathname.startsWith("/configuracion")
            ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
            : "text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        Configuración
      </Link>
    </nav>
  );
}
