import { describe, expect, it } from "vitest";
import { decodeShare, sanitizePersisted } from "./store";

describe("sanitizePersisted", () => {
  it("descarta campos inválidos e respeita o limite do carrinho", () => {
    const cart = Array.from({ length: 50 }, (_, i) => ({ id: `9N${String(i).padStart(10, "0")}`, owned: "x", keep: true }));
    const out = sanitizePersisted({ cart: [...cart, { id: "bad" }, cart[0]], plan: "foo", platform: "tv", months: 99, locale: "fr" });
    expect(out.cart).toHaveLength(40);
    expect(out.cart![0]).toEqual({ id: cart[0].id, owned: false, keep: true });
    expect(out.plan).toBeUndefined();
    expect(out.platform).toBeUndefined();
    expect(out.locale).toBeUndefined();
    expect(out.months).toBe(36);
  });

  it("PC Game Pass força plataforma PC", () => {
    expect(sanitizePersisted({ plan: "pc", platform: "console" }).platform).toBe("pc");
  });

  it("lixo vira objeto vazio", () => {
    expect(sanitizePersisted("garbage")).toEqual({});
    expect(sanitizePersisted(null)).toEqual({});
  });
});

describe("decodeShare", () => {
  it("link sem item válido não substitui o carrinho", () => {
    expect(decodeShare(new URLSearchParams("i=XXXXXXXXXXXX-invalid"))).toBeNull();
  });

  it("lê flags, plano, meses e ignora o total como dado confiável", () => {
    const d = decodeShare(new URLSearchParams("i=9NKX70BBCDRN.k,9P1HX37NMJLT.o,9NKX70BBCDRN&plan=premium&pf=pc&m=99&t=-5"))!;
    expect(d.cart).toEqual([
      { id: "9NKX70BBCDRN", owned: false, keep: true },
      { id: "9P1HX37NMJLT", owned: true, keep: false },
    ]);
    expect(d.plan).toBe("premium");
    expect(d.months).toBe(36);
    expect(d.hintTotal).toBeNull();
  });
});
