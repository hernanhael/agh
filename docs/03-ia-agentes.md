# 03 — Área IA: agentes expertos

## 1. Descripción

El área de IA es donde el abogado **crea y configura** sus agentes expertos. Luego los **selecciona dentro de cada expediente** para que trabajen allí (ver `02-expedientes.md`, sección 2.6). Un agente es una configuración del abogado compuesta por:

| Componente | Qué define |
|---|---|
| **Rol** | Qué hace y cómo se comporta: procesalista, redactor, analista, investigador. |
| **Rama** | Área del derecho: Civil y Comercial en la primera versión; Laboral, Familia, Penal después. |
| **Especialidad** | Materia o materias en las que es experto: consumidor, daños y perjuicios, prescripción, contratos, locaciones, sucesiones, ejecuciones y cobros. Lista editable por el abogado. |
| **Tipos de proceso** | Plantillas de proceso en las que actúa (ordinario, ejecutivo, etc.) o todas. |
| **Instrucciones** | Prompt de sistema guiado por bloques más instrucciones libres del abogado: jurisdicción, tono, formato, reglas de citación, **guías de comportamiento**. |
| **Fuentes** | Exactamente qué puede consultar: normas cargadas, guías, plantillas de escritos, fallos propios, y la historia del expediente donde fue seleccionado. Nada más. |
| **Herramientas** | Acciones que puede proponer: calcular plazo, crear tarea, crear vencimiento, buscar en la historia, generar escrito, informe de estado. |
| **Modo de conocimiento** | "Solo fuentes" (por defecto) o "conocimiento general" (opt-in con aviso). |
| **Modelo** | Modelo de lenguaje que lo ejecuta; configurable por agente. |

Regla central: el agente opera en **dominio cerrado**. Su campo de funcionamiento se limita a la historia del expediente y a los conocimientos y fuentes que el abogado le otorgó. No usa conocimiento general del modelo para afirmar derecho, plazos ni hechos. La sección 2.7 detalla cómo se garantiza.

## 2. Desarrollo

### 2.1 Catálogo inicial (ejemplos editables)

El sistema trae estos agentes como punto de partida. El abogado puede editarlos, clonarlos o borrarlos; sus fuentes vienen vacías hasta que él las asigne (salvo el corpus normativo semilla, que también puede desactivar).

#### Procesalista Tucumán
- **Rol / especialidad**: procesal civil y comercial; sin especialidad de fondo.
- **Responde**: qué recurso corresponde, plazo y forma; requisitos de un escrito; qué pasa en cada etapa; cómo se computa un plazo concreto (llamando al motor de plazos).
- **Fuentes sugeridas**: Ley 9531 y modificatorias, Ley 7844, Ley 6238, acordadas cargadas, guías de la colección Derecho.
- **Herramientas**: calcular plazo, crear vencimiento, sugerir guía, informe de estado.

#### Analista de expediente
- **Rol**: lee la historia del expediente y explica qué pasa. Es la base del **Informe de estado**.
- **Responde**: resumen de una actuación nueva; clasificación; plazos que se abren (vía motor); qué quedó pendiente; advertencias (plazo por vencer, prueba no producida, escrito sin presentar); propuesta de próximos pasos; resumen cronológico; preparación de audiencia.
- **Fuentes sugeridas**: historia del expediente, catálogo de plazos, guías, plantilla de proceso del expediente.
- **Herramientas**: clasificar actuación, crear vencimiento, crear tarea, cambiar etapa, informe de estado (todas como propuestas).

#### Redactor de escritos
- **Rol**: redacta borradores en el estilo forense de Tucumán dentro del editor del expediente.
- **Fuentes sugeridas**: plantillas de escritos del abogado, historia del expediente, normas y guías que el abogado asigne.
- **Herramientas**: buscar en historia, generar escrito, calcular plazo.
- **Regla**: lo que no está en la historia se marca `[[COMPLETAR: ...]]`.

#### Especialista en Daños y Perjuicios (ejemplo de agente por especialidad)
- **Rol / especialidad**: analista y consultor en responsabilidad civil.
- **Fuentes sugeridas**: artículos del CCyC que el abogado cargue (responsabilidad, daño resarcible, prescripción), guías propias de daños, fallos propios.
- **Uso típico**: en un ordinario de daños, informar qué rubros se reclamaron, qué prueba los respalda, qué falta acreditar, si hay riesgo de prescripción.

#### Especialista en Consumidor (ejemplo de agente por especialidad)
- **Fuentes sugeridas**: Ley 24.240 y modificatorias cargadas por el abogado, guías propias, fallos propios.
- **Uso típico**: verificar requisitos de la relación de consumo en la historia, advertir sobre daño punitivo y cargas probatorias, según lo que digan las fuentes cargadas.

