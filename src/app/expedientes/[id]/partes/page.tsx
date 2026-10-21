import { CornerDownRight, Inbox, Trash2, UserPlus, Users } from "lucide-react";
import { claseBotonAccion, claseSeparador, Pendientes, Vacio } from "@/components/ui";
import {
  etiquetaDe,
  listarPartes,
  ROLES_CLIENTE,
  ROLES_PARTE,
  type Parte,
} from "@/lib/datos";
import {
  agruparPartes,
  clienteDeLaNomina,
  faltantesDeCaratula,
  seNotifica,
  type FaltanteDeCaratula,
} from "@/lib/procesal";
import { agregarParteDeCaratula, borrarParte } from "../../acciones";
import { cargarExpediente } from "../cargar";
import { FormularioParte } from "./FormularioParte";

/**
 * Pestaña **Partes**: quiénes litigan, cómo se los notifica y de qué lado está
 * el cliente (docs/02-expedientes.md §2.14, `case_parties` en
 * docs/06-modelo-de-datos.md).
 *
 * La nómina se lee por **lados** y no como una lista de nueve roles: la parte
 * actora, la demandada con su citada en garantía, y alrededor los terceros y
 * auxiliares del juzgado. Debajo de cada parte cuelgan sus letrados, que es
 * como se la encuentra cuando hay que llamar a alguien.
 *
 * La carátula no se repite acá: sus dos nombres son el **arranque** de la
 * nómina. Mientras un lado de la carátula no tenga su parte cargada, la
 * pestaña ofrece sumarlo con un clic, y el abogado completa después el
 * documento y los domicilios, que es cuando llegan.
 *
 * Lo que de verdad se viene a buscar a esta pestaña es el **domicilio
 * electrónico**: sin la casilla del SAE no se notifica. Por eso es el único
 * dato que, cuando falta, se muestra en lugar de omitirse —y solo en quienes
 * se notifica, que es donde faltar significa algo (`seNotifica`).
 */

/** Un dato de contacto de la parte. Si está vacío no ocupa lugar. */
function DatoParte({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <span>
      <span className="text-zinc-400 dark:text-zinc-600">{rotulo} </span>
      {valor}
    </span>
  );
}

/** La identidad y el contacto de una parte, en una línea que se parte sola. */
function ContactoParte({ parte }: { parte: Parte }) {
  return (
    <>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
        <DatoParte rotulo="DNI/CUIT" valor={parte.documento} />
        {parte.domicilioElectronico ? (
          <DatoParte rotulo="Casilla" valor={parte.domicilioElectronico} />
        ) : seNotifica(parte.rol) ? (
          /*
            El único dato que se nombra cuando falta: sin casilla del SAE no hay
            forma de notificar a esa parte, así que la pestaña lo dice en vez de
            callarlo. A quien no se notifica —el perito, la mediadora— no se le
            reclama nada: ahí la casilla vacía no es un pendiente.
          */
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-500">
            <Inbox aria-hidden className="size-3.5 shrink-0" />
            Sin domicilio electrónico
          </span>
        ) : null}
        <DatoParte rotulo="Tel." valor={parte.telefono} />
        <DatoParte rotulo="Correo" valor={parte.email} />
      </p>
      {parte.domicilioReal ? (
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{parte.domicilioReal}</p>
      ) : null}
      {parte.notas ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{parte.notas}</p>
      ) : null}
    </>
  );
}

/** Nombre, rol y marcas de una parte, con sus datos y sus acciones debajo. */
function FilaParte({
  parte,
  expedienteId,
  representables,
}: {
  parte: Parte;
  expedienteId: string;
  representables: ReadonlyArray<Parte>;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
          {parte.nombre}
        </span>
        <span className="rotulo text-zinc-500 dark:text-zinc-500">
          {etiquetaDe(ROLES_PARTE, parte.rol)}
        </span>
        {parte.esCliente ? (
          /* El distintivo del cliente es el de la versión anterior de la
             pestaña: el azul del acento, que acá significa "los míos". */
          <span className="inline-flex items-center rounded-full border border-acento/40 px-2 py-0.5 text-xs text-acento">
            cliente
          </span>
        ) : null}
      </div>

      <ContactoParte parte={parte} />

      <div className="mt-1.5 flex items-center gap-3">
        <details>
          <summary className="cursor-pointer list-none text-xs text-zinc-500 underline decoration-dotted underline-offset-2 dark:text-zinc-500">
            Editar
          </summary>
          <div className="mb-2 border-t border-linea">
            <FormularioParte
              expedienteId={expedienteId}
              parte={parte}
              representables={representables}
            />
          </div>
        </details>
        <form action={borrarParte}>
          <input type="hidden" name="id" value={parte.id} />
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <button
            type="submit"
            title={`Quitar a "${parte.nombre}" de la nómina`}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <Trash2 aria-hidden className="size-3.5" />
            <span className="sr-only">Quitar de la nómina</span>
          </button>
        </form>
      </div>
    </>
  );
}

