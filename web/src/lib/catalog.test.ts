import { describe, expect, it } from "vitest";
import { tidyResults } from "./catalog";
import type { Product } from "./types";

const p = (title: string, priceMinor: number | null, inPlan = false): Product => ({
  id: title,
  market: "BR",
  currency: "BRL",
  title,
  cover: null,
  storeUrl: "",
  releaseDate: null,
  priceMinor,
  regularPriceMinor: priceMinor,
  saleEndsAt: null,
  memberPrices: {},
  upperEdition: false,
  includedIn: inPlan ? { ultimate: ["console"] } : {},
  available: true,
  verifiedAt: "",
});

describe("tidyResults", () => {
  it("esconde a página hub quando há edição vendável com o mesmo título", () => {
    const out = tidyResults([p("Forza Horizon 6", null), p("Forza Horizon 6 Standard Edition", 29900, true), p("Forza Horizon 5", 24900)]);
    expect(out.map((x) => x.title)).toEqual(["Forza Horizon 6 Standard Edition", "Forza Horizon 5"]);
  });

  it("jogo sem preço e sem edição irmã (removido da loja) vai para o fim, não some", () => {
    const out = tidyResults([p("Forza Horizon 3", null), p("Forza Horizon 5", 24900)]);
    expect(out.map((x) => x.title)).toEqual(["Forza Horizon 5", "Forza Horizon 3"]);
  });

  it("incluído no plano sem preço de venda continua na ordem original", () => {
    const out = tidyResults([p("A", null, true), p("B", 100)]);
    expect(out.map((x) => x.title)).toEqual(["A", "B"]);
  });
});
