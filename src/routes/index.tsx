import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conferência de numerário · Real" },
      { name: "description", content: "Contagem de cédulas e moedas do Real por família e condição, com conferência do saldo do mapa." },
      { property: "og:title", content: "Conferência de numerário · Real" },
      { property: "og:description", content: "Contagem de cédulas e moedas do Real por família e condição, com conferência do saldo do mapa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => {
    const currency = CURRENCIES[0];
    return currency ? <CurrencyPage cur={currency} /> : null;
  },
});
