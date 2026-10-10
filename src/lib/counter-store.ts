import { useSyncExternalStore } from "react";

export type Family = { id: string; title: string; notes: number[]; coins: number[]; circulating?: boolean };
export type Currency = {
  code: "BRL" | "EUR" | "USD";
  slug: "/" | "/euro" | "/dolar";
  name: string;
  symbol: string;
  families: Family[];
};

// valores em centavos
const N2 = [20000, 10000, 5000, 2000, 1000, 500, 200];
const N1 = [10000, 5000, 1000, 500, 100];

export const CURRENCIES: Currency[] = [
  {
    code: "BRL",
    slug: "/",
    name: "Real",
    symbol: "R$",
    families: [
      { id: "f2c", title: "2ª família · Circulante", notes: N2, coins: [], circulating: true },
      { id: "f2d", title: "2ª família · Dilacerado", notes: N2, coins: [] },
      { id: "f1d", title: "1ª família · Dilacerado", notes: N1, coins: [] },
      { id: "coins", title: "Moedas", notes: [], coins: [100, 50, 25, 10, 5, 1], circulating: true },
    ],
  },
  {
    code: "EUR",
    slug: "/euro",
    name: "Euro",
    symbol: "€",
    families: [{ id: "all", title: "Euro", notes: [50000, 20000, 10000, 5000, 2000, 1000, 500], coins: [] }],
  },
  {
    code: "USD",
    slug: "/dolar",
    name: "Dólar",
    symbol: "US$",
    families: [{ id: "all", title: "Dólar", notes: [10000, 5000, 2000, 1000, 500, 200, 100], coins: [] }],
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

// ---- Sessão da conferência ----
export type Person = { name: string; matricula: string };
export type Session = {
  employees: Person[];
  egttv: string;
  cidade: string;
  uf: string;
  turno: string;
  dataMapa: string;
  saldo: number; // centavos (Real)
  saldoEur: number;
  saldoUsd: number;
  tipo: string;
  obs: Record<string, string>;
  startedAt: string | null;
  justificativa: string;
  entrada15: boolean | null;
  cinta: boolean | null;
  egttvStaff: Person[];
  endedAt: string | null;
};
export const EGTTVS = ["Brinks", "Protege", "Prosegur", "Corpvs", "Wlataq", "Tbforte"];
export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
export const TIPOS = ["Agência", "PAE"];
export const saldoOf = (s: Session, code: string) =>
  code === "BRL" ? s.saldo : code === "EUR" ? s.saldoEur : s.saldoUsd;
export const TURNOS = ["Matutino", "Vespertino", "Noturno"];

const S_KEY = "contador-session";
const blank = (): Session => ({
  employees: [], egttv: "", cidade: "", uf: "", turno: "", dataMapa: "", saldo: 0, saldoEur: 0, saldoUsd: 0, tipo: "", obs: {},
  startedAt: null, justificativa: "", entrada15: null, cinta: null, egttvStaff: [], endedAt: null,
});
let session: Session = blank();
let sReady = false;
let sSnap = { session, ready: sReady };
const sListeners = new Set<() => void>();
const serverSSnap = { session: blank(), ready: false };
const persist = () => {
  try { sessionStorage.setItem(S_KEY, JSON.stringify(session)); } catch { /* ignore */ }
  sSnap = { session, ready: sReady };
  sListeners.forEach((l) => l());
};
export const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(S_KEY);
    session = raw ? { ...blank(), ...(JSON.parse(raw) as Session) } : blank();
  } catch { session = blank(); }
  sReady = true;
  persist();
};
export const updateSession = (p: Partial<Session>) => { session = { ...session, ...p }; persist(); };
export const resetAll = () => {
  session = blank();
  state = {};
  emit();
  persist();
};
export const useSession = () =>
  useSyncExternalStore(
    (l) => { sListeners.add(l); return () => sListeners.delete(l); },
    () => sSnap,
    () => serverSSnap,
  );

export const parseMoney = (s: string) => {
  const clean = s.replace(/[^\d,]/g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" }) : "—";
