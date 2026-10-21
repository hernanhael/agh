import { randomUUID } from "node:crypto";
import { oracion } from "@/lib/formato";
import { fechaValida } from "@/lib/plazos/calendario";
import { movimientoDesdeHistoria } from "@/lib/procesal/historia";
import { ahora, hoy, leerDatos, modificarDatos } from "./almacen";
import { correcto, fallo, type Resultado } from "./resultado";
import {
  SUBTIPOS_ENTRADA,
  TIPOS_ENTRADA,
  type Datos,
  type EntradaHistoria,
  type Expediente,
  type SubtipoEntrada,
  type TipoEntrada,
} from "./tipos";

/**
 * Historia del expediente: alta, edición y baja de entradas
 * (`history_entries` en docs/06-modelo-de-datos.md, docs/02-expedientes.md §2.3).
 *
 * Acá vive el efecto que tiene cargar una actuación sobre el expediente, que es
 * lo que hace que la historia no sea un cuaderno aparte:
 *
 * - un **acto de impulso** adelanta la fecha del último movimiento útil, de la
 *   que se cuenta la caducidad de instancia (§2.11);
 * - un decreto que **abre una etapa** mueve al expediente a esa etapa y deja
 *   la fecha del acto como fecha de la etapa.
 *
 * Cómo se lee y qué cuenta como impulso está en `lib/procesal/historia`, que es
 * puro. Acá se guarda.
 */

/**
 * Lo que llega del formulario. Se llama "carga" y no "entrada" porque la fila
 * guardada ya se llama `EntradaHistoria`: acá entrada es la pieza del
 * expediente, no el dato que entra al sistema.
 */
export interface CargaDeEntrada {
  expedienteId: string;
  /** 'YYYY-MM-DD'. Si viene vacía se usa la de hoy. */
  fecha: string;
  /** 'YYYY-MM-DD' o vacía: solo las piezas que se notifican la tienen. */
  fechaNotificacion: string;
  tipo: TipoEntrada;
  subtipo: SubtipoEntrada;
  titulo: string;
  texto: string;
  /** Clave de una etapa del tipo de proceso del expediente, o vacío. */
  abreEtapa: string;
}

/** El valor pedido si está en el catálogo; si no, el de reserva. */
function deCatalogo<T extends string>(
  catalogo: ReadonlyArray<{ valor: T }>,
  valor: string,
  porDefecto: T,
): T {
  return catalogo.some((candidato) => candidato.valor === valor) ? (valor as T) : porDefecto;
}

/**
 * La etapa pedida si pertenece al tipo de proceso del expediente; si no, vacío.
 *
 * Una etapa de otro tipo de proceso dejaría al expediente parado en una etapa
 * que su plantilla no tiene, que es como no tener etapa.
 */
function etapaDelProceso(datos: Datos, expediente: Expediente, clave: string): string {
  if (!clave) return "";
  const tipo = datos.tiposProceso.find((candidato) => candidato.id === expediente.tipoProcesoId);
  return tipo?.etapas.some((etapa) => etapa.clave === clave) ? clave : "";
}

/**
 * El título y el texto son oraciones, no nombres propios: se arregla el
 * espaciado, la puntuación y el texto que llegó todo en mayúsculas —que es como
 * sale del Portal del SAE—, sin tocar la ortografía de las palabras
 * (docs/10-normalizacion-de-texto.md).
 */
function normalizar(entrada: CargaDeEntrada) {
  return {
    fecha: fechaValida(entrada.fecha) || hoy(),
    fechaNotificacion: fechaValida(entrada.fechaNotificacion),
    tipo: deCatalogo(TIPOS_ENTRADA, entrada.tipo, "actuacion_juzgado"),
    subtipo: deCatalogo(SUBTIPOS_ENTRADA, entrada.subtipo, "otro"),
    // El título es una oración y no un nombre propio: "Provee la demanda y
    // ordena traslado por diez días" no se escribe en mayúsculas iniciales.
    titulo: oracion(entrada.titulo),
    // Los saltos de línea del original se conservan: un decreto pegado del
    // Portal viene en párrafos y se consulta como vino.
    texto: oracion(entrada.texto),
  };
}

/**
 * Deja al expediente al día con su historia.
 *
 * **Mientras haya actos de impulso cargados, la historia manda sobre la fecha
 * del último movimiento útil**, aunque sea anterior a la que estaba. Es lo que
 * promete el modelo —esa fecha se carga a mano solo hasta que exista la
 * historia (§2.1)— y es el lado seguro del error: si la historia está
 * incompleta, el expediente se ve más quieto de lo que está y el semáforo avisa
 * de más; al revés, una fecha optimista escondería una caducidad en curso, que
 * es justo lo que el semáforo existe para evitar.
 *
 * Sin ningún impulso cargado no se toca nada: manda la fecha de la ficha.
 */
