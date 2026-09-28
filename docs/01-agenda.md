# 01 — Área Agenda

## 1. Descripción

La Agenda es el calendario operativo del estudio. Reúne en una sola vista tres tipos de ítems que hoy viven separados:

| Tipo | Ejemplos | Origen |
|---|---|---|
| **Eventos** | Audiencia preliminar, audiencia de vista de causa, mediación, reunión con cliente, turno en el juzgado | Carga manual o desde un expediente |
| **Tareas** | Redactar contestación, pedir informe al Registro, llamar al perito, pagar tasa | Manual, desde un checklist de guía, o propuestas por la IA |
| **Vencimientos procesales** | Contestar demanda, expresar agravios, ofrecer prueba, apelar | Computados por el motor de plazos a partir de una notificación, importada del Portal del SAE o cargada a mano |

Además agrupa dos módulos secundarios que encajan mejor aquí que en otra área ("quizás algo más" del pedido original):

- **Contactos**: clientes, contrapartes, letrados de la contraria, peritos, juzgados y secretarías con datos de mesa de entradas.
- **Honorarios y gastos**: por expediente, con referencia a la Ley 5480 y a los aportes previsionales.

## 2. Desarrollo

### 2.1 Vistas

- **Hoy**: panel de inicio. Vencimientos de hoy y de los próximos 7 días ordenados por urgencia, audiencias del día, tareas vencidas o pendientes. Es la primera pantalla al abrir la aplicación.
- **Semana / Mes**: calendario clásico con colores por tipo (vencimiento en rojo, audiencia en azul, tarea en gris, mediación en violeta) y filtro por expediente.
- **Por expediente**: dentro de la ficha del expediente se ve solo lo que corresponde a esa causa.
- **Lista de vencimientos**: tabla filtrable por estado (pendiente, cumplido, vencido), por expediente y por rango de fechas. Es la vista de control diario.

### 2.2 Motor de cómputo de plazos

Es el componente más sensible del área. Se diseña como **módulo puro** (sin acceso a base de datos ni red) para poder testearlo exhaustivamente.

**Entrada**

- Fecha y hora de notificación (o de la actuación que abre el plazo).
- Cantidad de días.
- Tipo de días: hábiles judiciales (por defecto) o corridos.
- Tipo de acto: determina si aplica plazo de gracia.
- Centro judicial (Capital, Concepción, Monteros), por si hay asuetos locales.

**Reglas**

1. El plazo empieza a correr desde el día hábil siguiente a la notificación. Para la **notificación digital** del Portal del SAE, la regla de inicio (día de disponibilidad en la bandeja o día hábil siguiente) es un parámetro del motor **[a confirmar acordada de la Corte Suprema de Justicia de Tucumán]**.
2. **Presentaciones fuera del horario de atención de tribunales**: los plazos comienzan a correr a primera hora del día hábil siguiente (regla confirmada en la ayuda oficial del Portal del SAE).
3. Se saltean sábados, domingos, feriados nacionales, feriados provinciales de Tucumán, días de feria judicial (enero completo y julio según Acordada 840/26) y asuetos declarados por acordada de la Corte Suprema de Justicia de Tucumán.
4. Si el vencimiento cae en día inhábil, pasa al siguiente día hábil.
5. **Plazo de gracia**: se muestra como fecha secundaria, nunca como fecha principal **[a confirmar artículo y alcance en Ley 9531]**.
6. La feria suspende los plazos; si un plazo estaba corriendo al iniciar la feria, se reanuda al terminar.
7. **Solo el motor calcula plazos.** Los agentes de IA lo invocan con el acto del catálogo del abogado y reportan su salida; nunca estiman un plazo por su cuenta.

**Salida**

- Fecha de vencimiento principal.
- Fecha de gracia (si aplica).
- **Explicación paso a paso**: lista de fechas saltadas y por qué ("10/07 feriado nacional", "13/07 al 26/07 feria judicial de julio"). Esta explicación se guarda con el vencimiento para que el abogado pueda auditarlo.

**Calendario de días inhábiles**

- Tabla `holidays` precargada con feriados nacionales, feriados provinciales de Tucumán y ferias 2026–2038 (Acordada 840/26).
- Carga manual de asuetos y días de duelo por acordada, con enlace a la fuente.
- Cada registro indica alcance: nacional, provincial, centro judicial específico.

