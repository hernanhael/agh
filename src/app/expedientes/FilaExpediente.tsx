import { CalendarClock, Landmark } from "lucide-react";
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
              <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                <CalendarClock aria-hidden className="size-3.5 shrink-0" />
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
