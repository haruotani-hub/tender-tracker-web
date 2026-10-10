import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/euro")({
  head: () => ({
    meta: [
      { title: "Conferência de numerário · Euro" },
      { name: "description", content: "Contagem de cédulas de euro, saldo do mapa e observações da conferência." },
      { property: "og:title", content: "Conferência de numerário · Euro" },
      { property: "og:description", content: "Contagem de cédulas de euro, saldo do mapa e observações da conferência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => {
    const currency = CURRENCIES[1];
    return currency ? <CurrencyPage cur={currency} /> : null;
  },
});
