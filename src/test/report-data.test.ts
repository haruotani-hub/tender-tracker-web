import { describe, expect, it } from "vitest";
import { identifiedReportPeople, reportData, type Saved } from "@/lib/report-data";

const saved: Saved = {
  session: { employees: [], egttv: "Preserve", cidade: "São Paulo", uf: "SP", turno: "Matutino", dataMapa: "2026-10-14", saldo: 60000, saldoEur: 0, saldoUsd: 0, tipo: "Agência", just: { BRL: "Diferença identificada", EUR: "Euro conferido", USD: "Dólar conferido" }, startedAt: null, endedAt: null, observacoes: "Anotação livre", entrada15: null, cinta: null, egttvStaff: [], codigo: null },
  counts: { "BRL|f2c|n|20000": 3, "BRL|f2d|n|20000": 2, "BRL|f1d|n|10000": 4, "BRL|coins|c|1": 7, "EUR|all|n|50000": 2, "USD|all|n|10000": 5 },
};

describe("denomination report", () => {
  it("includes only filled employee identifications, without empty slots", () => {
    const person = { name: "Haruo Otani", matricula: "C123456" };
    expect(identifiedReportPeople([person, { name: "", matricula: "" }, { name: "   ", matricula: "C654321" }])).toEqual([person]);
    expect(identifiedReportPeople([])).toEqual([]);
  });
  it("reports units and values by note type without merging families", () => {
    const real = reportData(saved).find((c) => c.currency.code === "BRL");
    expect(real?.rows[0]).toMatchObject({ usable: 3, damaged: 2, usableValue: 60000, damagedValue: 40000, total: 100000 });
    expect(real?.rows[7]).toMatchObject({ usable: null, damaged: 4, damagedValue: 40000 });
    expect(real?.sum.value).toBe(140007);
    expect(real?.difference).toBe(80007);
  });
  it("includes cent coins as units and cents", () => {
    expect(reportData(saved)[0]?.rows.at(-1)).toMatchObject({ usable: 7, damaged: null, total: 7 });
  });
  it("keeps foreign note quantities and values separate", () => {
    expect(reportData(saved)[1]?.rows[0]).toMatchObject({ usable: 2, total: 100000 });
    expect(reportData(saved)[2]?.rows[0]).toMatchObject({ usable: 5, total: 50000 });
  });
  it("includes each currency justification in its observations", () => {
    expect(reportData(saved).map((c) => c.observations)).toEqual(["Diferença identificada", "Euro conferido", "Dólar conferido"]);
  });
});