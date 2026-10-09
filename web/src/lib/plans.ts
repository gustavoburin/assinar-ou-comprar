import type { Plan, PlanCode } from "./types";

/**
 * Planos curados à mão (o catálogo da Microsoft mistura SKUs de teste/promo/legado).
 * Conferido em xbox.com/{pt-BR,en-US}/xbox-game-pass em 2026-10-09; bate com o SKU "1 mês" do catálogo.
 * Essential fica fora: a lista de jogos dele não está exposta (ver docs/prd-review.md).
 */
export const PLANS: Plan[] = [
  {
    code: "ultimate",
    name: "Game Pass Ultimate",
    platforms: ["console", "pc"],
    monthlyMinor: { BR: 7690, US: 2299 },
    verifiedAt: "2026-10-09",
    source: "xbox.com",
  },
  {
    code: "premium",
    name: "Game Pass Premium",
    platforms: ["console", "pc"],
    monthlyMinor: { BR: 5990, US: 1499 },
    verifiedAt: "2026-10-09",
    source: "xbox.com",
  },
  {
    code: "pc",
    name: "PC Game Pass",
    platforms: ["pc"],
    monthlyMinor: { BR: 5999, US: 1399 },
    verifiedAt: "2026-10-09",
    source: "xbox.com",
  },
];

export const planByCode = (code: PlanCode) => PLANS.find((p) => p.code === code)!;
