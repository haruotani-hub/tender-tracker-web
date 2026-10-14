import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { btnCls } from "@/components/identity-gate";
import { downloadPdf, type Saved } from "@/lib/report";
import { ReportDocument } from "@/components/report-document";
import type { Validacao } from "@/lib/conferences.functions";

export function ReportView({ dados, codigo, validacao }: { dados: Saved; codigo: string; validacao: Validacao | null }) {
  return (
    <div className="space-y-4">
      <ReportDocument dados={dados} codigo={codigo} validacao={validacao} />
      <Button variant="ghost" onClick={() => downloadPdf(dados, codigo, validacao)} className={`${btnCls} flex items-center justify-center gap-2`}>
        <FileDown className="size-4" /> Gerar PDF
      </Button>
    </div>
  );
}
