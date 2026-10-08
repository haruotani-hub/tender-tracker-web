import { useSyncExternalStore } from "react";

export type Family = { id: string; title: string; notes: number[]; coins: number[] };
export type Currency = {
  code: "BRL" | "EUR" | "USD";
  slug: "/" | "/euro" | "/dolar";
  name: string;
  symbol: string;
  families: Family[];
};

// valores em centavos
export const CURRENCIES: Currency[] = [
  {
    code: "BRL",
    slug: "/",
    name: "Real",
    symbol: "R$",
    families: [
      { id: "f2", title: "2ª família do Real · Circulante", notes: [20000, 10000, 5000, 2000, 1000, 500, 200], coins: [100, 50, 25, 10, 5, 1] },
      { id: "f1", title: "1ª família do Real · Não circulante", notes: [10000, 5000, 1000, 500, 100], coins: [100, 50, 25, 10, 5, 1] },
    ],
  },
  {
    code: "EUR",
    slug: "/euro",
    name: "Euro",
    symbol: "€",
    families: [{ id: "all", title: "Euro", notes: [50000, 20000, 10000, 5000, 2000, 1000, 500], coins: [200, 100, 50, 20, 10, 5, 2, 1] }],
  },
  {
    code: "USD",
    slug: "/dolar",
    name: "Dólar",
    symbol: "US$",
    families: [{ id: "all", title: "Dólar", notes: [10000, 5000, 2000, 1000, 500, 200, 100], coins: [100, 50, 25, 10, 5, 1] }],
  },
];

export const fmt = (code: string, cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: code });

export const keyOf = (cur: string, fam: string, kind: "n" | "c", v: number) =>
  `${cur}|${fam}|${kind}|${v}`;

type State = Record<string, number>;
let state: State = {};
const empty: State = {};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const setQty = (k: string, n: number) => {
  state = { ...state, [k]: n };
  emit();
};
export const resetCurrency = (cur: string) => {
  state = Object.fromEntries(Object.entries(state).filter(([k]) => !k.startsWith(cur + "|")));
  emit();
};

export const useCounts = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => empty,
  );

export function summarize(cur: Currency, counts: State) {
  let value = 0;
  let pieces = 0;
  const byFamily = cur.families.map((f) => {
    let fv = 0;
    let fp = 0;
    for (const [kind, list] of [["n", f.notes], ["c", f.coins]] as const) {
      for (const v of list) {
        const q = counts[keyOf(cur.code, f.id, kind, v)] ?? 0;
        fv += q * v;
        fp += q;
      }
    }
    value += fv;
    pieces += fp;
    return { family: f, value: fv, pieces: fp };
  });
  return { value, pieces, byFamily };
}
