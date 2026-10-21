import { describe, expect, it } from "vitest";
import type { Expediente, Parte } from "@/lib/datos/tipos";
import {
  agruparPartes,
  clienteDeLaNomina,
  faltantesDeCaratula,
  ladoDeRol,
  seNotifica,
} from "./partes";

function parte(parcial: Partial<Parte> & { id: string }): Parte {
  return {
    expedienteId: "ex",
    rol: "otro",
    nombre: parcial.id,
    documento: "",
    domicilioReal: "",
    domicilioElectronico: "",
    telefono: "",
    email: "",
    representaA: "",
    esCliente: false,
    notas: "",
    creadoEn: "2026-01-02T00:00:00.000Z",
    actualizadoEn: "2026-01-02T00:00:00.000Z",
    ...parcial,
  };
}

function expediente(parcial: Partial<Expediente>): Expediente {
  return {
    id: "ex",
    numero: "1",
    anio: "26",
    caratula: "Actor c/ Demandado s/ Objeto",
    actor: "Actor",
    demandado: "Demandado",
    objeto: "Objeto",
    tipoProcesoId: "tp-ordinario",
    etapaActual: "prueba",
    etapaDesde: "2026-01-10",
    centroJudicial: "capital",
    fuero: "Civil y Comercial Común",
    materia: "",
    rolCliente: "actor",
    estado: "en_tramite",
    notas: "",
    creadoEn: "2026-01-02T00:00:00.000Z",
    actualizadoEn: "2026-01-02T00:00:00.000Z",
    ...parcial,
  };
}

describe("ladoDeRol", () => {
  it("pone al citado en garantía del lado de la demandada", () => {
    expect(ladoDeRol("citado_garantia")).toBe("demandada");
    expect(ladoDeRol("demandado")).toBe("demandada");
  });

  it("manda al tercero y a los auxiliares del juzgado al mismo lado", () => {
    expect(ladoDeRol("tercero")).toBe("auxiliares");
    expect(ladoDeRol("perito")).toBe("auxiliares");
    expect(ladoDeRol("mediador")).toBe("auxiliares");
  });
});

describe("agruparPartes", () => {
  it("sin partes no devuelve ningún grupo", () => {
    expect(agruparPartes([])).toEqual([]);
  });

  it("deja afuera los lados vacíos y conserva el orden de los lados", () => {
    const grupos = agruparPartes([
      parte({ id: "p", rol: "perito", nombre: "Perito" }),
      parte({ id: "d", rol: "demandado", nombre: "Demandado" }),
    ]);
    expect(grupos.map((grupo) => grupo.lado)).toEqual(["demandada", "auxiliares"]);
  });

  it("cuelga al letrado de la parte que representa", () => {
    const grupos = agruparPartes([
      parte({ id: "l", rol: "letrado_contraria", nombre: "Letrado", representaA: "d" }),
      parte({ id: "d", rol: "demandado", nombre: "Demandado" }),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].partes).toHaveLength(1);
    expect(grupos[0].partes[0].parte.id).toBe("d");
    expect(grupos[0].partes[0].representantes.map((r) => r.id)).toEqual(["l"]);
  });

  it("un letrado sin representado no se pierde: queda como una fila más", () => {
    const grupos = agruparPartes([
      parte({ id: "l", rol: "letrado_contraria", nombre: "Letrado", representaA: "borrado" }),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].lado).toBe("auxiliares");
    expect(grupos[0].partes[0].parte.id).toBe("l");
  });

  it("ordena cada lado por rol y después por nombre", () => {
    const grupos = agruparPartes([
      parte({ id: "c", rol: "citado_garantia", nombre: "Aseguradora" }),
      parte({ id: "d2", rol: "demandado", nombre: "Zabala" }),
      parte({ id: "d1", rol: "demandado", nombre: "Álvarez" }),
    ]);
    expect(grupos[0].partes.map((fila) => fila.parte.id)).toEqual(["d1", "d2", "c"]);
  });
});

describe("seNotifica", () => {
  it("reclama la casilla del SAE a las partes y a los letrados", () => {
    expect(seNotifica("actor")).toBe(true);
    expect(seNotifica("demandado")).toBe(true);
    expect(seNotifica("citado_garantia")).toBe(true);
    expect(seNotifica("letrado_contraria")).toBe(true);
  });

  it("no se la reclama a quien no se notifica en el juicio", () => {
    expect(seNotifica("perito")).toBe(false);
    expect(seNotifica("mediador")).toBe(false);
    expect(seNotifica("otro")).toBe(false);
  });
});

describe("clienteDeLaNomina", () => {
  it("devuelve la parte marcada como cliente", () => {
    const partes = [parte({ id: "a", rol: "actor" }), parte({ id: "b", esCliente: true })];
    expect(clienteDeLaNomina(partes)?.id).toBe("b");
    expect(clienteDeLaNomina([parte({ id: "a" })])).toBeUndefined();
  });
});

describe("faltantesDeCaratula", () => {
  it("ofrece los dos lados de la carátula cuando la nómina está vacía", () => {
    const faltan = faltantesDeCaratula(
      expediente({ actor: "Nicolás Rogel", demandado: "Swiss Medical ART" }),
      [],
    );
    expect(faltan).toEqual([
      { rol: "actor", nombre: "Nicolás Rogel" },
      { rol: "demandado", nombre: "Swiss Medical ART" },
    ]);
  });

  it("no ofrece un lado que ya está cargado, aunque esté escrito distinto", () => {
    const faltan = faltantesDeCaratula(
      expediente({ actor: "Nicolás Rogel", demandado: "Swiss Medical ART" }),
      [parte({ id: "a", rol: "actor", nombre: "NICOLAS ROGEL" })],
    );
    expect(faltan.map((lado) => lado.rol)).toEqual(["demandado"]);
  });

  it("una carátula sin demandado no ofrece un demandado vacío", () => {
    const faltan = faltantesDeCaratula(
      expediente({ actor: "Rosa Díaz", demandado: "", objeto: "Sucesión" }),
      [],
    );
    expect(faltan.map((lado) => lado.rol)).toEqual(["actor"]);
  });
});
