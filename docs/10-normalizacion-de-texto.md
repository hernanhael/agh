# 10 — Normalización de texto

## 1. Descripción

Todo lo que el abogado escribe y todo lo que entra por importación se guarda y se muestra con **un solo formato, ortográficamente correcto**. El sistema no confía en cómo venga el dato: lo normaliza.

El caso de referencia es la carátula. El Portal del SAE la publica en mayúsculas y sin tildes, y a mano se escribe distinto cada vez:

| Se carga | Se guarda y se muestra |
|---|---|
| `NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y Perjuicios` | Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios |
| `nicolas rogel contra swiss medical ART sobre DAÑOS Y PERJUICIOS` | Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios |
| `  MUNICIPALIDAD DE SAN MIGUEL DE TUCUMAN CONTRA maria de los angeles PEREZ Y OTROS SOBRE expropiacion` | Municipalidad de San Miguel de Tucumán c/ María de los Ángeles Pérez y otros s/ Expropiación |

El objetivo no es cosmético: una carátula escrita de tres maneras distintas es tres carátulas distintas para buscar, ordenar, deduplicar contra el SAE y armar el encabezado de un escrito.

## 2. Desarrollo

### 2.1 Dónde se aplica

El normalizador es un módulo puro (`src/lib/formato/`), sin red ni base de datos, y se usa en tres lugares:

1. **Al guardar.** Los repositorios (`src/lib/datos/`) normalizan antes de persistir. La normalización vive ahí y no en la pantalla, para que cualquier vía de carga futura —el importador del SAE, una carga masiva— quede formateada igual sin repetir la regla.
2. **Al mostrar.** Las mismas funciones sirven de red de seguridad para datos cargados antes de que esta normalización existiera.
3. **Al escribir, en vivo.** Como es puro e isomorfo, el formulario de expedientes previsualiza la carátula mientras se tipea: lo que el abogado ve es exactamente lo que se va a guardar, con sus tres componentes separados.

### 2.2 Tres tratamientos según qué es el dato

Cada campo se formatea según lo que significa, no según cómo se escribió.

| Función | Para qué | Regla |
|---|---|---|
| `nombrePropio` | Partes, nombre del abogado | Capitaliza cada palabra; partículas en minúscula (`de`, `del`, `la`, `y`, `van`); respeta iniciales, guiones, apóstrofos y prefijos `Mc`/`Mac` |
| `titulo` | Objeto de la carátula, materias, nombres de etapas y de tipos de proceso | Capitaliza las palabras significativas y deja en minúscula las menores (`de`, `por`, `y`, `en`), salvo la primera |
| `oracion` | Notas, descripciones, instrucciones de agentes | Solo lo que es seguro: espaciado, signos de puntuación, mayúscula inicial de cada oración y texto que llegó a los gritos |

Además: `numeroExpediente` normaliza al formato del SAE (`0077` + `2026` → `77/26`) y `clavear` genera las claves estables de las etapas (`Audiencia Preliminar` → `audiencia_preliminar`).

### 2.2.1 Normalizar también para buscar

`normalizarParaBuscar` es la contracara de todo esto: reduce un texto a minúsculas, sin tildes y con los signos convertidos en espacios. Se aplica **a la consulta y al dato**, así que el buscador de expedientes encuentra "Nicolás" escribiendo "nicolas", "Daños" escribiendo "danos" y "Pérez, Juan" escribiendo "juan perez" (`02-expedientes.md` §2.8).

Guardar normalizado es lo que hace posible esto: si la base tuviera la misma carátula escrita de tres formas, ninguna búsqueda las juntaría. Con Supabase, esta función pasa a ser una columna generada con `unaccent(lower(...))` y un índice encima.

### 2.3 Diccionarios

Son datos, no código (`src/lib/formato/diccionario.ts`), para poder ampliarlos sin tocar la lógica:

- **Partículas** de nombres propios y **palabras menores** de títulos.
- **Siglas** que conservan mayúsculas: tipos societarios (SA, SRL, SAS), aseguradoras y obras sociales (ART, OSDE, SMG), organismos (AFIP, ANSES, EDET) y siglas judiciales (SAE, CPCC, CCyC). Los tipos societarios se reconocen en cualquier caja porque no son palabras del castellano; el resto solo si venía en mayúsculas, para no convertir la abreviatura `art.` (artículo) en la aseguradora ART.
- **Acentos**: formas correctas de palabras que suelen escribirse sin tilde —nombres de pila, apellidos frecuentes, localidades de Tucumán y el vocabulario del objeto de la carátula (Daños, Sucesión, Expropiación, Tasación, Prescripción)—.

### 2.4 Lo que deliberadamente no hace

- **No corrige la ortografía de las palabras en texto libre.** Decidir entre "publico", "público" y "publicó" requiere entender la oración; equivocarse cambiaría lo que escribió el abogado. El diccionario de acentos se aplica solo a nombres y títulos, donde la palabra es inequívoca.
- **No adivina siglas en minúsculas.** `swiss medical art` queda "Swiss Medical Art": sin mayúsculas no hay forma de distinguir la aseguradora de la abreviatura de artículo.
- **No inventa datos faltantes.** Una carátula sin `c/` ni `s/` se formatea entera como nombre propio, sin suponer partes que no están.

### 2.5 Escape hatch

Configuración → Estudio tiene una preferencia, **"Corregir tildes faltantes"**, para el abogado que trabaja con apellidos que legítimamente van sin tilde (un "Leon" que no es "León"). Apagarla desactiva solo el diccionario de acentos; el resto de la normalización se sigue aplicando porque no admite ambigüedad.

## 3. Funcionalidad

### Hecho

- [x] `nombrePropio`, `titulo` y `oracion` con sus diccionarios, cubiertos por tests.
- [x] Lectura y armado de carátulas en sus tres componentes (`partirCaratula`, `construirCaratula`, `formatearCaratula`), tolerando las variantes `c/`, `contra`, `vs`, `s/`, `sobre`.
- [x] Normalización al guardar en expedientes, tipos de proceso, agentes y datos del estudio.
- [x] `normalizarParaBuscar`, usada por el buscador de expedientes.
- [x] Previsualización en vivo de la carátula en el alta de expedientes.
- [x] Preferencia de corrección de tildes.

### Pendiente

- [ ] Que el abogado amplíe los diccionarios de siglas y acentos desde Configuración (hoy se editan en el código).
- [ ] Aplicar el normalizador en el importador del SAE cuando exista (`09-conector-sae.md`).
- [ ] Normalizar los encabezados de los escritos del editor con las mismas funciones.
- [ ] Revisar carátulas cargadas antes de esta normalización y ofrecer reformatearlas en lote.
