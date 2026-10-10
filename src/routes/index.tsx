import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conferência de Valores - TCV" },
      { name: "description", content: "Contagem de cédulas e moedas, com conferência do saldo do mapa." },
      { property: "og:title", content: "Conferência de Valores" },
      { property: "og:description", content: "Contagem de cédulas e moedas, com conferência do saldo do mapa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => {
    const currency = CURRENCIES[0];
    return currency ? <CurrencyPage cur={currency} /> : null;
  },
});
