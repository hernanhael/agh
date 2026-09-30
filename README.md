# agh-IAwyer — Estudio jurídico virtual

Plataforma para asistir al abogado litigante durante la tramitación del proceso judicial en la **Provincia de Tucumán (Argentina)**. El expediente es el eje: su historia se construye dentro de la app (notificaciones traídas del Portal del SAE, escritos redactados allí mismo, documentos, eventos) y agentes de IA configurados por el abogado lo asisten en cada etapa, en dominio cerrado sobre esa historia y las fuentes que él les dio.

**Estado:** Fase 1 en curso. Hecho: motor de plazos, normalización de texto, Configuración (estudio, tipos de proceso, agentes) y Expedientes (listado con buscador y filtros por juzgado, OGA, estado, materia y fuero; alta con tipo de proceso; ficha; edición; baja). Primera regla de derecho procesal aplicada: la **caducidad de instancia**, que el listado informa con un semáforo —en trámite, para caducidad a los seis meses (tres en los incidentes), caduco— y la ficha explica con su cómputo (`docs/02-expedientes.md` §2.11). Pendiente para desplegar: Supabase y autenticación — los datos viven hoy en un archivo JSON local (`docs/07-arquitectura.md` §3.1).

## Documento de diseño

| Archivo | Contenido |
|---|---|
| [docs/00-vision.md](docs/00-vision.md) | Problema, propuesta, principios de diseño, mapa de áreas, glosario |
| [docs/01-agenda.md](docs/01-agenda.md) | Área 1 — Agenda, vencimientos procesales y motor de plazos |
| [docs/02-expedientes.md](docs/02-expedientes.md) | Área 2 — Expedientes: tipos de proceso, historia unificada, editor de escritos, agentes seleccionados |
| [docs/03-ia-agentes.md](docs/03-ia-agentes.md) | Área 3 — Agentes de IA: configuración por el abogado (desde Configuración), dominio cerrado, informe de estado |
| [docs/04-guias.md](docs/04-guias.md) | Área 4 — Guías de derecho y de trámites |
| [docs/05-integracion-expedientes-ia.md](docs/05-integracion-expedientes-ia.md) | Vinculación Expedientes e IA: flujos, herramientas, verificación de citas |
| [docs/06-modelo-de-datos.md](docs/06-modelo-de-datos.md) | Entidades, relaciones y esquema Supabase propuesto |
| [docs/07-arquitectura.md](docs/07-arquitectura.md) | Stack, componentes, motor de plazos, seguridad, riesgos |
| [docs/08-roadmap.md](docs/08-roadmap.md) | Fases de implementación, criterios de salida y verificaciones pendientes |
| [docs/09-conector-sae.md](docs/09-conector-sae.md) | Conector con el Portal del SAE: extensión, robot opcional, carga manual, pipeline de ingestión |
| [docs/10-normalizacion-de-texto.md](docs/10-normalizacion-de-texto.md) | Normalización de lo que se carga: carátulas, nombres, títulos y texto libre |

## Cómo leer estos documentos

1. Empezar por **00-vision** para entender el enfoque y el vocabulario.
2. Las cuatro áreas (**01** a **04**) siguen la misma estructura: *Descripción → Desarrollo → Funcionalidad (MVP / v2)*.
3. **05** explica cómo se conectan Expedientes e IA, que es la función principal del sistema.
4. **09** explica cómo entran las actuaciones del juzgado desde el Portal del SAE.
5. **06**, **07** y **10** son la base técnica para la fase de código.
6. **08** ordena el trabajo futuro y consolida lo pendiente de verificar.

Los puntos marcados **[a confirmar]** son datos normativos o administrativos que deben verificarse con fuentes oficiales antes de implementarse.

## Decisiones tomadas

- Jurisdicción: Tucumán. Código procesal de referencia: **Ley 9531** (CPCC, vigente desde 1/11/2022).
- Usuario: un solo abogado, con diseño preparado para escalar a varios.
- Stack previsto: Next.js (App Router) + Supabase + Vercel AI SDK.
- Rama inicial de los agentes: Civil y Comercial, con especialidades configurables (consumidor, daños, prescripción, etc.).
- **El abogado configura todo** desde el área Configuración: tipos de proceso con sus etapas, agentes especializados, plazos, plantillas de escritos y fuentes. El sistema trae ejemplos editables.
- **Dominio cerrado**: los agentes solo responden con base en la historia del expediente y las fuentes asignadas, con citas verificadas; los plazos los calcula exclusivamente el motor.
- Conector SAE: **extensión de navegador primero**, robot con credenciales como opción posterior, carga manual siempre disponible.
- Redacción de escritos: **editor propio en la app** con panel de IA, más importación y exportación Word.
- **Un solo formato para todo lo que se carga**: el sistema normaliza carátulas, nombres y títulos al guardar, según qué es cada dato.
