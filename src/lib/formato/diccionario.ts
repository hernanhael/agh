/**
 * Diccionarios del normalizador de texto.
 *
 * El sistema formatea lo que el abogado escribe (y lo que entra por
 * importación del SAE) para que la presentación visual sea uniforme y
 * ortográficamente correcta: "NICOLAS ROGEL C/ SWISS MEDICAL ART S/ daños y
 * Perjuicios" se guarda y se muestra como "Nicolás Rogel c/ Swiss Medical ART
 * s/ Daños y Perjuicios".
 *
 * Los tres diccionarios son datos, no reglas de código, para que se puedan
 * ampliar sin tocar la lógica. Cuando exista la base de datos (Fase 1,
 * docs/08-roadmap.md) el abogado podrá agregar sus propias entradas de siglas
 * y acentos desde Configuración.
 */

/**
 * Partículas que van en minúscula dentro de un nombre propio, salvo cuando
 * son la primera palabra: "María de los Ángeles", "Juan van Halen".
 */
export const PARTICULAS_NOMBRE: ReadonlySet<string> = new Set([
  "de",
  "del",
  "la",
  "las",
  "lo",
  "los",
  "y",
  "e",
  "da",
  "das",
  "do",
  "dos",
  "di",
  "du",
  "della",
  "van",
  "von",
  "der",
  "den",
  "ter",
  "bin",
  "ibn",
  // "Juan Pérez y otros", "Sucesores de Rosa Díaz"
  "otro",
  "otra",
  "otros",
  "otras",
]);

/**
 * Palabras que van en minúscula dentro de un título (el objeto de la
 * carátula, el nombre de una etapa, el título de un escrito), salvo cuando
 * son la primera palabra: "Daños y Perjuicios por Accidente de Tránsito".
 */
export const PALABRAS_MENORES_TITULO: ReadonlySet<string> = new Set([
  "a",
  "al",
  "ante",
  "bajo",
  "con",
  "contra",
  "de",
  "del",
  "desde",
  "e",
  "el",
  "en",
  "entre",
  "hacia",
  "hasta",
  "la",
  "las",
  "lo",
  "los",
  "o",
  "para",
  "por",
  "s",
  "se",
  "segun",
  "según",
  "sin",
  "sobre",
  "su",
  "sus",
  "tras",
  "u",
  "un",
  "una",
  "y",
]);

/**
 * Siglas que conservan sus mayúsculas. La clave es la sigla sin puntos y en
 * mayúsculas; el valor es cómo debe mostrarse.
 *
 * Incluye tipos societarios, obras sociales y aseguradoras de riesgo que
 * aparecen habitualmente como parte en una carátula, y siglas del ámbito
 * judicial y previsional de Tucumán.
 */
export const SIGLAS: ReadonlyMap<string, string> = new Map([
  // Tipos societarios (ver SIGLAS_INSENSIBLES)
  ["SA", "SA"],
  ["SAS", "SAS"],
  ["SRL", "SRL"],
  ["SCA", "SCA"],
  ["SCS", "SCS"],
  ["SH", "SH"],
  ["SAU", "SAU"],
  ["UTE", "UTE"],
  ["ONG", "ONG"],
  // Seguros, riesgos del trabajo y salud
  ["ART", "ART"],
  ["AFJP", "AFJP"],
  ["OSDE", "OSDE"],
  ["PAMI", "PAMI"],
  ["SMG", "SMG"],
  ["IPSST", "IPSST"],
  ["INSSJP", "INSSJP"],
  ["SSN", "SSN"],
  // Organismos y tributos
  ["AFIP", "AFIP"],
  ["ARCA", "ARCA"],
  ["ANSES", "ANSES"],
  ["DGR", "DGR"],
  ["IVA", "IVA"],
  ["DNI", "DNI"],
  ["LC", "LC"],
  ["LE", "LE"],
  ["CI", "CI"],
  ["CUIT", "CUIT"],
  ["CUIL", "CUIL"],
  ["EDET", "EDET"],
  ["SAT", "SAT"],
  ["YPF", "YPF"],
  ["PJT", "PJT"],
  // Judicial y normativo
  ["SAE", "SAE"],
  ["CPCC", "CPCC"],
  ["CCYC", "CCyC"],
  ["CSJT", "CSJT"],
  ["CSJN", "CSJN"],
  ["LCT", "LCT"],
  ["LDC", "LDC"],
]);

