import { redirect } from "next/navigation";
import { PESTANA_INICIAL, rutaPestana } from "./pestanas";

/**
 * `/expedientes/<id>` no muestra nada propio: lleva a la primera pestaña.
 *
 * Así el expediente tiene una sola dirección por vista y los enlaces que ya
 * existen —las filas del listado, lo que devuelven las acciones— siguen
 * funcionando. Los parámetros de búsqueda viajan con el salto, porque ahí vienen
 * los avisos de "cambios guardados" y de error.
 */
export default async function ExpedientePage({
  params,
  searchParams,
}: PageProps<"/expedientes/[id]">) {
  const { id } = await params;
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(await searchParams)) {
    for (const uno of Array.isArray(valor) ? valor : [valor]) {
      if (uno !== undefined) consulta.append(clave, uno);
    }
  }
  const cola = consulta.toString();
  redirect(`${rutaPestana(id, PESTANA_INICIAL)}${cola ? `?${cola}` : ""}`);
}
