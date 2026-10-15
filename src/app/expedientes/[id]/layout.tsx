import { Suspense } from "react";
import Link from "next/link";
import { AvisoRuta } from "@/components/AvisoRuta";
import { ChipProcesal } from "@/components/SituacionProcesal";
import { Encabezado } from "@/components/ui";
import { hoy, identificador } from "@/lib/datos";
import { situacionCaducidad } from "@/lib/procesal";
import { cargarExpediente, cargarTipoProceso } from "./cargar";
import { PestanasExpediente } from "./PestanasExpediente";

/**
 * El cuadro del expediente: lo que no cambia al moverse entre pestañas.
 *
 * Arriba, afuera del cuadro, la **identidad de la causa** —carátula, número— y
 * su **situación** —tipo de proceso, etapa y el semáforo de caducidad—. Eso
 * tiene que estar a la vista en cualquier pestaña: es la cabecera fija de la
 * ficha de docs/02-expedientes.md §2.7. Adentro, la tira de pestañas y el
 * contenido de la que está abierta.
 *
 * Al ser un `layout` y no una página, React conserva esta parte entre
 * navegaciones: cambiar de pestaña vuelve a pedir solo el cuerpo.
 */
export default async function ExpedienteLayout({ children, params }: LayoutProps<"/expedientes/[id]">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const tipo = await cargarTipoProceso(expediente.tipoProcesoId);
  const etapa = tipo?.etapas.find((candidata) => candidata.clave === expediente.etapaActual);
  const situacion = situacionCaducidad(expediente, hoy());

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Link
        href="/expedientes"
        className="text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-500"
      >
        ← Expedientes
      </Link>

      <div className="mt-3">
        <Encabezado
          titulo={expediente.caratula}
          descripcion={`Expediente ${identificador(expediente)}`}
        >
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <ChipProcesal situacion={situacion} />
            <span className="text-right text-xs text-zinc-500 dark:text-zinc-500">
              {tipo?.nombre ?? "sin tipo de proceso"}
              {etapa ? ` · ${etapa.nombre}` : null}
            </span>
          </div>
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

      <div className="rounded-lg border border-linea bg-superficie">
        <PestanasExpediente expedienteId={expediente.id} />
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
