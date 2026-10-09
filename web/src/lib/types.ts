export type Market = "BR" | "US";
export type Locale = "pt-BR" | "en-US";
export type Platform = "console" | "pc";
export type PlanCode = "premium" | "ultimate" | "pc";

/** Produto (uma edição vendável) com dados de um mercado. Valores em unidade mínima (centavos). */
export type Product = {
  id: string; // ID da Microsoft Store (BigId)
  market: Market;
  currency: "BRL" | "USD";
  title: string;
  cover: string | null;
  storeUrl: string;
  releaseDate: string | null;
  /** Preço vigente ao público (promoção incluída); null = desconhecido, nunca 0 por falta de dado. */
  priceMinor: number | null;
  /** Preço cheio (MSRP), para mostrar promoção. */
  regularPriceMinor: number | null;
  saleEndsAt: string | null;
  /** Preço com desconto de assinante, quando existir e for menor que o público. */
  memberPriceMinor: number | null;
  /** Em quais planos e plataformas o produto está incluído. */
  includedIn: Partial<Record<PlanCode, Platform[]>>;
  /** false = encontrado mas indisponível neste mercado. */
  available: boolean;
  verifiedAt: string;
};

export type Plan = {
  code: PlanCode;
  name: string;
  platforms: Platform[];
  monthlyMinor: Record<Market, number>;
  verifiedAt: string;
  source: string;
};

export type CartItem = { id: string; owned: boolean; keep: boolean };
