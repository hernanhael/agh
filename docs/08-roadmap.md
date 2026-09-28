# 08 — Roadmap

Fases ordenadas para llegar a un sistema usable lo antes posible. Cada fase tiene un criterio de salida verificable. Las duraciones son orientativas para un desarrollador trabajando de forma parcial.

## Fase 0 — Documento de diseño (esta)

**Entregable:** los documentos 00 a 09.
**Criterio de salida:** el abogado leyó las cuatro áreas, la integración y el conector, y validó el enfoque de configuración propia y dominio cerrado; los puntos **[a confirmar]** están listados para verificación.

## Fase 1 — Esqueleto, expedientes e historia (4 a 5 semanas)

- Proyecto Next.js + Supabase inicializado; autenticación con segundo factor.
- Migraciones del modelo de datos (`06`) con RLS; semillas copiadas al abogado como ejemplos editables.
- Layout con las cuatro áreas, Configuración y la vista Hoy.
- **Configuración**: plantillas de proceso con etapas, catálogo de plazos, plantillas de escritos, materias, juzgados.
- Expedientes: ficha con plantilla y materia, partes, etapas con transiciones, **historia unificada** con todos los tipos de entrada y filtros.
- **Editor de escritos** con versiones, importación y exportación Word/PDF, marcado de "presentado" (sin IA todavía).
- Documentos con subida y extracción de texto.
- **Motor de plazos** con tests, reglas parametrizadas y calendario de días inhábiles precargado.
- Agenda: calendario, eventos, tareas, vencimientos creados desde la historia, calculadora de plazos.
- Carga manual de actuaciones (texto y PDF). Recordatorios por correo.

**Criterio de salida:** el abogado configura una plantilla de proceso propia, carga un expediente real con su historia, redacta y exporta un escrito, registra una notificación y obtiene el vencimiento correcto con explicación.

## Fase 2 — IA integrada en el expediente (4 a 5 semanas)

- Pipeline de fragmentación y embeddings para historia, normas, guías, plantillas y corpus propio.
- Búsqueda híbrida filtrada por agente y expediente.
- **Constructor de agentes** con especialidades, tipos de proceso, guías de comportamiento, fuentes por ítem, modo de conocimiento; cinco agentes de ejemplo.
- **Selección de agentes por expediente**.
- Chat con contexto; **Informe de estado** estructurado guardado en la historia.
- Panel de IA en el editor de escritos (generar borrador, completar, reescribir, revisar requisitos).
- **Verificador de citas**, cobertura, sugerencias con aprobación (Flujos 1 a 6).
- Contador de tokens y presupuesto mensual.

**Criterio de salida:** en un expediente real con dos agentes seleccionados, el informe de estado identifica correctamente pendientes y plazos con citas verificadas; ante una pregunta cuya respuesta no está en las fuentes, el agente responde que no la encuentra; el Redactor genera un borrador con la carátula y partes correctas y marcas `[[COMPLETAR]]` donde falta información.

## Fase 3 — Conector SAE y guías (3 a 4 semanas)

- **Endpoint de ingestión** con tokens por dispositivo, deduplicación y vinculación automática.
- **Extensión de navegador**: lectura de bandeja e historia, modos manual y automático, selectores versionados, "capturar esta página".
- Flujo 0 completo: notificación → historia → análisis → plazos → aprobación → Agenda.
- Alerta por falta de sincronización.
- Guías: formato, carga, navegación, búsqueda, checklists activables, tabla etapa → guías en las plantillas.
- Redacción de las 8 a 10 guías de ejemplo, con verificación de los puntos **[a confirmar]** ante fuentes oficiales.
- Honorarios y gastos por expediente.

**Criterio de salida:** una notificación real del Portal aparece en la historia del expediente correcto sin transcripción manual, con vencimiento propuesto y explicación; al cambiar la etapa aparecen la guía y el checklist configurados.

## Fase 4 — Automatización y multiusuario (4 a 6 semanas)

- Robot SAE opcional (tarea local o en servidor) con bóveda de credenciales y apagado automático.
- Informe de estado automático al llegar una notificación; revisión diaria de expedientes activos.
- Investigador de jurisprudencia con dominios permitidos por el abogado.
- Banco de evaluación de agentes (incluidas preguntas "no está en las fuentes").
- Tablas de estudio y miembros; asignación de expedientes; plantillas, agentes y guías compartibles.
- Sincronización con Google Calendar.

**Criterio de salida:** las novedades del SAE llegan sin abrir el Portal (si el abogado activó el robot); un segundo usuario trabaja sobre expedientes asignados con los mismos agentes.

## Fase 5 — Expansión (continua)

- Ramas Laboral, Familia y Penal: plantillas, plazos, guías y agentes.
- Portal de clientes de solo lectura.
- Carga histórica masiva de expedientes anteriores.
- Reportes y exportaciones.

## Verificaciones pendientes antes de la Fase 3

Lista consolidada de los puntos **[a confirmar]** repartidos en los documentos:

1. Acordada de la Corte Suprema de Justicia de Tucumán que fija desde cuándo se tiene por notificada una cédula digital en el Portal del SAE.
2. Plazo de gracia: existencia, artículo y alcance en la Ley 9531.
3. Nomenclatura exacta de los tipos de proceso y etapas en la Ley 9531 (¿existe el proceso sumario?; audiencia preliminar, vista de causa, monitorio).
4. Plazos concretos del catálogo (contestación, excepciones, oposición monitoria, revocatoria, apelación, agravios, casación).
5. Caducidad de instancia: plazos.
6. Interacción entre la mediación obligatoria (Ley 7844) y la Ley 9531.
7. Tasa de justicia: alícuota, base, medio de pago ante Rentas Tucumán, exenciones.
8. Bono del Colegio de Abogados de Tucumán y aportes a la Caja de Previsión: montos y oportunidad.
9. Denominaciones actuales de los fueros y listado de juzgados por centro judicial, con el nombre exacto que usa el Portal.
10. Arancel de mediación.
11. Términos de uso del Portal del SAE respecto de accesos automatizados (relevante solo para el robot).
