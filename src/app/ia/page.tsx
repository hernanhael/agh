import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function IaPage() {
  return (
    <AreaPlaceholder
      titulo="IA"
      descripcion="Agentes configurados por el abogado, en dominio cerrado sobre la historia del expediente y las fuentes asignadas."
      pendientes={[
        "Constructor de agentes (Fase 2)",
        "Selección de agentes por expediente",
        "Chat con contexto e informe de estado con citas verificadas",
      ]}
    />
  );
}
