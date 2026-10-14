import { CURRENCIES, fmt, fmtDateTime, saldoOf, PERGUNTAS, summarize } from "@/lib/counter-store";
import { type Saved } from "@/lib/report-data";
import type { Validacao } from "@/lib/conferences.functions";
export type { Saved } from "@/lib/report-data";

const yn = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");

export function reportLines(d: Saved, codigo?: string | null, validacao?: Validacao | null) {
  const s = d.session;
  const L: Array<[string, string?]> = [];
  if (codigo) L.push(["Código", codigo]);
  s.employees.forEach((p, i) => L.push([`Empregado ${i + 1}`, `${p.name} · ${p.matricula}`]));
  L.push(["Tipo", s.tipo], ["EGTTV", s.egttv], ["Local", `${s.cidade}/${s.uf}`]);
  L.push(["Mapa", `${s.dataMapa.split("-").reverse().join("/")} · ${s.turno}`]);
  L.push(["Início", fmtDateTime(s.startedAt)], ["Término", fmtDateTime(s.endedAt)]);
  for (const c of CURRENCIES) {
    const sum = summarize(c, d.counts);
    const mapa = saldoOf(s, c.code);
    L.push([c.name], ["Saldo do mapa", fmt(c.code, mapa)], ["Contado", `${fmt(c.code, sum.value)} (${sum.pieces} peças)`]);
    L.push(["Diferença", fmt(c.code, sum.value - mapa)]);
    const observation = s.just?.[c.code]?.trim();
    if (observation) L.push([`Observações · ${c.name}`, observation]);
  }
  L.push(["Finalização"]);
  if (s.observacoes.trim()) L.push(["Observações gerais", s.observacoes]);
  PERGUNTAS.forEach((q, i) => L.push([q, yn(s.quest?.[i] ?? null)]));
  s.egttvStaff.forEach((p, i) => L.push([`EGTTV ${i + 1}`, `${p.name} · ${p.matricula}`]));
  if (validacao) {
    L.push(["Validação EGTTV", validacao.concorda ? "Concordo" : "Não concordo"], ["Observações da validação", validacao.justificativa], ["Validado por", `${validacao.nome} · ${validacao.matricula}`], ["Validado em", fmtDateTime(validacao.validadoEm)]);
  }
  return L;
}

/** Export the same two sheets used by the print view. */
export async function createReportPdf(d: Saved, codigo?: string | null, validacao?: Validacao | null) {
  const [{ jsPDF }, { default: html2canvas }, { createRoot }, { flushSync }, { createElement }, { ReportDocument, fitReportSheets }] = await Promise.all([
    import("jspdf"), import("html2canvas-pro"), import("react-dom/client"), import("react-dom"), import("react"), import("@/components/report-document"),
  ]);
  const host = document.createElement("div");
  host.className = "report-export-host";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(createElement(ReportDocument, { dados: d, codigo: codigo ?? null, validacao: validacao ?? null, exportMode: true })));
    await document.fonts.ready;
    fitReportSheets(host);
    const sheets = host.querySelectorAll<HTMLElement>(".report-sheet");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    for (const [index, sheet] of Array.from(sheets).entries()) {
      const canvas = await html2canvas(sheet, { scale: 2, logging: false, windowWidth: 1024 });
      if (index > 0) doc.addPage();
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    }
    return doc;
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function downloadPdf(d: Saved, codigo?: string | null, validacao?: Validacao | null) {
  const doc = await createReportPdf(d, codigo, validacao);
  doc.save(`conferencia-${codigo ?? "tcv"}.pdf`);
}
