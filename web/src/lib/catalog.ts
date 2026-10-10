/**
 * Camada de cache sobre xbox.ts. A Microsoft só é consultada quando o cache expira;
 * `verifiedAt` registra quando o dado foi realmente buscado na fonte.
 */
import { cacheLife } from "next/cache";
import type { Market, Product } from "./types";
import { fetchGamePassLists, fetchPopularIds, fetchRawProducts, fetchSearchIds, isMainGame, parseProduct, type GamePassLists } from "./xbox";

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

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const sellable = (p: Product) => p.priceMinor !== null || Object.keys(p.includedIn).length > 0;

/**
 * Página "hub" do xbox.com (ex.: "Forza Horizon 6" sem edição) não é vendida sozinha: some quando há uma edição
 * vendável com o mesmo título nos resultados. Sem preço e sem plano, mas sem irmã (ex.: jogo removido da loja), vai para o fim.
 */
export function tidyResults(items: Product[]): Product[] {
  const sellableTitles = items.filter(sellable).map((p) => norm(p.title));
  const ok = items.filter(sellable);
  const rest = items.filter((p) => !sellable(p) && !sellableTitles.some((t) => t !== norm(p.title) && t.startsWith(norm(p.title))));
  return [...ok, ...rest];
}

/** Detalhes (preço, inclusão) na ordem dada, só jogos principais. */
async function detailsInOrder(ids: string[], market: Market): Promise<Product[]> {
  const [lists, raws] = await Promise.all([gamePassLists(market), fetchRawProducts(ids, market)]);
  const verifiedAt = new Date().toISOString();
  const byId = new Map(raws.filter(isMainGame).map((r) => [r.ProductId as string, r]));
  return tidyResults(
    ids.flatMap((id) => {
      const r = byId.get(id);
      return r ? [parseProduct(r, market, lists, verifiedAt)] : [];
    }),
  );
}

async function searchCached(query: string, market: Market): Promise<Product[]> {
  "use cache: remote";
  const { ids, fallback } = await fetchSearchIds(query, market);
  // Resultado do fallback (só 10, sem lançamentos no topo) fica pouco tempo no cache.
  if (fallback) cacheLife("minutes");
  else cacheLife("hours");
  return ids.length ? detailsInOrder(ids.slice(0, 25), market) : [];
}

export async function searchProducts(query: string, market: Market): Promise<Product[]> {
  const q = query.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 60);
  if (q.length < 2) return [];
  return searchCached(q, market);
}

/** Estado vazio: o que está em alta no xbox.com agora (fallback: lista do Game Pass). */
export async function featured(market: Market): Promise<Product[]> {
  "use cache: remote";
  let ids: string[] = [];
  try {
    ids = await fetchPopularIds(market);
  } catch (e) {
    console.error("destaques xbox.com falharam; usando lista do Game Pass", e);
  }
  if (ids.length === 0) {
    cacheLife("minutes");
    ids = (await gamePassLists(market)).console.slice(0, 16);
  } else cacheLife("hours");
  return (await detailsInOrder(ids.slice(0, 25), market)).slice(0, 12);
}
