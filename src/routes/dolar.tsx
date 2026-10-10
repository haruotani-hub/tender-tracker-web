import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/dolar")({
  head: () => ({
    meta: [
      { title: "Conferência de numerário · Dólar" },
      { name: "description", content: "Contagem de cédulas de dólar, saldo do mapa e observações da conferência." },
      { property: "og:title", content: "Conferência de numerário · Dólar" },
      { property: "og:description", content: "Contagem de cédulas de dólar, saldo do mapa e observações da conferência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => {
    const currency = CURRENCIES[2];
    return currency ? <CurrencyPage cur={currency} /> : null;
  },
});
