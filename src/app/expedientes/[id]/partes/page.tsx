import { User, Users } from "lucide-react";
import { claseSeparador, Pendientes, Vacio } from "@/components/ui";
import { etiquetaDe, ROLES_CLIENTE, type RolCliente } from "@/lib/datos";
import { cargarExpediente } from "../cargar";

/**
 * Pestaña **Partes**: quiénes litigan y de qué lado está el cliente.
 *
 * Mientras no exista la nómina de partes del modelo de datos, las partes son
 * las tres componentes de la carátula —actor, demandado y objeto—, que se
 * guardan por separado justamente para esto (docs/10-normalizacion-de-texto.md).
 *
 * El listado muestra las dos partes igual, sin decir cuál es el cliente: ese
 * dato se consulta acá (docs/02-expedientes.md §2.9). Por eso el rol del
 * cliente es lo primero que se lee en la pestaña.
 */

/** Un lado del juicio. Marcado cuando el cliente del estudio es esa parte. */
function Lado({
  rotulo,
  nombre,
  cliente,
}: {
  rotulo: string;
  nombre: string;
  cliente: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        cliente ? "border-acento/40 bg-acento-suave" : "border-linea bg-background"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <User
          aria-hidden
          className={`size-3.5 ${cliente ? "text-acento" : "text-zinc-400 dark:text-zinc-500"}`}
        />
        <span className="rotulo text-zinc-500 dark:text-zinc-500">{rotulo}</span>
        {cliente ? (
          /* Distintivo propio y no `Marca`: sus tonos fijan el borde y el color
             del texto, y acá hace falta el azul de acento. */
          <span className="ml-auto inline-flex items-center rounded-full border border-acento/40 px-2 py-0.5 text-xs text-acento">
            cliente
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {nombre || <span className="font-normal text-zinc-400 dark:text-zinc-600">—</span>}
      </p>
    </div>
  );
}

/** El rol del cliente que no es ninguno de los dos lados de la carátula. */
const ROLES_AL_MARGEN: ReadonlyArray<RolCliente> = ["tercero", "heredero", "acreedor", "otro"];

export default async function PartesExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/partes">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const alMargen = ROLES_AL_MARGEN.includes(expediente.rolCliente);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Users aria-hidden className="size-4 text-zinc-500 dark:text-zinc-500" />
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          El estudio interviene como{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {etiquetaDe(ROLES_CLIENTE, expediente.rolCliente).toLowerCase()}
          </span>
          .
        </p>
      </div>

      {expediente.actor || expediente.demandado ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Lado
            rotulo="Actor"
            nombre={expediente.actor}
            cliente={expediente.rolCliente === "actor"}
          />
          <Lado
            rotulo="Demandado"
            nombre={expediente.demandado}
            cliente={expediente.rolCliente === "demandado"}
          />
        </div>
      ) : (
        /* Un expediente cargado antes de que la carátula se partiera en tres. */
        <div className="mt-4">
          <Vacio>
            La carátula de este expediente no está partida en actor y demandado. Volvé a guardarla
            desde Datos y el sistema la separa.
          </Vacio>
        </div>
      )}

      {alMargen ? (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          Ninguno de los dos lados de la carátula es el cliente: interviene como{" "}
          {etiquetaDe(ROLES_CLIENTE, expediente.rolCliente).toLowerCase()}. La nómina completa de
          partes y terceros llega con la ficha de partes.
        </p>
      ) : null}

      <section className={claseSeparador}>
        <h3 className="rotulo text-zinc-500 dark:text-zinc-500">Objeto</h3>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {expediente.objeto || (
            <span className="text-zinc-400 dark:text-zinc-600">Sin objeto en la carátula.</span>
          )}
        </p>
      </section>

      <Pendientes
        items={[
          "Nómina de partes del expediente: cada parte con su rol, DNI o CUIT, domicilio real y domicilio electrónico.",
          "Letrados de la contraria, apoderados y el mediador interviniente.",
          "Terceros citados, aseguradoras y peritos.",
          "Datos de contacto del cliente y vínculo con sus otros expedientes.",
        ]}
      />
    </>
  );
}
