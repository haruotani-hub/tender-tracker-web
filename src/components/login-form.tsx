import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { btnCls, inputCls } from "@/components/identity-gate";
import { login } from "@/lib/conferences.functions";
import { setToken } from "@/lib/counter-store";

export function Brand({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-8 border-b border-border pb-5">
      <Link to="/" className="font-display text-lg font-bold text-primary">Conferência de Valores - TCV</Link>
      <div className="mt-3 h-1 w-12 bg-brand-orange" />
      {children}
    </div>
  );
}

export function LoginForm({ role, title, onDone }: { role: "caixa" | "egttv"; title: string; onDone: () => void }) {
  const doLogin = useServerFn(login);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-8 font-sans">
      <Brand />
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(false);
        try {
          const r = await doLogin({ data: { role, usuario, senha } });
          if (r.ok) { setToken(role, r.token); onDone(); } else setErr(true);
        } catch { setErr(true); } finally { setBusy(false); }
      }}>
        <label className="block"><span className="font-display text-sm font-bold">Usuário</span>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" className={inputCls} /></label>
        <label className="block"><span className="font-display text-sm font-bold">Senha</span>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" className={inputCls} /></label>
        {err && <p className="text-sm font-bold text-destructive">Usuário ou senha incorretos.</p>}
        <Button variant="ghost" type="submit" disabled={busy || !usuario || !senha} className={btnCls}>Entrar</Button>
        <Link to="/" className="block text-center text-sm text-muted-foreground underline">Voltar ao início</Link>
      </form>
    </div>
  );
}
