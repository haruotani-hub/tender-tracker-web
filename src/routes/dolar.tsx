import { createFileRoute } from "@tanstack/react-router";
import { CurrencyPage } from "@/components/counter";
import { CURRENCIES } from "@/lib/counter-store";

export const Route = createFileRoute("/dolar")({
  head: () => ({
    meta: [
      { title: "Contador de Dólar — notas e moedas" },
      { name: "description", content: "Conte notas e moedas de dólar e veja o total em US$." },
      { property: "og:title", content: "Contador de Dólar" },
      { property: "og:description", content: "Contagem de notas e moedas de dólar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <CurrencyPage cur={CURRENCIES[2]!} />,
});
