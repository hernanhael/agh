import { FolderOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Aviso, claseBotonAccion, mensajes } from "@/components/ui";
import { listarExpedientes, listarPapelera } from "@/lib/datos";
import { fuerosDisponibles } from "@/lib/datos/fueros";
import { TarjetaFuero } from "./TarjetaFuero";

/**
 * Área Expedientes: la entrada por fuero.
 *
 * Antes de ver un solo juicio se elige el fuero. Cada tarjeta lleva solo su
 * nombre y abre `/expedientes/fuero/[fuero]`, donde están los procesos de ese
 * fuero con sus propios filtros (`lib/datos/fueros`).
 *
 * Los enlaces viejos que traían `?fuero=` siguen andando: se mandan a la
 * página del fuero con el resto de los filtros.
 */
export default async function ExpedientesPage({ searchParams }: PageProps<"/expedientes">) {
  const parametros = await searchParams;
  const [expedientes, papelera] = await Promise.all([listarExpedientes(), listarPapelera()]);
  const fueros = fuerosDisponibles(expedientes);

  const pedido = Array.isArray(parametros.fuero) ? parametros.fuero[0] : parametros.fuero;
  if (pedido) {
    const destino = fueros.find(
      (fuero) => fuero.valor.toLowerCase() === pedido.toLowerCase() || fuero.slug === pedido,
    );
    if (destino) {
      const resto = new URLSearchParams();
      for (const [clave, valor] of Object.entries(parametros)) {
        if (clave === "fuero" || valor === undefined) continue;
        resto.set(clave, Array.isArray(valor) ? (valor[0] ?? "") : valor);
      }
      const cadena = resto.toString();
      redirect(`/expedientes/fuero/${destino.slug}${cadena ? `?${cadena}` : ""}`);
    }
  }

  const { error, hecho } = mensajes(parametros);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pb-12 pt-7">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <FolderOpen aria-hidden className="size-4 text-zinc-400 dark:text-zinc-500" />
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Expedientes
          </h1>
        </div>
        <Link href="/expedientes/nuevo" className={claseBotonAccion}>
          <Plus aria-hidden className="size-4" />
          Nuevo expediente
        </Link>
      </header>

      <div className="mt-6">
        <Aviso error={error} hecho={hecho} />
      </div>

      <nav aria-label="Fueros">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fueros.map((fuero, orden) => (
            <TarjetaFuero key={fuero.slug} fuero={fuero} orden={orden} />
          ))}
        </ul>
      </nav>

      {/*
        La papelera aparece solo cuando tiene algo: vacía no hay nada que ir a
        buscar, y un enlace más al pie sería ruido.
      */}
      {papelera.length > 0 ? (
        <Link
          href="/expedientes/papelera"
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-zinc-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <Trash2 aria-hidden className="size-3.5" />
          Papelera ({papelera.length})
        </Link>
      ) : null}
    </div>
  );
}
