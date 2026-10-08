import { Link } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  CURRENCIES, fmt, keyOf, resetCurrency, setQty, summarize, useCounts,
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
    <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-bold leading-tight">{l}</div>
        <div className="font-mono text-xs text-muted-foreground">{fmt(cur.code, value * qty)}</div>
      </div>
      <button aria-label={`Diminuir ${l}`} onClick={() => set(qty - 1)}
        className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground active:scale-95">
        <Minus className="size-4" />
      </button>
      <input
        inputMode="numeric" aria-label={`Quantidade de ${l}`}
        value={qty === 0 ? "" : qty} placeholder="0"
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
        className="h-10 w-16 rounded-lg border bg-background text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-ring"
      />
      <button aria-label={`Aumentar ${l}`} onClick={() => set(qty + 1)}
        className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground active:scale-95">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function Group({ cur, f, kind, title, list }: { cur: Currency; f: Family; kind: "n" | "c"; title: string; list: number[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
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
  const [circ, non] = s.byFamily;
  const diff = circ && non ? circ.value - non.value : 0;
  const status =
    s.pieces === 0
      ? { text: "Aguardando contagem", tone: "text-muted-foreground" }
      : diff === 0
        ? { text: "Circulante e não circulante iguais", tone: "text-success" }
        : diff > 0
          ? { text: `Circulante maior em ${fmt(cur.code, diff)}`, tone: "text-success" }
          : { text: `Não circulante maior em ${fmt(cur.code, -diff)}`, tone: "text-destructive" };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col font-sans">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest opacity-70">
            {cur.name} · {s.pieces} {s.pieces === 1 ? "peça" : "peças"}
          </p>
          <p className="font-mono text-4xl font-bold leading-tight">{fmt(cur.code, s.value)}</p>
        </div>
        <button onClick={() => resetCurrency(cur.code)}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 font-display text-xs font-bold text-accent-foreground active:scale-95">
          <RotateCcw className="size-3.5" /> Zerar
        </button>
      </header>

      <main className="flex-1 space-y-6 px-4 py-5">
        {s.byFamily.map(({ family: f, value }) => (
          <div key={f.id} className="space-y-3 rounded-2xl border bg-secondary/40 p-3">
            {hasFamilies && (
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-base font-extrabold">{f.title}</h2>
                <span className="font-mono text-sm font-bold">{fmt(cur.code, value)}</span>
              </div>
            )}
            <Group cur={cur} f={f} kind="n" title="Cédulas" list={f.notes} />
            <Group cur={cur} f={f} kind="c" title="Moedas" list={f.coins} />
          </div>
        ))}

        {hasFamilies && (
          <div className="rounded-2xl border bg-card p-4">
            <p className="font-display text-sm font-bold">Conferência</p>
            <dl className="mt-2 space-y-1 font-mono text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Circulante (2ª família)</dt><dd>{fmt(cur.code, circ!.value)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Não circulante (1ª família)</dt><dd>{fmt(cur.code, non!.value)}</dd></div>
            </dl>
            <p className={`mt-3 border-t pt-3 font-display text-lg font-extrabold ${status.tone}`}>{status.text}</p>
          </div>
        )}
      </main>
      <Nav />
    </div>
  );
}
