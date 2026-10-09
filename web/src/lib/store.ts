"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clampMonths } from "./engine";
import type { CartItem, Locale, PlanCode, Platform } from "./types";

type State = {
  cart: CartItem[];
  plan: PlanCode;
  platform: Platform;
  months: number;
  locale: Locale | null; // null = padrão do mercado
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  toggle: (id: string, field: "owned" | "keep") => void;
  replaceCart: (cart: CartItem[]) => void;
  set: (patch: Partial<Pick<State, "plan" | "platform" | "months" | "locale">>) => void;
};

export const MAX_CART = 40;

export const useApp = create<State>()(
  persist(
    (set) => ({
      cart: [],
      plan: "ultimate",
      platform: "console",
      months: 3,
      locale: null,
      add: (id) =>
        set((s) => (s.cart.some((c) => c.id === id) || s.cart.length >= MAX_CART ? s : { cart: [...s.cart, { id, owned: false, keep: false }] })),
      remove: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
      clear: () => set({ cart: [] }),
      toggle: (id, field) => set((s) => ({ cart: s.cart.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c)) })),
      replaceCart: (cart) => set({ cart: cart.slice(0, MAX_CART) }),
      set: (patch) =>
        set((s) => {
          const next = { ...s, ...patch };
          next.months = clampMonths(next.months);
          // PC Game Pass só existe no PC.
          if (next.plan === "pc" && next.platform !== "pc") {
            if (patch.platform) next.plan = "ultimate";
            else next.platform = "pc";
          }
          return next;
        }),
    }),
    {
      name: "gpoc-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cart: s.cart, plan: s.plan, platform: s.platform, months: s.months, locale: s.locale }),
    },
  ),
);

/* Link compartilhável: estado inteiro na URL, sem banco. Preços nunca vão no link (só uma dica opcional). */
export function encodeShare(s: Pick<State, "cart" | "plan" | "platform" | "months">, buyTotalMinor: number | null): string {
  const p = new URLSearchParams();
  p.set("i", s.cart.map((c) => c.id + (c.owned ? ".o" : "") + (c.keep ? ".k" : "")).join(","));
  p.set("plan", s.plan);
  p.set("pf", s.platform);
  p.set("m", String(s.months));
  if (buyTotalMinor !== null) p.set("t", String(buyTotalMinor));
  return p.toString();
}

export type DecodedShare = { cart: CartItem[]; plan?: PlanCode; platform?: Platform; months?: number; hintTotal: number | null };

export function decodeShare(sp: URLSearchParams): DecodedShare | null {
  const raw = sp.get("i");
  if (!raw) return null;
  const cart: CartItem[] = [];
  for (const tok of raw.split(",").slice(0, MAX_CART)) {
    const [id, ...flags] = tok.toUpperCase().split(".");
    if (!/^[0-9A-Z]{12}$/.test(id) || cart.some((c) => c.id === id)) continue;
    cart.push({ id, owned: flags.includes("O"), keep: flags.includes("K") });
  }
  const plan = sp.get("plan");
  const pf = sp.get("pf");
  const t = Number(sp.get("t"));
  return {
    cart,
    plan: plan === "ultimate" || plan === "premium" || plan === "pc" ? plan : undefined,
    platform: pf === "console" || pf === "pc" ? pf : undefined,
    months: sp.get("m") ? clampMonths(Number(sp.get("m"))) : undefined,
    hintTotal: Number.isSafeInteger(t) && t > 0 ? t : null,
  };
}