function repercutirEnExpediente(
  datos: Datos,
  expediente: Expediente,
  entrada?: EntradaHistoria,
): void {
  let tocado = false;

  const impulso = movimientoDesdeHistoria(
    (datos.historia ?? []).filter((candidata) => candidata.expedienteId === expediente.id),
  );
  if (impulso && impulso !== expediente.ultimoMovimiento) {
    expediente.ultimoMovimiento = impulso;
    tocado = true;
  }

  // La etapa la mueve la entrada que la abre, con la fecha del acto. Borrar esa
  // entrada no devuelve el expediente a la etapa anterior: la historia no
  // guarda todavía de dónde venía (`stage_transitions` en el modelo), así que
  // la etapa se corrige desde Datos.
  if (entrada?.abreEtapa) {
    if (entrada.abreEtapa !== expediente.etapaActual) {
      expediente.etapaActual = entrada.abreEtapa;
      expediente.etapaDesde = entrada.fecha;
      tocado = true;
    } else if (entrada.fecha !== expediente.etapaDesde) {
      // Es la misma etapa en la que ya estaba: se corrige desde cuándo.
      expediente.etapaDesde = entrada.fecha;
      tocado = true;
    }
  }

  if (tocado) expediente.actualizadoEn = ahora();
}

/** Las entradas de un expediente, de la más reciente a la más antigua. */
export async function listarHistoria(expedienteId: string): Promise<EntradaHistoria[]> {
  const datos = await leerDatos();
  return (datos.historia ?? [])
    .filter((entrada) => entrada.expedienteId === expedienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn));
}

export async function crearEntradaHistoria(
  entrada: CargaDeEntrada,
): Promise<Resultado<EntradaHistoria>> {
  return modificarDatos((datos) => {
    const expediente = datos.expedientes.find(
      (candidato) => candidato.id === entrada.expedienteId,
    );
    if (!expediente) return fallo<EntradaHistoria>("No se encontró el expediente.");

    const campos = normalizar(entrada);
    if (!campos.titulo) {
      return fallo<EntradaHistoria>("Escribí en una línea qué fue esta actuación.");
    }

    const marca = ahora();
    const nueva: EntradaHistoria = {
      id: randomUUID(),
      expedienteId: expediente.id,
      fecha: campos.fecha,
      fechaNotificacion: campos.fechaNotificacion,
      tipo: campos.tipo,
      subtipo: campos.subtipo,
      // Todo lo que se carga desde la pestaña lo carga el estudio. El conector
      // del SAE y los agentes escribirán los otros dos orígenes.
      origen: "abogado",
      titulo: campos.titulo,
      texto: campos.texto,
      abreEtapa: etapaDelProceso(datos, expediente, entrada.abreEtapa),
      creadoEn: marca,
      actualizadoEn: marca,
    };

    // El almacén puede venir de una versión anterior, sin la lista.
    datos.historia ??= [];
    datos.historia.push(nueva);
    repercutirEnExpediente(datos, expediente, nueva);
    return correcto(nueva);
  });
}

export async function actualizarEntradaHistoria(
  id: string,
  entrada: CargaDeEntrada,
): Promise<Resultado<EntradaHistoria>> {
  return modificarDatos((datos) => {
    datos.historia ??= [];
    const guardada = datos.historia.find((candidata) => candidata.id === id);
    if (!guardada) return fallo<EntradaHistoria>("No se encontró la actuación.");

    const expediente = datos.expedientes.find(
      (candidato) => candidato.id === guardada.expedienteId,
    );
    if (!expediente) return fallo<EntradaHistoria>("No se encontró el expediente.");

    const campos = normalizar(entrada);
    if (!campos.titulo) {
      return fallo<EntradaHistoria>("Escribí en una línea qué fue esta actuación.");
    }

    Object.assign(guardada, {
      fecha: campos.fecha,
      fechaNotificacion: campos.fechaNotificacion,
      tipo: campos.tipo,
      subtipo: campos.subtipo,
      titulo: campos.titulo,
      texto: campos.texto,
      abreEtapa: etapaDelProceso(datos, expediente, entrada.abreEtapa),
      actualizadoEn: ahora(),
    });
    repercutirEnExpediente(datos, expediente, guardada);
    return correcto(guardada);
  });
}

export async function eliminarEntradaHistoria(id: string): Promise<Resultado<string>> {
  return modificarDatos((datos) => {
    datos.historia ??= [];
    const indice = datos.historia.findIndex((entrada) => entrada.id === id);
    if (indice === -1) return fallo<string>("No se encontró la actuación.");
    const [borrada] = datos.historia.splice(indice, 1);

    // La fecha del último movimiento se recalcula con lo que quedó; si no quedó
    // ningún impulso, se conserva la que había (ver `repercutirEnExpediente`).
    const expediente = datos.expedientes.find(
      (candidato) => candidato.id === borrada.expedienteId,
    );
    if (expediente) repercutirEnExpediente(datos, expediente);

    return correcto(borrada.titulo);
  });
}
