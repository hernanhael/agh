import { describe, expect, it } from "vitest";
import type { Estudio, Expediente, Parte } from "@/lib/datos/tipos";
import { encabezadoDeEscrito, parrafosDelCuerpo } from "./encabezado";

function expediente(parcial: Partial<Expediente> = {}): Expediente {
  return {
    id: "ex",
    numero: "1234",
    anio: "26",
    caratula: "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios",
    actor: "Nicolás Rogel",
    demandado: "Swiss Medical ART",
    objeto: "Daños y Perjuicios",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "contestacion",
    etapaDesde: "2026-09-15",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    juzgadoTipo: "Civil y Comercial Común",
    juzgadoNumero: "VI",
    materia: "Daños y Perjuicios",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "",
    creadoEn: "2026-08-01T00:00:00.000Z",
    actualizadoEn: "2026-08-01T00:00:00.000Z",
    ...parcial,
  };
}

function estudio(parcial: Partial<Estudio> = {}): Estudio {
  return {
    nombre: "Hernán Rogel",
    matricula: "CAT 1234",
    cuit: "20-12345678-9",
    domicilioElectronico: "20-12345678-9",
    telefono: "",
    centroJudicialHabitual: "capital",
    modeloPorDefecto: "anthropic/claude-opus-5",
    correccionDeTildes: true,
    actualizadoEn: "2026-01-01T00:00:00.000Z",
    ...parcial,
  };
}

const CLIENTE: Parte = {
  id: "pa",
  expedienteId: "ex",
  rol: "actor",
  nombre: "Nicolás Rogel",
  documento: "25.123.456",
  domicilioReal: "",
  domicilioElectronico: "",
  telefono: "",
  email: "",
  representaA: "",
  esCliente: true,
  notas: "",
  creadoEn: "2026-08-01T00:00:00.000Z",
  actualizadoEn: "2026-08-01T00:00:00.000Z",
};

describe("encabezadoDeEscrito", () => {
  it("arma el encabezado con los metadatos del expediente y del estudio", () => {
    const encabezado = encabezadoDeEscrito({
      expediente: expediente(),
      estudio: estudio(),
      cliente: CLIENTE,
      suma: "Contesta traslado",
    });

    expect(encabezado.suma).toBe("Contesta traslado");
    expect(encabezado.destinatario).toBe(
      "Señor Juez de Primera Instancia en lo Civil y Comercial Común de la VI Nominación",
    );
    expect(encabezado.numero).toBe("Expte. n.º 1234/26");
    expect(encabezado.caratula).toBe(
      "Nicolás Rogel c/ Swiss Medical ART s/ Daños y Perjuicios",
    );
    expect(encabezado.comparecencia).toContain("Hernán Rogel");
    expect(encabezado.comparecencia).toContain("matrícula CAT 1234");
    expect(encabezado.comparecencia).toContain("Expte. n.º 1234/26");
    expect(encabezado.comparecencia).toContain("letrado de Nicolás Rogel");
    expect(encabezado.comparecencia.endsWith("a V.S. respetuosamente digo:")).toBe(true);
    expect(encabezado.firma).toEqual(["Hernán Rogel", "Matrícula CAT 1234"]);
    expect(encabezado.faltantes).toEqual([]);
  });

  it("nombra al fuero con la preposición que le corresponde", () => {
    const civil = encabezadoDeEscrito({
      expediente: expediente({ juzgadoTipo: "Civil en Documentos y Locaciones", juzgadoNumero: "II" }),
      estudio: estudio(),
      suma: "Promueve",
    });
    expect(civil.destinatario).toBe(
      "Señor Juez de Primera Instancia en lo Civil en Documentos y Locaciones de la II Nominación",
    );

    // "En lo Familia y Sucesiones" no se dice.
    const familia = encabezadoDeEscrito({
      expediente: expediente({ juzgadoTipo: "Familia y Sucesiones", juzgadoNumero: "II" }),
      estudio: estudio(),
      suma: "Promueve",
    });
    expect(familia.destinatario).toBe(
      "Señor Juez de Primera Instancia de Familia y Sucesiones de la II Nominación",
    );
  });

  it("sin nómina de partes, toma al cliente del lado que ocupa en la carátula", () => {
    const comoActor = encabezadoDeEscrito({
      expediente: expediente({ rolCliente: "actor" }),
      estudio: estudio(),
      suma: "Contesta",
    });
    expect(comoActor.comparecencia).toContain("letrado de Nicolás Rogel");

    const comoDemandado = encabezadoDeEscrito({
      expediente: expediente({ rolCliente: "demandado" }),
      estudio: estudio(),
      suma: "Contesta",
    });
    expect(comoDemandado.comparecencia).toContain("letrado de Swiss Medical ART");
  });

  it("no inventa lo que falta: lo marca y lo informa", () => {
    const encabezado = encabezadoDeEscrito({
      expediente: expediente({ juzgadoTipo: "", juzgadoNumero: "" }),
      estudio: estudio({ nombre: "", matricula: "", domicilioElectronico: "" }),
      suma: "",
    });

    expect(encabezado.suma).toBe("[[COMPLETAR: qué hace este escrito]]");
    expect(encabezado.destinatario).toBe("Señor Juez [[COMPLETAR: juzgado]]");
    expect(encabezado.comparecencia).toContain("[[COMPLETAR: nombre del abogado]]");
    expect(encabezado.comparecencia).toContain("[[COMPLETAR: matrícula]]");
    expect(encabezado.comparecencia).toContain("[[COMPLETAR: domicilio electrónico]]");

    expect(encabezado.faltantes).toEqual([
      "el juzgado del expediente (pestaña Datos)",
      "el nombre del abogado (Configuración → Estudio)",
      "la matrícula (Configuración → Estudio)",
      "el domicilio electrónico (Configuración → Estudio)",
    ]);
  });

  it("avisa cuando el rol del cliente no es ninguno de los dos lados de la carátula", () => {
    const encabezado = encabezadoDeEscrito({
      expediente: expediente({ rolCliente: "heredero" }),
      estudio: estudio(),
      suma: "Promueve sucesorio",
    });
    expect(encabezado.comparecencia).toContain("[[COMPLETAR: cliente]]");
    expect(encabezado.faltantes).toContain("quién es el cliente en este juicio (pestaña Partes)");
  });
});

describe("parrafosDelCuerpo", () => {
  it("parte el cuerpo en párrafos y descarta las líneas en blanco", () => {
    expect(parrafosDelCuerpo("  Primero.\n\n\nSegundo.  \n")).toEqual(["Primero.", "Segundo."]);
    expect(parrafosDelCuerpo("   ")).toEqual([]);
  });
});
