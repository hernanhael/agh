import { AreaPlaceholder } from "@/components/AreaPlaceholder";

export default function AgendaPage() {
  return (
    <AreaPlaceholder
      titulo="Agenda"
      descripcion="Calendario, vencimientos procesales, calculadora de plazos, contactos y honorarios."
      pendientes={[
        "Calendario con eventos, tareas y vencimientos",
        "Calculadora de plazos manual (motor ya implementado en lib/plazos)",
        "Recordatorios por correo",
        "Contactos, honorarios y gastos",
      ]}
    />
  );
}
