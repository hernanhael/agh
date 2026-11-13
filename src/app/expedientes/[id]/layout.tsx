import { Suspense } from "react";
import Link from "next/link";
import { AvisoRuta } from "@/components/AvisoRuta";
import { ChipProcesal } from "@/components/SituacionProcesal";
import { claseBotonSecundario, Encabezado } from "@/components/ui";
import { enPapelera, hoy, identificador } from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import { restaurar } from "../acciones";
import { fueroDe } from "@/lib/datos/fueros";
import { situacionCaducidad } from "@/lib/procesal";
import { cargarExpediente } from "./cargar";
import { LadosPlegados } from "./LadosPlegados";
import { PestanasExpediente } from "./PestanasExpediente";

/**
 * El cuadro del expediente: lo que no cambia al moverse entre pestañas.
 *
 * Arriba, afuera del cuadro, la **identidad de la causa** —carátula y número— y
 * el **semáforo de caducidad**. Eso tiene que estar a la vista en cualquier
 * pestaña: es la cabecera fija de la ficha de docs/02-expedientes.md §2.7.
 * Adentro, la tira de pestañas y el contenido de la que está abierta.
 *
 * El tipo de proceso y la etapa **no** están acá, y es a propósito: la cabecera
 * se lee en las siete pestañas, así que cada dato que se le agrega lo paga
 * siete veces. Los dos tienen su lugar —la etapa en la ficha de Datos y en el
 * recorrido de Historia, el tipo de proceso en Resumen, Historia e IA—, y
 * repetirlos arriba sumaba una línea gris que había que saltear para llegar a
 * la carátula. Lo que queda es lo que no se puede averiguar de otra forma: de
 * qué juicio se trata y si está en riesgo de caducar.
 *
 * Al ser un `layout` y no una página, React conserva esta parte entre
 * navegaciones: cambiar de pestaña vuelve a pedir solo el cuerpo.
 */
export default async function ExpedienteLayout({ children, params }: LayoutProps<"/expedientes/[id]">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const situacion = situacionCaducidad(expediente, hoy());
  // Se vuelve al fuero del expediente, que es de donde se llegó.
  const fuero = fueroDe(expediente);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Link
        href={`/expedientes/fuero/${fuero.slug}`}
        className="text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-500"
      >
        ← {fuero.nombre}
      </Link>

      <div className="mt-3">
        <Encabezado
          titulo={expediente.caratula}
          descripcion={`Expediente ${identificador(expediente)}`}
        >
          <ChipProcesal situacion={situacion} />
        </Encabezado>
      </div>

      {/*
        El aviso lee la URL desde el cliente (ver `AvisoRuta`). El `Suspense`
        es el que pide Next para un componente que consulta los parámetros de
        búsqueda: sin él, toda esta rama tendría que renderizarse en el cliente.
      */}
      <Suspense fallback={null}>
        <AvisoRuta />
      </Suspense>

      {/*
        Un expediente de la papelera se sigue pudiendo abrir —por eso no da
        404—, pero lo dice arriba de todo y ofrece volver a ponerlo en uso.
      */}
      {enPapelera(expediente) ? (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          <span>
            Este expediente está en la{" "}
            <Link href="/expedientes/papelera" className="underline underline-offset-2">
              papelera
            </Link>{" "}
            desde el {formatoFecha((expediente.enPapeleraDesde ?? "").slice(0, 10))}: no aparece en
            los listados.
          </span>
          <form action={restaurar}>
            <input type="hidden" name="id" value={expediente.id} />
            <button type="submit" className={claseBotonSecundario}>
              Restaurar
            </button>
          </form>
        </div>
      ) : null}

      <div className="rounded-lg border border-linea bg-superficie">
        <PestanasExpediente expedienteId={expediente.id} />
        {/*
          Lo que se recuerda mientras se trabaja en este expediente y se olvida
          al salir al listado: qué lados de la nómina están plegados
          (`LadosPlegados`). La `key` hace que cada expediente empiece de cero.
        */}
        <LadosPlegados key={expediente.id}>
          <div className="p-5">{children}</div>
        </LadosPlegados>
      </div>
    </div>
  );
}
