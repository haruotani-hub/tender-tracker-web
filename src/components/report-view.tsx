import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btnCls } from "@/components/identity-gate";
import { downloadPdf, reportLines, type Saved } from "@/lib/report";
import type { Validacao } from "@/lib/conferences.functions";

export function ReportView({ dados, codigo, validacao }: { dados: Saved; codigo: string; validacao: Validacao | null }) {
  return (
    <div className="space-y-4">
      <dl className="space-y-1 font-mono text-sm">
        {reportLines(dados, codigo, validacao).map(([k, v], i) =>
          v === undefined ? (
            <h2 key={i} className="!mt-5 border-t pt-3 font-display text-lg font-bold text-primary">{k}</h2>
          ) : (
            <div key={i} className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">{k}</dt>
              <dd className="whitespace-pre-wrap break-all text-right">{v}</dd>
            </div>
          ),
        )}
      </dl>
      <Button variant="ghost" onClick={() => downloadPdf(dados, codigo, validacao)} className={`${btnCls} flex items-center justify-center gap-2`}>
        <FileDown className="size-4" /> Gerar PDF
      </Button>
    </div>
  );
}