/**
 * Siglas que se reconocen sin importar cómo se hayan escrito, porque ninguna
 * es también una palabra del castellano: "la casa sa" → "La Casa SA".
 *
 * El resto de `SIGLAS` solo se reconoce si venía en mayúsculas, para no
 * convertir la abreviatura "art." (artículo) en la aseguradora "ART".
 */
export const SIGLAS_INSENSIBLES: ReadonlySet<string> = new Set([
  "SA",
  "SAS",
  "SRL",
  "SCA",
  "SCS",
  "SH",
  "SAU",
  "UTE",
]);

/**
 * Formas correctas de palabras que suelen escribirse sin tilde en las
 * carátulas y en los datos importados del Portal del SAE, que trabaja en
 * mayúsculas y sin acentos.
 *
 * La clave es la palabra en minúsculas y **sin marcas diacríticas** (así
 * "DANOS", "daños" y "DAÑOS" caen todas en la misma entrada). El valor es la
 * forma que se muestra.
 *
 * Solo se aplica a nombres propios y títulos (partes y objeto de la
 * carátula, materias, nombres de etapas): son contextos donde la palabra es
 * inequívoca. En texto libre (notas, resúmenes) no se toca la ortografía de
 * las palabras, para no cambiarle el sentido a lo que escribió el abogado
 * ("publico" / "público" / "publicó").
 */
