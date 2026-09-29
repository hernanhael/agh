import { describe, expect, it } from "vitest";
import {
  aplicarFiltros,
  coincide,
  FILTROS_VACIOS,
  hayFiltros,
  identificador,
  opcionesDeFiltro,
  type Filtros,
} from "./filtros";
import type { Expediente } from "./tipos";

/**
 * Tests de búsqueda y filtrado. Son puros: se arman expedientes en memoria, sin
 * pasar por el almacén, porque es la misma función que corre en el cliente
 * mientras el abogado tipea.
 */

function expediente(parcial: Partial<Expediente>): Expediente {
  return {
    id: parcial.caratula ?? "x",
    numero: "1",
    anio: "26",
    caratula: "",
    actor: "",
    demandado: "",
    objeto: "",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "demanda",
    etapaDesde: "2026-01-01",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    materia: "",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "",
    creadoEn: "2026-01-01T00:00:00.000Z",
    actualizadoEn: "2026-01-01T00:00:00.000Z",
    ...parcial,
  };
}

const ROGEL = expediente({
  id: "rogel",
  numero: "1234",
  anio: "26",
  caratula: "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios",
  actor: "Nicolás Rogel",
  demandado: "Swiss Medical ART",
  objeto: "Daños y Perjuicios",
  materia: "Daños y Perjuicios",
  estado: "en_tramite",
});

const DIAZ = expediente({
  id: "diaz",
  numero: "845",
  anio: "26",
  caratula: "Rosa Díaz s/ Sucesión",
  actor: "Rosa Díaz",
  objeto: "Sucesión",
  materia: "Sucesiones",
  fuero: "Familia y Sucesiones",
  centroJudicial: "concepcion",
  estado: "en_tramite",
  rolCliente: "heredero",
});

const MUNI = expediente({
  id: "muni",
  numero: "9001",
  anio: "26",
  caratula: "Municipalidad de San Miguel de Tucumán c/ María de los Ángeles Pérez s/ Expropiación",
  actor: "Municipalidad de San Miguel de Tucumán",
  demandado: "María de los Ángeles Pérez",
  objeto: "Expropiación",
  materia: "Expropiación",
  estado: "paralizado",
  rolCliente: "demandado",
});

const TODOS = [ROGEL, DIAZ, MUNI];

function buscar(consulta: string): string[] {
  return TODOS.filter((expediente) => coincide(expediente, consulta)).map((e) => e.id);
}

describe("identificador", () => {
  it("usa el formato del SAE", () => {
    expect(identificador(ROGEL)).toBe("1234/26");
    expect(identificador(DIAZ)).toBe("845/26");
  });
});

describe("coincide", () => {
  const casos: Array<[string, string[]]> = [
    ["", ["rogel", "diaz", "muni"]],
    ["   ", ["rogel", "diaz", "muni"]],
    // Por número, entero o parcial
    ["1234", ["rogel"]],
    ["123", ["rogel"]],
    ["845", ["diaz"]],
    ["1234/26", ["rogel"]],
    ["/26", ["rogel", "diaz", "muni"]],
    // Por parte, sin tildes ni mayúsculas
    ["rogel", ["rogel"]],
    ["ROGEL", ["rogel"]],
    ["nicolas", ["rogel"]],
    ["Nicolás", ["rogel"]],
    ["nicolas rogel", ["rogel"]],
    ["rogel nicolas", ["rogel"]], // orden indistinto
    ["diaz", ["diaz"]],
    ["díaz", ["diaz"]],
    // Por demandado
    ["swiss", ["rogel"]],
    ["SWISS MEDICAL", ["rogel"]],
    ["art", ["rogel"]],
    ["maria perez", ["muni"]],
    ["angeles", ["muni"]],
    // Por objeto y materia, con la ñ escrita o no
    ["danos", ["rogel"]],
    ["daños", ["rogel"]],
    ["DAÑOS Y PERJUICIOS", ["rogel"]],
    ["sucesion", ["diaz"]],
    ["sucesión", ["diaz"]],
    ["expropiacion", ["muni"]],
    ["tucuman", ["muni"]],
    // Fragmentos parciales de palabra
    ["roge", ["rogel"]],
    ["municip", ["muni"]],
    // Sin resultados
    ["gomez", []],
    ["9999", []],
    ["rogel diaz", []], // las dos palabras tienen que estar en el mismo expediente
  ];

  it.each(casos)("buscar %j encuentra %j", (consulta, esperados) => {
    expect(buscar(consulta)).toEqual(esperados);
  });

  it("ignora los signos de puntuación de la consulta y del dato", () => {
    const perez = expediente({
      id: "perez",
      caratula: "Pérez, Juan Carlos c/ La Segunda ART s/ Daños",
      actor: "Pérez, Juan Carlos",
    });
    for (const consulta of ["perez juan", "juan carlos perez", "perez, juan", "PEREZ  JUAN"]) {
      expect(coincide(perez, consulta)).toBe(true);
    }
  });
});

