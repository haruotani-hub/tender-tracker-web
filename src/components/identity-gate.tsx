import { useEffect, useState, type ReactNode } from "react";
import { loadIdentity, saveIdentity, useIdentity } from "@/lib/counter-store";

export function IdentityGate({ children }: { children: ReactNode }) {
  const { identity, ready } = useIdentity();
  const [name, setName] = useState("");
  const [mat, setMat] = useState("");
  useEffect(() => loadIdentity(), []);

  if (!ready) return null;
  if (identity) return <>{children}</>;

  const valid = name.trim().split(/\s+/).length >= 2 && mat.trim().length > 0;
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 font-sans">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">Contador de dinheiro</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">Identifique-se</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) saveIdentity({ name: name.trim(), matricula: mat.trim() });
        }}
      >
        <label className="block">
          <span className="font-display text-sm font-bold">Nome completo</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
            className="mt-1 h-12 w-full rounded-lg border bg-card px-3 text-base outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="block">
          <span className="font-display text-sm font-bold">Matrícula Caixa</span>
          <input value={mat} onChange={(e) => setMat(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            inputMode="text" autoComplete="off"
            className="mt-1 h-12 w-full rounded-lg border bg-card px-3 font-mono text-base outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <button type="submit" disabled={!valid}
          className="h-12 w-full rounded-lg bg-primary font-display text-base font-bold text-primary-foreground disabled:opacity-40">
          Entrar
        </button>
        <p className="text-xs text-muted-foreground">Informe nome e sobrenome e sua matrícula.</p>
      </form>
    </div>
  );
}
