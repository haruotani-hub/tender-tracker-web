import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/euro")({
  head: () => ({
    meta: [
      { title: "Contador de Euro — cédulas e moedas" },
      { name: "description", content: "Conte cédulas e moedas de euro e veja o total em €." },
      { property: "og:title", content: "Contador de Euro" },
      { property: "og:description", content: "Contagem de cédulas e moedas de euro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <CurrencyPage cur={CURRENCIES[1]} />,
});