#### Investigador de jurisprudencia y doctrina (v2)
- Busca fallos en el corpus propio del abogado y, si él lo habilita, en dominios web que él liste. Solo cita lo que recuperó y puede enlazar.

### 2.2 Constructor de agentes

Formulario para crear, editar o clonar agentes.

1. **Identidad**: nombre, descripción, ícono, rama, **especialidades**, **tipos de proceso** en los que actúa.
2. **Instrucciones guiadas**: bloques seleccionables (jurisdicción Tucumán, rol, especialidad, tono, formato de salida, reglas de citación, reglas de dominio cerrado) más un campo de **guías de comportamiento** libres del abogado (por ejemplo: "cuando detectes una cédula, siempre calculá el plazo con el catálogo y nunca lo estimes"; "no opines sobre estrategia, solo informá").
3. **Fuentes**: selección explícita, ítem por ítem, de lo que el agente puede consultar: normas cargadas, colecciones de guías, plantillas de escritos, corpus propios (fallos, modelos), y "historia del expediente donde esté seleccionado" (activo por defecto). Sin fuentes asignadas, el agente solo ve la historia.
4. **Herramientas**: casillas por herramienta; cada una explica qué hace y aclara que toda escritura es una propuesta.
5. **Modo de conocimiento**: "Solo fuentes" (por defecto) o "Conocimiento general" con aviso visible en cada respuesta. Búsqueda web deshabilitada por defecto; si se habilita, lista de dominios permitidos.
6. **Modelo y parámetros**: modelo, temperatura (baja por defecto), longitud máxima.
7. **Prueba**: panel para probar el agente con una pregunta sobre un expediente de ejemplo antes de guardar, mostrando cobertura y citas.

### 2.3 Flujo de uso: crear en IA, seleccionar en el expediente, interactuar allí

1. El abogado crea o ajusta el agente en el área IA y le asigna fuentes y guías de comportamiento.
2. En un expediente, abre el panel "Agentes" y selecciona los que van a trabajar en esa causa. El sistema sugiere según materia y etapa; la decisión es del abogado.
3. Desde el expediente pide un **Informe de estado**, chatea, analiza una actuación o redacta con el agente. Todo ocurre con la historia del expediente como contexto.
4. Las propuestas del agente quedan pendientes de aprobación; lo aprobado entra en la historia, Agenda o Documentos con marca de origen.

**Informe de estado (salida estructurada)**

```json
{
  "estado": "texto breve del estado procesal actual, con fuente",
  "pendientes": [{ "que": "...", "desde": "entrada de la historia", "fuente": "..." }],
  "plazos": {
    "corriendo": [{ "acto": "...", "vence": "fecha", "calculado_por": "motor", "origen": "entrada" }],
    "vencidos": [],
    "proximos": []
  },
  "advertencias": [{ "texto": "...", "fuente": "..." }],
  "propuestas": [{ "accion": "crear_tarea | crear_vencimiento | cambiar_etapa | generar_escrito", "detalle": "...", "fuente": "..." }],
  "sin_respaldo": ["puntos que el agente no pudo apoyar en fuentes"],
  "cobertura": 0.85,
  "fuentes": ["ids de fragmentos y entradas usadas"]
}
```

Cada ítem lleva `fuente`; un ítem sin fuente va a `sin_respaldo` y no se muestra como acción. Los informes se guardan en la historia del expediente con fecha, agente y versión del agente.

### 2.4 Conocimiento y RAG

Todas las fuentes se indexan en `document_chunks` (embeddings en pgvector más texto completo) con metadatos de origen y de **propietario de la asignación**: un agente solo puede recuperar fragmentos de las fuentes que tiene asignadas y de la historia del expediente activo.

| Capa | Contenido | Quién la carga | Quién la habilita por agente |
|---|---|---|---|
| **Normativa** | Textos que el abogado carga (Ley 9531, CCyC, Ley 7844, Ley 5480, Ley 24.240, acordadas). El sistema trae algunos como semilla, desactivables | Abogado (semilla opcional) | Abogado, por agente |
| **Guías** | Colecciones Derecho y Trámites (`04-guias.md`) | Abogado | Abogado, por agente |
| **Plantillas y corpus propio** | Plantillas de escritos, fallos, modelos | Abogado | Abogado, por agente |
| **Historia del expediente** | Todas las entradas del expediente donde el agente fue seleccionado | Automática | Activa por defecto; nunca cruza expedientes |

