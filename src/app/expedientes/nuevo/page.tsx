import Link from "next/link";
import { Aviso, claseTarjeta, Encabezado, mensajes } from "@/components/ui";
import { listarMaterias, listarTiposProcesoActivos, obtenerEstudio } from "@/lib/datos";
import { nuevoExpediente } from "../acciones";
import { FormularioExpediente } from "../FormularioExpediente";

export default async function NuevoExpedientePage({
  searchParams,
}: PageProps<"/expedientes/nuevo">) {
  const [tipos, materias, estudio] = await Promise.all([
    listarTiposProcesoActivos(),
    listarMaterias(),
    obtenerEstudio(),
  ]);
  const { error } = mensajes(await searchParams);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Encabezado
        titulo="Nuevo expediente"
        descripcion="Elegí el tipo de proceso: con eso el expediente queda posicionado en la primera etapa de esa plantilla."
      />
      <Aviso error={error} />

      {tipos.length === 0 ? (
        <p className={claseTarjeta}>
          No hay tipos de proceso activos.{" "}
          <Link
            href="/configuracion/procesos"
            className="underline decoration-dotted underline-offset-2"
          >
            Configurá al menos uno
          </Link>{" "}
          antes de dar de alta un expediente.
        </p>
      ) : (
        <div className={claseTarjeta}>
          <FormularioExpediente
            tiposProceso={tipos}
            materias={materias}
            centroJudicialHabitual={estudio.centroJudicialHabitual}
            acentuar={estudio.correccionDeTildes}
            accion={nuevoExpediente}
            textoBoton="Crear expediente"
          />
        </div>
      )}
    </div>
  );
}
