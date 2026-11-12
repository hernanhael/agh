import {
  ArrowRight,
  Baby,
  Banknote,
  Bird,
  Briefcase,
  Coins,
  Feather,
  FileSignature,
  Gavel,
  Handshake,
  HeartHandshake,
  House,
  KeyRound,
  Landmark,
  Receipt,
  Scale,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Fuero } from "@/lib/datos/fueros";

/**
 * Tarjeta de un fuero en la entrada de Expedientes: el nombre, centrado, y al
 * pie un emblema de tres íconos que dice de qué trata el fuero.
 *
 * La tarjeta tiene **dos zonas que no se pisan**: arriba el título, que ocupa
 * todo el alto que sobra y se centra en él, y abajo una franja fija para el
 * emblema. Los íconos quedan recortados por el borde inferior, como un sello
 * que asoma, y por construcción no pueden tocar la letra aunque el nombre
 * ocupe dos renglones.
 *
 * Todo el movimiento es CSS, así que sirve como componente de servidor:
 *
 * - **Entrada**: las tarjetas suben y aparecen escalonadas (`.aparece-tarjeta`
 *   en globals.css).
 * - **Hover y foco**: la tarjeta se eleva, toma el tono del acento, los íconos
 *   suben un poco uno detrás de otro y se tiñen, entra una flecha por la
 *   esquina y una línea de acento crece por el pie.
 *
 * Con `prefers-reduced-motion` no hay desplazamientos: quedan los colores.
 */

/** Ícono central y los dos que lo acompañan, a izquierda y derecha. */
type Emblema = [LucideIcon, LucideIcon, LucideIcon];

const EMBLEMAS: Record<string, Emblema> = {
  "Civil y Comercial Común": [Handshake, Scale, Briefcase],
  "Civil en Documentos y Locaciones": [KeyRound, FileSignature, House],
  "Cobros y Apremios": [Receipt, Banknote, Coins],
  "Familia y Sucesiones": [Baby, Users, ScrollText],
  Paz: [Feather, Bird, HeartHandshake],
};

/** Para un fuero que no está en el catálogo. */
const EMBLEMA_GENERICO: Emblema = [ScrollText, Gavel, Landmark];

const claseIcono =
  "shrink-0 text-zinc-300 transition-[transform,color] duration-500 ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:text-acento/45 group-focus-visible:text-acento/45 dark:text-zinc-700 motion-reduce:transition-colors";

export function TarjetaFuero({ fuero, orden }: { fuero: Fuero; orden: number }) {
  const [Izquierda, Centro, Derecha] = EMBLEMAS[fuero.valor] ?? EMBLEMA_GENERICO;

  return (
    <li className="aparece-tarjeta" style={{ animationDelay: `${Math.min(orden, 10) * 60}ms` }}>
      <Link
        href={`/expedientes/fuero/${fuero.slug}`}
        className="group relative flex h-48 flex-col overflow-hidden rounded-xl border border-linea bg-superficie transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] hover:-translate-y-1 hover:border-acento/40 hover:bg-acento-suave hover:shadow-[0_10px_30px_-14px_oklch(0.45_0.1_258/0.45)] focus-visible:-translate-y-1 focus-visible:border-acento focus-visible:bg-acento-suave focus-visible:outline-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
      >
        <ArrowRight
          aria-hidden
          className="absolute right-4 top-4 size-4 -translate-x-2 text-acento opacity-0 transition-[transform,opacity] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:translate-x-0"
        />

        {/*
          Zona del título: todo lo que sobra del alto, con el nombre apoyado
          abajo, justo encima del emblema. Si el nombre ocupa dos renglones,
          crece hacia arriba y no hacia los íconos.
        */}
        <span className="flex flex-1 items-end justify-center px-8 pb-2 pt-6 text-center">
          <span className="text-lg font-medium leading-snug tracking-tight text-balance text-zinc-900 transition-colors duration-300 group-hover:text-acento-fuerte group-focus-visible:text-acento-fuerte dark:text-zinc-50">
            {fuero.nombre}
          </span>
        </span>

        {/* Zona del emblema: alto fijo, íconos recortados por el borde. */}
        <span aria-hidden className="flex h-14 shrink-0 items-end justify-center gap-6">
          <Izquierda
            strokeWidth={1.25}
            className={`${claseIcono} size-9 translate-y-2.5 group-hover:translate-y-1 group-focus-visible:translate-y-1`}
          />
          <Centro
            strokeWidth={1.25}
            className={`${claseIcono} size-14 translate-y-4 delay-75 group-hover:translate-y-2 group-focus-visible:translate-y-2`}
          />
          <Derecha
            strokeWidth={1.25}
            className={`${claseIcono} size-9 translate-y-2.5 delay-150 group-hover:translate-y-1 group-focus-visible:translate-y-1`}
          />
        </span>

        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-acento transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
        />
      </Link>
    </li>
  );
}
