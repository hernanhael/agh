"use client";

import { useState } from "react";
import { Campo, claseBotonPrimario, claseEntrada, claseEtapa } from "@/components/ui";
import { importeParaEditar } from "@/lib/contabilidad/importe";
import { formatearCaratula, normalizarParaBuscar, partirCaratula } from "@/lib/formato";
// Solo tipos y constantes: este módulo no toca la base ni el sistema de
// archivos, así que se puede importar desde un componente de cliente.
import {
  CENTROS_JUDICIALES,
  CLASES_EXPEDIENTE,
  CONCEPTOS_MONTO,
  ESTADOS_EXPEDIENTE,
  FECHAS_CLAVE,
  FUEROS,
  MONEDAS,
  ROLES_CLIENTE,
  TIPOS_AUDIENCIA,
  type CentroJudicial,
  type Expediente,
  type TipoProceso,
} from "@/lib/datos/tipos";
import { MESES_SIN_MOVIMIENTO } from "@/lib/procesal";

/**
 * Formulario de alta y edición de un expediente.
 *
 * Es un componente de cliente por dos motivos:
 *
 * 1. Las etapas que se ofrecen dependen del **tipo de proceso** elegido, que
 *    es lo primero que define el abogado al dar de alta
 *    (docs/02-expedientes.md §2.1).
 * 2. La carátula se previsualiza mientras se escribe, con el mismo módulo puro
 *    que después la normaliza en el servidor: lo que se ve es exactamente lo
 *    que se va a guardar.
 */
