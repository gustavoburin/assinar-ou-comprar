import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/products-br.json";
import trialFixture from "./__fixtures__/trial-br.json";
import { isMainGame, parseProduct } from "./xbox";

// Resposta real do displaycatalog (BR) salva em 2026-10-09: FH5 Padrão, FH5 Deluxe, CoD BO6 (Windows).
const raws = fixture.Products;
const byId = (id: string) => raws.find((p: { ProductId: string }) => p.ProductId === id);
const lists = { console: ["9NKX70BBCDRN"], pc: ["9NKX70BBCDRN"] };
const now = Date.parse("2026-10-09T12:00:00Z");
const parse = (id: string) => parseProduct(byId(id), "BR", lists, "2026-10-09T12:00:00Z", now);

describe("parseProduct (fixture real BR)", () => {
  it("FH5 Padrão: preço em centavos, BRL, incluído em Ultimate/Premium/PC", () => {
    const p = parse("9NKX70BBCDRN");
    expect(p.priceMinor).toBe(24900);
    expect(p.currency).toBe("BRL");
    expect(p.includedIn.ultimate).toEqual(["console", "pc"]);
    expect(p.includedIn.premium).toEqual(["console", "pc"]);
    expect(p.includedIn.pc).toEqual(["pc"]);
    expect(p.cover).toMatch(/^https:\/\/store-images/);
    expect(p.memberPriceMinor).toBeNull();
  });

  it("FH5 Deluxe: fora do plano, com desconto de assinante", () => {
    const p = parse("9P1HX37NMJLT");
    expect(p.priceMinor).toBe(30900);
    expect(p.memberPriceMinor).toBe(24720);
    expect(p.includedIn).toEqual({});
  });

  it("CoD BO6 (Windows): sem preço de compra → null, nunca zero", () => {
    const p = parse("9PNCL2R6G8D0");
    expect(p.priceMinor).toBeNull();
    expect(p.available).toBe(false);
  });

  it("ignora disponibilidades que ainda não começaram", () => {
    const past = parseProduct(byId("9NKX70BBCDRN"), "BR", lists, "x", Date.parse("2000-01-01"));
    expect(past.priceMinor).toBeNull();
  });
});

describe("SKU de avaliação", () => {
  it("33 Immortals: ignora o SKU de trial com preço 0 (bug achado no navegador)", () => {
    const p = parseProduct(trialFixture.Products[0], "BR", { console: [], pc: [] }, "x", now);
    expect(p.priceMinor).toBe(7295);
    expect(p.includedIn.premium).toEqual([]);
  });
});

describe("isMainGame", () => {
  it("rejeita pacotes de complementos", () => {
    const fake = { ProductKind: "Game", LocalizedProperties: [{ ProductTitle: "Pacote de Complementos Supremo do Forza Horizon 5" }] };
    expect(isMainGame(fake)).toBe(false);
    expect(isMainGame({ ProductKind: "Durable", LocalizedProperties: [{ ProductTitle: "X" }] })).toBe(false);
    expect(isMainGame(byId("9NKX70BBCDRN"))).toBe(true);
  });
});
