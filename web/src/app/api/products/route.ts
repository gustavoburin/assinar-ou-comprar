import { getProducts, parseIds, parseMarket } from "@/lib/catalog";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const market = parseMarket(url.searchParams.get("market"));
  if (!market) return json({ error: "market inválido" }, 400);
  const ids = parseIds(url.searchParams.get("ids"));
  if (!ids) return json({ error: "ids inválidos (1 a 40 IDs da loja separados por vírgula)" }, 400);
  try {
    const items = await getProducts(ids, market);
    return json({ items }, 200, 1800);
  } catch (e) {
    console.error("products failed", e);
    return json({ error: "fonte indisponível" }, 502);
  }
}
