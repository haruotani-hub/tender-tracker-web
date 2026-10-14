import { useEffect, useRef } from "react";
import { fmt, fmtDateTime, PERGUNTAS } from "@/lib/counter-store";
import { identifiedReportPeople, reportData, type Saved } from "@/lib/report-data";
import type { Validacao } from "@/lib/conferences.functions";
import caixaLogo from "@/assets/caixa.svg.asset.json";

type CurrencyReport = ReturnType<typeof reportData>[number];

/** Fit complete content without dropping observations or creating a third sheet. */
export function fitReportSheets(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>(".report-sheet").forEach((sheet) => {
    const content = sheet.querySelector<HTMLElement>(".report-sheet-content");
    if (!content) return;
    content.style.removeProperty("--report-fit");
    const available = sheet.clientHeight - 76;
    const ratio = Math.min(1, available / content.scrollHeight);
    content.style.setProperty("--report-fit", String(ratio));
  });
}

function CurrencyTable({ c }: { c: CurrencyReport }) {
  const real = c.currency.code === "BRL";
  return <section className="report-currency">
    <h2 className="report-band">{real ? "DETALHAMENTO DE APURAÇÃO DOS VALORES EM CUSTÓDIA" : c.currency.name.toUpperCase()}</h2>
    <p className="report-pair"><strong>Saldo do mapa da EGTTV:</strong><span>{fmt(c.currency.code, c.balance)}</span></p>
    <table className="report-table">
      <thead>
        {real && <tr><th>TIPO</th><th colSpan={2}>UTILIZÁVEL</th><th colSpan={2}>DILACERADO</th><th>TOTAIS</th></tr>}
        <tr>{(real ? ["DENOMINAÇÃO", "UNIDADE", "VALOR", "UNIDADE", "VALOR", "VALOR"] : ["TIPO", "UNIDADE", "VALOR"]).map((v, i) => <th key={i}>{v}</th>)}</tr>
      </thead>
      <tbody>{c.rows.map((r) => <tr key={r.label}>
        <th>{r.label}</th>
        <td className={r.usable === null ? "report-unavailable" : ""}>{r.usable ?? "—"}</td>
        <td className={r.usable === null ? "report-unavailable" : ""}>{r.usable === null ? "—" : fmt(c.currency.code, r.usableValue)}</td>
        {real && <><td className={r.damaged === null ? "report-unavailable" : ""}>{r.damaged ?? "—"}</td><td className={r.damaged === null ? "report-unavailable" : ""}>{r.damaged === null ? "—" : fmt(c.currency.code, r.damagedValue)}</td><td>{fmt(c.currency.code, r.total)}</td></>}
      </tr>)}</tbody>
      <tfoot><tr><th>SUBTOTAL</th><td>{c.rows.reduce((a, r) => a + (r.usable ?? 0), 0)}</td><td>{fmt(c.currency.code, c.rows.reduce((a, r) => a + r.usableValue, 0))}</td>{real && <><td>{c.rows.reduce((a, r) => a + (r.damaged ?? 0), 0)}</td><td>{fmt(c.currency.code, c.rows.reduce((a, r) => a + r.damagedValue, 0))}</td><td>{fmt(c.currency.code, c.sum.value)}</td></>}</tr></tfoot>
    </table>
    <p className="report-pair"><strong>Valor físico apurado:</strong><span>{fmt(c.currency.code, c.sum.value)} · {c.sum.pieces} unidades</span></p>
    <p className="report-pair"><strong>Diferença (apurado − mapa):</strong><span>{fmt(c.currency.code, c.difference)}</span></p>
  </section>;
}

function Notes({ title, children }: { title: string; children: string }) {
  return <section className="report-notes"><h2 className="report-band report-observation-band">{title}</h2><p>{children || "—"}</p></section>;
}

