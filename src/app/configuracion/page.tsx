import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function ConfiguracionPage() {
  return (
    <AreaPlaceholder
      titulo="Configuración"
      descripcion="El abogado configura todo: plantillas de proceso, plazos, escritos, materias, juzgados y agentes. El sistema trae ejemplos editables."
      pendientes={[
        "Plantillas de proceso con etapas",
        "Catálogo de plazos (usa el motor de lib/plazos)",
        "Plantillas de escritos",
        "Materias y juzgados",
      ]}
    />
  );
}
