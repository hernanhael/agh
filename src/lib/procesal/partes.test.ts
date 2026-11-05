import { describe, expect, it } from "vitest";
import type { Expediente, Parte } from "@/lib/datos/tipos";
import {
  aclaracionDe,
  agruparPartes,
  caracterDe,
  clienteDeLaNomina,
  colorDeLado,
  colorDeParte,
  comparece,
  comparecenciaDe,
  faltantesDeCaratula,
  ladoDeRol,
  ladoDelCliente,
  letradosDe,
  llevaLetrado,
  nombreCompleto,
  nombreDeNomina,
  palabraAbogado,
  rotuloDeRol,
  renglonesDeLetrado,
  particularidadDe,
  seNotifica,
} from "./partes";

function parte(parcial: Partial<Parte> & { id: string }): Parte {
  return {
    expedienteId: "ex",
    rol: "otro",
    nombre: parcial.id,
    documento: "",
    domicilioReal: "",
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
  it("reparte los lados entre el pleito y lo que lo rodea", () => {
    expect(ladoDeRol("actor")).toBe("actora");
    expect(ladoDeRol("mediador")).toBe("auxiliares");
  });

  it("la citada en garantía y los terceros tienen lado propio, en el pleito", () => {
    // Vienen del lado del demandado pero no son él: tienen su propia póliza,
    // su propio letrado y su propia contestación.
    expect(ladoDeRol("citado_garantia")).toBe("citada");
    expect(ladoDeRol("tercero")).toBe("terceros");
    expect(ladoDeRol("demandado")).toBe("demandada");
  });

  it("manda a los auxiliares del juzgado al mismo lado", () => {
    expect(ladoDeRol("sindico")).toBe("auxiliares");
    expect(ladoDeRol("perito")).toBe("auxiliares");
    expect(ladoDeRol("mediador")).toBe("auxiliares");
  });
});

