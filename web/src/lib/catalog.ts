/**
 * Camada de cache sobre xbox.ts. A Microsoft só é consultada quando o cache expira;
 * `verifiedAt` registra quando o dado foi realmente buscado na fonte.
 */
import { cacheLife } from "next/cache";
import type { Market, Product } from "./types";
import { fetchGamePassLists, fetchRawProducts, fetchSuggestions, isMainGame, parseProduct, type GamePassLists } from "./xbox";

export const MAX_IDS = 40;
const ID_RE = /^[0-9A-Z]{12}$/;

/** IDs da loja vindos da URL. null = parâmetro inválido (vazio, token malformado ou acima do limite). */
export function parseIds(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = raw.toUpperCase().split(",").map((s) => s.trim());
  if (ids.length > MAX_IDS || ids.some((s) => !ID_RE.test(s))) return null;
  return [...new Set(ids)];
}

export function parseMarket(raw: string | null): Market | null {
  const m = raw?.toUpperCase();
  return m === "BR" || m === "US" ? m : null;
}

async function gamePassLists(market: Market): Promise<GamePassLists> {
  "use cache: remote";
  cacheLife("hours");
  return fetchGamePassLists(market);
}

/** Cache por (mercado, produto): carrinhos diferentes reaproveitam os mesmos itens. */
async function productCached(id: string, market: Market): Promise<Product | null> {
  "use cache: remote";
  cacheLife("hours");
  const [lists, raws] = await Promise.all([gamePassLists(market), fetchRawProducts([id], market)]);
  return raws[0] ? parseProduct(raws[0], market, lists, new Date().toISOString()) : null;
}

export async function getProducts(ids: string[], market: Market): Promise<Product[]> {
  const found = await Promise.all(ids.map((id) => productCached(id, market)));
  return found.filter((p): p is Product => p !== null);
}

async function searchCached(query: string, market: Market): Promise<Product[]> {
  "use cache: remote";
  cacheLife("hours");
  const ids = await fetchSuggestions(query, market);
  if (ids.length === 0) return [];
  const [lists, raws] = await Promise.all([gamePassLists(market), fetchRawProducts(ids.slice(0, 20), market)]);
  const verifiedAt = new Date().toISOString();
  return raws.filter(isMainGame).map((r) => parseProduct(r, market, lists, verifiedAt));
}

export async function searchProducts(query: string, market: Market): Promise<Product[]> {
  const q = query.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return [];
  return searchCached(q, market);
}

/** Atalhos do estado vazio: primeiros itens reais da lista de console do Game Pass. */
export async function featured(market: Market): Promise<Product[]> {
  "use cache: remote";
  cacheLife("hours");
  const lists = await gamePassLists(market);
  const raws = await fetchRawProducts(lists.console.slice(0, 16), market);
  const verifiedAt = new Date().toISOString();
  return raws.filter(isMainGame).map((r) => parseProduct(r, market, lists, verifiedAt)).slice(0, 8);
}
