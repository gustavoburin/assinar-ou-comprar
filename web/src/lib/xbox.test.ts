import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/products-br.json";
import trialFixture from "./__fixtures__/trial-br.json";
import { readFileSync } from "node:fs";
import { channelIdsFromHtml, isMainGame, parseProduct } from "./xbox";

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
    expect(p.memberPrices).toEqual({});
    expect(p.upperEdition).toBe(false);
  });

  it("FH5 Deluxe: fora do plano; desconto só para PC Game Pass e Ultimate (não Premium)", () => {
    const p = parse("9P1HX37NMJLT");
    expect(p.priceMinor).toBe(30900);
    expect(p.memberPrices).toEqual({ pc: 24720, ultimate: 24720 });
    expect(p.upperEdition).toBe(true);
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
    expect(p.includedIn.premium).toEqual(["console", "pc"]); // Premium vem da remediação, mesmo fora das listas
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

describe("channelIdsFromHtml (busca real do xbox.com por \"halo\", 2026-10-10)", () => {
  const html = readFileSync(new URL("./__fixtures__/xbox-search-halo.html", import.meta.url), "utf8");

  it("extrai os 25 jogos em ordem, com o remake Campaign Evolved no topo", () => {
    const ids = channelIdsFromHtml(html);
    expect(ids).toHaveLength(25);
    expect(ids.slice(0, 3)).toContain("9N6J4RNFPKKL");
  });

  it("falha de forma explícita se o formato mudar", () => {
    expect(() => channelIdsFromHtml("<html></html>")).toThrow();
  });
});

describe("isMainGame: upgrades e vouchers", () => {
  const g = (t: string) => ({ ProductKind: "Game", LocalizedProperties: [{ ProductTitle: t }] });
  it("rejeita upgrade de edição, voucher e demo", () => {
    expect(isMainGame(g("Forza Horizon 6 Premium Upgrade"))).toBe(false);
    expect(isMainGame(g("Halo: Campaign Evolved - Atualização da Premium Edition"))).toBe(false);
    expect(isMainGame(g("Halo Wars 2 Demo"))).toBe(false);
    expect(isMainGame(g("Gears of War: E-Day Premium Edition"))).toBe(true);
  });
});
