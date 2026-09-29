"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  FolderOpen,
  Scale,
  Settings,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";

/**
 * Barra lateral: riel de íconos, uno por área, con el rótulo debajo.
 *
 * Los íconos y sus rótulos van en el gris secundario de la aplicación
 * (`text-zinc-600 dark:text-zinc-400`, el de las descripciones y los datos de
 * apoyo): la barra se lee sin esfuerzo pero no compite con el expediente, que
 * es lo que se viene a leer.
 *
 * El azul de acento —el de "Nuevo expediente"— queda reservado para una sola
 * cosa: marcar el área abierta. Al pasar el mouse solo aparece el fondo
 * teñido, sin teñir la tinta, para que el azul signifique siempre lo mismo.
 */

interface Area {
  href: string;
  label: string;
  Icono: LucideIcon;
}

const AREAS: ReadonlyArray<Area> = [
  { href: "/hoy", label: "Hoy", Icono: Sun },
  { href: "/agenda", label: "Agenda", Icono: CalendarDays },
  { href: "/expedientes", label: "Expedientes", Icono: FolderOpen },
  { href: "/ia", label: "IA", Icono: Sparkles },
  { href: "/guias", label: "Guías", Icono: BookOpen },
];

const CONFIGURACION: Area = {
  href: "/configuracion",
  label: "Configuración",
  Icono: Settings,
};

function Entrada({ href, label, Icono, activo }: Area & { activo: boolean }) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={activo ? "page" : undefined}
      className={`group flex flex-col items-center gap-2 rounded-xl px-1 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
        activo ? "bg-acento-suave" : "hover:bg-acento-suave/60"
      }`}
    >
      <Icono
        aria-hidden
        strokeWidth={2}
        className={`size-8 ${activo ? "text-acento" : "text-zinc-600 dark:text-zinc-400"}`}
      />
      <span
        className={`text-center text-[13px] font-medium leading-tight ${
          activo ? "text-acento" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();

  /** Una sección está abierta también desde sus subrutas (`/expedientes/12`). */
  const abierta = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Áreas"
      className="flex h-full w-32 shrink-0 flex-col border-r border-linea bg-barra"
    >
      <Link
        href="/"
        title="agh-IAwyer — Estudio jurídico virtual"
        className="mx-auto mt-5 mb-3 flex size-12 items-center justify-center rounded-xl border border-acento/30 bg-acento-suave transition-colors hover:border-acento/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
      >
        <Scale aria-hidden strokeWidth={2} className="size-6 text-acento" />
        <span className="sr-only">agh-IAwyer</span>
      </Link>

      <ul className="flex flex-col gap-1.5 p-2.5">
        {AREAS.map((area) => (
          <li key={area.href}>
            <Entrada {...area} activo={abierta(area.href)} />
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-linea p-2.5">
        <Entrada {...CONFIGURACION} activo={abierta(CONFIGURACION.href)} />
      </div>
    </nav>
  );
}
