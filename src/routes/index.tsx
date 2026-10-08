import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contador de Real — 1ª e 2ª família" },
      { name: "description", content: "Conte cédulas e moedas do Real, separando 1ª e 2ª família, e confira circulante contra não circulante." },
      { property: "og:title", content: "Contador de Real" },
      { property: "og:description", content: "Conferência de caixa em R$: 1ª e 2ª família do Real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <CurrencyPage cur={CURRENCIES[0]!} />,
});
