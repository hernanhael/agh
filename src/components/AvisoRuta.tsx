"use client";

import { useSearchParams } from "next/navigation";
import { Aviso } from "@/components/ui";

/**
 * El aviso de "cambios guardados" o del error, leído de la URL desde el
 * cliente.
 *
 * Las acciones del servidor informan el resultado con un parámetro de búsqueda
 * (`?hecho=`, `?error=`), y los `layout` no reciben `searchParams` —solo las
 * páginas—. Como el aviso tiene que aparecer arriba del expediente sea cual sea
 * la pestaña abierta, vive en el cuadro y lee la URL con `useSearchParams`.
 */
export function AvisoRuta() {
  const parametros = useSearchParams();
  return (
    <Aviso
      error={parametros.get("error") ?? undefined}
      hecho={parametros.get("hecho") ?? undefined}
    />
  );
}
