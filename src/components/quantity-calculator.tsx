import { useState } from "react";
import { ArrowDownToLine, Calculator, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateQuantity, canTransferQuantity } from "@/lib/quantity-calculator";

export function QuantityCalculator({ label, quantity, onTransfer }: { label: string; quantity: number; onTransfer: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [replace, setReplace] = useState(false);
  const result = calculateQuantity(expression);
  const valid = canTransferQuantity(result);
  const append = (key: string) => {
    setExpression((previous) => replace && /[\d,(]/.test(key) ? key : previous + key);
    setReplace(false);
  };
  const equals = () => {
    if (result !== null) { setExpression(String(result).replace(".", ",")); setReplace(true); }
  };
  return (
    <Dialog open={open} onOpenChange={(next) => {
      setOpen(next);
      if (next) { setExpression(quantity ? String(quantity) : ""); setReplace(true); }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" title={`Abrir calculadora para ${label}`} aria-label={`Abrir calculadora para ${label}`}
          className="size-10 shrink-0 bg-accent text-accent-foreground">
          <Calculator className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg p-4" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogTitle className="pr-8 font-display tracking-normal">Calculadora</DialogTitle>
        <DialogDescription>Quantidade de {label}</DialogDescription>
        <input aria-label="Cálculo" inputMode="decimal" value={expression} maxLength={200}
          onChange={(e) => { setExpression(e.target.value); setReplace(false); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); } }}
          className="h-12 w-full min-w-0 rounded-lg border bg-card px-3 text-right font-mono text-xl outline-none focus:ring-2 focus:ring-ring" />
        <output aria-live="polite" className="min-h-6 break-all text-right font-mono text-lg font-bold text-primary">
          {result === null ? (expression ? "Cálculo inválido" : "0") : result.toLocaleString("pt-BR", { maximumFractionDigits: 10 })}
        </output>
        <div className="grid grid-cols-4 gap-2">
          <Button variant="secondary" onClick={() => { setExpression(""); setReplace(false); }} title="Limpar cálculo" aria-label="Limpar cálculo" className="h-11">C</Button>
          <Button variant="secondary" onClick={() => append("(")} className="h-11">(</Button>
          <Button variant="secondary" onClick={() => append(")")} className="h-11">)</Button>
          <Button variant="secondary" onClick={() => { setExpression((v) => v.slice(0, -1)); setReplace(false); }} title="Apagar último dígito" aria-label="Apagar último dígito" className="h-11"><Delete className="size-4" /></Button>
          {["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ",", "=", "+"].map((key) => (
            <Button key={key} variant={/[÷×−+=]/.test(key) ? "secondary" : "outline"} className="h-11 font-mono text-lg"
              onClick={() => key === "=" ? equals() : append(key)}>{key}</Button>
          ))}
        </div>
        {result !== null && !valid && <p className="text-sm text-destructive">A quantidade deve ser um número inteiro entre 0 e 99.999.</p>}
        <Button disabled={!valid} onClick={() => {
          if (!canTransferQuantity(result)) return;
          onTransfer(result);
          setOpen(false);
        }} className="h-12 w-full gap-2 font-display font-bold"><ArrowDownToLine className="size-4" /> Transpor valor</Button>
      </DialogContent>
    </Dialog>
  );
}