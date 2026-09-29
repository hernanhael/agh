// Marca el módulo como exclusivo del servidor. Sin esto, importar el barril
// `@/lib/datos` desde un componente de cliente hace que el empaquetador intente
// meter `node:fs` en el navegador y falle con un error indescifrable; con esto,
// el error dice exactamente qué pasó. Los componentes de cliente tienen que
// importar de los módulos puros (`./tipos`, `./filtros`).
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { datosIniciales } from "./semillas";
import type { Datos } from "./tipos";

/**
 * Almacén de datos de la Fase 1, **provisorio**.
 *
 * El destino del proyecto es Supabase Postgres con RLS
 * (docs/07-arquitectura.md §1). Mientras no esté montado, la configuración y
 * los expedientes viven en un archivo JSON local para poder construir y usar
 * las pantallas de verdad. Todo el acceso pasa por este módulo y por los
 * repositorios de al lado, así que el cambio a Supabase se hace acá y no
 * toca ni las páginas ni las acciones.
 *
 * Limitaciones asumidas a propósito: un solo abogado (el `owner_id` del
 * modelo de datos todavía no existe), sin concurrencia entre procesos y sin
 * persistencia en un despliegue serverless, donde el sistema de archivos es
 * de solo lectura.
 */

/**
 * Ruta del archivo. Se lee en cada operación (y no una vez al cargar el
 * módulo) para que los tests puedan apuntar a un archivo temporal.
 */
function archivo(): string {
  return process.env.AGH_ARCHIVO_DATOS ?? join(process.cwd(), ".data", "estudio.json");
}

/**
 * Cola de escrituras: serializa los ciclos leer-modificar-escribir para que
 * dos acciones simultáneas no se pisen. No protege contra otro proceso
 * escribiendo el mismo archivo; eso lo resuelve la base de datos.
 */
let cola: Promise<unknown> = Promise.resolve();

function esArchivoInexistente(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

async function escribir(datos: Datos): Promise<void> {
  const ruta = archivo();
  await mkdir(dirname(ruta), { recursive: true });
  // Escritura atómica: si el proceso muere a mitad de camino, el archivo
  // anterior queda intacto en lugar de truncado. El nombre temporal es único
  // porque dos peticiones simultáneas pueden intentar sembrar el archivo a la
  // vez, y con un nombre fijo la segunda no encontraría su propio temporal.
  const temporal = `${ruta}.${randomUUID()}.tmp`;
  await writeFile(temporal, `${JSON.stringify(datos, null, 2)}\n`, "utf8");
  await rename(temporal, ruta);
}

/** Lee el almacén. La primera vez lo crea con los ejemplos del sistema. */
export async function leerDatos(): Promise<Datos> {
  try {
    // La ruta se resuelve en tiempo de ejecución, así que Turbopack no puede
    // analizarla y por defecto incluiría todo el proyecto en el bundle del
    // servidor. Se le indica que la ignore: este archivo no es una dependencia
    // del código, es el almacén provisorio, y desaparece con Supabase
    // (docs/07-arquitectura.md §3.1).
    const crudo = await readFile(/* turbopackIgnore: true */ archivo(), "utf8");
    return JSON.parse(crudo) as Datos;
  } catch (error) {
    if (!esArchivoInexistente(error)) throw error;
    const iniciales = datosIniciales();
    await escribir(iniciales);
    return iniciales;
  }
}

/**
 * Modifica el almacén con `cambio` y lo guarda. Devuelve lo que devuelva
 * `cambio`, para que las acciones puedan informar el registro creado.
 */
export async function modificarDatos<T>(cambio: (datos: Datos) => T | Promise<T>): Promise<T> {
  const tarea = cola.then(async () => {
    const datos = await leerDatos();
    const resultado = await cambio(datos);
    await escribir(datos);
    return resultado;
  });
  // La cola sigue avanzando aunque una tarea falle.
  cola = tarea.catch(() => undefined);
  return tarea;
}

/** Marca de tiempo para `creadoEn` / `actualizadoEn`. */
export function ahora(): string {
  return new Date().toISOString();
}

/** Fecha de hoy en 'YYYY-MM-DD', como la usa el motor de plazos. */
export function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
