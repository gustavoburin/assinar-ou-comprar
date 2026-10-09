/**
 * Camada de cache sobre xbox.ts. A Microsoft só é consultada quando o cache expira;
 * `verifiedAt` registra quando o dado foi realmente buscado na fonte.
 */
import { cacheLife } from "next/cache";
import type { Market, Product } from "./types";
import { fetchGamePassLists, fetchRawProducts, fetchSuggestions, isMainGame, parseProduct, type GamePassLists } from "./xbox";

export const MAX_IDS = 40;
const ID_RE = /^[0-9A-Z]{12}$/;

export function sanitizeIds(raw: string | null): string[] {
  if (!raw) return [];
  const ids = raw.toUpperCase().split(",").map((s) => s.trim()).filter((s) => ID_RE.test(s));
  return [...new Set(ids)].slice(0, MAX_IDS);
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

async function productsUncached(ids: string[], market: Market): Promise<Product[]> {
  const [lists, raws] = await Promise.all([gamePassLists(market), fetchRawProducts(ids, market)]);
  const verifiedAt = new Date().toISOString();
  return raws.map((r) => parseProduct(r, market, lists, verifiedAt));
}

/** `ids` deve vir ordenado para reaproveitar o cache. */
async function productsCached(ids: string[], market: Market): Promise<Product[]> {
  "use cache: remote";
  cacheLife("hours");
  return productsUncached(ids, market);
}

export async function getProducts(ids: string[], market: Market): Promise<Product[]> {
  return productsCached([...ids].sort(), market);
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
