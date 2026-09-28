# 04 — Área Guías

## 1. Descripción

Las Guías son la **base de conocimiento propia del estudio**, escrita en Markdown y organizada en dos colecciones:

| Colección | Qué explica | Ejemplo |
|---|---|---|
| **Derecho** | Derecho sustantivo y procesal: cómo funciona un instituto, qué exige la norma, qué plazos y recursos hay | "Estructura del proceso ordinario en la Ley 9531" |
| **Trámites** | Paso a paso administrativo de lo que rodea al proceso judicial: dónde ir, qué pagar, qué formulario, qué sistema | "Cómo iniciar la mediación prejudicial obligatoria" |

Las guías cumplen tres funciones:

1. **Consulta directa** del abogado (y de futuros colaboradores).
2. **Fuente de conocimiento de los agentes** de IA vía RAG (documento 03). Una guía solo la ve un agente si el abogado se la asignó como fuente al configurarlo; no hay acceso implícito.
3. **Asistente de trámite dentro del expediente**: cada guía puede tener un checklist que se instancia en una causa según la etapa de su plantilla de proceso (documentos 02 y 05).

Como toda la configuración del sistema, las guías son **del abogado**: las de ejemplo que trae el proyecto se marcan como tales y puede editarlas, reescribirlas o borrarlas.

## 2. Desarrollo

### 2.1 Formato de una guía

Archivo Markdown con encabezado de metadatos:

```markdown
---
titulo: Inicio de mediación prejudicial obligatoria
coleccion: tramites
rama: civil-comercial
tipo_proceso: [ordinario, sumarisimo]
etapa: mediacion
normativa: [Ley 7844, Decreto 2960/2009]
centro_judicial: [capital, concepcion, monteros]
revisado: 2026-09-15
estado: vigente          # vigente | necesita-revision | borrador
plantillas: [formulario-solicitud-mediacion]
---

## Cuándo aplica
...

## Pasos
1. ...

## Documentación necesaria
...

## Costos y aportes
...

## Errores frecuentes
...

## Fuentes
- ...
```

Cuerpo con secciones estándar por colección:

- **Trámites**: Cuándo aplica, Pasos, Documentación necesaria, Costos y aportes, Plazos, Errores frecuentes, Fuentes.
- **Derecho**: Concepto, Regulación (artículos), Requisitos, Plazos y recursos, Jurisprudencia de referencia, Relación con otros institutos, Fuentes.

### 2.2 Checklist ejecutable

Sección opcional `## Checklist` con ítems que el sistema convierte en tareas cuando el abogado "activa la guía" en un expediente:

```markdown
## Checklist
- [ ] Verificar que la materia no esté excluida de mediación (Ley 7844)
- [ ] Completar formulario de solicitud en el Centro de Mediación Judicial
- [ ] Abonar arancel de mediación [a confirmar monto]
- [ ] Notificar al requerido
- [ ] Asistir a la audiencia y obtener acta
- [ ] Adjuntar acta de cierre al expediente (habilita la demanda)
```

Cada ítem puede llevar metadatos opcionales: plazo relativo (`+5dh` = cinco días hábiles desde la activación), documento a producir, agente sugerido.

### 2.3 Índice inicial — colección Trámites (Tucumán)

Las 8 a 10 guías semilla del MVP salen de esta lista. Los ítems con **[a confirmar]** requieren verificación con fuente oficial antes de publicarse como "vigente".

1. **Mediación prejudicial obligatoria**: Ley 7844, Decreto 2960/2009, Centro de Mediación Judicial. Materias excluidas; cómo iniciar; aranceles **[a confirmar]**; acta de cierre; interacción con la Ley 9531 **[a confirmar]**.
2. **Inicio de demanda por el Portal del SAE**: alta del expediente, carga de escrito y documental digital, sorteo de juzgado, constancias.
3. **Pago de tasa de justicia**: base imponible, alícuota, formulario y medio de pago ante Rentas Tucumán, exenciones, oportunidad de pago **[a confirmar todo]**.
4. **Bono, matrícula y aportes**: bono del Colegio de Abogados de Tucumán, aportes a la Caja de Previsión y Seguridad Social de Abogados y Procuradores por inicio de juicio y por regulación **[a confirmar montos y oportunidad]**.
5. **Notificaciones electrónicas y cédulas**: domicilio electrónico, cómo se cursa y cuándo se tiene por notificada una cédula en el SAE, cédulas a domicilio real, edictos.
6. **Presentación de escritos digitales**: formato, firma electrónica/digital, cargo, adjuntos, escritos fuera de horario **[a confirmar régimen de cargo y plazo de gracia]**.
7. **Feria judicial y habilitación de feria**: cronograma 2026–2038 (Acordada 840/26), atención de urgencias 8 a 13 h (art. 164 Ley 6238), cómo pedir habilitación.
8. **Regulación y cobro de honorarios**: Ley 5480: pautas, mínimos, incidentes (art. 59), comunicación a la Caja, ejecución de honorarios.
9. **Ejecución de sentencia**: liquidación, intimación de pago, embargo, subasta, inscripción de medidas.
10. **Oficios e informes**: Registro de la Propiedad, Registro Automotor, bancos, ARCA, ANSES: cómo se libran y diligencian por vía electrónica.
11. **Poderes y representación**: poder general y especial, carta poder, ratificación, patrocinio vs. apoderamiento.
12. **Medidas cautelares**: requisitos, contracautela, traba e inscripción, caducidad.

