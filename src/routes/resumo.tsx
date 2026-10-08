import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Nav } from "@/components/counter";
import { CURRENCIES, fmt, summarize, useCounts } from "@/lib/counter-store";

export const Route = createFileRoute("/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo final da contagem — Real, Euro e Dólar" },
      { name: "description", content: "Somatória final de quantidades e valores contados, com data e hora." },
      { property: "og:title", content: "Resumo final da contagem" },
      { property: "og:description", content: "Quantidades e valores de Real, Euro e Dólar com data e hora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Resumo,
});

function Resumo() {
  const counts = useCounts();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const stamp = now
    ? now.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "medium" })
    : "—";
  const rows = CURRENCIES.map((c) => ({ c, s: summarize(c, counts) }));
  const totalPieces = rows.reduce((a, r) => a + r.s.pieces, 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col font-sans">
      <header className="border-b bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <p className="font-display text-xs font-bold uppercase tracking-widest opacity-70">Resumo final</p>
        <p className="font-mono text-3xl font-bold leading-tight">{totalPieces} peças</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-xs">{stamp}</span>
          <button onClick={() => setNow(new Date())}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 font-display text-xs font-bold text-accent-foreground active:scale-95">
            <RefreshCw className="size-3.5" /> Atualizar
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 py-5">
        {rows.map(({ c, s }) => (
          <section key={c.code} className="rounded-2xl border bg-card p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-extrabold">{c.name}</h2>
              <span className="font-mono text-xl font-bold">{fmt(c.code, s.value)}</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {s.pieces} {s.pieces === 1 ? "peça" : "peças"}
            </p>
            {c.families.length > 1 && (
              <dl className="mt-3 space-y-1 border-t pt-3 font-mono text-sm">
                {s.byFamily.map(({ family, value, pieces }) => (
                  <div key={family.id} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{family.title} ({pieces})</dt>
                    <dd>{fmt(c.code, value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </main>
      <Nav />
    </div>
  );
}
