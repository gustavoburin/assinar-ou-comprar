import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import App from "@/components/App";
import type { Market } from "@/lib/types";

export function generateStaticParams() {
  return [{ market: "br" }, { market: "us" }];
}

const META: Record<string, Metadata> = {
  br: {
    title: "Assinar ou Comprar? — Game Pass vale a pena para os seus jogos?",
    description: "Monte a lista de jogos, veja preços da Microsoft Store Brasil e descubra se compensa comprar ou assinar o Game Pass.",
  },
  us: {
    title: "Subscribe or Buy? — Is Game Pass worth it for your games?",
    description: "List your games, see US Microsoft Store prices and find out whether buying or subscribing to Game Pass costs less.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[market]">): Promise<Metadata> {
  const { market } = await params;
  return {
    ...META[market],
    alternates: { canonical: `/${market}`, languages: { "pt-BR": "/br", "en-US": "/us" } },
  };
}

export default async function MarketPage({ params }: PageProps<"/[market]">) {
  const { market } = await params;
  if (market !== "br" && market !== "us") notFound();
  return (
    <Suspense>
      <App market={market.toUpperCase() as Market} />
    </Suspense>
  );
}
