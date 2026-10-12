import { Button } from "@/components/ui/button";
import { QuantityCalculator } from "@/components/quantity-calculator";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  CURRENCIES, fmt, keyOf, saldoOf, resetCurrency, setQty, summarize, updateSession, useCounts, useSession,
  type Currency, type Family,
} from "@/lib/counter-store";

const label = (sym: string, c: number) =>
  c >= 100 ? `${sym} ${c / 100}` : `${c} ${c === 1 ? "centavo" : "centavos"}`;

function Row({ cur, k, value }: { cur: Currency; k: string; value: number }) {
  const counts = useCounts();
  const qty = counts[k] ?? 0;
  const set = (n: number) => setQty(k, Math.max(0, Math.min(99999, n)));
  const l = label(cur.symbol, value);
  return (
    <div className="space-y-2 rounded-lg border bg-card px-3 py-2">
      <div className="group flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-bold leading-tight">{l}</div>
        <div className="font-mono text-xs text-muted-foreground">{fmt(cur.code, value * qty)}</div>
      </div>
      <Button variant="ghost" aria-label={`Diminuir ${l}`} onClick={() => set(qty - 1)}
        className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground active:scale-95">
        <Minus className="size-4" />
      </Button>
      <input
        inputMode="numeric" aria-label={`Quantidade de ${l}`}
        value={qty === 0 ? "" : qty} placeholder="0"
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
        className="h-10 w-16 rounded-lg border bg-background text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-ring"
      />
      <Button variant="ghost" aria-label={`Aumentar ${l}`} onClick={() => set(qty + 1)}
        className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground active:scale-95">
        <Plus className="size-4" />
      </Button>
      <QuantityCalculator label={l} quantity={qty} onTransfer={set} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[-1000, -100, 100, 1000].map((d) => (
          <Button variant="ghost" key={d} aria-label={`${d > 0 ? "Somar" : "Subtrair"} ${Math.abs(d)} em ${l}`} onClick={() => set(qty + d)}
            className={`h-9 rounded-lg font-mono text-sm font-bold active:scale-95 ${d > 0 ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>
            {d > 0 ? "+" : "−"}{Math.abs(d)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function Group({ cur, f, kind, title, list }: { cur: Currency; f: Family; kind: "n" | "c"; title: string; list: number[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xs font-bold uppercase tracking-normal text-muted-foreground">{title}</h3>
      {list.map((v) => (
        <Row key={v} cur={cur} k={keyOf(cur.code, f.id, kind, v)} value={v} />
      ))}
    </div>
  );
}

export function Nav() {
  const items = [
    ...CURRENCIES.map((c) => ({ to: c.slug, text: c.name })),
    { to: "/resumo" as const, text: "Resumo" },
  ];
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t bg-card">
      {items.map((i) => (
        <Link key={i.to} to={i.to}
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-primary text-primary-foreground" }}
          className="py-3 text-center font-display text-sm font-bold">
          {i.text}
        </Link>
      ))}
    </nav>
  );
}

export function CurrencyPage({ cur }: { cur: Currency }) {
  const counts = useCounts();
  const s = summarize(cur, counts);
  const hasFamilies = cur.families.length > 1;


  const { session } = useSession();
  const isBRL = true;
  const mapa = saldoOf(session, cur.code);
  const remaining = mapa - s.value;
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col font-sans">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-normal opacity-70">
            {"Saldo restante · " + cur.name} · {s.pieces} {s.pieces === 1 ? "peça" : "peças"}
          </p>
          <p className="font-mono text-3xl font-bold leading-tight break-words">{fmt(cur.code, remaining)}</p>
          {isBRL && (
            <p className="font-mono text-xs opacity-80">Mapa {fmt(cur.code, mapa)} · Contado {fmt(cur.code, s.value)}</p>
          )}
        </div>
        <Button variant="ghost" onClick={() => resetCurrency(cur.code)}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 font-display text-xs font-bold text-accent-foreground active:scale-95">
          <RotateCcw className="size-3.5" /> Zerar
        </Button>
      </header>

      <main className="flex-1 space-y-6 px-4 py-5">
        {s.byFamily.map(({ family: f, value }) => (
          <div key={f.id} className="space-y-3 border-t border-border pt-4">
            {hasFamilies && (
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-base font-bold">{f.title}</h2>
                <span className="font-mono text-sm font-bold">{fmt(cur.code, value)}</span>
              </div>
            )}
            {f.notes.length > 0 && <Group cur={cur} f={f} kind="n" title="Cédulas" list={f.notes} />}
            {f.coins.length > 0 && <Group cur={cur} f={f} kind="c" title="Moedas" list={f.coins} />}
          </div>
        ))}

        {hasDiff && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-bold text-destructive">
            Há diferença em {cur.name}: a justificativa é obrigatória para finalizar a conferência.
          </p>
        )}

        <label className="block">
          <span className="font-display text-sm font-bold">
            Justificativa · {cur.name}
            {hasDiff && <span className="text-destructive"> · obrigatória</span>}
          </span>
          <textarea rows={3} maxLength={1000} value={session.just?.[cur.code] ?? ""}
            onChange={(e) => updateSession({ just: { ...session.just, [cur.code]: e.target.value } })}
            className="mt-1 w-full rounded-lg border bg-card p-3 text-base outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </main>
      <Nav />
    </div>
  );
}
