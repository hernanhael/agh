import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function ExpedientesPage() {
  return (
    <AreaPlaceholder
      titulo="Expedientes"
      descripcion="Ficha del expediente, historia unificada, editor de escritos y agentes seleccionados."
      pendientes={[
        "Listado y alta de expedientes",
        "Plantillas de proceso con etapas (máquina de estados)",
        "Historia unificada con filtros",
        "Editor de escritos con versiones, import/export Word",
      ]}
    />
  );
}
