import { useEffect, useRef, useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { btnCls, inputCls } from "@/components/identity-gate";
import { getConference } from "@/lib/conferences.functions";
import { clipboardConferenceCode } from "@/lib/clipboard-code";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type Loaded = NonNullable<Awaited<ReturnType<typeof getConference>>>;
export const cleanCode = (v: string) => v.replace(/[^A-Za-z0-9]/g, "").slice(0, 32);

export function CodeLookup({ onFound }: { onFound: (c: Loaded) => void }) {
  const fetchConf = useServerFn(getConference);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [clipboardMessage, setClipboardMessage] = useState("");
  const offered = useRef<string | null>(null);
  const reading = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkClipboard = async (explicit = false) => {
    if (reading.current || document.visibilityState !== "visible") return;
    reading.current = true;
    try {
      const candidate = clipboardConferenceCode(await navigator.clipboard.readText());
      if (candidate && (explicit || offered.current !== candidate)) {
        offered.current = candidate;
        setCopiedCode(candidate);
        setClipboardMessage("");
      } else if (explicit && !candidate) setClipboardMessage("Nenhum código válido de 32 caracteres foi encontrado.");
    } catch {
      if (explicit) setClipboardMessage("O navegador não permitiu ler a área de transferência. Cole o código diretamente no campo.");
    } finally { reading.current = false; }
  };
  useEffect(() => {
    const check = () => { void checkClipboard(); };
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => { window.removeEventListener("focus", check); document.removeEventListener("visibilitychange", check); };
  }, []);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr("");
      try {
        const r = await fetchConf({ data: { codigo: code } });
        if (r) onFound(r); else setErr("Conferência não encontrada.");
      } catch { setErr("Não foi possível consultar. Tente novamente."); } finally { setBusy(false); }
    }}>
      <label className="block"><span className="font-display text-sm font-bold">Código da conferência</span>
        <input ref={inputRef} value={code} onFocus={() => { void checkClipboard(); }} onChange={(e) => setCode(cleanCode(e.target.value))} placeholder="32 caracteres" className={`${inputCls} font-mono`} /></label>
      <Button variant="outline" type="button" onClick={() => { void checkClipboard(true); }} className="w-full"><ClipboardPaste className="size-4" /> Colar código copiado</Button>
      {clipboardMessage && <p role="status" className="text-xs text-muted-foreground">{clipboardMessage}</p>}
      <p className="text-xs text-muted-foreground">{code.length}/32</p>
      {err && <p className="text-sm font-bold text-destructive">{err}</p>}
      <Button variant="ghost" type="submit" disabled={busy || code.length !== 32} className={btnCls}>Consultar</Button>
      <Dialog open={copiedCode !== null} onOpenChange={(open) => { if (!open) setCopiedCode(null); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg" onCloseAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}>
          <DialogTitle>Colar código da conferência?</DialogTitle>
          <DialogDescription>Foi encontrado um código de 32 caracteres na área de transferência. Deseja colá-lo?</DialogDescription>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => setCopiedCode(null)}>Não, obrigado</Button>
            <Button type="button" onClick={() => { if (copiedCode) { setCode(copiedCode); setErr(""); } setCopiedCode(null); }}><ClipboardPaste className="size-4" /> Colar código</Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}

