import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Aviso,
  claseBotonPeligro,
  claseBotonSecundario,
  mensajes,
} from "@/components/ui";
import { identificador, listarPapelera } from "@/lib/datos";
import { fueroDe } from "@/lib/datos/fueros";
import { formatoFecha } from "@/lib/plazos";
import { borrarExpediente, restaurar } from "../acciones";

/**
 * La papelera de expedientes: la baja lógica (`deleted_at` en
 * docs/06-modelo-de-datos.md).
 *
 * Un expediente borrado desde su ficha viene acá con todo lo suyo —historia,
 * partes, contabilidad— y desde acá se restaura o se borra para siempre. Es el
 * único lugar desde donde se puede borrar definitivamente, y por eso el botón
 * de borrar dice que no se deshace: es el segundo paso, no el primero.
 */
export default async function PapeleraPage({ searchParams }: PageProps<"/expedientes/papelera">) {
  const [expedientes, parametros] = await Promise.all([listarPapelera(), searchParams]);
  const { error, hecho } = mensajes(parametros);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pb-12 pt-7">
      <Link
        href="/expedientes"
        className="group -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-acento-suave hover:text-acento focus-visible:outline-2 focus-visible:outline-acento dark:text-zinc-400"
      >
        <ArrowLeft
          aria-hidden
          className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        Todos los fueros
      </Link>
      <header className="mt-1 flex items-center gap-2">
        <Trash2 aria-hidden className="size-4 text-zinc-400 dark:text-zinc-500" />
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Papelera
        </h1>
      </header>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Los expedientes que se mandaron a la papelera, con su historia, sus partes y su
        contabilidad. Se pueden restaurar tal como estaban.
      </p>

      <div className="mt-6">
        <Aviso error={error} hecho={hecho} />
      </div>

      {expedientes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-linea-fuerte px-4 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
          La papelera está vacía.
        </p>
      ) : (
        <ul className="divide-y divide-linea rounded-lg border border-linea bg-superficie">
          {expedientes.map((expediente) => (
            <li
              key={expediente.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/expedientes/${expediente.id}`}
                  className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
                >
                  {expediente.caratula}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                  <span className="tabular-nums">{identificador(expediente)}</span> ·{" "}
                  {fueroDe(expediente).nombre} · en la papelera desde el{" "}
                  <span className="tabular-nums">
                    {formatoFecha((expediente.enPapeleraDesde ?? "").slice(0, 10))}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={restaurar}>
                  <input type="hidden" name="id" value={expediente.id} />
                  <input type="hidden" name="volverA" value="papelera" />
                  <button type="submit" className={claseBotonSecundario}>
                    Restaurar
                  </button>
                </form>
                <form action={borrarExpediente}>
                  <input type="hidden" name="id" value={expediente.id} />
                  <button
                    type="submit"
                    className={claseBotonPeligro}
                    title="Borra el expediente con su historia, sus partes y su contabilidad. No se puede deshacer."
                  >
                    Borrar para siempre
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
