import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/login-form";
import { ReportView } from "@/components/report-view";
import { CodeLookup, type Loaded } from "@/components/code-lookup";
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
