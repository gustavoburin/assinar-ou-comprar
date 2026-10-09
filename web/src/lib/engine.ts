/**
 * Motor de comparação. Puro e determinístico: mesmo código no cliente e no servidor.
 * Regras em docs/prd-review.md §3. Todos os valores em unidade mínima (inteiros).
 */
import type { CartItem, Market, Plan, Platform, Product } from "./types";

export type ItemStatus =
  | "owned" // já possuído: fora do custo
  | "included" // no plano para a plataforma escolhida
  | "buy" // fora do plano: precisa comprar em qualquer cenário
  | "unavailable" // não vendido neste mercado
  | "unknown"; // sem preço conhecido

export type ItemResult = {
  id: string;
  status: ItemStatus;
  /** Custo no cenário "comprar tudo" (null = desconhecido). */
  buyCost: number | null;
  /** Custo no cenário assinatura (0 se incluído; preço de assinante se fora). */
  subscribeCost: number | null;
  keep: boolean;
};

export type Scenario = { key: "buy" | "subscribe" | "subscribeKeep"; totalMinor: number };

export type Comparison = {
  complete: boolean;
  items: ItemResult[];
  /** Itens que tornam a comparação parcial. */
  missing: string[];
  scenarios: Scenario[];
  /** Cenário mais barato; null se parcial, vazio ou empate. */
  cheapest: Scenario["key"] | null;
  /** Diferença entre o mais caro e o mais barato dos cenários principais (buy x subscribe). */
  differenceMinor: number;
  /** Meses de assinatura que empatam com comprar (null se não calculável). */
  breakEvenMonths: number | null;
};

export type CompareInput = {
  market: Market;
  plan: Plan;
  platform: Platform;
  months: number;
  cart: CartItem[];
  products: Record<string, Product | undefined>;
};

export const MIN_MONTHS = 1;
export const MAX_MONTHS = 36;

export function clampMonths(m: number): number {
  if (!Number.isFinite(m)) return MIN_MONTHS;
  return Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, Math.round(m)));
}

/** Preço de compra enquanto assinante: desconto de membro se houver, senão o público. */
function memberOrPublic(p: Product): number | null {
  if (p.priceMinor === null) return null;
  if (p.memberPriceMinor !== null && p.memberPriceMinor < p.priceMinor) return p.memberPriceMinor;
  return p.priceMinor;
}

export function isIncluded(p: Product, plan: Plan, platform: Platform): boolean {
  if (!plan.platforms.includes(platform)) return false;
  return (p.includedIn[plan.code] ?? []).includes(platform);
}

export function compare(input: CompareInput): Comparison {
  const { plan, platform, market } = input;
  const months = clampMonths(input.months);
  const seen = new Set<string>();
  const items: ItemResult[] = [];

  for (const c of input.cart) {
    if (seen.has(c.id)) continue; // mesma edição nunca conta duas vezes
    seen.add(c.id);
    const p = input.products[c.id];
    if (c.owned) {
      items.push({ id: c.id, status: "owned", buyCost: 0, subscribeCost: 0, keep: c.keep });
      continue;
    }
    if (!p || p.market !== market) {
      // Dado do produto ausente (ou de outro mercado): nunca vira zero.
      items.push({ id: c.id, status: "unknown", buyCost: null, subscribeCost: null, keep: c.keep });
      continue;
    }
    const included = isIncluded(p, plan, platform);
    if (!p.available && !included) {
      items.push({ id: c.id, status: "unavailable", buyCost: null, subscribeCost: null, keep: c.keep });
      continue;
    }
    if (included) {
      items.push({ id: c.id, status: "included", buyCost: p.priceMinor, subscribeCost: 0, keep: c.keep });
      continue;
    }
    const price = p.priceMinor;
    items.push({
      id: c.id,
      status: price === null ? "unknown" : "buy",
      buyCost: price,
      subscribeCost: memberOrPublic(p),
      keep: c.keep,
    });
  }

  const missing = items.filter((i) => i.buyCost === null || i.subscribeCost === null).map((i) => i.id);
  const complete = missing.length === 0;
  const sum = (xs: (number | null)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0);

  const monthly = plan.monthlyMinor[market];
  const subscription = months * monthly;
  const buyTotal = sum(items.map((i) => i.buyCost));
  const subscribeTotal = subscription + sum(items.map((i) => i.subscribeCost));

  const scenarios: Scenario[] = [
    { key: "buy", totalMinor: buyTotal },
    { key: "subscribe", totalMinor: subscribeTotal },
  ];

  // "Assinar e manter": compra, com desconto de assinante, só dos marcados que estão INCLUÍDOS
  // (os fora do plano já são comprados no cenário assinatura).
  const keepIncluded = items.filter((i) => i.keep && i.status === "included");
  if (keepIncluded.length > 0) {
    const keepCost = sum(
      keepIncluded.map((i) => {
        const p = input.products[i.id]!;
        return memberOrPublic(p);
      }),
    );
    scenarios.push({ key: "subscribeKeep", totalMinor: subscribeTotal + keepCost });
  }

  const active = items.filter((i) => i.status !== "owned");
  let cheapest: Comparison["cheapest"] = null;
  if (complete && active.length > 0 && buyTotal !== subscribeTotal) {
    cheapest = buyTotal < subscribeTotal ? "buy" : "subscribe";
  }

  // Equilíbrio = (compra − custos de compra no cenário assinatura) / mensalidade.
  let breakEvenMonths: number | null = null;
  if (complete && active.length > 0 && monthly > 0) {
    const avoided = buyTotal - sum(items.map((i) => i.subscribeCost));
    breakEvenMonths = Math.max(0, avoided) / monthly;
  }

  return {
    complete,
    items,
    missing,
    scenarios,
    cheapest,
    differenceMinor: Math.abs(buyTotal - subscribeTotal),
    breakEvenMonths,
  };
}
