/**
 * Leitura dos endpoints públicos (não documentados) da Microsoft Store / Game Pass.
 * Só roda no servidor, com cache (ver catalog.ts). Funções de parse são puras e testadas.
 */
import type { Market, PlanCode, Platform, Product } from "./types";

export const MARKET_LANG: Record<Market, string> = { BR: "pt-br", US: "en-us" };
const SIGL_CONSOLE = "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e";
const SIGL_PC = "fdd9e2a7-0fee-49f6-ad69-4354098401ff";
const SUB = {
  premium: "CFQ7TTC0P85B",
  pc: "CFQ7TTC0KGQ8",
  ubisoft: "CFQ7TTC0QH5H",
} as const;

export type GamePassLists = { console: string[]; pc: string[] };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any;

async function getJson(url: string): Promise<Raw> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${new URL(url).host}`);
  return res.json();
}

export async function fetchGamePassLists(market: Market): Promise<GamePassLists> {
  const lang = MARKET_LANG[market];
  const list = async (id: string) => {
    const d = await getJson(`https://catalog.gamepass.com/sigls/v2?id=${id}&language=${lang}&market=${market}`);
    return (d as Raw[]).slice(1).map((x) => x.id as string);
  };
  const [console_, pc] = await Promise.all([list(SIGL_CONSOLE), list(SIGL_PC)]);
  return { console: console_, pc };
}

export async function fetchRawProducts(ids: string[], market: Market): Promise<Raw[]> {
  if (ids.length === 0) return [];
  const out: Raw[] = [];
  for (let i = 0; i < ids.length; i += 20) {
    const q = new URLSearchParams({
      bigIds: ids.slice(i, i + 20).join(","),
      market,
      languages: MARKET_LANG[market],
      "MS-CV": "gpoc.1",
    });
    const d = await getJson(`https://displaycatalog.mp.microsoft.com/v7.0/products?${q}`);
    out.push(...(d.Products ?? []));
  }
  return out;
}

export async function fetchSuggestions(query: string, market: Market): Promise<string[]> {
  const q = new URLSearchParams({
    market,
    languages: MARKET_LANG[market],
    query,
    productFamilyNames: "Games",
  });
  const d = await getJson(`https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?${q}`);
  const ids: string[] = [];
  for (const r of d.Results ?? []) for (const p of r.Products ?? []) if (p.Type === "Game") ids.push(p.ProductId);
  return ids;
}

/** DLCs, pacotes de complementos e moedas não aparecem como jogo principal. */
const NOT_A_GAME =
  /\b(add-?ons?|complementos?|season pass|passe de temporada|expansion pass|passe de expans[aã]o|points|pontos|coins|moedas|currency|virtual)\b/i;

export function isMainGame(raw: Raw): boolean {
  if (raw.ProductKind !== "Game") return false;
  const title: string = raw.LocalizedProperties?.[0]?.ProductTitle ?? "";
  return !NOT_A_GAME.test(title);
}

const toMinor = (v: number) => Math.round(v * 100);

function pickCover(images: Raw[]): string | null {
  for (const purpose of ["Poster", "BoxArt", "FeaturePromotionalSquareArt"]) {
    const img = images.find((i) => i.ImagePurpose === purpose);
    if (img?.Uri) return (img.Uri.startsWith("//") ? "https:" : "") + img.Uri;
  }
  return null;
}

function activeNow(a: Raw, now: number): boolean {
  const c = a.Conditions ?? {};
  const start = c.StartDate ? Date.parse(c.StartDate) : -Infinity;
  const end = c.EndDate ? Date.parse(c.EndDate) : Infinity;
  return start <= now && now <= end;
}

export function parseProduct(raw: Raw, market: Market, lists: GamePassLists, verifiedAt: string, now = Date.now()): Product {
  const lp = raw.LocalizedProperties?.[0] ?? {};
  const currency = market === "BR" ? "BRL" : "USD";
  const subs = new Set<string>(); // assinaturas com acesso incluído (preço 0)
  const allRemediations = new Set<string>();
  const publicPrices: { list: number; msrp: number; end: string | null }[] = [];
  const memberPrices: number[] = [];

  for (const sku of raw.DisplaySkuAvailabilities ?? []) {
    // SKUs de avaliação gratuita custam 0 e não são o preço do jogo.
    if (sku.Sku?.Properties?.IsTrial) continue;
    for (const a of sku.Availabilities ?? []) {
      if (!activeNow(a, now)) continue;
      const price = a.OrderManagementData?.Price;
      if (!price || price.CurrencyCode !== currency) continue;
      const rem: string[] = (a.Remediations ?? []).filter((r: Raw) => r.Type === "Upsell").map((r: Raw) => r.BigId);
      rem.forEach((r) => allRemediations.add(r));
      if (!(a.Actions ?? []).includes("Purchase")) continue;
      if (rem.length > 0) {
        if (price.ListPrice === 0) rem.forEach((r) => subs.add(r));
        else memberPrices.push(toMinor(price.ListPrice));
      } else {
        publicPrices.push({ list: toMinor(price.ListPrice), msrp: toMinor(price.MSRP), end: a.Conditions?.EndDate ?? null });
      }
    }
  }

  publicPrices.sort((a, b) => a.list - b.list);
  const best = publicPrices[0];
  const priceMinor = best ? best.list : null;
  const memberMin = memberPrices.length ? Math.min(...memberPrices) : null;
  const onSale = best && best.list < best.msrp;
  const saleEnd = onSale && best.end && Date.parse(best.end) < Date.parse("2100-01-01") ? best.end : null;

  const onConsole = lists.console.includes(raw.ProductId);
  const onPc = lists.pc.includes(raw.ProductId);
  const plats = (c: boolean, p: boolean): Platform[] => [...(c ? ["console" as const] : []), ...(p ? ["pc" as const] : [])];
  const includedIn: Partial<Record<PlanCode, Platform[]>> = {};
  // Ultimate = listas "All Console/PC Games" do Game Pass.
  if (onConsole || onPc) includedIn.ultimate = plats(onConsole, onPc);
  // Premium: remediação estruturada do catálogo, restrita às listas.
  if (subs.has(SUB.premium)) includedIn.premium = plats(onConsole, onPc);
  // PC Game Pass: lista PC, exceto títulos que só vêm via Ubisoft+ (exclusivo do Ultimate).
  const ubisoftOnly = allRemediations.has(SUB.ubisoft) && !allRemediations.has(SUB.pc);
  if (onPc && !ubisoftOnly) includedIn.pc = ["pc"];

  const release = raw.MarketProperties?.[0]?.OriginalReleaseDate ?? null;
  const locale = market === "BR" ? "pt-BR" : "en-US";
  return {
    id: raw.ProductId,
    market,
    currency,
    title: lp.ProductTitle ?? raw.ProductId,
    cover: pickCover(lp.Images ?? []),
    storeUrl: `https://www.xbox.com/${locale}/games/store/p/${raw.ProductId}`,
    releaseDate: release && !release.startsWith("1753") ? release : null,
    priceMinor,
    regularPriceMinor: best ? best.msrp : null,
    saleEndsAt: saleEnd,
    memberPriceMinor: memberMin !== null && priceMinor !== null && memberMin < priceMinor ? memberMin : null,
    includedIn,
    available: priceMinor !== null || subs.size > 0 || onConsole || onPc,
    verifiedAt,
  };
}
