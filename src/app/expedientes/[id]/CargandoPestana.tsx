/**
 * Lo que se ve en el cuerpo del cuadro mientras carga una pestaña.
 *
 * No es solo cortesía: las rutas del expediente son dinámicas, y Next solo
 * adelanta (prefetch) una ruta dinámica si el segmento tiene un `loading`. Con
 * eso, apretar F1…F6 cambia de pestaña en el acto y el contenido entra apenas
 * llega.
 *
 * El `loading.tsx` va **en cada pestaña** y no en la carpeta del expediente:
 * puesto arriba, su límite de suspensión también envuelve a
 * `/expedientes/<id>`, y entonces el salto a la primera pestaña dejaría de ser
 * un 307 del servidor para convertirse en un refresh del navegador, con el
 * parpadeo correspondiente.
 */
export default function CargandoPestana() {
  return (
    <div aria-hidden className="animate-pulse space-y-3">
      <div className="h-2.5 w-24 rounded bg-linea" />
      <div className="h-4 w-2/3 rounded bg-linea" />
      <div className="h-4 w-1/2 rounded bg-linea" />
      <div className="h-4 w-3/5 rounded bg-linea" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
