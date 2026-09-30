import Link from "next/link";
import { Semaforo } from "@/components/Registro";
import { claseTarjetaEnlace, Encabezado } from "@/components/ui";
import { resumenConfiguracion } from "@/lib/datos";

/**
 * Portada de Configuración: qué hay configurado hoy y qué falta.
 *
 * Las secciones que todavía no existen se listan como pendientes en lugar de
 * esconderse, para que se vea el alcance completo del área (Fase 1 de
 * docs/08-roadmap.md).
 */

const PENDIENTES = [
  { titulo: "Catálogo de plazos", detalle: "Plazos por acto, con artículo y marca de verificación. Usa el motor de lib/plazos." },
  { titulo: "Plantillas de escritos", detalle: "Cuerpo del escrito con variables del expediente." },
  { titulo: "Materias", detalle: "Hoy se escriben libremente en cada tipo de proceso y expediente." },
  { titulo: "Juzgados y secretarías", detalle: "Con el nombre exacto que usa el Portal del SAE, para vincular expedientes." },
  { titulo: "Dispositivos SAE", detalle: "Tokens de la extensión de navegador, revocables." },
];

export default async function ConfiguracionPage() {
  const resumen = await resumenConfiguracion();

  return (
    <>
      <Encabezado
        titulo="Configuración del estudio"
        descripcion="El abogado configura: tipos de proceso con sus etapas, agentes especializados, plazos, escritos, materias y juzgados. El sistema trae ejemplos editables, nunca reglas fijas."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Los tres cuadros usan el papel y el hover del registro. */}
        <Link href="/configuracion/estudio" className={claseTarjetaEnlace}>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Estudio</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Datos del abogado y preferencias
          </p>
          <div className="mt-3">
            {resumen.estudioCompleto ? (
              <Semaforo
                tono="ok"
                etiqueta="Completo"
                detalle="El nombre y la matrícula están cargados: alcanzan para encabezar un escrito."
              />
            ) : (
              <Semaforo
                tono="aviso"
                etiqueta="Falta cargar"
                detalle="Sin nombre y matrícula, los escritos salen sin encabezado."
              />
            )}
          </div>
        </Link>

        <Link href="/configuracion/procesos" className={claseTarjetaEnlace}>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Tipos de proceso</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Ordinario, sumario, expropiación y los que agregues
          </p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {resumen.tiposProcesoActivos}
            <span className="ml-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              de {resumen.tiposProceso} activos
            </span>
          </p>
        </Link>

        <Link href="/configuracion/agentes" className={claseTarjetaEnlace}>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Agentes</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Especializados por rol, materia y tipo de proceso
          </p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {resumen.agentesActivos}
            <span className="ml-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              de {resumen.agentes} activos
            </span>
          </p>
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Todavía no configurable
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          El resto de las secciones de Configuración previstas para la Fase 1.
        </p>
        <ul className="mt-4 divide-y divide-linea rounded-lg border border-linea">
          {PENDIENTES.map((pendiente) => (
            <li key={pendiente.titulo} className="px-4 py-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {pendiente.titulo}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{pendiente.detalle}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