export const ACENTOS: Readonly<Record<string, string>> = {
  // Nombres de pila
  adrian: "Adrián",
  agustin: "Agustín",
  ainhoa: "Ainhoa",
  ambrosio: "Ambrosio",
  anabel: "Anabel",
  andres: "Andrés",
  angel: "Ángel",
  angela: "Ángela",
  angeles: "Ángeles",
  angelica: "Angélica",
  anibal: "Aníbal",
  asuncion: "Asunción",
  belen: "Belén",
  benjamin: "Benjamín",
  ceferino: "Ceferino",
  cesar: "César",
  cristian: "Cristián",
  concepcion: "Concepción",
  damian: "Damián",
  dario: "Darío",
  efrain: "Efraín",
  eleonora: "Eleonora",
  elias: "Elías",
  emilia: "Emilia",
  esteban: "Esteban",
  fabian: "Fabián",
  fatima: "Fátima",
  german: "Germán",
  hector: "Héctor",
  hernan: "Hernán",
  ines: "Inés",
  ivan: "Iván",
  jesus: "Jesús",
  joaquin: "Joaquín",
  jose: "José",
  julian: "Julián",
  lucia: "Lucía",
  luis: "Luis",
  martin: "Martín",
  maria: "María",
  matias: "Matías",
  maximo: "Máximo",
  milagros: "Milagros",
  moises: "Moisés",
  monica: "Mónica",
  nicolas: "Nicolás",
  noelia: "Noelia",
  oscar: "Óscar",
  raul: "Raúl",
  ramon: "Ramón",
  rocio: "Rocío",
  rosalia: "Rosalía",
  ruben: "Rubén",
  sebastian: "Sebastián",
  sofia: "Sofía",
  simon: "Simón",
  tomas: "Tomás",
  valentin: "Valentín",
  veronica: "Verónica",
  victor: "Víctor",
  // Apellidos frecuentes
  alvarez: "Álvarez",
  aranguez: "Aránguez",
  avila: "Ávila",
  baez: "Báez",
  benitez: "Benítez",
  bermudez: "Bermúdez",
  caceres: "Cáceres",
  chavez: "Chávez",
  cordoba: "Córdoba",
  diaz: "Díaz",
  dominguez: "Domínguez",
  enriquez: "Enríquez",
  fernandez: "Fernández",
  galindez: "Galíndez",
  garcia: "García",
  garzon: "Garzón",
  gimenez: "Giménez",
  gomez: "Gómez",
  gonzalez: "González",
  gutierrez: "Gutiérrez",
  guzman: "Guzmán",
  henriquez: "Henríquez",
  hernandez: "Hernández",
  ibanez: "Ibáñez",
  jimenez: "Jiménez",
  juarez: "Juárez",
  lazaro: "Lázaro",
  leon: "León",
  lopez: "López",
  marquez: "Márquez",
  martinez: "Martínez",
  mendez: "Méndez",
  munoz: "Muñoz",
  nieto: "Nieto",
  nunez: "Núñez",
  ordonez: "Ordóñez",
  paez: "Páez",
  perez: "Pérez",
  ramirez: "Ramírez",
  rodriguez: "Rodríguez",
  rios: "Ríos",
  roman: "Román",
  ruiz: "Ruiz",
  sanchez: "Sánchez",
  santillan: "Santillán",
  suarez: "Suárez",
  tellez: "Téllez",
  torrez: "Torrez",
  valdez: "Valdez",
  vazquez: "Vázquez",
  velazquez: "Velázquez",
  yanez: "Yáñez",
  zarate: "Zárate",
  // Localidades y centros judiciales de Tucumán ("Concepción" ya figura
  // arriba como nombre de pila)
  famailla: "Famaillá",
  monteros: "Monteros",
  rio: "Río",
  sali: "Salí",
  tafi: "Tafí",
  tucuman: "Tucumán",
  // Objeto de la carátula y materias
  absolucion: "Absolución",
  accion: "Acción",
  adquisitiva: "Adquisitiva",
  alimentos: "Alimentos",
  ampliacion: "Ampliación",
  apelacion: "Apelación",
  avaluo: "Avalúo",
  canon: "Canon",
  casacion: "Casación",
  cautelar: "Cautelar",
  cesion: "Cesión",
  citacion: "Citación",
  cobro: "Cobro",
  colacion: "Colación",
  conciliacion: "Conciliación",
  consignacion: "Consignación",
  danos: "Daños",
  declaracion: "Declaración",
  demolicion: "Demolición",
  division: "División",
  ejecucion: "Ejecución",
  escrituracion: "Escrituración",
  excepcion: "Excepción",
  exhibicion: "Exhibición",
  expropiacion: "Expropiación",
  filiacion: "Filiación",
  homologacion: "Homologación",
  impugnacion: "Impugnación",
  incidente: "Incidente",
  indemnizacion: "Indemnización",
  informacion: "Información",
  inscripcion: "Inscripción",
  interdiccion: "Interdicción",
  intimacion: "Intimación",
  liquidacion: "Liquidación",
  mediacion: "Mediación",
  medida: "Medida",
  notificacion: "Notificación",
  nulidad: "Nulidad",
  obligacion: "Obligación",
  oposicion: "Oposición",
  particion: "Partición",
  peticion: "Petición",
  posesion: "Posesión",
  prescripcion: "Prescripción",
  proteccion: "Protección",
  reconvencion: "Reconvención",
  reduccion: "Reducción",
  regulacion: "Regulación",
  reivindicacion: "Reivindicación",
  rendicion: "Rendición",
  resolucion: "Resolución",
  restitucion: "Restitución",
  revision: "Revisión",
  simulacion: "Simulación",
  subrogacion: "Subrogación",
  sucesion: "Sucesión",
  sustitucion: "Sustitución",
  tasacion: "Tasación",
  transito: "Tránsito",
  usucapion: "Usucapión",
};
