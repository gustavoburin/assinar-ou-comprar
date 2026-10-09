import { getProducts, parseMarket, sanitizeIds } from "@/lib/catalog";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const market = parseMarket(url.searchParams.get("market"));
  if (!market) return json({ error: "market inválido" }, 400);
  const ids = sanitizeIds(url.searchParams.get("ids"));
  try {
    const items = await getProducts(ids, market);
    return json({ items }, 200, 1800);
  } catch (e) {
    console.error("products failed", e);
    return json({ error: "fonte indisponível" }, 502);
  }
}
