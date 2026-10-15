import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Marca, Pendientes, Vacio } from "@/components/ui";
import {
  etiquetaDe,
  MODELOS,
  MODOS_CONOCIMIENTO,
  ROLES_AGENTE,
  sugerirAgentes,
} from "@/lib/datos";
import { cargarExpediente, cargarTipoProceso } from "../cargar";

/**
 * Pestaña **IA**: los agentes que intervienen en este expediente
 * (docs/02-expedientes.md §2.6, docs/03-ia-agentes.md).
 *
 * Los agentes se crean y se configuran una sola vez en Configuración; acá se
 * decide cuáles trabajan en esta causa. Hoy la pestaña muestra los que el
 * sistema **sugiere** por materia y tipo de proceso, que es la mitad de la
 * historia: la selección efectiva por expediente, el informe de estado y el
 * chat con contexto son las piezas que siguen.
 *
 * Cada agente trabaja en dominio cerrado: solo ve la historia de este
 * expediente y las fuentes que el abogado le dio al configurarlo. El modo de
 * conocimiento se muestra junto a cada uno porque cambia cuánto se puede
 * confiar en lo que responde.
 */
export default async function IaExpedientePage({ params }: PageProps<"/expedientes/[id]/ia">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const [tipo, agentes] = await Promise.all([
    cargarTipoProceso(expediente.tipoProcesoId),
    sugerirAgentes(expediente.tipoProcesoId, expediente.materia),
  ]);

  return (
    <>
      <div className="flex items-start gap-2">
        <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-500" />
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Agentes sugeridos para{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {tipo?.nombre ?? "este expediente"}
          </span>
          {expediente.materia ? ` en ${expediente.materia.toLowerCase()}` : null}.
        </p>
      </div>

      {agentes.length === 0 ? (
        <div className="mt-4">
          <Vacio>
            Ninguno de los agentes configurados actúa en este tipo de proceso. Se configuran en{" "}
            <Link
              href="/configuracion/agentes"
              className="underline decoration-dotted underline-offset-2"
            >
              Configuración → Agentes
            </Link>
            .
          </Vacio>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-linea">
          {agentes.map((agente) => (
            <li key={agente.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {agente.nombre}
                </span>
                <Marca>{etiquetaDe(ROLES_AGENTE, agente.rol)}</Marca>
                <Marca tono={agente.modoConocimiento === "solo_fuentes" ? "ok" : "aviso"}>
                  {etiquetaDe(MODOS_CONOCIMIENTO, agente.modoConocimiento).toLowerCase()}
                </Marca>
              </div>
              {agente.descripcion ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {agente.descripcion}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                {agente.rama}
                {agente.especialidades.length > 0 ? ` · ${agente.especialidades.join(", ")}` : null}
                {" · "}
                {etiquetaDe(MODELOS, agente.modelo)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pendientes
        items={[
          "Selección efectiva: elegir qué agentes trabajan en esta causa, en lugar de una sugerencia por materia y tipo de proceso.",
          "Informe de estado bajo demanda, con cada punto referido a su fuente, guardado en la historia.",
          "Chat con el contexto del expediente y análisis de una actuación concreta.",
          "Acciones propuestas por la IA pendientes de aprobación: crear vencimiento, tarea, cambiar etapa, generar escrito (docs/05-integracion-expedientes-ia.md).",
          "Panel de IA del editor de escritos, con las referencias de todo lo que toma de la historia.",
        ]}
      />
    </>
  );
}
