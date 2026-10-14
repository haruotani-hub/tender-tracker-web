import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { btnCls, inputCls, maskName, maskCaixaMatricula } from "@/components/identity-gate";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useIndividualAccount } from "@/components/individual-auth";

export function Brand({ children }: { children?: ReactNode }) {
  return <div className="mb-8 border-b border-border pb-5"><Link to="/" className="font-display text-lg font-bold text-primary">Conferência de Valores - TCV</Link><div className="mt-3 h-1 w-12 bg-brand-orange" />{children}</div>;
}
export function LoginForm({ role, title, onDone }: { role: "caixa" | "egttv"; title: string; onDone: () => void }) {
  const { user, profile, refresh } = useIndividualAccount();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState(profile?.nome ?? "");
  const [matricula, setMatricula] = useState(profile?.matricula ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const needsProfile = !!user;
  const collect = signup || needsProfile;
  return <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-8 font-sans">
    <Brand /><h1 className="font-display text-3xl font-bold">{needsProfile ? "Identificação da conta" : signup ? "Criar conta individual" : title}</h1>
    <form className="mt-6 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMessage("");
      try {
        if (collect && (nome.trim().split(/\s+/).length < 2 || (role === "caixa" ? !/^C\d{6}$/.test(matricula) : !matricula.trim()))) throw new Error("Preencha nome completo e matrícula válida.");
        if (user) {
          const { error } = await supabase.from("profiles").upsert({ id: user.id, nome: nome.trim(), matricula });
          if (error) throw error;
          await refresh(); onDone();
        } else if (signup) {
          const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin, data: { nome: nome.trim(), matricula } } });
          if (error) throw error;
          setMessage("Confira seu e-mail e confirme o cadastro antes de entrar.");
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
          if (error) throw error;
          await refresh(); onDone();
        }
      } catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível entrar."); } finally { setBusy(false); }
    }}>
      {!needsProfile && <><label className="block"><span className="font-display text-sm font-bold">E-mail</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputCls} /></label>
      <label className="block"><span className="font-display text-sm font-bold">Senha</span><input type="password" minLength={8} required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete={signup ? "new-password" : "current-password"} className={inputCls} /></label></>}
      {collect && <><label className="block"><span className="font-display text-sm font-bold">Nome completo</span><input required value={nome} onChange={(e) => setNome(maskName(e.target.value))} className={inputCls} /></label><label className="block"><span className="font-display text-sm font-bold">{role === "caixa" ? "Matrícula Caixa" : "Matrícula funcional"}</span><input required value={matricula} onChange={(e) => setMatricula(role === "caixa" ? maskCaixaMatricula(e.target.value) : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} className={inputCls} /></label></>}
      {message && <p role="status" className="text-sm font-bold text-primary">{message}</p>}
      <Button type="submit" disabled={busy} className={btnCls}>{busy ? "Aguarde…" : needsProfile ? "Salvar identificação" : signup ? "Criar conta" : "Entrar"}</Button>
      {!needsProfile && <><Button type="button" variant="outline" className="h-12 w-full" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (result.error) throw result.error; if (!result.redirected) { await refresh(); onDone(); } } catch { setMessage("Não foi possível entrar com Google."); } finally { setBusy(false); } }}>Entrar com Google</Button><Button type="button" variant="link" className="w-full" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "Já tenho conta" : "Criar conta individual"}</Button></>}
      {needsProfile && <Button type="button" variant="link" className="w-full" onClick={() => supabase.auth.signOut()}>Sair</Button>}
      <Link to="/" className="block text-center text-sm text-muted-foreground underline">Voltar ao início</Link>
    </form></div>;
}
