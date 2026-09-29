import { SubNav } from "@/components/SubNav";

/** Secciones de Configuración (docs/02-expedientes.md §2.10). */
const SECCIONES = [
  { href: "/configuracion", label: "Resumen" },
  { href: "/configuracion/estudio", label: "Estudio" },
  { href: "/configuracion/procesos", label: "Tipos de proceso" },
  { href: "/configuracion/agentes", label: "Agentes" },
] as const;

export default function ConfiguracionLayout({ children }: LayoutProps<"/configuracion">) {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        Configuración
      </p>
      <SubNav secciones={SECCIONES} className="mt-3 mb-8" />
      {children}
    </div>
  );
}
