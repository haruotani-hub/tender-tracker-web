import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contador de Dinheiro — Conferência de caixa em R$" },
      { name: "description", content: "Conte notas e moedas em reais e confira sobra ou falta frente ao valor esperado." },
      { property: "og:title", content: "Contador de Dinheiro" },
      { property: "og:description", content: "Conte notas e moedas em reais e confira sobra ou falta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

// values in centavos
const NOTES = [20000, 10000, 5000, 2000, 1000, 500, 200];
const COINS = [100, 50, 25, 10, 5];

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const label = (c: number) => (c >= 100 ? `R$ ${c / 100}` : `${c} centavos`);

function Row({
  value,
  qty,
  onChange,
}: {
  value: number;
  qty: number;
  onChange: (n: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(0, Math.min(99999, n)));
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-bold leading-tight">{label(value)}</div>
        <div className="font-mono text-xs text-muted-foreground">{brl(value * qty)}</div>
      </div>
      <button
        aria-label={`Diminuir ${label(value)}`}
        onClick={() => set(qty - 1)}
        className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground active:scale-95"
      >
        <Minus className="size-4" />
      </button>
      <input
        inputMode="numeric"
        aria-label={`Quantidade de ${label(value)}`}
        value={qty === 0 ? "" : qty}
        placeholder="0"
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
        className="h-10 w-16 rounded-lg border bg-background text-center font-mono text-base font-bold outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        aria-label={`Aumentar ${label(value)}`}
        onClick={() => set(qty + 1)}
        className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground active:scale-95"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function Index() {
  const [qty, setQty] = useState<Record<number, number>>({});
  const [expected, setExpected] = useState("");

  const total = [...NOTES, ...COINS].reduce((s, v) => s + v * (qty[v] ?? 0), 0);
  const expectedCents = Math.round(
    parseFloat(expected.replace(/\./g, "").replace(",", ".") || "0") * 100,
  );
  const hasExpected = expected.trim() !== "" && !isNaN(expectedCents);
  const diff = total - expectedCents;
  const pieces = Object.values(qty).reduce((a, b) => a + b, 0);

  const status = !hasExpected
    ? { text: "Informe o valor esperado", tone: "text-muted-foreground" }
    : diff === 0
      ? { text: "Caixa conferido", tone: "text-success" }
      : diff > 0
        ? { text: `Sobra de ${brl(diff)}`, tone: "text-success" }
        : { text: `Falta de ${brl(-diff)}`, tone: "text-destructive" };

  const group = (title: string, list: number[]) => (
    <section className="space-y-2">
      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {list.map((v) => (
        <Row key={v} value={v} qty={qty[v] ?? 0} onChange={(n) => setQty((q) => ({ ...q, [v]: n }))} />
      ))}
    </section>
  );

  return (
    <div className="mx-auto min-h-screen max-w-xl pb-8 font-sans">
      <header className="sticky top-0 z-10 border-b bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-widest opacity-70">
              Total contado · {pieces} {pieces === 1 ? "peça" : "peças"}
            </p>
            <p className="font-mono text-4xl font-bold leading-tight">{brl(total)}</p>
          </div>
          <button
            onClick={() => {
              setQty({});
              setExpected("");
            }}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 font-display text-xs font-bold text-accent-foreground active:scale-95"
          >
            <RotateCcw className="size-3.5" /> Zerar
          </button>
        </div>
      </header>

      <main className="space-y-6 px-4 pt-5">
        <section className="rounded-2xl border bg-card p-4">
          <label className="font-display text-sm font-bold" htmlFor="exp">
            Valor esperado
          </label>
          <div className="mt-2 flex items-center rounded-lg border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
            <span className="font-mono text-muted-foreground">R$</span>
            <input
              id="exp"
              inputMode="decimal"
              value={expected}
              placeholder="0,00"
              onChange={(e) => setExpected(e.target.value.replace(/[^\d,]/g, ""))}
              className="h-11 w-full bg-transparent px-2 font-mono text-lg font-bold outline-none"
            />
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t pt-3">
            <span className={`font-display text-lg font-extrabold ${status.tone}`}>{status.text}</span>
            {hasExpected && (
              <span className="font-mono text-xs text-muted-foreground">
                esperado {brl(expectedCents)}
              </span>
            )}
          </div>
        </section>

        {group("Cédulas", NOTES)}
        {group("Moedas", COINS)}
      </main>
    </div>
  );
}
