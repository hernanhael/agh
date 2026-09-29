import Link from "next/link";
import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function IaPage() {
  return (
    <AreaPlaceholder
      titulo="IA"
      descripcion="Conversaciones con los agentes e informes de estado, en dominio cerrado sobre la historia del expediente y las fuentes asignadas."
      pendientes={[
        "Selección de agentes por expediente",
        "Chat con contexto e informe de estado con citas verificadas",
        "Fuentes por agente y RAG filtrado (Fase 2)",
      ]}
    >
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Los agentes especializados se crean y editan en{" "}
        <Link
          href="/configuracion/agentes"
          className="underline decoration-dotted underline-offset-2"
        >
          Configuración → Agentes
        </Link>
        .
      </p>
    </AreaPlaceholder>
  );
}
