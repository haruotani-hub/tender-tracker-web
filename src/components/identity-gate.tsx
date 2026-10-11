import { Button } from "@/components/ui/button";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  EGTTVS, TIPOS, TURNOS, UFS, loadSession, parseMoney, updateSession, useSession, type Person,
} from "@/lib/counter-store";

export const inputCls =
  "mt-1 h-12 w-full rounded-lg border bg-card px-3 text-base outline-none focus:ring-2 focus:ring-ring";
export const btnCls =
  "h-12 w-full rounded-lg bg-primary font-display text-base font-bold text-primary-foreground disabled:opacity-40";

// Primeira letra de cada nome em maiúscula, mantendo o resto como digitado
export const maskName = (v: string) =>
  v
    .replace(/[^\p{L}\p{M}'’\- ]/gu, "")
    .replace(/(^\s*|[ \t])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());

// Matrícula Caixa: letra C seguida de até 6 números (ex.: C123456)
export const maskCaixaMatricula = (v: string) => `C${v.toUpperCase().replace(/[^0-9]/g, "").slice(0, 6)}`;

export type MatKind = "caixa" | "livre";
export const matriculaOk = (m: string, kind: MatKind) =>
  kind === "caixa" ? /^C\d{6}$/.test(m) : m.trim().length > 0;

export const validPeople = (ps: Person[], kind: MatKind = "caixa") =>
  ps.length > 0 && ps.every((p) => p.name.trim().split(/\s+/).length >= 2 && matriculaOk(p.matricula, kind));

export function PeopleEditor({ people, onChange, matLabel, matKind = "caixa" }: { people: Person[]; onChange: (p: Person[]) => void; matLabel: string; matKind?: MatKind }) {
  const set = (i: number, p: Partial<Person>) => onChange(people.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-4">
      {people.map((p, i) => (
        <div key={i} className="space-y-2 rounded-lg border bg-secondary/40 p-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold uppercase tracking-normal text-muted-foreground">Empregado {i + 1}</span>
            {people.length > 1 && (
              <Button variant="ghost" type="button" aria-label="Remover" onClick={() => onChange(people.filter((_, j) => j !== i))}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
          <label className="block"><span className="font-display text-sm font-bold">Nome completo</span>
            <input value={p.name} onChange={(e) => set(i, { name: maskName(e.target.value) })} className={inputCls} /></label>
          <label className="block"><span className="font-display text-sm font-bold">{matLabel}</span>
            <input
              value={p.matricula}
              onChange={(e) => set(i, { matricula: matKind === "caixa" ? maskCaixaMatricula(e.target.value) : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
              placeholder={matKind === "caixa" ? "C000000" : undefined}
              inputMode={matKind === "caixa" ? "numeric" : "text"}
              className={`${inputCls} font-mono`} /></label>
        </div>
      ))}
      {people.length < 3 && (
        <Button variant="ghost" type="button" onClick={() => onChange([...people, { name: "", matricula: "" }])}
          className="flex h-11 w-full items-center justify-center gap-1 rounded-lg border border-dashed font-display text-sm font-bold">
          <Plus className="size-4" /> Adicionar empregado
        </Button>
      )}
    </div>
  );
}

function Shell({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-8 font-sans">
      <div className="mb-8 border-b border-border pb-5">
        <p className="font-display text-lg font-bold text-primary">Conferência de Valores - TCV</p>
        <div className="mt-3 h-1 w-12 bg-brand-orange" />
      </div>
      <p className="font-display text-xs font-bold uppercase tracking-normal text-muted-foreground">Etapa {step} de 3</p>
      <h1 className="mt-1 font-display text-3xl font-bold">{title}</h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function IdentityGate({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const [people, setPeople] = useState<Person[]>([{ name: "", matricula: "" }]);
  const [egttv, setEgttv] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [turno, setTurno] = useState("");
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState("");
  const [saldo, setSaldo] = useState("");
  const [sEur, setSEur] = useState("");
  const [sUsd, setSUsd] = useState("");
  useEffect(() => loadSession(), []);

  if (!ready) return null;

  if (session.employees.length === 0) {
    return (
      <Shell step={1} title="Identificação dos empregados">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (validPeople(people)) updateSession({ employees: people.map((p) => ({ name: p.name.trim(), matricula: p.matricula })) }); }}>
          <PeopleEditor people={people} onChange={setPeople} matLabel="Matrícula Caixa" />
          <Button variant="ghost" type="submit" disabled={!validPeople(people)} className={btnCls}>Continuar</Button>
          <p className="text-xs text-muted-foreground">Até 3 empregados. Nome e sobrenome; matrícula no formato C seguido de 6 números (ex.: C123456).</p>
        </form>
      </Shell>
    );
  }

  if (!session.egttv) {
    const ok = egttv && cidade.trim() && uf;
    return (
      <Shell step={2} title="Dados da EGTTV">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (ok) updateSession({ egttv, cidade: cidade.trim(), uf }); }}>
          <label className="block"><span className="font-display text-sm font-bold">EGTTV</span>
            <select value={egttv} onChange={(e) => setEgttv(e.target.value)} className={inputCls}>
              <option value="">Selecione…</option>{EGTTVS.map((x) => <option key={x}>{x}</option>)}
            </select></label>
          <label className="block"><span className="font-display text-sm font-bold">Município/Cidade</span>
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputCls} /></label>
          <label className="block"><span className="font-display text-sm font-bold">UF</span>
            <select value={uf} onChange={(e) => setUf(e.target.value)} className={inputCls}>
              <option value="">Selecione…</option>{UFS.map((x) => <option key={x}>{x}</option>)}
            </select></label>
          <Button variant="ghost" type="submit" disabled={!ok} className={btnCls}>Continuar</Button>
        </form>
      </Shell>
    );
  }

  if (!session.startedAt) {
    const ok = tipo && turno && data;
    return (
      <Shell step={3} title="Mapa da EGTTV">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (ok) updateSession({ turno, dataMapa: data, saldo: parseMoney(saldo), saldoEur: parseMoney(sEur), saldoUsd: parseMoney(sUsd), tipo, startedAt: new Date().toISOString() }); }}>
          <p className="rounded-lg bg-secondary px-3 py-2 text-sm">{session.egttv} · {session.cidade}/{session.uf}</p>
          <div>
            <span className="font-display text-sm font-bold">Tipo de conferência</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <Button variant="ghost" key={t} type="button" onClick={() => setTipo(t)}
                  className={`h-12 rounded-lg border font-display font-bold ${tipo === t ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t}</Button>
              ))}
            </div>
          </div>
          <label className="block"><span className="font-display text-sm font-bold">Turno</span>
            <select value={turno} onChange={(e) => setTurno(e.target.value)} className={inputCls}>
              <option value="">Selecione…</option>{TURNOS.map((x) => <option key={x}>{x}</option>)}
            </select></label>
          <label className="block"><span className="font-display text-sm font-bold">Data do mapa</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputCls} /></label>
          <label className="block"><span className="font-display text-sm font-bold">Saldo do mapa · Real (R$)</span>
            <input inputMode="decimal" placeholder="0,00" value={saldo} onChange={(e) => setSaldo(e.target.value.replace(/[^\d.,]/g, ""))}
              className={`${inputCls} font-mono`} /></label>
          <label className="block"><span className="font-display text-sm font-bold">Saldo do mapa · Dólar (US$)</span>
            <input inputMode="decimal" placeholder="0,00" value={sUsd} onChange={(e) => setSUsd(e.target.value.replace(/[^\d.,]/g, ""))}
              className={`${inputCls} font-mono`} /></label>
          <label className="block"><span className="font-display text-sm font-bold">Saldo do mapa · Euro (€)</span>
            <input inputMode="decimal" placeholder="0,00" value={sEur} onChange={(e) => setSEur(e.target.value.replace(/[^\d.,]/g, ""))}
              className={`${inputCls} font-mono`} /></label>
          <Button variant="ghost" type="submit" disabled={!ok} className={btnCls}>Iniciar conferência</Button>
        </form>
      </Shell>
    );
  }

  return <>{children}</>;
}