export function FormularioExpediente({
  expediente,
  tiposProceso,
  materias,
  radicaciones,
  etiquetasConocidas = [],
  centroJudicialHabitual,
  hoy,
  acentuar,
  accion,
  textoBoton,
  fueroInicial,
}: {
  expediente?: Expediente;
  tiposProceso: TipoProceso[];
  materias: string[];
  /** Juzgados, nominaciones y OGA que ya se usaron, para sugerirlos. */
  radicaciones: { juzgados: string[]; nominaciones: string[]; oficinasGestion: string[] };
  /** Etiquetas que ya se usan en otros expedientes, para sumarlas con un clic. */
  etiquetasConocidas?: string[];
  centroJudicialHabitual: CentroJudicial;
  /** Día de hoy en 'YYYY-MM-DD': es el último movimiento de un expediente nuevo. */
  hoy: string;
  acentuar: boolean;
  accion: (datos: FormData) => Promise<void>;
  textoBoton: string;
  /** Fuero elegido de entrada en un alta: el del listado desde el que se llegó. */
  fueroInicial?: string;
}) {
  const [tipoProcesoId, setTipoProcesoId] = useState(
    expediente?.tipoProcesoId ?? tiposProceso[0]?.id ?? "",
  );
  const [caratula, setCaratula] = useState(expediente?.caratula ?? "");
  const [etiquetas, setEtiquetas] = useState((expediente?.etiquetas ?? []).join(", "));

  // Las etiquetas escritas, comparables, para no ofrecer las que ya están.
  const escritas = new Set(
    etiquetas
      .split(/[,;\n]/)
      .map((etiqueta) => normalizarParaBuscar(etiqueta))
      .filter(Boolean),
  );
  const sugeridas = etiquetasConocidas.filter(
    (etiqueta) => !escritas.has(normalizarParaBuscar(etiqueta)),
  );

  function sumarEtiqueta(etiqueta: string) {
    setEtiquetas((actuales) => {
      const previas = actuales.trim().replace(/,$/, "");
      return previas ? `${previas}, ${etiqueta}` : etiqueta;
    });
  }

  const tipoElegido = tiposProceso.find((tipo) => tipo.id === tipoProcesoId);
  const partes = partirCaratula(caratula);
  const formateada = formatearCaratula(caratula, { acentuar });
  const cambia = formateada !== caratula.trim() && caratula.trim() !== "";

  return (
    <form action={accion} className="space-y-6">
      {expediente ? <input type="hidden" name="id" value={expediente.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-4">
        <Campo etiqueta="Número">
          <input
            name="numero"
            defaultValue={expediente?.numero ?? ""}
            placeholder="1234"
            inputMode="numeric"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Año" ayuda="Dos dígitos.">
          <input
            name="anio"
            defaultValue={expediente?.anio ?? ""}
            placeholder="26"
            inputMode="numeric"
            required
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Centro Judicial" className="sm:col-span-2">
          <select
            name="centroJudicial"
            defaultValue={expediente?.centroJudicial ?? centroJudicialHabitual}
            className={claseEntrada}
          >
            {CENTROS_JUDICIALES.map((centro) => (
              <option key={centro.valor} value={centro.valor}>
                {centro.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {/*
        Radicación. Son tres campos libres con sugerencias y no una referencia a
        un catálogo porque el de juzgados y secretarías de Configuración
        (`courts`) todavía no existe: cuando exista, este bloque pasa a ser un
        solo desplegable y el juzgado trae su OGA.
      */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo
          etiqueta="Juzgado"
          ayuda="Tipo de juzgado, sin la nominación."
          className="sm:col-span-2"
        >
          <input
            name="juzgadoTipo"
            list="juzgados-conocidos"
            defaultValue={expediente?.juzgadoTipo ?? ""}
            placeholder="Civil y Comercial Común"
            className={claseEntrada}
          />
          <datalist id="juzgados-conocidos">
            {[...new Set([...FUEROS, ...radicaciones.juzgados])].map((juzgado) => (
              <option key={juzgado} value={juzgado} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Nominación" ayuda="Como la nombra el SAE: VI.">
          <input
            name="juzgadoNumero"
            list="nominaciones-conocidas"
            defaultValue={expediente?.juzgadoNumero ?? ""}
            placeholder="VI"
            className={claseEntrada}
          />
          <datalist id="nominaciones-conocidas">
            {radicaciones.nominaciones.map((nominacion) => (
              <option key={nominacion} value={nominacion} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Oficina de Gestión Asociada">
          <input
            name="oficinaGestion"
            list="ogas-conocidas"
            defaultValue={expediente?.oficinaGestion ?? ""}
            placeholder="OGA Civil Capital"
            className={claseEntrada}
          />
          <datalist id="ogas-conocidas">
            {radicaciones.oficinasGestion.map((oga) => (
              <option key={oga} value={oga} />
            ))}
          </datalist>
        </Campo>
      </div>

      <div>
        <Campo
          etiqueta="Carátula"
          ayuda="Escribila o pegala del Portal del SAE, como venga. El sistema la formatea."
        >
          <input
            name="caratula"
            value={caratula}
            onChange={(evento) => setCaratula(evento.target.value)}
            placeholder="NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y Perjuicios"
            required
            className={claseEntrada}
          />
        </Campo>

        {caratula.trim() ? (
          <div className="mt-2 rounded-md border border-linea bg-background p-3">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
              {cambia ? "Se va a guardar así" : "Así se guarda"}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formateada}
            </p>
            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500">
              <div>
                <dt className="inline font-medium">Actor: </dt>
                <dd className="inline">{partes.actor || "—"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Demandado: </dt>
                <dd className="inline">{partes.demandado || "—"}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Objeto: </dt>
                <dd className="inline">{partes.objeto || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Tipo de proceso"
          ayuda="Define las etapas del expediente. Se configura en Configuración → Tipos de proceso."
        >
          <select
            name="tipoProcesoId"
            value={tipoProcesoId}
            onChange={(evento) => setTipoProcesoId(evento.target.value)}
            required
            className={claseEntrada}
          >
            <option value="">Elegir…</option>
            {tiposProceso.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Etapa actual"
          ayuda={
            tipoElegido && tipoElegido.etapas.length === 0
              ? "Este tipo de proceso todavía no tiene etapas."
              : "Por defecto, la primera del tipo de proceso."
          }
        >
          <select
            name="etapaActual"
            key={tipoProcesoId}
            defaultValue={expediente?.etapaActual ?? ""}
            disabled={!tipoElegido || tipoElegido.etapas.length === 0}
            className={claseEntrada}
          >
            {(tipoElegido?.etapas ?? []).map((etapa) => (
              <option key={etapa.clave} value={etapa.clave}>
                {etapa.orden}. {etapa.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {tipoElegido && tipoElegido.etapas.length > 0 ? (
        <ol className="flex flex-wrap items-center gap-1 text-xs">
          {tipoElegido.etapas.map((etapa, indice) => (
            <li key={etapa.clave} className="flex items-center gap-1">
              {indice > 0 ? <span className="text-zinc-400">→</span> : null}
              <span className={claseEtapa}>
                {etapa.nombre}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fuero">
          <select
            name="fuero"
            defaultValue={
              expediente?.fuero ??
              (fueroInicial && FUEROS.includes(fueroInicial) ? fueroInicial : FUEROS[0])
            }
            className={claseEntrada}
          >
            {FUEROS.map((fuero) => (
              <option key={fuero} value={fuero}>
                {fuero}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Materia" ayuda="Sirve para sugerir agentes por especialidad.">
          <input
            name="materia"
            list="materias-conocidas"
            defaultValue={expediente?.materia ?? partes.objeto}
            placeholder="Daños y Perjuicios"
            className={claseEntrada}
          />
          <datalist id="materias-conocidas">
            {materias.map((materia) => (
              <option key={materia} value={materia} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Rol del cliente">
          <select
            name="rolCliente"
            defaultValue={expediente?.rolCliente ?? "actor"}
            className={claseEntrada}
          >
            {ROLES_CLIENTE.map((rol) => (
              <option key={rol.valor} value={rol.valor}>
                {rol.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Estado">
          <select
            name="estado"
            defaultValue={expediente?.estado ?? "en_tramite"}
            className={claseEntrada}
          >
            {ESTADOS_EXPEDIENTE.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {/*
        Caducidad de instancia. El sistema no guarda "en trámite / para
        caducidad / caduco": lo deduce de estos tres campos, que son hechos
        (`lib/procesal/caducidad`). El último movimiento lo va a escribir la
        historia del expediente cuando exista; hasta entonces se carga acá.
      */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Clase"
          ayuda={`El principal caduca a los ${MESES_SIN_MOVIMIENTO.principal} meses sin movimiento; los incidentes, a los ${MESES_SIN_MOVIMIENTO.incidente}.`}
        >
          <select
            name="clase"
            defaultValue={expediente?.clase ?? "principal"}
            className={claseEntrada}
          >
            {CLASES_EXPEDIENTE.map((clase) => (
              <option key={clase.valor} value={clase.valor}>
                {clase.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Último movimiento" ayuda="De acá se cuenta la caducidad.">
          <input
            type="date"
            name="ultimoMovimiento"
            defaultValue={expediente?.ultimoMovimiento ?? hoy}
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Caducidad declarada" ayuda="Solo si el juzgado la declaró.">
          <input
            type="date"
            name="caducidadDeclarada"
            defaultValue={expediente?.caducidadDeclarada ?? ""}
            className={claseEntrada}
          />
        </Campo>
      </div>

      {/* Audiencia fijada. Sin fecha no se guarda ni el tipo ni la hora. */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo etiqueta="Audiencia fijada" ayuda="Tipo de audiencia." className="sm:col-span-2">
          <input
            name="audienciaTipo"
            list="audiencias-conocidas"
            defaultValue={expediente?.audienciaTipo ?? ""}
            placeholder="Audiencia Preliminar"
            className={claseEntrada}
          />
          <datalist id="audiencias-conocidas">
            {TIPOS_AUDIENCIA.map((audiencia) => (
              <option key={audiencia} value={audiencia} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Fecha">
          <input
            type="date"
            name="audienciaFecha"
            defaultValue={expediente?.audienciaFecha ?? ""}
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Hora">
          <input
            type="time"
            name="audienciaHora"
            defaultValue={expediente?.audienciaHora ?? ""}
            className={claseEntrada}
          />
        </Campo>
      </div>

      {/*
        Fechas clave de la causa. Son mojones para tener a mano: no mueven la
        etapa ni el último movimiento, que tienen sus propios campos.
      */}
      <fieldset>
        <legend className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Fechas clave
        </legend>
        <div className="mt-1 grid gap-4 sm:grid-cols-5">
          {FECHAS_CLAVE.map(({ campo, etiqueta }) => (
            <Campo key={campo} etiqueta={etiqueta}>
              <input
                type="date"
                name={campo}
                defaultValue={expediente?.[campo] ?? ""}
                className={claseEntrada}
              />
            </Campo>
          ))}
        </div>
      </fieldset>

      {/*
        Monto del juicio. Se escribe como se escribe en Argentina —"1.234.567,89"—
        y se guarda en centavos, como los importes de la contabilidad. La fecha
        importa: un monto de 2026 no se compara con uno de 2029 sin reexpresarlo.
      */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Campo etiqueta="Monto" ayuda="Vacío si no hay monto.">
          <input
            name="monto"
            defaultValue={
              expediente?.montoCentavos !== undefined
                ? importeParaEditar(expediente.montoCentavos)
                : ""
            }
            placeholder="1.500.000,00"
            inputMode="decimal"
            className={claseEntrada}
          />
        </Campo>
        <Campo etiqueta="Qué es">
          <select
            name="montoConcepto"
            defaultValue={expediente?.montoConcepto ?? "reclamado"}
            className={claseEntrada}
          >
            {CONCEPTOS_MONTO.map((concepto) => (
              <option key={concepto.valor} value={concepto.valor}>
                {concepto.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Moneda">
          <select name="moneda" defaultValue={expediente?.moneda ?? "ARS"} className={claseEntrada}>
            {MONEDAS.map((moneda) => (
              <option key={moneda.valor} value={moneda.valor}>
                {moneda.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Al día" ayuda="Si queda vacía, la de hoy.">
          <input
            type="date"
            name="montoFecha"
            defaultValue={expediente?.montoFecha ?? ""}
            className={claseEntrada}
          />
        </Campo>
      </div>

      {/*
        Etiquetas libres, separadas por coma. Las que ya se usan en otros
        expedientes se suman con un clic: escribir "Urgente" en uno y "urgentes"
        en otro partiría el grupo en dos.
      */}
      <div>
        <Campo etiqueta="Etiquetas" ayuda="Separadas por coma. Sirven para agrupar y filtrar el listado.">
          <input
            name="etiquetas"
            value={etiquetas}
            onChange={(evento) => setEtiquetas(evento.target.value)}
            placeholder="Urgente, Cliente ART"
            className={claseEntrada}
          />
        </Campo>
        {sugeridas.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-zinc-500 dark:text-zinc-500">Ya usadas:</span>
            {sugeridas.map((etiqueta) => (
              <button
                key={etiqueta}
                type="button"
                onClick={() => sumarEtiqueta(etiqueta)}
                className="rounded-full border border-linea-fuerte px-2 py-0.5 text-xs text-zinc-600 transition-colors hover:border-acento hover:text-acento dark:text-zinc-400"
              >
                + {etiqueta}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/*
        La nota de un expediente que ya existe se edita en la ficha, con un
        clic y con formato (`NotaExpediente`). Acá viaja en un campo oculto y
        no en un `textarea` por dos razones: dos editores del mismo campo se
        pisan —el último en guardar gana—, y este mostraría las marcas de
        formato en crudo y las devolvería como texto plano.

        Oculto pero presente: la acción arma la entrada completa desde el
        formulario, así que si el campo no viajara, guardar cualquier otro dato
        borraría la nota.

        En el alta sí es un `textarea`: todavía no hay ficha donde hacer el
        clic, y una nota recién escrita no tiene formato que perder.
      */}
      {expediente ? (
        <input type="hidden" name="notas" value={expediente.notas} />
      ) : (
        <Campo etiqueta="Notas" ayuda="Después se edita desde la ficha, con formato.">
          <textarea name="notas" rows={3} defaultValue="" className={claseEntrada} />
        </Campo>
      )}

      <div className="flex justify-end">
        <button type="submit" className={claseBotonPrimario}>
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
