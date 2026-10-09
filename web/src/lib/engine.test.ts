import { describe, expect, it } from "vitest";
import { clampMonths, compare, type CompareInput } from "./engine";
import { planByCode } from "./plans";
import type { Product } from "./types";

const base: Omit<Product, "id" | "title"> = {
  market: "BR",
  currency: "BRL",
  cover: null,
  storeUrl: "",
  releaseDate: null,
  priceMinor: 24900,
  regularPriceMinor: 24900,
  saleEndsAt: null,
  memberPriceMinor: null,
  includedIn: {},
  available: true,
  verifiedAt: "2026-10-09T00:00:00Z",
};
const prod = (id: string, over: Partial<Product> = {}): Product => ({ ...base, id, title: id, ...over });

// Ultimate BR = R$ 76,90 (7690)
const fh5 = prod("FH5", { priceMinor: 24900, includedIn: { ultimate: ["console", "pc"], premium: ["console", "pc"] } });
const fm = prod("FM", { priceMinor: 34900, includedIn: { ultimate: ["console", "pc"], premium: ["console", "pc"] } });
const cod = prod("COD", { priceMinor: 39900, memberPriceMinor: 31920 }); // fora do plano, -20% assinante
const pcOnly = prod("PCONLY", { priceMinor: 10000, includedIn: { ultimate: ["pc"], pc: ["pc"] } });

function input(over: Partial<CompareInput>): CompareInput {
  const products = Object.fromEntries([fh5, fm, cod, pcOnly].map((p) => [p.id, p]));
  return {
    market: "BR",
    plan: planByCode("ultimate"),
    platform: "console",
    months: 3,
    cart: [],
    products,
    ...over,
  };
}
const total = (r: ReturnType<typeof compare>, k: string) => r.scenarios.find((s) => s.key === k)?.totalMinor;
const cart = (...ids: string[]) => ids.map((id) => ({ id, owned: false, keep: false }));

describe("compare", () => {
  it("soma uma e várias edições no cenário comprar", () => {
    expect(total(compare(input({ cart: cart("FH5") })), "buy")).toBe(24900);
    expect(total(compare(input({ cart: cart("FH5", "FM") })), "buy")).toBe(59800);
  });

  it("assinatura com todos incluídos = meses × mensalidade", () => {
    const r = compare(input({ cart: cart("FH5", "FM") }));
    expect(total(r, "subscribe")).toBe(3 * 7690);
    expect(r.cheapest).toBe("subscribe");
    expect(r.differenceMinor).toBe(59800 - 23070);
  });

  it("jogo fora do plano entra na assinatura com preço de assinante", () => {
    const r = compare(input({ cart: cart("FH5", "COD") }));
    expect(total(r, "buy")).toBe(24900 + 39900);
    expect(total(r, "subscribe")).toBe(3 * 7690 + 31920);
    expect(r.items.find((i) => i.id === "COD")!.status).toBe("buy");
  });

  it("ponto de equilíbrio considera a economia de assinante nos jogos fora do plano", () => {
    const r = compare(input({ cart: cart("FH5", "COD") }));
    // (64800 − 31920) / 7690
    expect(r.breakEvenMonths).toBeCloseTo((24900 + 39900 - 31920) / 7690, 6);
  });

  it("item já possuído sai do custo", () => {
    const r = compare(input({ cart: [{ id: "FH5", owned: true, keep: false }, ...cart("COD")] }));
    expect(total(r, "buy")).toBe(39900);
  });

  it("mesma edição adicionada duas vezes conta uma vez", () => {
    expect(total(compare(input({ cart: cart("FH5", "FH5") })), "buy")).toBe(24900);
  });

  it("plataforma incompatível não conta como incluído", () => {
    const onConsole = compare(input({ cart: cart("PCONLY") }));
    expect(onConsole.items[0].status).toBe("buy");
    const onPc = compare(input({ cart: cart("PCONLY"), platform: "pc" }));
    expect(onPc.items[0].status).toBe("included");
  });

  it("PC Game Pass não cobre console", () => {
    const r = compare(input({ cart: cart("PCONLY"), plan: planByCode("pc"), platform: "console" }));
    expect(r.items[0].status).toBe("buy");
  });

  it("preço desconhecido nunca vira zero: comparação parcial, sem vencedor", () => {
    const nop = prod("NOP", { priceMinor: null, regularPriceMinor: null });
    const r = compare(input({ cart: cart("FH5", "NOP"), products: { FH5: fh5, NOP: nop } }));
    expect(r.complete).toBe(false);
    expect(r.missing).toEqual(["NOP"]);
    expect(r.cheapest).toBeNull();
    expect(r.breakEvenMonths).toBeNull();
    expect(total(r, "buy")).toBe(24900); // subtotal conhecido
  });

  it("jogo incluído sem preço de venda ainda dá comparação parcial (não dá para saber quanto custaria comprar)", () => {
    const gpOnly = prod("GPO", { priceMinor: null, includedIn: { ultimate: ["console"] } });
    const r = compare(input({ cart: cart("GPO"), products: { GPO: gpOnly } }));
    expect(r.items[0].status).toBe("included");
    expect(r.complete).toBe(false);
  });

  it("produto sem dado ou de outro mercado não vira zero", () => {
    const us = prod("USONLY", { market: "US" });
    const r = compare(input({ cart: cart("USONLY", "GHOST"), products: { USONLY: us } }));
    expect(r.items.map((i) => i.status)).toEqual(["unknown", "unknown"]);
    expect(r.complete).toBe(false);
  });

  it("indisponível no mercado é sinalizado", () => {
    const na = prod("NA", { available: false, priceMinor: null });
    const r = compare(input({ cart: cart("NA"), products: { NA: na } }));
    expect(r.items[0].status).toBe("unavailable");
    expect(r.complete).toBe(false);
  });

  it("assinar e manter soma só itens incluídos marcados, sem duplicar os de fora do plano", () => {
    const r = compare(
      input({
        cart: [
          { id: "FH5", owned: false, keep: true },
          { id: "COD", owned: false, keep: true },
        ],
      }),
    );
    // assinatura + COD (assinante) + FH5 (sem desconto de assinante → público)
    expect(total(r, "subscribeKeep")).toBe(3 * 7690 + 31920 + 24900);
  });

  it("sem itens para manter, não existe cenário extra", () => {
    expect(compare(input({ cart: cart("FH5") })).scenarios.map((s) => s.key)).toEqual(["buy", "subscribe"]);
  });

  it("empate não declara vencedor", () => {
    const p = prod("X", { priceMinor: 7690, includedIn: { ultimate: ["console"] } });
    const r = compare(input({ cart: cart("X"), months: 1, products: { X: p } }));
    expect(r.cheapest).toBeNull();
  });

  it("carrinho vazio não tem recomendação", () => {
    const r = compare(input({ cart: [] }));
    expect(r.cheapest).toBeNull();
    expect(r.breakEvenMonths).toBeNull();
  });

  it("valores são inteiros", () => {
    const r = compare(input({ cart: cart("FH5", "FM", "COD"), months: 7 }));
    r.scenarios.forEach((s) => expect(Number.isInteger(s.totalMinor)).toBe(true));
  });
});

describe("clampMonths", () => {
  it("limita entre 1 e 36", () => {
    expect(clampMonths(0)).toBe(1);
    expect(clampMonths(99)).toBe(36);
    expect(clampMonths(NaN)).toBe(1);
    expect(clampMonths(6)).toBe(6);
  });
});
