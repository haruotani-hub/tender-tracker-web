import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { btnCls, inputCls } from "@/components/identity-gate";
import { Brand } from "@/components/login-form";
import { ReportView } from "@/components/report-view";
import { getConference } from "@/lib/conferences.functions";
import type { Saved } from "@/lib/report";

export const Route = createFileRoute("/consulta")({
  head: () => ({
    meta: [
      { title: "Consultar conferência - TCV" },
      { name: "description", content: "Abra uma conferência salva pelo código de 32 caracteres." },
      { property: "og:title", content: "Consultar conferência - TCV" },
      { property: "og:description", content: "Abra uma conferência salva pelo código de 32 caracteres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Consulta,
});

export type Loaded = NonNullable<Awaited<ReturnType<typeof getConference>>>;
export const cleanCode = (v: string) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 32);

export function CodeLookup({ onFound }: { onFound: (c: Loaded) => void }) {
  const fetchConf = useServerFn(getConference);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      try {
        const r = await fetchConf({ data: { codigo: code } });
        if (r) onFound(r); else setErr("Conferência não encontrada.");
      } catch { setErr("Não foi possível consultar. Tente novamente."); } finally { setBusy(false); }
    }}>
      <label className="block"><span className="font-display text-sm font-bold">Código da conferência</span>
        <input value={code} onChange={(e) => setCode(cleanCode(e.target.value))} placeholder="32 caracteres" className={`${inputCls} font-mono`} /></label>
      <p className="text-xs text-muted-foreground">{code.length}/32</p>
      {err && <p className="text-sm font-bold text-destructive">{err}</p>}
      <Button variant="ghost" type="submit" disabled={busy || code.length !== 32} className={btnCls}>Consultar</Button>
    </form>
  );
}

function Consulta() {
  const [conf, setConf] = useState<Loaded | null>(null);
  return (
    <div className="mx-auto min-h-screen max-w-xl px-6 py-8 font-sans">
      <Brand />
      <h1 className="mb-6 font-display text-3xl font-bold">Consultar conferência</h1>
      {conf ? (
        <>
          <ReportView dados={conf.dados as unknown as Saved} codigo={conf.codigo} validacao={conf.validacao} />
          <Button variant="ghost" onClick={() => setConf(null)} className="mt-3 h-12 w-full rounded-lg border bg-card font-display font-bold">Consultar outra</Button>
        </>
      ) : <CodeLookup onFound={setConf} />}
      <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground underline">Voltar ao início</Link>
    </div>
  );
}
