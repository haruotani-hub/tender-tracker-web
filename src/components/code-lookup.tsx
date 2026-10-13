import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { btnCls, inputCls } from "@/components/identity-gate";
import { getConference } from "@/lib/conferences.functions";

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

