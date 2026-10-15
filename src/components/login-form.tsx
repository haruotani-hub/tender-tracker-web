import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { btnCls, inputCls, maskName, maskCaixaMatricula } from "@/components/identity-gate";
import { useIndividualAccount } from "@/components/individual-auth";
import { checkLogin } from "@/lib/conferences.functions";

export function Brand({ children }: { children?: ReactNode }) {
  return <div className="mb-8 border-b border-border pb-5"><Link to="/" className="font-display text-lg font-bold text-primary">Conferência de Valores - TCV</Link><div className="mt-3 h-1 w-12 bg-brand-orange" />{children}</div>;
}
export function LoginForm({ role, title, onDone }: { role: "caixa" | "egttv"; title: string; onDone: () => void }) {
  const { signIn } = useIndividualAccount();
  const check = useServerFn(checkLogin);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-8 font-sans">
    <Brand /><h1 className="font-display text-3xl font-bold">{title}</h1>
    <form className="mt-6 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMessage("");
      try {
        if (nome.trim().split(/\s+/).length < 2 || (role === "caixa" ? !/^C\d{6}$/.test(matricula) : !matricula.trim())) throw new Error("Preencha nome completo e matrícula válida.");
        await check({ data: { usuario, senha } });
        signIn({ usuario, senha, nome: nome.trim(), matricula }); onDone();
      } catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível entrar."); } finally { setBusy(false); }
    }}>
      <label className="block"><span className="font-display text-sm font-bold">Usuário</span><input required value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" className={inputCls} /></label>
      <label className="block"><span className="font-display text-sm font-bold">Senha</span><input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" className={inputCls} /></label>
      <label className="block"><span className="font-display text-sm font-bold">Nome completo</span><input required value={nome} onChange={(e) => setNome(maskName(e.target.value))} className={inputCls} /></label>
      <label className="block"><span className="font-display text-sm font-bold">{role === "caixa" ? "Matrícula Caixa" : "Matrícula funcional"}</span><input required value={matricula} onChange={(e) => setMatricula(role === "caixa" ? maskCaixaMatricula(e.target.value) : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} className={inputCls} /></label>
      {message && <p role="status" className="text-sm font-bold text-destructive">{message}</p>}
      <Button type="submit" disabled={busy} className={btnCls}>{busy ? "Aguarde…" : "Entrar"}</Button>
      <Link to="/" className="block text-center text-sm text-muted-foreground underline">Voltar ao início</Link>
    </form></div>;
}
