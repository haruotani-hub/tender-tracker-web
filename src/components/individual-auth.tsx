import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resetAll } from "@/lib/counter-store";

// Temporary shared Admin/Admin login (user decision); credentials are rechecked on the server.
export type Profile = { nome: string; matricula: string };
export type Cred = { usuario: string; senha: string };
type Stored = Profile & Cred & { role?: "caixa" | "egttv" };
type Account = { role: Stored["role"] | null; user: Cred | null; profile: Profile | null; ready: boolean; signIn: (s: Stored) => void; signOut: () => void };
const KEY = "tcv-login";
const AccountContext = createContext<Account>({ role: null, user: null, profile: null, ready: false, signIn: () => {}, signOut: () => {} });
export function IndividualAuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) setStored(JSON.parse(raw) as Stored); } catch { /* ignore */ }
    setReady(true);
  }, []);
  const signIn = (s: Stored) => { sessionStorage.setItem(KEY, JSON.stringify(s)); setStored(s); };
  const signOut = () => { sessionStorage.removeItem(KEY); setStored(null); resetAll(); };
  const value: Account = {
    role: stored?.role ?? null,
    user: stored ? { usuario: stored.usuario, senha: stored.senha } : null,
    profile: stored ? { nome: stored.nome, matricula: stored.matricula } : null,
    ready, signIn, signOut,
  };
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
export const useIndividualAccount = () => useContext(AccountContext);