### 2.4 Índice inicial — colección Derecho

1. Estructura de los procesos en la Ley 9531: conocimiento ordinario y sumarísimo, ejecutivo, monitorio, especiales.
2. Plazos procesales: cómputo, días hábiles, suspensión por feria, plazo de gracia **[a confirmar]**.
3. Recursos: revocatoria, apelación, nulidad, casación ante la Corte Suprema de Justicia de Tucumán, inconstitucionalidad; plazos y forma.
4. Prueba: ofrecimiento, medios, audiencia preliminar, audiencia de vista de causa, prueba pericial.
5. Proceso monitorio: supuestos, sentencia monitoria, oposición.
6. Proceso ejecutivo: títulos, excepciones, sentencia de remate.
7. Sucesiones: apertura, declaratoria, inventario, partición.
8. Caducidad de instancia: plazos y cómo evitarla **[a confirmar]**.
9. Medidas cautelares: verosimilitud del derecho, peligro en la demora, contracautela.
10. Nociones sustantivas de uso frecuente en el CCyC: prescripción liberatoria, responsabilidad civil, daños, mora e intereses, locación.

### 2.5 Vinculación con etapas del expediente

La correspondencia etapa a guías sugeridas se configura **dentro de cada plantilla de proceso** (`02-expedientes.md`, sección 2.1): cada etapa lista sus guías, checklist, plazos típicos, escritos típicos y agentes sugeridos. Ejemplo para la plantilla de ordinario de ejemplo:

| Tipo de proceso | Etapa | Guías sugeridas |
|---|---|---|
| Ordinario | Mediación | Mediación prejudicial; Poderes |
| Ordinario | Demanda | Inicio de demanda por el SAE; Tasa de justicia; Bono y aportes |
| Ordinario | Traslado / Contestación | Notificaciones electrónicas; Plazos procesales |
| Ordinario | Prueba | Prueba; Oficios e informes |
| Ordinario | Sentencia / Recursos | Recursos |
| Ordinario | Ejecución | Ejecución de sentencia; Regulación y cobro de honorarios |

### 2.6 Edición y ciclo de vida

- **MVP**: las guías se escriben como archivos Markdown en el repositorio (`content/guias/`) y se cargan a la base de datos e indexan al desplegar. Lectura y búsqueda desde la aplicación.
- **v2**: editor en la aplicación con vista previa, historial de versiones, comparación entre versiones.
- Estado `necesita-revision`: se marca a mano cuando cambia la normativa, o lo propone un agente cuando detecta contradicción entre una guía y una norma más nueva del corpus.
- Cada guía muestra su fecha de revisión de forma visible; las de más de 12 meses sin revisar se listan en un panel de mantenimiento.

### 2.7 Búsqueda y navegación

- Navegación por colección, rama, tipo de proceso y etapa.
- Búsqueda léxica y semántica (mismo índice del RAG).
- Desde cada guía: "Preguntar al Procesalista sobre esta guía" (abre un chat con la guía como contexto) y "Activar checklist en expediente".

## 3. Funcionalidad

### MVP

- [ ] Formato de guía con metadatos, cuerpo y checklist; validación al cargar.
- [ ] Carga desde `content/guias/` a la base de datos e indexación para RAG.
- [ ] Lectura con navegación por colección, rama, proceso y etapa.
- [ ] Búsqueda léxica y semántica.
- [ ] Checklist activable en un expediente, con ítems convertidos a tareas y seguimiento de cumplimiento.
- [ ] Guías sugeridas por etapa configuradas en las plantillas de proceso.
- [ ] Asignación de guías como fuente por agente (desde el constructor de agentes).
- [ ] Entre 8 y 10 guías semilla: Mediación, Inicio de demanda por el SAE, Tasa de justicia, Bono y aportes, Notificaciones, Presentación de escritos, Feria, Honorarios, Estructura de procesos Ley 9531, Plazos y recursos.
- [ ] Panel de guías vencidas o marcadas para revisión.

### v2

- [ ] Editor en la aplicación con vista previa y versionado.
- [ ] Sugerencia automática de revisión cuando cambia el corpus normativo.
- [ ] Plantillas de escritos como tipo de contenido propio, enlazadas desde las guías y usadas por el Redactor.
- [ ] Guías para Laboral, Familia y Penal.
- [ ] Exportación a PDF para compartir con clientes (versión simplificada).
