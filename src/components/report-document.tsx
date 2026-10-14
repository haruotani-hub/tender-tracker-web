import { fmt, fmtDateTime, PERGUNTAS } from "@/lib/counter-store";
import { reportData, type Saved } from "@/lib/report-data";
import type { Validacao } from "@/lib/conferences.functions";

export function ReportDocument({ dados, codigo, validacao }: { dados: Saved; codigo?: string | null; validacao?: Validacao | null }) {
  const s = dados.session;
  const data = reportData(dados);
  const band = "bg-report-heading px-2 py-2 text-center text-sm font-bold text-report-paper";
  const td = "border border-report-disabled px-2 py-1 text-right tabular-nums";
  return <article className="space-y-4 bg-report-paper py-3 text-sm text-report-ink">
    <h1 className={band}>TERMO DE CONFERÊNCIA DE VALORES EM PODER DA EGTTV</h1>
    <p className="text-center font-bold">Conferência de Valores - TCV · #INTERNO.CAIXA</p>
    <dl className="grid grid-cols-1 gap-2 border p-3 sm:grid-cols-2">
      <div><dt className="font-bold">EGTTV / Município / UF</dt><dd>{s.egttv} · {s.cidade}/{s.uf}</dd></div>
      <div><dt className="font-bold">Custódia</dt><dd>{s.tipo}</dd></div>
      <div><dt className="font-bold">Início</dt><dd>{fmtDateTime(s.startedAt)}</dd></div>
      <div><dt className="font-bold">Término</dt><dd>{fmtDateTime(s.endedAt)}</dd></div>
      <div><dt className="font-bold">Data do mapa / Turno</dt><dd>{s.dataMapa.split("-").reverse().join("/")} · {s.turno}</dd></div>
      <div><dt className="font-bold">Código</dt><dd className="break-all">{codigo ?? s.codigo ?? "—"}</dd></div>
    </dl>
    {data.sort((a, b) => ["BRL", "USD", "EUR"].indexOf(a.currency.code) - ["BRL", "USD", "EUR"].indexOf(b.currency.code)).map((c) => <section key={c.currency.code} className="space-y-2">
      <h2 className={band}>{c.currency.code === "BRL" ? "DETALHAMENTO DOS VALORES EM CUSTÓDIA · REAL" : `MOEDA ESTRANGEIRA · ${c.currency.name.toUpperCase()}`}</h2>
      <p className="px-2"><strong>Saldo do mapa da EGTTV:</strong> {fmt(c.currency.code, c.balance)}</p>
      <div className="overflow-x-auto" tabIndex={0} aria-label={`Detalhamento de ${c.currency.name}`}>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-report-heading text-report-paper">
            {c.currency.code === "BRL" && <tr><th className={td}>Tipo</th><th colSpan={2} className={td}>Utilizável</th><th colSpan={2} className={td}>Dilacerado</th><th className={td}>Totais</th></tr>}
            <tr>{(c.currency.code === "BRL" ? ["Denominação", "Unidade", "Valor", "Unidade", "Valor", "Valor"] : ["Tipo", "Unidade", "Valor"]).map((v, i) => <th key={i} className={`${td} whitespace-nowrap`}>{v}</th>)}</tr>
          </thead>
          <tbody>{c.rows.map((r) => <tr key={r.label}>
            <th className={`${td} whitespace-nowrap font-normal`}>{r.label}</th>
            <td className={`${td} ${r.usable === null ? "bg-report-disabled" : ""}`}>{r.usable ?? "—"}</td>
            <td className={`${td} whitespace-nowrap ${r.usable === null ? "bg-report-disabled" : ""}`}>{r.usable === null ? "—" : fmt(c.currency.code, r.usableValue)}</td>
            {c.currency.code === "BRL" && <><td className={`${td} ${r.damaged === null ? "bg-report-disabled" : ""}`}>{r.damaged ?? "—"}</td><td className={`${td} whitespace-nowrap ${r.damaged === null ? "bg-report-disabled" : ""}`}>{r.damaged === null ? "—" : fmt(c.currency.code, r.damagedValue)}</td><td className={`${td} whitespace-nowrap`}>{fmt(c.currency.code, r.total)}</td></>}
          </tr>)}</tbody>
          <tfoot><tr className="font-bold"><th className={td}>Subtotal</th><td className={td}>{c.rows.reduce((a, r) => a + (r.usable ?? 0), 0)}</td><td className={`${td} whitespace-nowrap`}>{fmt(c.currency.code, c.rows.reduce((a, r) => a + r.usableValue, 0))}</td>{c.currency.code === "BRL" && <><td className={td}>{c.rows.reduce((a, r) => a + (r.damaged ?? 0), 0)}</td><td className={`${td} whitespace-nowrap`}>{fmt(c.currency.code, c.rows.reduce((a, r) => a + r.damagedValue, 0))}</td><td className={`${td} whitespace-nowrap`}>{fmt(c.currency.code, c.sum.value)}</td></>}</tr></tfoot>
        </table>
      </div>
      <p className="px-2"><strong>Valor físico apurado:</strong> {fmt(c.currency.code, c.sum.value)} · {c.sum.pieces} unidades</p>
      <p className="px-2"><strong>Diferença (apurado − mapa):</strong> {fmt(c.currency.code, c.difference)}</p>
      <h3 className="bg-brand-orange px-2 py-1 text-center font-bold text-report-ink">OBSERVAÇÕES · {c.currency.name.toUpperCase()}</h3>
      <p className="min-h-12 whitespace-pre-wrap border p-3">{c.observations || "—"}</p>
    </section>)}
    {s.observacoes.trim() && <section><h2 className={band}>OBSERVAÇÕES GERAIS</h2><p className="whitespace-pre-wrap border p-3">{s.observacoes}</p></section>}
    <section><h2 className={band}>QUESTIONÁRIO · S (SIM) / N (NÃO)</h2><dl>{PERGUNTAS.map((q, i) => <div key={q} className="flex items-start gap-3 border-b p-2"><dt className="flex-1">{q}</dt><dd className="font-bold">{s.quest?.[i] === true ? "S" : s.quest?.[i] === false ? "N" : "—"}</dd></div>)}</dl></section>
    <p>As informações acima refletem a realidade e, em decorrência, lavrou-se o presente termo em duas vias de igual teor, que após lido e aprovado, vai por todos abaixo assinado para a configuração administrativa do fato.</p>
    <div className="grid gap-4 sm:grid-cols-2">{[s.employees, s.egttvStaff].map((people, col) => <section key={col}><h2 className={band}>{col ? "TRANSPORTADORA" : "CAIXA"}</h2>{Array.from({ length: 3 }, (_, i) => <div key={i} className="border-b px-2 pb-3 pt-8"><p className="border-t pt-1">Nome: {people[i]?.name ?? ""}</p><p>Matrícula: {people[i]?.matricula ?? ""}</p></div>)}</section>)}</div>
    {validacao && <section><h2 className={band}>VALIDAÇÃO EGTTV</h2><p>{validacao.concorda ? "Concordo" : "Não concordo"} · {validacao.nome} · {validacao.matricula}</p><p>{fmtDateTime(validacao.validadoEm)}</p><p className="whitespace-pre-wrap">{validacao.justificativa}</p></section>}
    <p className="font-bold">1ª via - Caixa · 2ª via - Transportadora</p>
  </article>;
}