describe("aplicarFiltros", () => {
  function filtrar(parcial: Partial<Filtros>): string[] {
    return aplicarFiltros(TODOS, { ...FILTROS_VACIOS, ...parcial }).map((e) => e.id);
  }

  it("sin filtros devuelve todo, en el mismo orden", () => {
    expect(filtrar({})).toEqual(["rogel", "diaz", "muni"]);
  });

  it("filtra por estado", () => {
    expect(filtrar({ estado: "en_tramite" })).toEqual(["rogel", "diaz"]);
    expect(filtrar({ estado: "paralizado" })).toEqual(["muni"]);
    expect(filtrar({ estado: "archivado" })).toEqual([]);
  });

  it("filtra por materia y por fuero", () => {
    expect(filtrar({ materia: "Sucesiones" })).toEqual(["diaz"]);
    expect(filtrar({ fuero: "Familia y Sucesiones" })).toEqual(["diaz"]);
    expect(filtrar({ fuero: "Civil y Comercial Común" })).toEqual(["rogel", "muni"]);
  });

  it("compara materia y fuero sin tildes ni mayúsculas", () => {
    expect(filtrar({ fuero: "civil y comercial comun" })).toEqual(["rogel", "muni"]);
    expect(filtrar({ materia: "EXPROPIACION" })).toEqual(["muni"]);
  });

  it("combina los filtros con la búsqueda", () => {
    expect(filtrar({ estado: "en_tramite", consulta: "rogel" })).toEqual(["rogel"]);
    // El estado excluye al único que coincide con el texto.
    expect(filtrar({ estado: "paralizado", consulta: "rogel" })).toEqual([]);
    expect(filtrar({ fuero: "Civil y Comercial Común", consulta: "tucuman" })).toEqual(["muni"]);
  });
});

describe("hayFiltros", () => {
  it("distingue el estado inicial de uno con filtros puestos", () => {
    expect(hayFiltros(FILTROS_VACIOS)).toBe(false);
    expect(hayFiltros({ ...FILTROS_VACIOS, consulta: "  " })).toBe(false);
    expect(hayFiltros({ ...FILTROS_VACIOS, consulta: "rogel" })).toBe(true);
    expect(hayFiltros({ ...FILTROS_VACIOS, estado: "en_tramite" })).toBe(true);
    expect(hayFiltros({ ...FILTROS_VACIOS, materia: "Sucesiones" })).toBe(true);
    expect(hayFiltros({ ...FILTROS_VACIOS, fuero: "Paz" })).toBe(true);
  });
});

describe("opcionesDeFiltro", () => {
  it("ofrece solo los valores que existen, con su cantidad", () => {
    const opciones = opcionesDeFiltro(TODOS);
    expect(opciones.estados).toEqual([
      { valor: "en_tramite", etiqueta: "En trámite", cantidad: 2 },
      { valor: "paralizado", etiqueta: "Paralizado", cantidad: 1 },
    ]);
    expect(opciones.materias.map((o) => o.etiqueta)).toEqual([
      "Daños y Perjuicios",
      "Expropiación",
      "Sucesiones",
    ]);
    expect(opciones.fueros).toEqual([
      { valor: "Civil y Comercial Común", etiqueta: "Civil y Comercial Común", cantidad: 2 },
      { valor: "Familia y Sucesiones", etiqueta: "Familia y Sucesiones", cantidad: 1 },
    ]);
  });

  it("no ofrece materias vacías", () => {
    const opciones = opcionesDeFiltro([expediente({ id: "sin-materia", materia: "" })]);
    expect(opciones.materias).toEqual([]);
  });

  it("los estados salen en el orden del proceso, no alfabético", () => {
    const opciones = opcionesDeFiltro([
      expediente({ id: "a", estado: "archivado" }),
      expediente({ id: "b", estado: "en_mediacion" }),
      expediente({ id: "c", estado: "en_tramite" }),
    ]);
    expect(opciones.estados.map((o) => o.valor)).toEqual([
      "en_mediacion",
      "en_tramite",
      "archivado",
    ]);
  });
});
