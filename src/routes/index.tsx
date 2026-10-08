import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contador de Dinheiro — Real, Euro e Dólar" },
      { name: "description", content: "Conte notas e moedas em reais, euros e dólares e confira circulante contra não circulante." },
      { property: "og:title", content: "Contador de Dinheiro" },
      { property: "og:description", content: "Conferência de caixa: circulante x não circulante em R$, € e US$." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

// valores em centavos
type Family = { id: string; title: string; notes: number[]; coins: number[] };
type Currency = {
  code: "BRL" | "EUR" | "USD";
  name: string;
  symbol: string;
  families: [Family, Family]; // [circulante, não circulante]
};

const CURRENCIES: Currency[] = [
  {
    code: "BRL",
    name: "Real",
    symbol: "R$",
    families: [
      { id: "c", title: "Circulante · 2ª família do Real", notes: [20000, 10000, 5000, 2000, 1000, 500, 200], coins: [100, 50, 25, 10, 5, 1] },
      { id: "n", title: "Não circulante · 1ª família do Real", notes: [10000, 5000, 1000, 500, 100], coins: [100, 50, 25, 10, 5, 1] },
    ],
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    families: [
      { id: "c", title: "Circulante · Série Europa", notes: [20000, 10000, 5000, 2000, 1000, 500], coins: [200, 100, 50, 20, 10, 5, 2, 1] },
      { id: "n", title: "Não circulante · 1ª série", notes: [50000, 20000, 10000, 5000, 2000, 1000, 500], coins: [200, 100, 50, 20, 10, 5, 2, 1] },
    ],
  },
  {
    code: "USD",
    name: "Dólar",
    symbol: "US$",
    families: [
      { id: "c", title: "Circulante · Notas atuais", notes: [10000, 5000, 2000, 1000, 500, 200, 100], coins: [100, 50, 25, 10, 5, 1] },
      { id: "n", title: "Não circulante · Notas antigas", notes: [10000, 5000, 2000, 1000, 500, 200, 100], coins: [100, 50, 25, 10, 5, 1] },
    ],
  },
];

const fmt = (code: string, cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: code });

const label = (sym: string, c: number) => (c >= 100 ? `${sym} ${c / 100}` : `${c} ${c === 1 ? "centavo" : "centavos"}`);

function Row({
  code, symbol, value, qty, onChange,
}: {
  code: string; symbol: string; value: number; qty: number; onChange: (n: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(0, Math.min(99999, n)));
  const l = label(symbol, value);
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-bold leading-tight">{l}</div>
        <div className="font-mono text-xs text-muted-foreground">{fmt(code, value * qty)}</div>
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

function CurrencyCounter({ cur }: { cur: Currency }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const key = (f: Family, kind: string, v: number) => `${f.id}-${kind}-${v}`;

  const famTotal = (f: Family) =>
    f.notes.reduce((s, v) => s + v * (qty[key(f, "n", v)] ?? 0), 0) +
    f.coins.reduce((s, v) => s + v * (qty[key(f, "c", v)] ?? 0), 0);

  const [circ, non] = cur.families;
  const tc = famTotal(circ);
  const tn = famTotal(non);
  const total = tc + tn;
  const diff = tc - tn;

  const status =
    tc === 0 && tn === 0
      ? { text: "Aguardando contagem", tone: "text-muted-foreground" }
      : diff === 0
        ? { text: "Circulante e não circulante iguais", tone: "text-success" }
        : diff > 0
          ? { text: `Circulante maior em ${fmt(cur.code, diff)}`, tone: "text-success" }
          : { text: `Não circulante maior em ${fmt(cur.code, -diff)}`, tone: "text-destructive" };

  const group = (f: Family, kind: "n" | "c", title: string, list: number[]) => (
    <div className="space-y-2">
      <h3 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {list.map((v) => (
        <Row key={v} code={cur.code} symbol={cur.symbol} value={v} qty={qty[key(f, kind, v)] ?? 0}
          onChange={(n) => setQty((q) => ({ ...q, [key(f, kind, v)]: n }))} />
      ))}
    </div>
  );

  return (
    <section className="space-y-5">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-widest opacity-70">
            {cur.name} · total contado
          </p>
          <p className="font-mono text-4xl font-bold leading-tight">{fmt(cur.code, total)}</p>
        </div>
        <button onClick={() => setQty({})}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 font-display text-xs font-bold text-accent-foreground active:scale-95">
          <RotateCcw className="size-3.5" /> Zerar
        </button>
      </header>

      <div className="space-y-6 px-4">
        {cur.families.map((f) => (
          <div key={f.id} className="space-y-3 rounded-2xl border bg-secondary/40 p-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-base font-extrabold">{f.title}</h2>
              <span className="font-mono text-sm font-bold">{fmt(cur.code, famTotal(f))}</span>
            </div>
            {group(f, "n", "Cédulas", f.notes)}
            {group(f, "c", "Moedas", f.coins)}
          </div>
        ))}

        <div className="rounded-2xl border bg-card p-4">
          <p className="font-display text-sm font-bold">Conferência</p>
          <dl className="mt-2 space-y-1 font-mono text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Circulante</dt><dd>{fmt(cur.code, tc)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Não circulante</dt><dd>{fmt(cur.code, tn)}</dd></div>
          </dl>
          <p className={`mt-3 border-t pt-3 font-display text-lg font-extrabold ${status.tone}`}>{status.text}</p>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <div className="mx-auto min-h-screen max-w-xl space-y-12 pb-12 font-sans">
      {CURRENCIES.map((c) => (
        <CurrencyCounter key={c.code} cur={c} />
      ))}
    </div>
  );
}
