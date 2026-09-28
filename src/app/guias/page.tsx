import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function GuiasPage() {
  return (
    <AreaPlaceholder
      titulo="Guías"
      descripcion="Guías de derecho y de trámites, activables por etapa procesal."
      pendientes={[
        "Guías de ejemplo (Fase 3)",
        "Checklists activables",
        "Tabla etapa → guías en las plantillas de proceso",
      ]}
    />
  );
}