export function ReportDocument({ dados, codigo, validacao, exportMode = false }: { dados: Saved; codigo?: string | null; validacao?: Validacao | null; exportMode?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const s = dados.session;
  const data = reportData(dados);
  const real = data.find((c) => c.currency.code === "BRL");
  const foreign = [data.find((c) => c.currency.code === "USD"), data.find((c) => c.currency.code === "EUR")].filter((c): c is CurrencyReport => !!c);
  useEffect(() => {
    const before = () => { if (ref.current) { ref.current.classList.add("report-export"); fitReportSheets(ref.current); } };
    const after = () => { if (ref.current && !exportMode) ref.current.classList.remove("report-export"); };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, [exportMode]);
  const footer = (page: number) => <footer className="report-footer"><span>Código: {codigo ?? s.codigo ?? "—"}</span><span>{page}/2</span></footer>;
  return <article ref={ref} className={`report-document ${exportMode ? "report-export" : ""}`}>
    <section className="report-sheet" aria-label="Página 1 · Real"><div className="report-sheet-content">
      <img className="report-logo" src={caixaLogo.url} alt="CAIXA" />
      <h1 className="report-band report-title">TERMO DE CONFERÊNCIA DE VALORES EM PODER DA EGTTV</h1>
      <p className="report-subtitle">Conferência de Valores - TCV · #INTERNO.CAIXA</p>
      <dl className="report-identification">
        <div><dt>EGTTV / Município / UF</dt><dd>{s.egttv} · {s.cidade}/{s.uf}</dd></div>
        <div><dt>Tipo de conferência</dt><dd>Conferência {s.tipo}</dd></div>
        <div><dt>Início da conferência</dt><dd>{fmtDateTime(s.startedAt)}</dd></div>
        <div><dt>Data do mapa / Turno</dt><dd>{s.dataMapa.split("-").reverse().join("/")} · {s.turno}</dd></div>
      </dl>
      {real && <><CurrencyTable c={real} /><Notes title="OBSERVAÇÕES · REAL">{real.observations}</Notes></>}
      {footer(1)}
    </div></section>
    <section className="report-sheet" aria-label="Página 2 · Moeda estrangeira, questionário e identificação"><div className="report-sheet-content">
      <h2 className="report-band">MOEDA ESTRANGEIRA</h2>
      <div className="report-foreign">{foreign.map((c) => <CurrencyTable key={c.currency.code} c={c} />)}</div>
      <Notes title="OBSERVAÇÕES · MOEDA ESTRANGEIRA">{foreign.filter((c) => c.observations).map((c) => `${c.currency.name}: ${c.observations}`).join("\n")}</Notes>
      {s.observacoes.trim() && <Notes title="OBSERVAÇÕES GERAIS">{s.observacoes}</Notes>}
      <section className="report-questionnaire"><h2 className="report-band">QUESTIONÁRIO · S (SIM) / N (NÃO)</h2><dl>{PERGUNTAS.map((q, i) => <div key={q}><dt>{q}</dt><dd>{s.quest?.[i] === true ? "S" : s.quest?.[i] === false ? "N" : "—"}</dd></div>)}</dl></section>
      <section className="report-declaration"><h2 className="report-band">DECLARAÇÃO DE CONFERÊNCIA E VALIDAÇÃO</h2><p>As informações registradas neste Termo de Conferência de Valores refletem a apuração realizada pelos membros da Comissão de TCV, conforme os dados e as observações apresentados neste documento.</p><p>Após a conferência, os responsáveis abaixo identificados declaram ciência dos resultados apurados, inclusive das eventuais divergências e justificativas registradas, validando eletronicamente as informações de sua responsabilidade.</p></section>
      <div className="report-employees">{[s.employees, s.egttvStaff].map((people, col) => {
        const identified = identifiedReportPeople(people);
        return identified.length > 0 ? <section key={col}><h2 className="report-band">{col ? "TRANSPORTADORA" : "CAIXA"}</h2>{identified.map((person, i) => <div key={i}><p>Nome: {person.name}</p><p>Matrícula: {person.matricula}</p></div>)}</section> : null;
      })}</div>
      <Notes title="SITUAÇÃO DE VALIDAÇÃO EGTTV">{validacao ? `${validacao.concorda ? "validado EGTTV" : "não validado EGTTV"}\nJustificativa: ${validacao.justificativa.trim() || "—"}\n${validacao.nome} · ${validacao.matricula}\n${fmtDateTime(validacao.validadoEm)}` : "Validação EGTTV pendente"}</Notes>
      <p className="report-copies">1ª via - Caixa · 2ª via - Transportadora</p>
      {footer(2)}
    </div></section>
  </article>;
}
