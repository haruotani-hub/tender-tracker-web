import { describe, expect, it, vi } from "vitest";
import { createReportPdf } from "@/lib/report";
import type { Saved } from "@/lib/report-data";

vi.mock("html2canvas-pro", () => ({
  default: vi.fn(async () => ({
    toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC",
  })),
}));

describe("two-page report export", () => {
  it("exports exactly two A4 pages even with all observation fields populated", async () => {
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
    const longNote = "Conferência de valores. ".repeat(40);
    const saved: Saved = {
      session: { employees: [], egttv: "Preserve", cidade: "São Paulo", uf: "SP", turno: "Matutino", dataMapa: "2026-10-14", saldo: 0, saldoEur: 0, saldoUsd: 0, tipo: "Agência", just: { BRL: longNote, EUR: longNote, USD: longNote }, startedAt: null, endedAt: null, observacoes: longNote, entrada15: null, cinta: null, quest: [true, true, true, true, true, true], egttvStaff: [], codigo: null },
      counts: {},
    };
    const pdf = await createReportPdf(saved);
    expect(pdf.getNumberOfPages()).toBe(2);
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    expect(document.querySelector(".report-export-host")).toBeNull();
  });
});