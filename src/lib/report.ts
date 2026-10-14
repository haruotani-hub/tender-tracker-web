import { CURRENCIES, fmt, fmtDateTime, saldoOf, summarize, type Session } from "@/lib/counter-store";
import type { Validacao } from "@/lib/conferences.functions";

export type Saved = { session: Session; counts: Record<string, number> };

const yn = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");

/** Linhas do relatório: [rótulo, valor] ou título (valor undefined). */
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
    const diff = sum.value - mapa;
    L.push([c.name]);
    L.push(["Saldo do mapa", fmt(c.code, mapa)], ["Contado", `${fmt(c.code, sum.value)} (${sum.pieces} peças)`]);
    if (c.families.length > 1) sum.byFamily.forEach((f) => L.push([`  ${f.family.title} (${f.pieces})`, fmt(c.code, f.value)]));
    L.push(["Diferença", diff === 0 ? "sem diferença" : `${diff > 0 ? "sobra" : "falta"} ${fmt(c.code, Math.abs(diff))}`]);
    const j = s.just?.[c.code]?.trim();
    if (diff !== 0 && j) L.push(["Justificativa", j]);
  }
  L.push(["Finalização"]);
  if (s.observacoes.trim()) L.push(["Observações", s.observacoes]);
  PERGUNTAS.forEach((q, i) => L.push([q, yn(s.quest?.[i] ?? null)]));
  s.egttvStaff.forEach((p, i) => L.push([`EGTTV ${i + 1}`, `${p.name} · ${p.matricula}`]));
  L.push(["Validação EGTTV"]);
  if (validacao) {
    L.push(["Parecer", validacao.concorda ? "Concordo" : "Não concordo"]);
    if (!validacao.concorda) L.push(["Justificativa", validacao.justificativa]);
    L.push(["Validado por", `${validacao.nome} · ${validacao.matricula}`], ["Validado em", fmtDateTime(validacao.validadoEm)]);
  } else L.push(["Situação", "Pendente"]);
  return L;
}

export async function downloadPdf(d: Saved, codigo?: string | null, validacao?: Validacao | null) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 15;
  let y = 18;
  const brk = (h: number) => { if (y + h > 285) { doc.addPage(); y = 18; } };
  doc.setFillColor(0, 102, 179); doc.rect(0, 0, W, 8, "F");
  doc.setFillColor(247, 148, 30); doc.rect(M, 12, 20, 1.2, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(0, 102, 179);
  y = 22; doc.text("Conferência de Valores - TCV", M, y); y += 8;
  doc.setTextColor(0, 0, 0);
  for (const [k, v] of reportLines(d, codigo, validacao)) {
    if (v === undefined) {
      brk(12); y += 3; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 102, 179);
      doc.text(k, M, y); doc.setTextColor(0, 0, 0); y += 6; continue;
    }
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(v, 110) as string[];
    brk(lines.length * 5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(90, 90, 90); doc.text(k, M, y);
    doc.setTextColor(0, 0, 0); doc.text(lines, W - M, y, { align: "right" });
    y += lines.length * 5;
  }
  doc.save(`conferencia-${codigo ?? "tcv"}.pdf`);
}
