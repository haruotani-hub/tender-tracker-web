import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { btnCls } from "@/components/identity-gate";
import { Brand, LoginForm } from "@/components/login-form";
import { ReportView } from "@/components/report-view";
import { CodeLookup, type Loaded } from "@/components/code-lookup";
import { validateConference } from "@/lib/conferences.functions";
import { useIndividualAccount } from "@/components/individual-auth";
import type { Saved } from "@/lib/report";

export const Route = createFileRoute("/egttv")({
  head: () => ({
    meta: [
      { title: "Validação EGTTV - TCV" },
      { name: "description", content: "A EGTTV valida a conferência salva pelo empregado Caixa." },
      { property: "og:title", content: "Validação EGTTV - TCV" },
      { property: "og:description", content: "A EGTTV valida a conferência salva pelo empregado Caixa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Egttv,
});

function Egttv() {
  const { user, profile, ready, signOut } = useIndividualAccount();
  const [conf, setConf] = useState<Loaded | null>(null);
  const [concorda, setConcorda] = useState<boolean | null>(null);
  const [just, setJust] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const validate = useServerFn(validateConference);

  if (!ready) return null;
  if (!user || !profile?.nome.trim() || !profile.matricula.trim()) return <LoginForm role="egttv" title="Login EGTTV" onDone={() => {}} />;

  const ok = concorda !== null && (concorda || just.trim());

  return (
    <div className="mx-auto min-h-screen max-w-xl px-6 py-8 font-sans">
      <Brand />
      <h1 className="mb-6 font-display text-3xl font-bold">Validação EGTTV</h1>
      {!conf ? <CodeLookup onFound={setConf} /> : (
        <>
          <ReportView dados={JSON.parse(conf.dados) as Saved} codigo={conf.codigo} validacao={conf.validacao} />
          {!conf.validacao && (
            <section className="mt-6 space-y-4 border-t pt-4">
              <p className="font-display text-sm font-bold">Parecer sobre a conferência</p>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <Button variant="ghost" key={String(v)} type="button" onClick={() => setConcorda(v)}
                    className={`h-12 rounded-lg border font-display font-bold ${concorda === v ? (v ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground") : "bg-card"}`}>
                    {v ? "Concordo" : "Não concordo"}
                  </Button>
                ))}
              </div>
              {concorda === false && (
                <label className="block"><span className="font-display text-sm font-bold">Justificativa (obrigatória)</span>
                  <textarea value={just} maxLength={2000} rows={4} onChange={(e) => setJust(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-background p-3 text-base outline-none focus:ring-2 focus:ring-ring" /></label>
              )}
              <p className="text-sm font-bold">Responsável: {profile.nome} · {profile.matricula}</p>
              {err && <p className="text-sm font-bold text-destructive">{err}</p>}
              <Button variant="ghost" disabled={!ok || busy} className={btnCls} onClick={async () => {
                setBusy(true); setErr("");
                try {
                  const v = await validate({ data: { cred: user, nome: profile.nome, matricula: profile.matricula, codigo: conf.codigo, concorda: !!concorda, justificativa: just } });
                  setConf({ ...conf, validacao: v });
                } catch (e) {
                  const m = e instanceof Error ? e.message : "";
                  setErr(m || "Falha ao registrar.");
                } finally { setBusy(false); }
              }}>Registrar validação</Button>
            </section>
          )}
          <Button variant="ghost" onClick={() => { setConf(null); setConcorda(null); setJust(""); }} className="mt-3 h-12 w-full rounded-lg border bg-card font-display font-bold">Validar outra</Button>
        </>
      )}
      <div className="mt-6 flex justify-center gap-4 text-sm text-muted-foreground">
        <Link to="/" className="underline">Início</Link>
        <Button type="button" variant="link" onClick={signOut}>Sair</Button>
      </div>
    </div>
  );
}