/** El lado de la carátula que todavía no está en la nómina. */
function FilaDeCaratula({
  faltante,
  expedienteId,
}: {
  faltante: FaltanteDeCaratula;
  expedienteId: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-dashed border-linea-fuerte bg-background px-3 py-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{faltante.nombre}</span>
        <span className="text-zinc-500 dark:text-zinc-500">
          {" "}
          está en la carátula y no en la nómina
        </span>
      </span>
      <form action={agregarParteDeCaratula}>
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <input type="hidden" name="rol" value={faltante.rol} />
        <button type="submit" className={`${claseBotonAccion} text-xs`}>
          <UserPlus aria-hidden className="size-3.5" />
          Sumar como {etiquetaDe(ROLES_PARTE, faltante.rol).toLowerCase()}
        </button>
      </form>
    </li>
  );
}

export default async function PartesExpedientePage({
  params,
}: PageProps<"/expedientes/[id]/partes">) {
  const { id } = await params;
  const expediente = await cargarExpediente(id);
  const partes = await listarPartes(expediente.id);

  const grupos = agruparPartes(partes);
  const faltantes = faltantesDeCaratula(expediente, partes);
  const cliente = clienteDeLaNomina(partes);
  // Un letrado no puede representar a otro letrado: el desplegable del
  // formulario ofrece solo a quienes no representan a nadie.
  const representables = partes.filter((parte) => !parte.representaA);

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Users aria-hidden className="size-4 shrink-0 text-zinc-500 dark:text-zinc-500" />
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          El estudio interviene como{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {etiquetaDe(ROLES_CLIENTE, expediente.rolCliente).toLowerCase()}
          </span>
          {cliente ? (
            <>
              , por{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{cliente.nombre}</span>
            </>
          ) : null}
          .
        </p>
      </div>

      {partes.length === 0 ? (
        <div className="mt-4">
          <Vacio>
            La nómina de partes de este expediente está vacía. Las notificaciones, los escritos y
            la rendición al cliente se arman con estos datos.
          </Vacio>
        </div>
      ) : null}

      {faltantes.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {faltantes.map((faltante) => (
            <FilaDeCaratula
              key={faltante.rol}
              faltante={faltante}
              expedienteId={expediente.id}
            />
          ))}
        </ul>
      ) : null}

      {grupos.map((grupo) => (
        <section key={grupo.lado} className={claseSeparador}>
          <h3 className="rotulo text-zinc-500 dark:text-zinc-500">{grupo.etiqueta}</h3>
          <ul className="mt-2 space-y-3">
            {grupo.partes.map(({ parte, representantes }) => (
              <li
                key={parte.id}
                id={`parte-${parte.id}`}
                className={`rounded-md border p-3 ${
                  parte.esCliente ? "border-acento/40 bg-acento-suave" : "border-linea bg-background"
                }`}
              >
                <FilaParte
                  parte={parte}
                  expedienteId={expediente.id}
                  representables={representables.filter((candidata) => candidata.id !== parte.id)}
                />

                {/*
                  Los letrados y apoderados cuelgan de su representado, con un
                  sangrado y una línea al costado: se leen como parte de esa
                  parte y no como una fila suelta de la nómina.
                */}
                {representantes.map((representante) => (
                  <div
                    key={representante.id}
                    id={`parte-${representante.id}`}
                    className="mt-3 border-l border-linea-fuerte pl-3"
                  >
                    <div className="flex items-start gap-1.5">
                      <CornerDownRight
                        aria-hidden
                        className="mt-1 size-3.5 shrink-0 text-zinc-400 dark:text-zinc-600"
                      />
                      <div className="min-w-0 flex-1">
                        <FilaParte
                          parte={representante}
                          expedienteId={expediente.id}
                          representables={representables.filter(
                            (candidata) => candidata.id !== representante.id,
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <details className={claseSeparador}>
        <summary className="cursor-pointer text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Agregar parte
        </summary>
        <div className="border-t border-linea">
          <FormularioParte expedienteId={expediente.id} representables={representables} />
        </div>
      </details>

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
          "Agenda de contactos del estudio: hoy cada parte guarda sus datos adentro del expediente, así que un mismo cliente con tres juicios se carga tres veces (contacts en docs/06-modelo-de-datos.md).",
          "Vínculo del cliente con sus otros expedientes, y de la contraria con los juicios en los que ya litigó el estudio.",
          "Encabezado de escrito armado con esta nómina: carátula, partes, documentos y domicilios constituidos, sin volver a tipearlos.",
          "Cédulas y notificaciones a los domicilios electrónicos cargados.",
          "Aseguradoras con su póliza y su cobertura, y peritos con su especialidad y su matrícula.",
        ]}
      />
    </>
  );
}
