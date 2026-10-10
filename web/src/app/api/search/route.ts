import { parseMarket, searchProducts } from "@/lib/catalog";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const market = parseMarket(url.searchParams.get("market"));
  if (!market) return json({ error: "market inválido" }, 400);
  try {
    const { items, fallback } = await searchProducts(url.searchParams.get("q") ?? "", market);
    return json({ items }, 200, fallback ? 60 : 600);
  } catch (e) {
    console.error("search failed", e);
    return json({ error: "fonte indisponível" }, 502);
  }
}
