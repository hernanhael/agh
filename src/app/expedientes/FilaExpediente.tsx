import Link from "next/link";
// Se importa de los módulos puros y no del barril `@/lib/datos`, que arrastra
// el almacén y con él `node:fs`: esta fila se renderiza también en el cliente.
import { etiquetaEstado, identificador } from "@/lib/datos/filtros";
import {
  CENTROS_JUDICIALES,
  type EstadoExpediente,
  type Expediente,
  type TipoProceso,
} from "@/lib/datos/tipos";

/**
 * Una fila del registro de expedientes.
 *
 * Tres niveles de lectura, de arriba abajo: identificación (número, juzgado,
 * estado), identidad de la causa (la carátula, en serif, que es lo que el
 * abogado reconoce de un vistazo) y situación procesal (tipo de proceso, etapa
 * y avance).
 */

/**
 * Color por estado, en el punto y en la etiqueta. Es semántico, no decorativo:
 * el rojo está reservado para "paralizado", que es el que implica riesgo de
 * caducidad de instancia (docs/02-expedientes.md §2.9).
 */
const ESTILO_ESTADO: Record<EstadoExpediente, { punto: string; texto: string }> = {
  en_mediacion: { punto: "bg-sky-500", texto: "text-sky-700 dark:text-sky-400" },
  en_tramite: { punto: "bg-emerald-500", texto: "text-emerald-700 dark:text-emerald-400" },
  suspendido: { punto: "bg-amber-500", texto: "text-amber-700 dark:text-amber-400" },
  con_sentencia: { punto: "bg-indigo-500", texto: "text-indigo-700 dark:text-indigo-400" },
  en_ejecucion: { punto: "bg-violet-500", texto: "text-violet-700 dark:text-violet-400" },
  archivado: { punto: "bg-zinc-400", texto: "text-zinc-500 dark:text-zinc-400" },
  paralizado: { punto: "bg-rose-500", texto: "text-rose-700 dark:text-rose-400" },
};

function etiquetaCentro(centro: string): string {
  return CENTROS_JUDICIALES.find((candidato) => candidato.valor === centro)?.etiqueta ?? centro;
}

/** Los conectores "c/" y "s/" en itálica y apagados: separan, no compiten. */
function Conector({ children }: { children: string }) {
  return <span className="font-normal italic text-zinc-400 dark:text-zinc-500"> {children} </span>;
}

/** Una parte del juicio: actor o demandado, sin distinción entre ellas. */
function Parte({ nombre }: { nombre: string }) {
  return <span className="font-semibold">{nombre}</span>;
}

/**
 * La carátula con su estructura visible. Se arma desde los tres componentes
 * guardados; si un expediente viejo no los tiene, se muestra el texto entero.
 */
function Caratula({ expediente }: { expediente: Expediente }) {
  if (!expediente.actor) return <>{expediente.caratula}</>;
  return (
    <>
      <Parte nombre={expediente.actor} />
      {expediente.demandado ? (
        <>
          <Conector>c/</Conector>
          <Parte nombre={expediente.demandado} />
        </>
      ) : null}
      {expediente.objeto ? (
        <>
          <Conector>s/</Conector>
          <span className="font-normal text-zinc-600 dark:text-zinc-400">{expediente.objeto}</span>
        </>
      ) : null}
    </>
  );
}

export function FilaExpediente({
  expediente,
  tipo,
  orden,
}: {
  expediente: Expediente;
  tipo: TipoProceso | undefined;
  /** Posición en la lista, para escalonar la entrada. */
  orden: number;
}) {
  const estilo = ESTILO_ESTADO[expediente.estado] ?? ESTILO_ESTADO.en_tramite;
  const etapa = tipo?.etapas.find((candidata) => candidata.clave === expediente.etapaActual);

  return (
    <li className="aparece" style={{ animationDelay: `${Math.min(orden, 8) * 30}ms` }}>
      <Link
        href={`/expedientes/${expediente.id}`}
        className="block rounded-lg border border-linea bg-superficie px-4 py-3.5 transition-colors hover:border-linea-fuerte hover:bg-acento-suave focus-visible:border-acento focus-visible:bg-acento-suave focus-visible:outline-none"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="rotulo text-zinc-500 dark:text-zinc-400">
            {identificador(expediente)}
          </span>
          <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
            {expediente.fuero}
            <span className="px-1.5 text-linea-fuerte">·</span>
            {etiquetaCentro(expediente.centroJudicial)}
          </span>
          <span className={`rotulo flex shrink-0 items-center gap-1.5 ${estilo.texto}`}>
            <span aria-hidden className={`size-1.5 rounded-full ${estilo.punto}`} />
            {etiquetaEstado(expediente.estado)}
          </span>
        </div>

        <h2 className="mt-1.5 text-[15px] leading-snug text-zinc-900 dark:text-zinc-50">
          <Caratula expediente={expediente} />
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{tipo?.nombre ?? "Sin tipo de proceso"}</span>
          {etapa ? (
            <>
              <span className="text-linea-fuerte">·</span>
              <span className="text-zinc-700 dark:text-zinc-300">{etapa.nombre}</span>
            </>
          ) : null}
          {expediente.materia ? (
            <>
              <span className="text-linea-fuerte">·</span>
              <span>{expediente.materia}</span>
            </>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
