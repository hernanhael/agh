import { Aviso, mensajes } from "@/components/ui";
import { FILTROS_VACIOS, listarExpedientes, listarTiposProceso } from "@/lib/datos";
import { ListadoExpedientes } from "./ListadoExpedientes";

/** Lee un parámetro de búsqueda que puede venir repetido. */
function uno(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

/**
 * Área Expedientes.
 *
 * El servidor trae los datos y el listado filtra en el cliente para que la
 * búsqueda responda en la misma tecla (`ListadoExpedientes`). Los filtros
 * iniciales se leen de la URL, así que un enlace con `?q=` o `?estado=` abre ya
 * filtrado.
 */
export default async function ExpedientesPage({ searchParams }: PageProps<"/expedientes">) {
  const parametros = await searchParams;
  const [expedientes, tipos] = await Promise.all([listarExpedientes(), listarTiposProceso()]);
  const { error, hecho } = mensajes(parametros);

  return (
    <div className="flex min-h-full flex-col">
      <ListadoExpedientes
        expedientes={expedientes}
        tipos={tipos}
        filtrosIniciales={{
          ...FILTROS_VACIOS,
          consulta: uno(parametros.q),
          estado: uno(parametros.estado),
          materia: uno(parametros.materia),
          fuero: uno(parametros.fuero),
        }}
        aviso={<Aviso error={error} hecho={hecho} />}
      />
    </div>
  );
}