### 2.3 Plazos precargados por tipo de acto

Catálogo de plazos frecuentes del fuero Civil y Comercial según Ley 9531, **propiedad del abogado**: él lo crea, edita y valida. Cada entrada tiene: nombre del acto, cantidad de días, tipo de días, artículo de referencia, tipos de proceso en los que aplica. El sistema trae ejemplos marcados **[a confirmar]** hasta que el abogado los valide contra el texto vigente. Las plantillas de proceso (`02-expedientes.md`) referencian este catálogo para los plazos típicos de cada etapa. Ejemplos de entradas a completar:

- Contestar demanda en proceso ordinario.
- Contestar demanda en proceso sumarísimo.
- Oponer excepciones en ejecutivo.
- Oposición en proceso monitorio.
- Recurso de revocatoria.
- Recurso de apelación.
- Expresión de agravios.
- Recurso de casación ante la Corte Suprema de Justicia de Tucumán.

Cuando llega una notificación (desde el conector SAE o a mano), el abogado o el agente seleccionado identifica el acto del catálogo y el motor calcula el vencimiento. Si el acto no está en el catálogo, el agente no calcula y propone agregarlo. El vencimiento nace **vinculado a la entrada de la historia** que lo originó.

### 2.4 Recordatorios

- Por vencimiento: alertas configurables (por defecto 5, 2 y 1 día hábil antes, y el mismo día a las 8 h).
- Por evento: 1 día antes y 2 horas antes.
- Canales: notificación en la aplicación, correo electrónico. WhatsApp y push móvil en v2.
- Un vencimiento se marca "cumplido" manualmente o al registrarse la actuación que lo satisface (por ejemplo, al guardar el escrito de contestación como presentado).

### 2.5 Contactos

- Tipos: cliente, contraparte, letrado, perito, juzgado/secretaría, mediador, escribano, otro.
- Campos: nombre, DNI/CUIT, domicilio real, domicilio electrónico (para letrados), teléfono, correo, notas.
- Juzgados: centro judicial, fuero, nominación, secretaría, dirección, teléfono, horario de mesa de entradas, juez y secretario actuales.
- Un contacto puede estar vinculado a varios expedientes con un rol distinto en cada uno.

### 2.6 Honorarios y gastos

- Por expediente: registro de gastos (tasa de justicia, aportes, bono, edictos, peritos, fotocopias) con comprobante adjunto y estado (pagado por el estudio, a rendir al cliente, rendido).
- Honorarios: pactados (convenio con el cliente, con cuota litis si corresponde) y regulados (fecha, monto, instancia, estado de cobro). Referencia a la Ley 5480 y a la obligación de comunicar la regulación a la Caja de Previsión.
- Registro de tiempos (opcional): iniciar/detener un cronómetro sobre una tarea o expediente, para justificar honorarios por hora en asuntos extrajudiciales.
- Reporte simple: totales por expediente y por cliente, pendientes de cobro.

## 3. Funcionalidad

### MVP

- [ ] Vista Hoy con vencimientos próximos, tareas y eventos del día.
- [ ] Calendario semana/mes con filtro por expediente.
- [ ] Alta, edición y baja de eventos y tareas; vinculación opcional a expediente.
- [ ] Motor de plazos con explicación auditable y tests unitarios.
- [ ] Tabla de días inhábiles precargada (feriados nacionales, provinciales, ferias 2026–2038) y carga manual de asuetos.
- [ ] Catálogo de plazos por tipo de acto, editable.
- [ ] Calculadora de plazos independiente (sin necesidad de expediente) para consultas rápidas.
- [ ] Vencimientos creados desde una actuación del expediente (ver documento 02 y 05).
- [ ] Recordatorios en la aplicación y por correo.
- [ ] Contactos con vinculación a expedientes.
- [ ] Gastos y honorarios por expediente con estados básicos.

### v2

- [ ] Sincronización bidireccional con Google Calendar.
- [ ] Recordatorios por WhatsApp y notificaciones push móviles.
- [ ] Registro de tiempos con cronómetro.
- [ ] Reportes de honorarios y gastos exportables.
- [ ] Detección de feriados nuevos desde fuentes oficiales (Boletín Oficial, acordadas) con propuesta de alta.
- [ ] Plazos en otros fueros (laboral, familia) cuando se agreguen esas ramas.
