import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function HoyPage() {
  return (
    <AreaPlaceholder
      titulo="Hoy"
      descripcion="Vencimientos, tareas y notificaciones pendientes de aprobación del día."
      pendientes={[
        "Vencimientos calculados por el motor de plazos",
        "Notificaciones del SAE sin revisar",
        "Tareas y eventos del día",
      ]}
    />
  );
}
