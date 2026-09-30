"use client";

import { ChevronDown, FileSearch, FolderOpen, FolderPlus, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { claseBotonAccion, claseSelectFiltro, claseSelectFiltroActivo } from "@/components/ui";
// Módulos puros, no el barril `@/lib/datos`: este componente corre en el
// cliente y el barril arrastra el almacén, que usa `node:fs`.
import {
  aplicarFiltros,
  FILTROS_VACIOS,
  hayFiltros,
  opcionesDeFiltro,
  type Filtros,
  type OpcionFiltro,
} from "@/lib/datos/filtros";
import type { Expediente, TipoProceso } from "@/lib/datos/tipos";
import { FilaExpediente } from "./FilaExpediente";

/**
 * Listado de expedientes con búsqueda y filtros.
 *
 * Filtra **en el cliente**, sobre la lista que ya vino del servidor: el
 * resultado se actualiza en la misma tecla, sin ida y vuelta. Las reglas son
 * las de `lib/datos/filtros`, que es un módulo puro y por eso puede correr acá
 * y en el servidor con el mismo comportamiento.
 *
 * El día que el volumen lo pida, ese módulo se traduce a SQL y el listado
 * pagina; la interfaz no cambia.
 */

/** Desplegable de un filtro. Se marca cuando está filtrando. */
function SelectFiltro({
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  opciones: OpcionFiltro[];
  onChange: (valor: string) => void;
}) {
  if (opciones.length === 0) return null;
  const activo = valor !== "";

  return (
    <span className="relative inline-flex items-center">
      <select
        aria-label={etiqueta}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className={activo ? claseSelectFiltroActivo : claseSelectFiltro}
      >
        <option value="">{etiqueta}</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta} ({opcion.cantidad})
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className={`pointer-events-none absolute right-2 size-3 ${
          activo ? "text-acento" : "text-zinc-400 dark:text-zinc-500"
        }`}
      />
    </span>
  );
}

export function ListadoExpedientes({
  expedientes,
  tipos,
  hoy,
  filtrosIniciales,
  aviso,
}: {
  expedientes: Expediente[];
  tipos: TipoProceso[];
  /** Día de hoy en 'YYYY-MM-DD', para el semáforo de caducidad de cada fila. */
  hoy: string;
  filtrosIniciales: Filtros;
  /** Aviso de la acción anterior, renderizado en el servidor. */
  aviso?: ReactNode;
}) {
  const [filtros, setFiltros] = useState(filtrosIniciales);

  const opciones = useMemo(() => opcionesDeFiltro(expedientes), [expedientes]);
  const mostrados = useMemo(() => aplicarFiltros(expedientes, filtros), [expedientes, filtros]);
  const porId = useMemo(() => new Map(tipos.map((tipo) => [tipo.id, tipo])), [tipos]);
  const filtrando = hayFiltros(filtros);

  // La búsqueda queda en la URL para poder compartirla o volver a ella, pero se
  // escribe con `replaceState` y no con el router: no hace falta navegar si el
  // filtrado ya ocurrió acá.
  useEffect(() => {
    const parametros = new URLSearchParams();
    if (filtros.consulta.trim()) parametros.set("q", filtros.consulta.trim());
    if (filtros.estado) parametros.set("estado", filtros.estado);
    if (filtros.materia) parametros.set("materia", filtros.materia);
    if (filtros.fuero) parametros.set("fuero", filtros.fuero);
    if (filtros.juzgado) parametros.set("juzgado", filtros.juzgado);
    if (filtros.oga) parametros.set("oga", filtros.oga);
    const cadena = parametros.toString();
    window.history.replaceState(null, "", cadena ? `?${cadena}` : window.location.pathname);
  }, [filtros]);

  function cambiar(campo: keyof Filtros, valor: string) {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-linea bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-8 pb-3 pt-7">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <FolderOpen aria-hidden className="size-4 text-zinc-400 dark:text-zinc-500" />
              <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Expedientes
              </h1>
            </div>
            <Link href="/expedientes/nuevo" className={claseBotonAccion}>
              <Plus aria-hidden className="size-4" />
              Nuevo expediente
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="relative flex-1 basis-72">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
              <input
                type="search"
                value={filtros.consulta}
                onChange={(evento) => cambiar("consulta", evento.target.value)}
                placeholder="Buscar por número, actor, demandado u objeto"
                aria-label="Buscar expedientes"
                className="w-full rounded-md border border-linea bg-superficie py-1.5 pl-8 pr-8 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-acento focus:outline-none focus:ring-1 focus:ring-acento dark:text-zinc-50 dark:placeholder:text-zinc-500"
              />
              {filtros.consulta ? (
                <button
                  type="button"
                  onClick={() => cambiar("consulta", "")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </span>

            <SelectFiltro
              etiqueta="Juzgado"
              valor={filtros.juzgado}
              opciones={opciones.juzgados}
              onChange={(valor) => cambiar("juzgado", valor)}
            />
            <SelectFiltro
              etiqueta="OGA"
              valor={filtros.oga}
              opciones={opciones.ogas}
              onChange={(valor) => cambiar("oga", valor)}
            />
            <SelectFiltro
              etiqueta="Estado"
              valor={filtros.estado}
              opciones={opciones.estados}
              onChange={(valor) => cambiar("estado", valor)}
            />
            <SelectFiltro
              etiqueta="Materia"
              valor={filtros.materia}
              opciones={opciones.materias}
              onChange={(valor) => cambiar("materia", valor)}
            />
            <SelectFiltro
              etiqueta="Fuero"
              valor={filtros.fuero}
              opciones={opciones.fueros}
              onChange={(valor) => cambiar("fuero", valor)}
            />

            {filtrando ? (
              <>
                <span className="rotulo text-zinc-400 dark:text-zinc-500">
                  {mostrados.length} de {expedientes.length}
                </span>
                <button
                  type="button"
                  onClick={() => setFiltros(FILTROS_VACIOS)}
                  className="rounded px-1 text-xs text-zinc-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Limpiar
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-8 py-6">
        {aviso}
        {mostrados.length > 0 ? (
          <ul className="space-y-2.5">
            {mostrados.map((expediente, orden) => (
              <FilaExpediente
                key={expediente.id}
                expediente={expediente}
                tipo={porId.get(expediente.tipoProcesoId)}
                hoy={hoy}
                orden={orden}
              />
            ))}
          </ul>
        ) : expedientes.length > 0 ? (
          <div className="rounded-lg border border-dashed border-linea-fuerte px-4 py-14 text-center">
            <FileSearch aria-hidden className="mx-auto size-7 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Ningún expediente coincide con la búsqueda.
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Se busca por número, carátula, actor, demandado, objeto, materia, juzgado y OGA.
            </p>
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_VACIOS)}
              className="mt-4 text-sm text-acento underline decoration-1 underline-offset-4"
            >
              Quitar los filtros
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-linea-fuerte px-4 py-14 text-center">
            <FolderPlus aria-hidden className="mx-auto size-7 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              Todavía no hay expedientes.
            </p>
            <Link href="/expedientes/nuevo" className={`${claseBotonAccion} mt-3`}>
              <Plus aria-hidden className="size-4" />
              Cargar el primero
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
