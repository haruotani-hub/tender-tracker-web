import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { Nav } from "@/components/counter";
import { PeopleEditor, btnCls, validPeople } from "@/components/identity-gate";
import {
  CURRENCIES, fmt, saldoOf, fmtDateTime, resetAll, summarize, updateSession, useCounts, useSession, type Person,
} from "@/lib/counter-store";

export const Route = createFileRoute("/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo e finalização da conferência" },
      { name: "description", content: "Somatória final, diferença com o mapa da EGTTV, questionário e relatório da conferência." },
      { property: "og:title", content: "Resumo da conferência" },
      { property: "og:description", content: "Somatória, diferença, justificativa e relatório final." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Resumo,
});

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <p className="font-display text-sm font-bold">{label}</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            className={`h-11 rounded-lg border font-display font-bold ${value === v ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {v ? "Sim" : "Não"}
          </button>
        ))}
      </div>
    </div>
  );
}

const yn = (v: boolean | null) => (v === null ? "—" : v ? "Sim" : "Não");

function Resumo() {
  const counts = useCounts();
  const { session: ss } = useSession();
  const [just, setJust] = useState(ss.justificativa);
  const [e15, setE15] = useState<boolean | null>(ss.entrada15);
  const [cinta, setCinta] = useState<boolean | null>(ss.cinta);
  const [staff, setStaff] = useState<Person[]>(ss.egttvStaff.length ? ss.egttvStaff : [{ name: "", matricula: "" }]);

  const rows = CURRENCIES.map((c) => ({ c, s: summarize(c, counts) }));
  const diffs = rows.map(({ c, s }) => ({ c, mapa: saldoOf(ss, c.code), counted: s.value, d: s.value - saldoOf(ss, c.code) }));
  const hasDiff = diffs.some((x) => x.d !== 0);
  const finished = !!ss.endedAt;
  const ok = (!hasDiff || just.trim().length > 0) && e15 !== null && cinta !== null && validPeople(staff);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col font-sans">
      <header className="border-b bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <p className="font-display text-xs font-bold uppercase tracking-widest opacity-70">
          {finished ? "Relatório da conferência" : "Resumo"}
        </p>
        {diffs.map(({ c, mapa, counted, d }) => (
          <div key={c.code} className="mt-1">
            <p className="font-mono text-xl font-bold leading-tight">
              {c.name}: {d === 0 ? "sem diferença" : `${d > 0 ? "sobra" : "falta"} ${fmt(c.code, Math.abs(d))}`}
            </p>
            <p className="font-mono text-xs opacity-80">Mapa {fmt(c.code, mapa)} · Contado {fmt(c.code, counted)}</p>
          </div>
        ))}
      </header>

      <main className="flex-1 space-y-4 px-4 py-5">
        <section className="rounded-2xl border bg-card p-4 font-mono text-sm">
          <dl className="space-y-1">
            {ss.employees.map((p, i) => (
              <div key={i} className="flex justify-between gap-2"><dt className="text-muted-foreground">Empregado {i + 1}</dt><dd className="text-right">{p.name} · {p.matricula}</dd></div>
            ))}
            <div className="flex justify-between"><dt className="text-muted-foreground">Tipo</dt><dd>{ss.tipo}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">EGTTV</dt><dd>{ss.egttv}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Local</dt><dd>{ss.cidade}/{ss.uf}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Mapa</dt><dd>{ss.dataMapa.split("-").reverse().join("/")} · {ss.turno}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Início</dt><dd>{fmtDateTime(ss.startedAt)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Término</dt><dd>{fmtDateTime(ss.endedAt)}</dd></div>
          </dl>
        </section>

        {rows.map(({ c, s }) => (
          <section key={c.code} className="rounded-2xl border bg-card p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-extrabold">{c.name}</h2>
              <span className="font-mono text-xl font-bold">{fmt(c.code, s.value)}</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">{s.pieces} {s.pieces === 1 ? "peça" : "peças"}</p>
            {c.families.length > 1 && (
              <dl className="mt-3 space-y-1 border-t pt-3 font-mono text-sm">
                {s.byFamily.map(({ family, value, pieces }) => (
                  <div key={family.id} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{family.title} ({pieces})</dt><dd>{fmt(c.code, value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}

        {finished ? (
          <>
            <section className="space-y-1 rounded-2xl border bg-card p-4 font-mono text-sm">
              {hasDiff && <p><span className="text-muted-foreground">Justificativa: </span>{ss.justificativa}</p>}
              <p><span className="text-muted-foreground">Entrada liberada em até 15 min: </span>{yn(ss.entrada15)}</p>
              <p><span className="text-muted-foreground">Solicitada abertura de cinta(s): </span>{yn(ss.cinta)}</p>
              {ss.egttvStaff.map((p, i) => (
                <p key={i}><span className="text-muted-foreground">EGTTV {i + 1}: </span>{p.name} · {p.matricula}</p>
              ))}
            </section>
            <div className="grid grid-cols-2 gap-2 print:hidden">
              <button onClick={() => window.print()} className={`${btnCls} flex items-center justify-center gap-2`}><Printer className="size-4" /> Imprimir</button>
              <button onClick={() => { if (confirm("Iniciar nova conferência? Os dados atuais serão apagados.")) resetAll(); }}
                className="h-12 rounded-lg border bg-card font-display font-bold">Nova conferência</button>
            </div>
          </>
        ) : (
          <section className="space-y-4 rounded-2xl border bg-card p-4">
            {hasDiff && (
              <label className="block">
                <span className="font-display text-sm font-bold text-destructive">Justifique a(s) diferença(s) apontada(s)</span>
                <textarea value={just} maxLength={1000} onChange={(e) => setJust(e.target.value)} rows={4}
                  className="mt-1 w-full rounded-lg border bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring" />
              </label>
            )}
            <YesNo label="Foi liberada a entrada em até 15 min?" value={e15} onChange={setE15} />
            <YesNo label="Foi solicitada abertura de cinta(s) para conferência?" value={cinta} onChange={setCinta} />
            <div>
              <p className="mb-2 font-display text-sm font-bold">Empregados da EGTTV que acompanharam (até 3)</p>
              <PeopleEditor people={staff} onChange={setStaff} matLabel="Matrícula funcional" />
            </div>
            <button disabled={!ok} className={btnCls}
              onClick={() => updateSession({
                justificativa: !hasDiff ? "" : just.trim(), entrada15: e15, cinta,
                egttvStaff: staff.map((p) => ({ name: p.name.trim(), matricula: p.matricula })),
                endedAt: new Date().toISOString(),
              })}>
              Finalizar conferência
            </button>
          </section>
        )}
      </main>
      <div className="print:hidden"><Nav /></div>
    </div>
  );
}