Recuperación: fragmentos de 500 a 800 tokens con solapamiento (normas: un fragmento por artículo); búsqueda híbrida semántica y léxica; filtro por agente y expediente **antes** de recuperar; reordenamiento y límite de contexto.

### 2.5 Controles, auditoría y costos

- Toda respuesta muestra citas clicables y el indicador de cobertura.
- Aviso permanente: "Las respuestas son borradores de apoyo, limitados a las fuentes que cargaste. Verificá antes de presentar."
- Confidencialidad: la historia de un expediente solo se envía al modelo cuando el agente está seleccionado en ese expediente. Registro de qué fragmentos se enviaron y cuándo.
- Costos: tokens por conversación, por agente y por mes; presupuesto mensual con aviso.
- Auditoría: informes y sugerencias guardan el agente, su versión, el mensaje de origen y los fragmentos usados.

### 2.6 Modelos

- Acceso vía AI Gateway con identificadores `proveedor/modelo`, cambiables sin desplegar.
- Por defecto: Claude para análisis y redacción; un modelo económico para clasificación y resúmenes cortos.
- Embeddings multilingües con buen desempeño en español.
- Temperatura baja por defecto en todos los agentes.

### 2.7 Dominio cerrado y control de alucinaciones

Objetivo: reducir al mínimo posible que el agente invente. Reglas de diseño obligatorias:

1. **Citas obligatorias**. Toda afirmación jurídica o fáctica debe apoyarse en un fragmento recuperado de las fuentes habilitadas o de la historia. Si no hay fragmento, el agente responde: "No encuentro esto en las fuentes que me diste" y, si corresponde, propone qué fuente cargar.
2. **Plazos solo por el motor**. El agente nunca estima ni infiere un plazo. Llama a `calcular_plazo` con el acto del catálogo del abogado y reporta el resultado con su explicación. Si el acto no está en el catálogo, lo dice y propone agregarlo.
3. **Hechos solo de la historia**. Lo que no está en la historia se marca `[[COMPLETAR]]`; nunca se rellena con supuestos.
4. **Modo "solo fuentes" por defecto**. Las instrucciones de sistema prohíben usar conocimiento general para afirmar derecho, plazos o hechos. El modo "conocimiento general" es opt-in por agente y cada respuesta en ese modo lleva un aviso visible.
5. **Sin búsqueda web por defecto**. Si el abogado la habilita para un agente, se restringe a los dominios que él liste.
6. **Salidas estructuradas con fuente obligatoria**. En informes y sugerencias, un ítem sin fuente no se muestra como acción; va a `sin_respaldo`.
7. **Verificación de citas posterior a la generación**. Antes de mostrar la respuesta, el sistema comprueba que cada cita apunte a un fragmento realmente recuperado en ese turno. Las que no coinciden se marcan como "cita no verificada" o se eliminan, según configuración del abogado.
8. **Indicador de cobertura**. Cada respuesta informa qué proporción de lo afirmado tiene respaldo y lista lo que quedó sin respaldo.
9. **Banco de evaluación (v2)**. Preguntas con respuesta esperada, incluidas preguntas cuya respuesta correcta es "no está en las fuentes", para medir invención al cambiar instrucciones, modelo o fuentes.

Complementos técnicos: temperatura baja; contexto armado solo con fragmentos recuperados (nunca documentos completos ni resúmenes generados sin fuente); herramientas de escritura siempre como propuestas; registro de fragmentos por turno para auditar cualquier respuesta.

## 3. Funcionalidad

### MVP

- [ ] Constructor de agentes con rol, rama, especialidades, tipos de proceso, instrucciones guiadas, guías de comportamiento, fuentes por ítem, herramientas, modo de conocimiento y modelo.
- [ ] Cinco agentes de ejemplo editables (Procesalista, Analista, Redactor, Daños, Consumidor).
- [ ] Selección de agentes por expediente.
- [ ] Informe de estado bajo demanda con salida estructurada, guardado en la historia.
- [ ] Chat con contexto del expediente, transmisión en tiempo real, historial.
- [ ] RAG filtrado por agente y expediente, búsqueda híbrida.
- [ ] Citas clicables, verificación de citas posterior a la generación, indicador de cobertura.
- [ ] Modo "solo fuentes" por defecto; búsqueda web deshabilitada.
- [ ] Sugerencias con aprobación; contador de tokens y presupuesto.

### v2

- [ ] Informe de estado automático al llegar una notificación del SAE y revisión diaria de expedientes activos.
- [ ] Investigador de jurisprudencia con dominios permitidos por el abogado.
- [ ] Banco de evaluación y comparación entre versiones de un agente.
- [ ] Ramas Laboral, Familia y Penal.
- [ ] Agentes compartibles entre usuarios (multiusuario).
