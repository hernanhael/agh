import {
  Aviso,
  Campo,
  claseBotonPrimario,
  claseEntrada,
  claseTarjeta,
  Encabezado,
  mensajes,
} from "@/components/ui";
import { CENTROS_JUDICIALES, MODELOS, obtenerEstudio } from "@/lib/datos";
import { guardarEstudio } from "../acciones";

export default async function EstudioPage({
  searchParams,
}: PageProps<"/configuracion/estudio">) {
  const estudio = await obtenerEstudio();
  const { error, hecho } = mensajes(await searchParams);

  return (
    <>
      <Encabezado
        titulo="Estudio"
        descripcion="Datos del abogado, que encabezan los escritos, y preferencias generales del sistema."
      />
      <Aviso error={error} hecho={hecho} />

      <form action={guardarEstudio} className={`${claseTarjeta} space-y-6`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre y apellido">
            <input
              name="nombre"
              defaultValue={estudio.nombre}
              placeholder="Hernán Rogel"
              className={claseEntrada}
            />
          </Campo>
          <Campo etiqueta="Matrícula">
            <input
              name="matricula"
              defaultValue={estudio.matricula}
              placeholder="CAT 1234"
              className={claseEntrada}
            />
          </Campo>
          <Campo etiqueta="CUIT">
            <input
              name="cuit"
              defaultValue={estudio.cuit}
              placeholder="20-12345678-9"
              className={claseEntrada}
            />
          </Campo>
          <Campo etiqueta="Teléfono">
            <input name="telefono" defaultValue={estudio.telefono} className={claseEntrada} />
          </Campo>
          <Campo
            etiqueta="Domicilio electrónico"
            ayuda="El del Portal del SAE, donde se reciben las notificaciones."
            className="sm:col-span-2"
          >
            <input
              name="domicilioElectronico"
              type="email"
              defaultValue={estudio.domicilioElectronico}
              className={claseEntrada}
            />
          </Campo>
        </div>

        <div className="grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-2 dark:border-zinc-800">
          <Campo
            etiqueta="Centro judicial habitual"
            ayuda="Se propone al dar de alta un expediente."
          >
            <select
              name="centroJudicialHabitual"
              defaultValue={estudio.centroJudicialHabitual}
              className={claseEntrada}
            >
              {CENTROS_JUDICIALES.map((centro) => (
                <option key={centro.valor} value={centro.valor}>
                  {centro.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Modelo por defecto" ayuda="Para los agentes nuevos.">
            <select
              name="modeloPorDefecto"
              defaultValue={estudio.modeloPorDefecto}
              className={claseEntrada}
            >
              {MODELOS.map((modelo) => (
                <option key={modelo.valor} value={modelo.valor}>
                  {modelo.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Presentación del texto
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Todo lo que cargás (y lo que se importe del Portal del SAE) se guarda con formato
            uniforme: mayúsculas donde corresponde, espacios y signos de puntuación normalizados.
            Esto no se puede desactivar porque no admite ambigüedad.
          </p>
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              name="correccionDeTildes"
              defaultChecked={estudio.correccionDeTildes}
              className="mt-0.5 size-4 rounded border-zinc-300 dark:border-zinc-700"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Corregir tildes faltantes
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                En nombres y títulos: &ldquo;NICOLAS ROGEL&rdquo; se guarda como &ldquo;Nicolás
                Rogel&rdquo;. Desactivalo si trabajás con apellidos que van sin tilde. En las notas
                y los textos libres nunca se corrige la ortografía de las palabras.
              </span>
            </span>
          </label>
        </div>

        <div className="flex justify-end border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <button type="submit" className={claseBotonPrimario}>
            Guardar
          </button>
        </div>
      </form>
    </>
  );
}
