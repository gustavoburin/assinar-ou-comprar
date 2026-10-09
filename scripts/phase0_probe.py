"""Fase 0: sonda os endpoints públicos (não documentados) da Microsoft para BR e US.

Uso: python3 scripts/phase0_probe.py > docs/phase0-probe.txt
Cobre: listas do Game Pass (sigls), busca (autosuggest), preços por edição,
inclusão/desconto de assinante (remediações Upsell), capas e preços de planos.
"""
import json
import urllib.parse
import urllib.request

MARKETS = [("BR", "pt-br"), ("US", "en-us")]
SIGLS = {
    "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e": "All Console Games",
    "fdd9e2a7-0fee-49f6-ad69-4354098401ff": "All PC Games",
}
PLANS = {
    "CFQ7TTC0K5DJ": "Essential",
    "CFQ7TTC0P85B": "Premium",
    "CFQ7TTC0KHS0": "Ultimate",
    "CFQ7TTC0KGQ8": "PC Game Pass",
    "CFQ7TTC0K6L8": "Console (legado)",
}
# FH5 Padrão, FH5 Deluxe, Forza Motorsport, Starfield, CoD BO6 (Windows)
GAMES = ["9NKX70BBCDRN", "9P1HX37NMJLT", "9PLKVSWR299F", "9NCJSXWZTP88", "9PNCL2R6G8D0"]


def get(url):
    return json.load(urllib.request.urlopen(url, timeout=30))


def products(ids, market, lang):
    q = urllib.parse.urlencode({"bigIds": ",".join(ids), "market": market, "languages": lang, "MS-CV": "probe.1"})
    return get(f"https://displaycatalog.mp.microsoft.com/v7.0/products?{q}")["Products"]


def purchase_prices(p):
    """(moeda, MSRP, ListPrice, planos de upsell) de cada availability de compra."""
    out = []
    for sku in p.get("DisplaySkuAvailabilities", []):
        for a in sku.get("Availabilities", []):
            price = a.get("OrderManagementData", {}).get("Price")
            if not price or "Purchase" not in a.get("Actions", []):
                continue
            upsell = sorted(PLANS.get(r.get("BigId"), r.get("BigId")) for r in a.get("Remediations") or [])
            out.append((price["CurrencyCode"], price["MSRP"], price["ListPrice"], upsell))
    return out


for market, lang in MARKETS:
    print(f"\n######## {market} ########")

    print("\n-- Listas Game Pass (sigls)")
    for sid, name in SIGLS.items():
        items = get(f"https://catalog.gamepass.com/sigls/v2?id={sid}&language={lang}&market={market}")
        print(f"{name}: {len(items) - 1} produtos")

    print("\n-- Busca 'forza' (autosuggest)")
    q = urllib.parse.urlencode({"market": market, "languages": lang, "query": "forza", "productFamilyNames": "Games"})
    res = get(f"https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?{q}")
    for r in res.get("Results", []):
        for p in r.get("Products", [])[:8]:
            print(f"{p['ProductId']}  {p['Title']}  ({p.get('Type')})")

    print("\n-- Jogos: preço de compra, inclusão (preço 0 via Upsell) e desconto de assinante")
    for p in products(GAMES, market, lang):
        lp = p["LocalizedProperties"][0]
        prices = sorted(set((c, m, l, tuple(u)) for c, m, l, u in purchase_prices(p)))
        included = sorted({u for c, m, l, us in prices if l == 0 for u in us})
        member = sorted({l for c, m, l, us in prices if us and 0 < l < m})
        public = sorted({l for c, m, l, us in prices if not us})
        covers = [i["ImagePurpose"] for i in lp.get("Images", [])]
        print(f"{p['ProductId']}  {lp['ProductTitle']}  kind={p.get('ProductKind')}")
        print(f"   público={public}  assinante={member}  incluído_em={included}")
        print(f"   capas={sorted(set(covers))[:6]}")

    print("\n-- Planos (SKUs com preço > 0, como vêm do catálogo)")
    for p in products(list(PLANS), market, lang):
        rows = set()
        for sku in p.get("DisplaySkuAvailabilities", []):
            title = sku["Sku"]["LocalizedProperties"][0]["SkuTitle"]
            for a in sku.get("Availabilities", []):
                price = a.get("OrderManagementData", {}).get("Price")
                if price and price["ListPrice"] > 0:
                    rows.add((title.replace("\xa0", " ")[:45], price["CurrencyCode"], price["ListPrice"]))
        print(f"{PLANS[p['ProductId']]}:")
        for row in sorted(rows):
            print(f"   {row}")
