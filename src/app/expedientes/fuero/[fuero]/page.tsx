import { notFound } from "next/navigation";
import { Aviso, mensajes } from "@/components/ui";
import { FILTROS_VACIOS, hoy, listarExpedientes, listarTiposProceso } from "@/lib/datos";
import { expedientesDelFuero, fueroPorSlug } from "@/lib/datos/fueros";
import { ListadoExpedientes } from "../../ListadoExpedientes";

/** Lee un parámetro de búsqueda que puede venir repetido. */
function uno(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

/**
 * Los expedientes de un fuero.
 *
 * El servidor trae solo los del fuero y el listado filtra en el cliente para
 * que la búsqueda responda en la misma tecla (`ListadoExpedientes`). Los
 * filtros que se ofrecen son los del fuero (`lib/datos/fueros`) y sus opciones
 * salen de sus propios expedientes: un juzgado de Familia no aparece en el
 * desplegable de Civil y Comercial.
 *
 * Los filtros iniciales se leen de la URL, así que un enlace con `?q=`,
 * `?estado=` o `?juzgado=` abre ya filtrado.
 *
 * El día de hoy se resuelve acá, en el servidor, y baja como dato: el semáforo
 * de caducidad de cada fila tiene que dar lo mismo en el HTML inicial y después
 * de la hidratación.
 */
export default async function FueroPage({
  params,
  searchParams,
}: PageProps<"/expedientes/fuero/[fuero]">) {
  const [{ fuero: slug }, parametros] = await Promise.all([params, searchParams]);
  const [todos, tipos] = await Promise.all([listarExpedientes(), listarTiposProceso()]);

  const fuero = fueroPorSlug(slug, todos);
  if (!fuero) notFound();

  const { error, hecho } = mensajes(parametros);

  return (
    <div className="flex min-h-full flex-col">
      <ListadoExpedientes
        key={fuero.slug}
        fuero={{ valor: fuero.valor, nombre: fuero.nombre, filtros: [...fuero.filtros] }}
        expedientes={expedientesDelFuero(todos, fuero)}
        tipos={tipos}
        hoy={hoy()}
        filtrosIniciales={{
          ...FILTROS_VACIOS,
          consulta: uno(parametros.q),
          estado: uno(parametros.estado),
          materia: uno(parametros.materia),
          juzgado: uno(parametros.juzgado),
          oga: uno(parametros.oga),
        }}
        aviso={<Aviso error={error} hecho={hecho} />}
      />
    </div>
  );
}
