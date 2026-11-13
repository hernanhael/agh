"use client";

import { ArrowLeft, ChevronDown, FileSearch, FolderPlus, Plus, Search, X } from "lucide-react";
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
import type { CampoFiltro } from "@/lib/datos/fueros";
import type { Expediente, TipoProceso } from "@/lib/datos/tipos";
import { FilaExpediente } from "./FilaExpediente";

/**
 * Listado de los expedientes de un fuero, con búsqueda y filtros.
 *
 * Recibe solo los expedientes del fuero, y los filtros que muestra son los que
 * el fuero define (`lib/datos/fueros`): cada fuero tiene su juego, y las
 * opciones de cada desplegable salen de sus propios expedientes.
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

/** Rótulo de cada filtro y de dónde salen sus opciones. */
const FILTROS: Record<
  CampoFiltro,
  { etiqueta: string; opciones: keyof ReturnType<typeof opcionesDeFiltro> }
> = {
  juzgado: { etiqueta: "Juzgado", opciones: "juzgados" },
  oga: { etiqueta: "OGA", opciones: "ogas" },
  estado: { etiqueta: "Estado", opciones: "estados" },
  materia: { etiqueta: "Materia", opciones: "materias" },
  etiqueta: { etiqueta: "Etiqueta", opciones: "etiquetas" },
};

export function ListadoExpedientes({
  fuero,
  expedientes,
  tipos,
  hoy,
  filtrosIniciales,
  aviso,
}: {
  /** El fuero que se está mirando: valor guardado, nombre y filtros propios. */
  fuero: { valor: string; nombre: string; filtros: CampoFiltro[] };
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
  // El alta desde un fuero llega con el fuero ya elegido.
  const enlaceNuevo = `/expedientes/nuevo?fuero=${encodeURIComponent(fuero.valor)}`;

  // La búsqueda queda en la URL para poder compartirla o volver a ella, pero se
  // escribe con `replaceState` y no con el router: no hace falta navegar si el
  // filtrado ya ocurrió acá.
  useEffect(() => {
    const parametros = new URLSearchParams();
    if (filtros.consulta.trim()) parametros.set("q", filtros.consulta.trim());
    // El nombre del filtro es también el del parámetro: ?juzgado=, ?oga=…
    for (const campo of fuero.filtros) {
      if (filtros[campo]) parametros.set(campo, filtros[campo]);
    }
    const cadena = parametros.toString();
    window.history.replaceState(null, "", cadena ? `?${cadena}` : window.location.pathname);
  }, [filtros, fuero.filtros]);

  function cambiar(campo: keyof Filtros, valor: string) {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-linea bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-8 pb-3 pt-7">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div>
              {/*
                La vuelta al panel de fueros, a la vista y con forma de botón:
                es la salida de esta pantalla y no un dato más del encabezado.
              */}
              <Link
                href="/expedientes"
                className="group -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-acento-suave hover:text-acento focus-visible:outline-2 focus-visible:outline-acento dark:text-zinc-400"
              >
                <ArrowLeft
                  aria-hidden
                  className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                Todos los fueros
              </Link>
              <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
                {fuero.nombre}
              </h1>
            </div>
            <Link href={enlaceNuevo} className={claseBotonAccion}>
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

            {fuero.filtros.map((campo) => (
              <SelectFiltro
                key={campo}
                etiqueta={FILTROS[campo].etiqueta}
                valor={filtros[campo]}
                opciones={opciones[FILTROS[campo].opciones]}
                onChange={(valor) => cambiar(campo, valor)}
              />
            ))}

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
              Se busca por número, carátula, actor, demandado, objeto, materia, juzgado, OGA y
              etiquetas.
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
              Todavía no hay expedientes en {fuero.nombre}.
            </p>
            <Link href={enlaceNuevo} className={`${claseBotonAccion} mt-3`}>
              <Plus aria-hidden className="size-4" />
              Cargar el primero
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
