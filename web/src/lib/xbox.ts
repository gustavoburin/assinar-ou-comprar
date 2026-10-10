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
/** Ultimate reúne os benefícios de todas as assinaturas (inclui PC, Premium, Console legado, EA Play, Ubisoft+). */
const UPPER_EDITION =
  /\b(deluxe|premium|ultimate|gold|definitive|complete|collector'?s|suprema|de luxo|definitiva|completa|edi[cç][aã]o premium|vault|bundle|pacote)\b/i;

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

const XBOX_LOCALE: Record<Market, string> = { BR: "pt-BR", US: "en-US" };

/** Índice logo após o objeto JSON que começa em `start` (o script continua com outro código depois). */
function jsonObjectEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      if (--depth === 0) return i + 1;
    }
  }
  throw new Error("JSON do xbox.com incompleto");
}

/** IDs (em ordem) do primeiro canal de produtos no estado que o xbox.com renderiza no servidor. */
export function channelIdsFromHtml(html: string): string[] {
  const marker = html.indexOf("window.__PRELOADED_STATE__");
  if (marker < 0) throw new Error("xbox.com sem __PRELOADED_STATE__");
  const start = html.indexOf("{", marker);
  const state = JSON.parse(html.slice(start, jsonObjectEnd(html, start)));
  const channels: Record<string, Raw> = state?.core2?.channels?.channelData ?? {};
  for (const ch of Object.values(channels)) {
    const products: Raw[] = ch?.data?.products ?? [];
    if (products.length) return products.map((p) => p.productId).filter((id: unknown) => typeof id === "string");
  }
  return [];
}

/** O xbox.com às vezes devolve 5xx para servidores; tenta de novo antes de desistir. */
async function xboxComIds(path: string, market: Market, attempts = 3): Promise<string[]> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 400 * i));
    try {
      const res = await fetch(`https://www.xbox.com/${XBOX_LOCALE[market]}${path}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; assinar-ou-comprar)", Accept: "text/html", "Accept-Language": XBOX_LOCALE[market] },
      });
      if (res.status >= 500) throw new Error(`HTTP ${res.status} em xbox.com`);
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} em xbox.com`), { final: true });
      return channelIdsFromHtml(await res.text());
    } catch (e) {
      last = e;
      if ((e as { final?: boolean }).final) break;
    }
  }
  throw last;
}

/**
 * Busca de jogos: a mesma do xbox.com (até 25, por relevância, já com lançamentos e só jogos).
 * Se o xbox.com falhar ou mudar de formato, cai no autosuggest (limitado a 10).
 */
export async function fetchSearchIds(query: string, market: Market): Promise<{ ids: string[]; fallback: boolean }> {
  try {
    const ids = await xboxComIds(`/search/results/games?q=${encodeURIComponent(query)}`, market);
    return { ids, fallback: false };
  } catch (e) {
    console.error("busca xbox.com falhou; usando autosuggest", e);
  }
  return { ids: await fetchSuggestions(query, market), fallback: true };
}

/** Jogos em destaque agora (página "Procurar jogos" do xbox.com: mais vendidos/populares). */
export async function fetchPopularIds(market: Market): Promise<string[]> {
  return xboxComIds("/games/browse", market);
}

/** DLCs, pacotes de complementos, upgrades, moedas e demos não aparecem como jogo principal. */
const NOT_A_GAME =
  /\b(add-?ons?|complementos?|season pass|passe de temporada|expansion pass|passe de expans[aã]o|points|pontos|coins|moedas|currency|virtual|upgrade|atualiza[cç][aã]o d[ae]|voucher|demo)\b/i;

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
  const memberBySub = new Map<string, number>();

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
        else
          for (const r of rem) {
            const v = toMinor(price.ListPrice);
            memberBySub.set(r, Math.min(v, memberBySub.get(r) ?? Infinity));
          }
      } else {
        publicPrices.push({ list: toMinor(price.ListPrice), msrp: toMinor(price.MSRP), end: a.Conditions?.EndDate ?? null });
      }
    }
  }

  publicPrices.sort((a, b) => a.list - b.list);
  const best = publicPrices[0];
  const priceMinor = best ? best.list : null;
  const onSale = best && best.list < best.msrp;
  const saleEnd = onSale && best.end && Date.parse(best.end) < Date.parse("2100-01-01") ? best.end : null;

  const onConsole = lists.console.includes(raw.ProductId);
  const onPc = lists.pc.includes(raw.ProductId);
  const plats = (c: boolean, p: boolean): Platform[] => [...(c ? ["console" as const] : []), ...(p ? ["pc" as const] : [])];
  const includedIn: Partial<Record<PlanCode, Platform[]>> = {};
  // Ultimate = listas "All Console/PC Games" do Game Pass.
  if (onConsole || onPc) includedIn.ultimate = plats(onConsole, onPc);
  // Premium: definido pela remediação do catálogo; as listas só refinam a plataforma quando o produto aparece nelas.
  if (subs.has(SUB.premium)) includedIn.premium = onConsole || onPc ? plats(onConsole, onPc) : ["console", "pc"];
  // PC Game Pass: lista PC, exceto títulos que só vêm via Ubisoft+ (exclusivo do Ultimate).
  const ubisoftOnly = allRemediations.has(SUB.ubisoft) && !allRemediations.has(SUB.pc);
  if (onPc && !ubisoftOnly) includedIn.pc = ["pc"];

  // Desconto de assinante só vale para o plano a que o catálogo o associa.
  const memberPrices: Partial<Record<PlanCode, number>> = {};
  const under = (v: number | undefined) => (v !== undefined && priceMinor !== null && v < priceMinor ? v : undefined);
  const pcMember = under(memberBySub.get(SUB.pc));
  const premiumMember = under(memberBySub.get(SUB.premium));
  const anyMember = under(memberBySub.size ? Math.min(...memberBySub.values()) : undefined);
  if (pcMember !== undefined) memberPrices.pc = pcMember;
  if (premiumMember !== undefined) memberPrices.premium = premiumMember;
  if (anyMember !== undefined) memberPrices.ultimate = anyMember;

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
    memberPrices,
    upperEdition: UPPER_EDITION.test(lp.ProductTitle ?? ""),
    includedIn,
    available: priceMinor !== null || subs.size > 0 || onConsole || onPc,
    verifiedAt,
  };
}
