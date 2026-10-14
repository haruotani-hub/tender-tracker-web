import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Search, Truck } from "lucide-react";
import { Brand } from "@/components/login-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conferência de Valores - TCV" },
      { name: "description", content: "Acesso para empregados Caixa, EGTTV e consulta de conferências salvas." },
      { property: "og:title", content: "Conferência de Valores - TCV" },
      { property: "og:description", content: "Acesso para empregados Caixa, EGTTV e consulta de conferências salvas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const big = "flex h-20 items-center justify-center gap-3 rounded-lg font-display text-lg font-bold";

function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-8 font-sans">
      <Brand />
      <h1 className="font-display text-3xl font-bold">Acesso</h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/real" className={`${big} min-w-0 px-3 text-center bg-primary text-primary-foreground`}><Building2 className="size-5 shrink-0" /><span className="min-w-0 leading-tight">Empregado Caixa</span></Link>
        <Link to="/egttv" className={`${big} bg-brand-orange text-primary-foreground`}><Truck className="size-5" /> EGTTV</Link>
      </div>
      <Link to="/consulta" className={`${big} mt-3 border bg-card`}><Search className="size-5" /> Consultar conferência</Link>
    </div>
  );
}
