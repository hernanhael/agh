import {
  claseBotonPeligro,
  claseSeparador,
  Dato,
  Grupo,
  Marca,
  Pendientes,
} from "@/components/ui";
import {
  CENTROS_JUDICIALES,
  CLASES_EXPEDIENTE,
  ESTADOS_EXPEDIENTE,
  etiquetaDe,
  hoy,
  identificador,
  listarMaterias,
  listarRadicaciones,
  listarTiposProcesoActivos,
  nombreJuzgado,
  obtenerEstudio,
  ROLES_CLIENTE,
} from "@/lib/datos";
import { formatoFecha } from "@/lib/plazos";
import { claseDeExpediente } from "@/lib/procesal";
import { borrarExpediente, guardarExpediente } from "../../acciones";
import { FormularioExpediente } from "../../FormularioExpediente";
import { cargarExpediente, cargarTipoProceso } from "../cargar";

/**
 * Pestaña **Datos**: los metadatos del expediente y el formulario para
 * editarlos (docs/02-expedientes.md §2.1).
 *
 * Se leen por grupos, en el orden en que el abogado los usa: con qué número se
 * identifica, dónde tramita, cómo está encuadrado y qué fechas tiene. Lo que
 * describe a las partes está en su propia pestaña y el estado de la causa en
 * Resumen; acá queda la ficha.
 */

/** Las marcas de tiempo del almacén son ISO completas: alcanza el día. */
function dia(marca: string): string {
  return formatoFecha(marca.slice(0, 10));
}

export default async function DatosExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/datos">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const [tipo, tiposActivos, materias, radicaciones, estudio] = await Promise.all([
    cargarTipoProceso(expediente.tipoProcesoId),
    listarTiposProcesoActivos(),
    listarMaterias(),
    listarRadicaciones(),
    obtenerEstudio(),
  ]);

  const etapa = tipo?.etapas.find((candidata) => candidata.clave === expediente.etapaActual);
  const clase = claseDeExpediente(expediente);
  const detalleClase = CLASES_EXPEDIENTE.find((candidata) => candidata.valor === clase)?.detalle;
  const juzgado = nombreJuzgado(expediente);
  // Si el tipo de proceso está desactivado, se agrega igual a la lista del
  // formulario para no cambiárselo sin querer al guardar.
  const tiposDisponibles =
    tipo && !tiposActivos.some((candidato) => candidato.id === tipo.id)
      ? [tipo, ...tiposActivos]
      : tiposActivos;

  return (
    <>
      <Grupo titulo="Identificación">
        <Dato rotulo="Número y año">{identificador(expediente)}</Dato>
        <Dato rotulo="Clase">
          {etiquetaDe(CLASES_EXPEDIENTE, clase)}
          {detalleClase ? (
            <span className="block text-xs text-zinc-500 dark:text-zinc-500">{detalleClase}</span>
          ) : null}
        </Dato>
        <Dato rotulo="Tipo de proceso">{tipo?.nombre}</Dato>
      </Grupo>

      <Grupo titulo="Radicación" className={claseSeparador}>
        <Dato rotulo="Centro judicial">
          {etiquetaDe(CENTROS_JUDICIALES, expediente.centroJudicial)}
        </Dato>
        <Dato rotulo="Fuero">{expediente.fuero}</Dato>
        <Dato rotulo="Juzgado">{juzgado}</Dato>
        <Dato rotulo="Oficina de Gestión Asociada">{expediente.oficinaGestion}</Dato>
      </Grupo>

      <Grupo titulo="Encuadre" className={claseSeparador}>
        <Dato rotulo="Materia">{expediente.materia}</Dato>
        <Dato rotulo="Rol del cliente">{etiquetaDe(ROLES_CLIENTE, expediente.rolCliente)}</Dato>
        <Dato rotulo="Estado">{etiquetaDe(ESTADOS_EXPEDIENTE, expediente.estado)}</Dato>
      </Grupo>

      <Grupo titulo="Fechas" className={claseSeparador}>
        <Dato rotulo="Alta en el sistema">{dia(expediente.creadoEn)}</Dato>
        <Dato rotulo="Etapa actual desde">
          {expediente.etapaDesde ? (
            <>
              {formatoFecha(expediente.etapaDesde)}
              {etapa ? (
                <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                  {etapa.nombre}
                </span>
              ) : null}
            </>
          ) : undefined}
        </Dato>
        <Dato rotulo="Último movimiento">
          {expediente.ultimoMovimiento ? formatoFecha(expediente.ultimoMovimiento) : undefined}
        </Dato>
        <Dato rotulo="Caducidad declarada">
          {expediente.caducidadDeclarada
            ? formatoFecha(expediente.caducidadDeclarada)
            : undefined}
        </Dato>
        <Dato rotulo="Última modificación">{dia(expediente.actualizadoEn)}</Dato>
      </Grupo>

      {expediente.notas ? (
        <section className={claseSeparador}>
          <h3 className="rotulo text-zinc-500 dark:text-zinc-500">Notas</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
            {expediente.notas}
          </p>
        </section>
      ) : null}

      <Pendientes
        items={[
          "Fecha de inicio y el resto de las fechas clave: inicio de mediación, demanda, radicación, sentencia y firmeza (§2.1).",
          "Monto reclamado o base regulatoria, con moneda y fecha.",
          "Etiquetas para agrupar expedientes.",
          "Juzgado y secretaría tomados del catálogo de Configuración, en lugar de dos campos libres.",
          "Baja lógica y archivo: hoy borrar un expediente es definitivo.",
        ]}
      />

      <details className={claseSeparador}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Editar expediente
        </summary>
        <div className="mt-4 border-t border-linea pt-4">
          <FormularioExpediente
            expediente={expediente}
            tiposProceso={tiposDisponibles}
            materias={materias}
            radicaciones={radicaciones}
            centroJudicialHabitual={estudio.centroJudicialHabitual}
            hoy={hoy()}
            acentuar={estudio.correccionDeTildes}
            accion={guardarExpediente}
            textoBoton="Guardar cambios"
          />
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-linea pt-4">
          <form action={borrarExpediente}>
            <input type="hidden" name="id" value={expediente.id} />
            <button type="submit" className={claseBotonPeligro}>
              Borrar expediente
            </button>
          </form>
          <Marca tono="aviso">No se puede deshacer</Marca>
        </div>
      </details>
    </>
  );
}
