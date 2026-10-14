import { CURRENCIES, fmt, fmtDateTime, saldoOf, PERGUNTAS, summarize } from "@/lib/counter-store";
import { reportData, type Saved } from "@/lib/report-data";
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

/** Browser-only export; palette is resolved from the shared semantic CSS tokens. */
export async function createReportPdf(d: Saved, codigo?: string | null, validacao?: Validacao | null) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const s = d.session;
  const data = reportData(d);
  const palette = (token: string): [number, number, number] => {
    const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [0, 0, 0];
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    ctx.fillRect(0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    return [pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0];
  };
  const paper = palette("--report-paper"), ink = palette("--report-ink"), band = palette("--report-heading"), accent = palette("--brand-orange"), white = palette("--report-paper"), disabled = palette("--report-disabled");
  doc.setLineWidth(0.25); doc.setDrawColor(...ink);
  let y = 10;
  const cell = (x: number, top: number, w: number, h: number, text: string, fill = paper, bold = false, align: "left" | "center" | "right" = "left", size = 8) => {
    doc.setFillColor(...fill); doc.setTextColor(...(fill === band ? white : ink));
    doc.rect(x, top, w, h, "FD"); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, w - 3) as string[];
    doc.text(lines, align === "left" ? x + 1.5 : align === "right" ? x + w - 1.5 : x + w / 2, top + h / 2 - (lines.length - 1) * size * 0.176 + size * 0.12, { align, lineHeightFactor: 1.1 });
  };
  const title = (text: string, fill = band) => { cell(10, y, 190, 7, text, fill, true, "center", 9); y += 7; };
  const pair = (label: string, value: string) => { cell(10, y, 65, 7, label, band, true); cell(75, y, 125, 7, value); y += 7; };
  const footer = () => {
    doc.setTextColor(...ink); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Código: ${codigo ?? s.codigo ?? "—"}`, 10, 287);
    doc.text(`Término: ${fmtDateTime(s.endedAt)}`, 200, 287, { align: "right" });
  };
  const nextPage = () => { footer(); doc.addPage(); y = 10; };
  const notes = (label: string, text: string, minHeight = 16) => {
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text || "—", 186) as string[];
    const perPage = 52;
    for (let i = 0; i < lines.length; i += perPage) {
      const chunk = lines.slice(i, i + perPage);
      const h = Math.max(minHeight, chunk.length * 3.8 + 5);
      if (y + h + 7 > 280) nextPage();
      title(i ? `${label} (continuação)` : label, accent);
      cell(10, y, 190, h, chunk.join("\n")); y += h + 2;
    }
  };
  title("TERMO DE CONFERÊNCIA DE VALORES EM PODER DA EGTTV");
  cell(10, y, 190, 6, "Conferência de Valores - TCV · #INTERNO.CAIXA", band, true, "center"); y += 6;
  pair("EGTTV / MUNICÍPIO / UF", `${s.egttv} · ${s.cidade} / ${s.uf}`);
  pair("DATA / HORA DE INÍCIO", fmtDateTime(s.startedAt));
  pair("CUSTÓDIA", `${s.tipo === "Agência" ? "[X]" : "[ ]"} Agência     ${s.tipo === "PAE" ? "[X]" : "[ ]"} PAE`);
  pair("DATA DO MAPA / TURNO", `${s.dataMapa.split("-").reverse().join("/")} · ${s.turno}`);
  const real = data.find((c) => c.currency.code === "BRL");
  if (real) {
    pair("SALDO DO MAPA DA EGTTV", fmt("BRL", real.balance));
    title("DETALHAMENTO DA APURAÇÃO DOS VALORES EM CUSTÓDIA");
    const widths = [46, 23, 31, 23, 31, 36];
    const row = (values: string[], h = 6, header = false, unavailable: number[] = []) => {
      let x = 10;
      values.forEach((v, i) => { const width = widths[i]; if (width === undefined) return; cell(x, y, width, h, v, header ? band : unavailable.includes(i) ? disabled : paper, header, i ? "right" : "left", 7.5); x += width; }); y += h;
    };
    row(["TIPO", "UTILIZÁVEL", "", "DILACERADO", "", "TOTAIS"], 6, true);
    row(["DENOMINAÇÃO", "UNIDADE", "VALOR", "UNIDADE", "VALOR", "VALOR"], 6, true);
    for (const r of real.rows) row([r.label, r.usable === null ? "—" : String(r.usable), r.usable === null ? "—" : fmt("BRL", r.usableValue), r.damaged === null ? "—" : String(r.damaged), r.damaged === null ? "—" : fmt("BRL", r.damagedValue), fmt("BRL", r.total)], 5.8, false, [...(r.usable === null ? [1, 2] : []), ...(r.damaged === null ? [3, 4] : [])]);
    row(["SUBTOTAL", String(real.rows.reduce((a, r) => a + (r.usable ?? 0), 0)), fmt("BRL", real.rows.reduce((a, r) => a + r.usableValue, 0)), String(real.rows.reduce((a, r) => a + (r.damaged ?? 0), 0)), fmt("BRL", real.rows.reduce((a, r) => a + r.damagedValue, 0)), fmt("BRL", real.sum.value)], 7, true);
    pair("VALOR FÍSICO APURADO", fmt("BRL", real.sum.value));
    pair("DIFERENÇA (APURADO - MAPA)", fmt("BRL", real.difference));
    notes("OBSERVAÇÕES · REAL", real.observations, 22);
  }
  nextPage();
  title("MOEDA ESTRANGEIRA");
  const foreign = [data.find((c) => c.currency.code === "USD"), data.find((c) => c.currency.code === "EUR")];
  const top = y;
  let bottom = top;
  foreign.forEach((c, col) => {
    if (!c) return;
    const x = col ? 107 : 10; let yy = top;
    cell(x, yy, 93, 7, c.currency.name.toUpperCase(), band, true, "center"); yy += 7;
    cell(x, yy, 93, 7, `Saldo do mapa: ${fmt(c.currency.code, c.balance)}`); yy += 7;
    ["TIPO", "UNIDADE", "VALOR"].forEach((v, i) => cell(x + i * 31, yy, 31, 6, v, band, true, "center")); yy += 6;
    c.rows.forEach((r) => { [r.label, String(r.usable), fmt(c.currency.code, r.total)].forEach((v, i) => cell(x + i * 31, yy, 31, 6, v, paper, false, "right")); yy += 6; });
    cell(x, yy, 93, 7, `Valor físico apurado: ${fmt(c.currency.code, c.sum.value)}`, paper, true); yy += 7;
    cell(x, yy, 93, 7, `Diferença: ${fmt(c.currency.code, c.difference)}`); yy += 7;
    bottom = Math.max(bottom, yy);
  });
  y = bottom + 3;
  notes("OBSERVAÇÕES · MOEDA ESTRANGEIRA", foreign.filter((c) => c?.observations).map((c) => `${c?.currency.name}: ${c?.observations}`).join("\n"), 16);
  if (s.observacoes.trim()) notes("OBSERVAÇÕES GERAIS", s.observacoes);
  if (y + 55 > 280) nextPage();
  title("QUESTIONÁRIO · S (SIM) / N (NÃO)");
  PERGUNTAS.forEach((q, i) => { cell(10, y, 178, 8, q, paper, false, "left", 7.3); cell(188, y, 12, 8, s.quest?.[i] === true ? "S" : s.quest?.[i] === false ? "N" : "—", paper, true, "center"); y += 8; });
  if (y + 77 > 280) nextPage();
  cell(10, y, 190, 13, "As informações acima refletem a realidade e, em decorrência, lavrou-se o presente termo em duas vias de igual teor, que após lido e aprovado, vai por todos abaixo assinado para a configuração administrativa do fato.", paper, false, "left", 8); y += 13;
  const startSign = y;
  [s.employees, s.egttvStaff].forEach((people, col) => {
    const x = col ? 107 : 10; let yy = startSign;
    cell(x, yy, 93, 6, col ? "TRANSPORTADORA" : "CAIXA", band, true, "center"); yy += 6;
    for (let i = 0; i < 3; i++) {
      cell(x, yy, 93, 18, `Assinatura: ___________________________________\nNome: ${people[i]?.name ?? ""}\nMatrícula: ${people[i]?.matricula ?? ""}`, paper, false, "left", 7.5); yy += 18;
    }
  }); y += 60;
  if (validacao) notes("VALIDAÇÃO EGTTV", `${validacao.concorda ? "Concordo" : "Não concordo"} · ${validacao.nome} · ${validacao.matricula}\n${fmtDateTime(validacao.validadoEm)}\n${validacao.justificativa || ""}`);
  if (y + 6 > 280) nextPage();
  cell(10, y, 190, 6, "1ª via - Caixa     ·     2ª via - Transportadora", paper, true);
  footer();
  return doc;
}

export async function downloadPdf(d: Saved, codigo?: string | null, validacao?: Validacao | null) {
  const doc = await createReportPdf(d, codigo, validacao);
  doc.save(`conferencia-${codigo ?? "tcv"}.pdf`);
}
