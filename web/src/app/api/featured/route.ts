import { featured, parseMarket } from "@/lib/catalog";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const market = parseMarket(new URL(req.url).searchParams.get("market"));
  if (!market) return json({ error: "market inválido" }, 400);
  try {
    const { items, fallback } = await featured(market);
    return json({ items }, 200, fallback ? 60 : 3600);
  } catch (e) {
    console.error("featured failed", e);
    return json({ error: "fonte indisponível" }, 502);
  }
}
