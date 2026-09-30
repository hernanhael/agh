import { Semaforo, type TonoEstado } from "@/components/Registro";
import type { EstadoProcesal, SituacionCaducidad } from "@/lib/procesal";

/**
 * El semáforo de la caducidad de instancia, compartido por el listado y la
 * ficha del expediente (docs/02-expedientes.md §2.11).
 *
 * Es la traducción del derecho procesal al lenguaje visual del registro
 * (`Registro.tsx`): cada situación toma el tono que le corresponde y el detalle
 * del cómputo viaja como explicación del color.
 *
 * - **verde**: el expediente se mueve.
 * - **amarillo**: se cumplieron los meses sin movimiento (seis en el principal,
 *   tres en los incidentes) y la contraria puede acusar la caducidad.
 * - **rojo**: el juzgado declaró la caducidad.
 * - **gris**: no hay instancia en curso que pueda caducar (mediación previa,
 *   suspendido, con sentencia, en ejecución, archivado).
 */
const TONO_PROCESAL: Record<EstadoProcesal, TonoEstado> = {
  en_movimiento: "ok",
  para_caducidad: "aviso",
  caduco: "riesgo",
  sin_instancia: "neutro",
};

export function ChipProcesal({
  situacion,
  yaExplicado = false,
  className = "",
}: {
  situacion: SituacionCaducidad;
  /**
   * `true` donde el detalle ya está escrito al lado, como en la ficha: el
   * semáforo deja de llevarlo en el hover para no decir dos veces lo mismo,
   * que al lector de pantalla se le nota.
   */
  yaExplicado?: boolean;
  className?: string;
}) {
  return (
    <Semaforo
      tono={TONO_PROCESAL[situacion.estado]}
      etiqueta={situacion.etiqueta}
      detalle={yaExplicado ? undefined : situacion.detalle}
      className={className}
    />
  );
}