describe("agruparPartes", () => {
  it("sin partes no devuelve ningún grupo", () => {
    expect(agruparPartes([])).toEqual([]);
  });

  it("pone a las fallecidas al final de su lado, en orden alfabético", () => {
    const [actora, demandada] = agruparPartes([
      parte({ id: "z", rol: "actor", nombre: "Zoe", apellido: "Zárate", fallecioEl: "2026-10-02" }),
      parte({ id: "c", rol: "actor", nombre: "Nicolás", apellido: "Rogel", esCliente: true }),
      parte({ id: "a", rol: "actor", nombre: "Ana", apellido: "Álvarez", fallecioEl: "2026-01-01" }),
      parte({ id: "m", rol: "actor", nombre: "Gabriela", apellido: "Maidana" }),
      parte({ id: "d", rol: "demandado", nombre: "Swiss Medical ART" }),
    ]);
    // El cliente sigue primero entre los vivos; las fallecidas, abajo y por
    // apellido, aunque una sea anterior al cliente en el alfabeto.
    expect(actora.partes.map((fila) => fila.parte.id)).toEqual(["c", "m", "a", "z"]);
    expect(demandada.partes.map((fila) => fila.parte.id)).toEqual(["d"]);
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

  it("el cliente encabeza su lado, aunque el orden alfabético lo mandaría al final", () => {
    const grupos = agruparPartes([
      parte({ id: "a1", rol: "actor", nombre: "Álvarez" }),
      parte({ id: "a2", rol: "actor", nombre: "Zabala", esCliente: true }),
      parte({ id: "a3", rol: "actor", nombre: "Maidana" }),
    ]);
    expect(grupos[0].partes.map((fila) => fila.parte.id)).toEqual(["a2", "a1", "a3"]);
  });

  it("ordena cada lado por rol y después por nombre", () => {
    const grupos = agruparPartes([
      parte({ id: "d2", rol: "demandado", nombre: "Zabala" }),
      parte({ id: "d1", rol: "demandado", nombre: "Álvarez" }),
    ]);
    expect(grupos[0].partes.map((fila) => fila.parte.id)).toEqual(["d1", "d2"]);
  });

  it("cuelga de cada heredero la parte fallecida a la que sucede", () => {
    const grupos = agruparPartes([
      parte({ id: "a", rol: "actor", nombre: "Rosa Díaz", fallecioEl: "2026-03-14" }),
      parte({ id: "h", rol: "actor", nombre: "Carla Díaz", caracter: "heredero", sucedeA: "a" }),
    ]);
    const heredero = grupos[0].partes.find((fila) => fila.parte.id === "h");
    expect(heredero?.sucedido?.nombre).toBe("Rosa Díaz");
  });

  it("si la parte fallecida no está en la nómina, el heredero queda sin ella", () => {
    const grupos = agruparPartes([
      parte({ id: "h", rol: "actor", caracter: "heredero", sucedeA: "borrada" }),
    ]);
    expect(grupos[0].partes[0].sucedido).toBeUndefined();
  });
});

describe("comparecenciaDe", () => {
  it("al actor lo da por comparecido: presentar la demanda es su comparecencia", () => {
    expect(comparecenciaDe(parte({ id: "a", rol: "actor" }))).toBe("comparecio");
  });

  it("al resto de las partes las deja pendientes, que es el lado seguro del error", () => {
    expect(comparecenciaDe(parte({ id: "d", rol: "demandado" }))).toBe("pendiente");
    expect(comparecenciaDe(parte({ id: "c", rol: "citado_garantia" }))).toBe("pendiente");
  });

  it("a quien no comparece no se le pregunta", () => {
    expect(comparece("perito")).toBe(false);
    expect(comparece("letrado_contraria")).toBe(false);
    expect(comparecenciaDe(parte({ id: "p", rol: "perito" }))).toBe("no_corresponde");
    expect(comparecenciaDe(parte({ id: "l", rol: "letrado_contraria" }))).toBe("no_corresponde");
  });

  it("lo cargado le gana a lo que corresponde al rol", () => {
    expect(comparecenciaDe(parte({ id: "d", rol: "demandado", comparecencia: "rebelde" }))).toBe(
      "rebelde",
    );
    // También al revés: un actor al que se le cargó otra cosa no vuelve a
    // "compareció" por ser actor.
    expect(comparecenciaDe(parte({ id: "a", rol: "actor", comparecencia: "pendiente" }))).toBe(
      "pendiente",
    );
  });
});

describe("caracterDe y particularidadDe", () => {
  it("sin carácter cargado, la parte actúa por derecho propio y no advierte nada", () => {
    expect(caracterDe(parte({ id: "a" }))).toBe("por_si");
    expect(particularidadDe(parte({ id: "a" }))).toBe("");
  });

  it("el carácter especial trae la particularidad que hay que tener presente", () => {
    expect(particularidadDe(parte({ id: "m", caracter: "menor" }))).toContain("Ministerio Pupilar");
    expect(particularidadDe(parte({ id: "h", caracter: "heredero" }))).toContain(
      "vocación hereditaria",
    );
  });
});

describe("rotuloDeRol", () => {
  it("se calla donde la sección ya lo dice", () => {
    // Cada lado del pleito agrupa un solo rol: el título de la sección es el
    // rótulo, y repetirlo en cada tarjeta es decir dos veces lo mismo.
    expect(rotuloDeRol("actor")).toBe("");
    expect(rotuloDeRol("demandado")).toBe("");
    expect(rotuloDeRol("citado_garantia")).toBe("");
    expect(rotuloDeRol("tercero")).toBe("");
  });

  it("lo dice donde la sección mete varios roles", () => {
    expect(rotuloDeRol("perito")).toBe("Perito");
    expect(rotuloDeRol("sindico")).toBe("Síndico");
    // El letrado no cae en ningún lado y va a parar a esa misma columna.
    expect(rotuloDeRol("letrado_contraria")).toBe("Abogado");
  });
});

describe("aclaracionDe", () => {
  it("sin carácter que cambie el lugar, no hay nada que aclarar", () => {
    expect(aclaracionDe(parte({ id: "d", rol: "demandado" }))).toBe("");
    expect(aclaracionDe(parte({ id: "p", rol: "demandado", caracter: "persona_juridica" }))).toBe(
      "",
    );
  });

  it("el heredero nombra a la parte fallecida que sucede", () => {
    const causante = parte({ id: "a", rol: "actor", nombre: "Rosa Díaz" });
    const heredero = parte({ id: "h", rol: "actor", caracter: "heredero", sucedeA: "a" });
    expect(aclaracionDe(heredero, causante)).toBe("Heredero de Rosa Díaz");
  });

  it("sin parte fallecida vinculada, el heredero va solo", () => {
    // El sucesorio: el heredero promueve y no sucede a nadie en el juicio.
    expect(aclaracionDe(parte({ id: "h", rol: "actor", caracter: "heredero" }))).toBe("Heredero");
  });

  it("el carácter que califica y el que reemplaza van con su palabra sola", () => {
    expect(aclaracionDe(parte({ id: "m", rol: "actor", caracter: "menor" }))).toBe("menor");
    expect(
      aclaracionDe(parte({ id: "f", rol: "letrado_contraria", caracter: "defensoria_oficial" })),
    ).toBe("Defensoría Oficial");
  });
});

describe("renglonesDeLetrado", () => {
  it("un letrado particular es un solo renglón", () => {
    expect(renglonesDeLetrado(parte({ id: "l", nombre: "Fernando Ledesma" }))).toEqual({
      nombre: "Fernando Ledesma",
      debajo: "",
    });
  });

  it("la Defensoría se parte en el organismo y cuál es", () => {
    // Da igual cómo esté cargada: el prefijo se saca si está escrito.
    const conPrefijo = parte({
      id: "d",
      nombre: "Defensoría Oficial Civil de Concepción",
      caracter: "defensoria_oficial",
    });
    const sinPrefijo = parte({
      id: "e",
      nombre: "Civil de Concepción",
      caracter: "defensoria_oficial",
    });
    expect(renglonesDeLetrado(conPrefijo)).toEqual({
      nombre: "Defensoría Oficial",
      debajo: "Civil de Concepción",
    });
    expect(renglonesDeLetrado(sinPrefijo)).toEqual({
      nombre: "Defensoría Oficial",
      debajo: "Civil de Concepción",
    });
  });
});

describe("letradosDe", () => {
  it("sin cese, el letrado es el actual", () => {
    const { actuales, anteriores } = letradosDe([parte({ id: "l", rol: "letrado_contraria" })]);
    expect(actuales.map((letrado) => letrado.id)).toEqual(["l"]);
    expect(anteriores).toEqual([]);
  });

  it("separa a los que cesaron y los ordena del más reciente al más viejo", () => {
    const { actuales, anteriores } = letradosDe([
      parte({ id: "viejo", cesoEl: "2024-03-01" }),
      parte({ id: "actual" }),
      parte({ id: "reciente", cesoEl: "2026-09-10" }),
    ]);
    expect(actuales.map((letrado) => letrado.id)).toEqual(["actual"]);
    expect(anteriores.map((letrado) => letrado.id)).toEqual(["reciente", "viejo"]);
  });
});

describe("ladoDelCliente", () => {
  it("lo dice la nómina: el lado de la parte marcada como cliente", () => {
    const partes = [
      parte({ id: "a", rol: "actor" }),
      parte({ id: "d", rol: "demandado", esCliente: true }),
    ];
    expect(ladoDelCliente(expediente({ rolCliente: "actor" }), partes)).toBe("demandada");
  });

  it("sin cliente cargado cae en el rol de la ficha", () => {
    expect(ladoDelCliente(expediente({ rolCliente: "demandado" }), [])).toBe("demandada");
  });

  it("un rol que no dice de qué lado litiga no pinta ningún lado", () => {
    expect(ladoDelCliente(expediente({ rolCliente: "heredero" }), [])).toBeUndefined();
    expect(ladoDelCliente(expediente({ rolCliente: "acreedor" }), [])).toBeUndefined();
  });
});

describe("agruparPartes: áreas", () => {
  it("manda el pleito a un área y lo que lo rodea a la otra", () => {
    const grupos = agruparPartes([
      parte({ id: "a", rol: "actor" }),
      parte({ id: "d", rol: "demandado" }),
      parte({ id: "p", rol: "perito" }),
    ]);
    expect(grupos.map((grupo) => [grupo.lado, grupo.area])).toEqual([
      ["actora", "principal"],
      ["demandada", "principal"],
      ["auxiliares", "secundaria"],
    ]);
  });
});

describe("llevaLetrado", () => {
  it("se lo reclama a quien litiga", () => {
    expect(llevaLetrado("actor")).toBe(true);
    expect(llevaLetrado("demandado")).toBe(true);
    expect(llevaLetrado("tercero")).toBe(true);
  });

  it("no se lo reclama a quien comparece por su cargo", () => {
    // El síndico y el administrador se presentan en el juicio, pero actúan por
    // su cargo y no con un patrocinio: "sin letrado" sería un dato faltante
    // que nunca van a tener.
    expect(llevaLetrado("sindico")).toBe(false);
    expect(llevaLetrado("otro")).toBe(false);
    expect(llevaLetrado("perito")).toBe(false);
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

describe("nombreDeNomina y nombreCompleto", () => {
  it("adelanta el apellido en la nómina y lo deja al final en una frase", () => {
    const rogel = parte({ id: "a", nombre: "Nicolás", apellido: "Rogel" });
    expect(nombreDeNomina(rogel)).toBe("Rogel Nicolás");
    expect(nombreCompleto(rogel)).toBe("Nicolás Rogel");
  });

  it("deja tal cual a quien no tiene apellido: una persona jurídica o una parte vieja", () => {
    const aseguradora = parte({ id: "a", nombre: "Swiss Medical ART" });
    expect(nombreDeNomina(aseguradora)).toBe("Swiss Medical ART");
    expect(nombreCompleto(aseguradora)).toBe("Swiss Medical ART");
  });

  it("ordena cada lado por apellido", () => {
    const [actora] = agruparPartes([
      parte({ id: "z", rol: "actor", nombre: "Ana", apellido: "Zárate" }),
      parte({ id: "b", rol: "actor", nombre: "Zoe", apellido: "Bravo" }),
    ]);
    expect(actora.partes.map((fila) => fila.parte.id)).toEqual(["b", "z"]);
  });

  it("dice de quién hereda en el orden en que se dice", () => {
    const rosa = parte({ id: "r", nombre: "Rosa", apellido: "Díaz" });
    const heredera = parte({ id: "h", caracter: "heredero", sucedeA: "r" });
    expect(aclaracionDe(heredera, rosa)).toBe("Heredero de Rosa Díaz");
  });

  it("reconoce en la carátula a una parte partida en nombre y apellido, en cualquier orden", () => {
    const rogel = parte({ id: "a", rol: "actor", nombre: "Nicolás", apellido: "Rogel" });
    expect(faltantesDeCaratula(expediente({ actor: "Nicolás Rogel", demandado: "" }), [rogel])).toEqual([]);
    expect(faltantesDeCaratula(expediente({ actor: "ROGEL NICOLAS", demandado: "" }), [rogel])).toEqual([]);
  });
});

describe("colorDeParte", () => {
  it("pinta a cada parte con el color de su lado", () => {
    expect(colorDeParte(parte({ id: "a", rol: "actor" }), [])).toBe(colorDeLado("actora"));
    expect(colorDeParte(parte({ id: "d", rol: "demandado" }), [])).toBe(colorDeLado("demandada"));
    expect(colorDeLado("actora")).not.toBe(colorDeLado("demandada"));
  });

  it("le da al letrado el color del lado de su representado", () => {
    const demandada = parte({ id: "d", rol: "demandado" });
    const letrado = parte({ id: "l", rol: "letrado_contraria", representaA: "d" });
    expect(colorDeParte(letrado, [demandada, letrado])).toBe(colorDeLado("demandada"));
  });
});


describe("palabraAbogado", () => {
  it("nombra a cada uno por su género, y sin género usa el masculino", () => {
    expect(palabraAbogado([parte({ id: "a", genero: "femenino" })])).toBe("Abogada");
    expect(palabraAbogado([parte({ id: "a", genero: "masculino" })])).toBe("Abogado");
    expect(palabraAbogado([parte({ id: "a" })])).toBe("Abogado");
  });

  it("varias van en femenino solo si son todas mujeres", () => {
    const ella = parte({ id: "a", genero: "femenino" });
    const otra = parte({ id: "b", genero: "femenino" });
    const el = parte({ id: "c", genero: "masculino" });
    expect(palabraAbogado([ella, otra])).toBe("Abogadas");
    expect(palabraAbogado([ella, el])).toBe("Abogados");
  });
});
