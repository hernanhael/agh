"use client";

import { useState } from "react";
import { Campo, claseBotonPrimario, claseEntrada } from "@/components/ui";
import { formatearCaratula, partirCaratula } from "@/lib/formato";
// Solo tipos y constantes: este módulo no toca la base ni el sistema de
// archivos, así que se puede importar desde un componente de cliente.
import {
  CENTROS_JUDICIALES,
  ESTADOS_EXPEDIENTE,
  FUEROS,
  ROLES_CLIENTE,
  type CentroJudicial,
  type Expediente,
  type TipoProceso,
} from "@/lib/datos/tipos";

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
  centroJudicialHabitual,
  acentuar,
  accion,
  textoBoton,
}: {
  expediente?: Expediente;
  tiposProceso: TipoProceso[];
  materias: string[];
  centroJudicialHabitual: CentroJudicial;
  acentuar: boolean;
  accion: (datos: FormData) => Promise<void>;
  textoBoton: string;
}) {
  const [tipoProcesoId, setTipoProcesoId] = useState(
    expediente?.tipoProcesoId ?? tiposProceso[0]?.id ?? "",
  );
  const [caratula, setCaratula] = useState(expediente?.caratula ?? "");

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
        <Campo etiqueta="Centro judicial" className="sm:col-span-2">
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
          <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
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
              <span className="rounded bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
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
            defaultValue={expediente?.fuero ?? FUEROS[0]}
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

      <Campo etiqueta="Notas">
        <textarea
          name="notas"
          rows={3}
          defaultValue={expediente?.notas ?? ""}
          className={claseEntrada}
        />
      </Campo>

      <div className="flex justify-end">
        <button type="submit" className={claseBotonPrimario}>
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
