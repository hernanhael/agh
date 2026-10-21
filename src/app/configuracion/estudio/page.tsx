import {
  Aviso,
  Campo,
  claseBotonPrimario,
  claseEntrada,
  claseTarjeta,
  Encabezado,
  mensajes,
} from "@/components/ui";
import {
  CENTROS_JUDICIALES,
  FUENTES_ESCRITO,
  INTERLINEADOS,
  MODELOS,
  obtenerEstudio,
} from "@/lib/datos";
import { formatoVigente } from "@/lib/escritos";
import { guardarEstudio } from "../acciones";

/** Una preferencia de sí o no, con su explicación al lado de la casilla. */
function Opcion({
  campo,
  marcado,
  titulo,
  detalle,
}: {
  campo: string;
  marcado: boolean;
  titulo: string;
  detalle: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={campo}
        defaultChecked={marcado}
        className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 dark:border-zinc-700"
      />
      <span>
        <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {titulo}
        </span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-500">{detalle}</span>
      </span>
    </label>
  );
}

export default async function EstudioPage({
  searchParams,
}: PageProps<"/configuracion/estudio">) {
  const estudio = await obtenerEstudio();
  const formato = formatoVigente(estudio.formatoEscrito);
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

        <div className="grid gap-4 border-t border-linea pt-6 sm:grid-cols-2">
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

        <div className="border-t border-linea pt-6">
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

        <div className="border-t border-linea pt-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Formato de los escritos
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Con esta forma se componen los escritos que se redactan en la historia del
            expediente: la hoja es A4 y el encabezado sale de los datos del expediente y de los de
            arriba. Lo que se ve en pantalla es lo que sale impreso.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Tipo de letra">
              <select name="fuente" defaultValue={formato.fuente} className={claseEntrada}>
                {FUENTES_ESCRITO.map((fuente) => (
                  <option key={fuente} value={fuente}>
                    {fuente}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Tamaño" ayuda="En puntos.">
              <input
                type="number"
                name="tamanio"
                min={8}
                max={18}
                step={0.5}
                defaultValue={formato.tamanio}
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Interlineado">
              <select
                name="interlineado"
                defaultValue={formato.interlineado}
                className={claseEntrada}
              >
                {INTERLINEADOS.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Campo etiqueta="Margen superior" ayuda="En cm.">
              <input
                type="number"
                name="margenSuperior"
                min={0}
                max={8}
                step={0.5}
                defaultValue={formato.margenSuperior}
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Margen inferior" ayuda="En cm.">
              <input
                type="number"
                name="margenInferior"
                min={0}
                max={8}
                step={0.5}
                defaultValue={formato.margenInferior}
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Margen izquierdo" ayuda="Ancho, para el cosido.">
              <input
                type="number"
                name="margenIzquierdo"
                min={0}
                max={8}
                step={0.5}
                defaultValue={formato.margenIzquierdo}
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Margen derecho" ayuda="En cm.">
              <input
                type="number"
                name="margenDerecho"
                min={0}
                max={8}
                step={0.5}
                defaultValue={formato.margenDerecho}
                className={claseEntrada}
              />
            </Campo>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Sangría de párrafo" ayuda="En cm. Cero la saca.">
              <input
                type="number"
                name="sangria"
                min={0}
                max={4}
                step={0.25}
                defaultValue={formato.sangria}
                className={claseEntrada}
              />
            </Campo>
            <Campo etiqueta="Tamaño de la carátula" ayuda="En puntos, en el encabezado.">
              <input
                type="number"
                name="caratulaTamanio"
                min={8}
                max={18}
                step={0.5}
                defaultValue={formato.caratulaTamanio}
                className={claseEntrada}
              />
            </Campo>
          </div>

          <div className="mt-4 space-y-2">
            <Opcion
              campo="textoJustificado"
              marcado={formato.textoJustificado}
              titulo="Texto justificado"
              detalle="Los párrafos del cuerpo llegan parejos a los dos márgenes."
            />
            <Opcion
              campo="caratulaNegrita"
              marcado={formato.caratulaNegrita}
              titulo="Carátula en negrita"
              detalle="En el encabezado del escrito."
            />
            <Opcion
              campo="caratulaMayusculas"
              marcado={formato.caratulaMayusculas}
              titulo="Carátula en mayúsculas"
              detalle="Se muestra en mayúsculas sin cambiar cómo está guardada."
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-linea pt-6">
          <button type="submit" className={claseBotonPrimario}>
            Guardar
          </button>
        </div>
      </form>
    </>
  );
}
