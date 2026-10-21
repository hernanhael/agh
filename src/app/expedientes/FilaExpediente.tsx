import { Landmark } from "lucide-react";
import {
  claseColumnaEstado,
  claseDatoRegistro,
  claseNombreRegistro,
  claseRejillaRegistro,
  Meta,
  Punto,
  Registro,
  Rotulo,
} from "@/components/Registro";
import { ChipProcesal } from "@/components/SituacionProcesal";
// Se importa de los módulos puros y no del barril `@/lib/datos`, que arrastra
// el almacén y con él `node:fs`: esta fila se renderiza también en el cliente.
import { identificador, nombreJuzgado } from "@/lib/datos/filtros";
import { CENTROS_JUDICIALES, type Expediente, type TipoProceso } from "@/lib/datos/tipos";
import { audienciaFijada, situacionCaducidad } from "@/lib/procesal";

/**
 * Una fila del registro de expedientes: la burbuja que el abogado lee antes de
 * entrar al expediente.
 *
 * Usa las piezas del registro (`components/Registro.tsx`), que son el dibujo
 * común de las listas de la aplicación. Acá se completa con derecho procesal:
 *
 *   fila 1:  número
 *   fila 2:  carátula                               | semáforo de caducidad
 *   fila 3:  juzgado · OGA · centro · audiencia      | etapa
 *
 * No se muestran la materia ni el tipo de proceso: el tipo ya surge de la
 * carátula y la materia es un dato de la ficha, para sugerir agentes. El detalle
 * del movimiento tampoco: en la lista alcanza el color, y de dónde sale ese
 * color se ve al pasar el mouse por el semáforo y explicado en la ficha.
 */

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

/**
 * Calendario con los colores del emoji 📅: la banda roja arriba y la página de
 * papel abajo, en lugar del ícono de línea que usa el resto de la aplicación.
 *
 * Es el único dibujo en color de la lista y es a propósito: en una pantalla de
 * burbujas grises, el expediente con audiencia fijada tiene que encontrarse sin
 * leer. El rojo acá no es el rojo del semáforo —no hay audiencias "verdes" ni
 * "rojas"—, y no se confunde con él porque el semáforo es un chip con texto en
 * la columna de la derecha y esto es un calendario de 16 píxeles en la línea
 * del juzgado.
 *
 * Va dibujado a mano y no como emoji de texto porque el emoji lo dibuja cada
 * sistema a su manera (en Windows sale plano y azulado) y hereda la línea de
 * base del texto, que lo deja desalineado del resto de la fila.
 */
function CalendarioAudiencia({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" className={className}>
      {/* Las dos anillas, antes de la página para que queden por detrás. */}
      <path
        d="M5.5 1.25v2M10.5 1.25v2"
        className="stroke-zinc-400 dark:stroke-zinc-500"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="1.75"
        y="2.75"
        width="12.5"
        height="11.5"
        rx="2"
        className="fill-white stroke-zinc-300 dark:fill-zinc-200 dark:stroke-zinc-400"
      />
      {/* La banda del encabezado: el rojo con el que todos dibujan el emoji. */}
      <path
        d="M1.75 4.75a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v1.6h-12.5z"
        className="fill-[oklch(0.58_0.19_25)] dark:fill-[oklch(0.64_0.18_25)]"
      />
      {/* Las marcas de los días: textura de hoja de almanaque. */}
      <path
        d="M4.75 9.25h2.5M8.75 9.25h2.5M4.75 11.75h2.5"
        className="stroke-zinc-300 dark:stroke-zinc-400"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FilaExpediente({
  expediente,
  tipo,
  hoy,
  orden,
}: {
  expediente: Expediente;
  tipo: TipoProceso | undefined;
  /**
   * Día de hoy en 'YYYY-MM-DD'. Lo trae el servidor en lugar de leerlo del
   * reloj acá: la fila se renderiza en los dos lados y el semáforo tiene que
   * dar lo mismo en el HTML inicial y después de la hidratación.
   */
  hoy: string;
  /** Posición en la lista, para escalonar la entrada. */
  orden: number;
}) {
  const situacion = situacionCaducidad(expediente, hoy);
  const etapa = tipo?.etapas.find((candidata) => candidata.clave === expediente.etapaActual);
  const juzgado = nombreJuzgado(expediente);
  const audiencia = audienciaFijada(expediente, hoy);
  // Una audiencia que ya pasó no es una audiencia fijada: queda en la ficha,
  // pero no ocupa la burbuja, que es para lo que todavía hay que hacer.
  const proxima = audiencia && !audiencia.pasada ? audiencia : undefined;

  return (
    <Registro href={`/expedientes/${expediente.id}`} orden={orden}>
      <div className={claseRejillaRegistro}>
        <Rotulo className="sm:col-span-2">{identificador(expediente)}</Rotulo>

        <h2 className={claseNombreRegistro}>
          <Caratula expediente={expediente} />
        </h2>
        <ChipProcesal situacion={situacion} className={claseColumnaEstado} />

        {/*
          La tercera fila arranca separada de la carátula: el margen va en las
          dos celdas para que sigan enfrentadas.
        */}
        <Meta className="mt-2">
          <Landmark aria-hidden className="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          {/* Sin juzgado cargado se muestra el fuero, que es el dato que hay. */}
          <span className="text-zinc-700 dark:text-zinc-300">
            {juzgado ? `Juzgado ${juzgado}` : expediente.fuero}
          </span>
          {expediente.oficinaGestion ? (
            <>
              <Punto />
              <span>{expediente.oficinaGestion}</span>
            </>
          ) : null}
          <Punto />
          <span>{etiquetaCentro(expediente.centroJudicial)}</span>
          {proxima ? (
            <>
              <Punto />
              {/*
                La audiencia es el único dato de la línea que lleva color, y lo
                lleva con los colores del emoji del calendario: entre burbujas
                grises, el expediente con audiencia fijada salta a la vista. Va
                un punto más grande que el ícono del juzgado —16 contra 14— para
                que la banda roja se lea. El texto queda en gris: el color lo
                pone el calendario y no la línea entera, y el semáforo de la
                derecha sigue siendo el único verde/amarillo/rojo de la fila.
              */}
              <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                <CalendarioAudiencia className="size-4 shrink-0" />
                {proxima.texto}
              </span>
            </>
          ) : null}
        </Meta>
        <span className={`mt-2 ${claseDatoRegistro} ${claseColumnaEstado}`}>
          {etapa?.nombre ?? "Sin etapa"}
        </span>
      </div>
    </Registro>
  );
}
