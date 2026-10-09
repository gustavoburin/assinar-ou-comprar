"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { compare, MAX_MONTHS, MIN_MONTHS, type Comparison } from "@/lib/engine";
import { DEFAULT_LOCALE, DICTS, formatDateTime, formatMoney, type Dict } from "@/lib/i18n";
import { PLANS, planByCode } from "@/lib/plans";
import { decodeShare, encodeShare, useApp } from "@/lib/store";
import type { Locale, Market, PlanCode, Product } from "@/lib/types";

type Ctx = { t: Dict; market: Market; locale: Locale; money: (m: number) => string; planCode: PlanCode };

const noop = () => () => {};
/** true só no cliente (o carrinho vive no localStorage). */
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export default function App({ market }: { market: Market }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const sp = useSearchParams();
  const s = useApp();
  const locale: Locale = s.locale ?? DEFAULT_LOCALE[market];
  const t = DICTS[locale];
  const money = useCallback((m: number) => formatMoney(m, market, locale), [market, locale]);
  const ctx: Ctx = { t, market, locale, money, planCode: s.plan };

  const [products, setProducts] = useState<Record<string, Product>>({});
  const [drawer, setDrawer] = useState(false);
  const drawerTrigger = useRef<HTMLButtonElement>(null);
  const closeDrawer = () => {
    setDrawer(false);
    requestAnimationFrame(() => drawerTrigger.current?.focus());
  };

  // Link compartilhado: lido na primeira renderização, aplicado uma vez, URL limpa depois.
  const [shared] = useState(() => decodeShare(new URLSearchParams(sp.toString())));
  const appliedShare = useRef(false);
  useEffect(() => {
    if (!hydrated || !shared || appliedShare.current) return;
    appliedShare.current = true;
    const st = useApp.getState();
    st.replaceCart(shared.cart);
    st.set({ plan: shared.plan ?? st.plan, platform: shared.platform ?? st.platform, months: shared.months ?? st.months });
    router.replace(`/${market.toLowerCase()}`, { scroll: false });
  }, [hydrated, shared, router, market]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `market=${market.toLowerCase()}; path=/; max-age=31536000; samesite=lax`;
  }, [locale, market]);

  // Busca dados atuais de todos os itens do carrinho (revalida preços ao abrir/trocar mercado).
  const cartKey = s.cart.map((c) => c.id).sort().join(",");
  const [fetchedKey, setFetchedKey] = useState("");
  const [failedKey, setFailedKey] = useState("");
  const loadKey = `${market}:${cartKey}`;
  // Produto de outro mercado conta como ausente: precisa da versão regional.
  const isMissing = useCallback((id: string) => !products[id] || products[id].market !== market, [products, market]);
  useEffect(() => {
    if (!hydrated || !cartKey || fetchedKey === loadKey || failedKey === loadKey) return;
    const missing = cartKey.split(",").filter(isMissing);
    if (missing.length === 0) return;
    let cancelled = false;
    fetch(`/api/products?market=${market}&ids=${missing.join(",")}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { items: Product[] }) => {
        if (cancelled) return;
        setProducts((prev) => ({ ...prev, ...Object.fromEntries(d.items.map((p) => [p.id, p])) }));
        setFetchedKey(loadKey);
      })
      .catch(() => !cancelled && setFailedKey(loadKey));
    return () => {
      cancelled = true;
    };
  }, [hydrated, cartKey, market, loadKey, isMissing, fetchedKey, failedKey]);

  const remember = useCallback((items: Product[]) => {
    setProducts((prev) => ({ ...prev, ...Object.fromEntries(items.map((p) => [p.id, p])) }));
  }, []);

  const loadFailed = Boolean(cartKey) && failedKey === loadKey;
  const loadingIds = Boolean(cartKey) && !loadFailed && fetchedKey !== loadKey && cartKey.split(",").some(isMissing);
  const retry = () => setFailedKey("");
  const sharedHint = shared ? shared.hintTotal : undefined;
  const plan = planByCode(s.plan);
  const result = useMemo(
    () => compare({ market, plan, platform: s.platform, months: s.months, cart: s.cart, products }),
    [market, plan, s.platform, s.months, s.cart, products],
  );

  if (!hydrated) return <div className="p-8 text-center text-muted">…</div>;

  const cartIds = new Set(s.cart.map((c) => c.id));
  const buyTotal = result.scenarios[0].totalMinor;

  return (
    <div className="min-h-dvh">
      <Header ctx={ctx} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-28 lg:grid-cols-[1fr_400px] lg:pb-10" inert={drawer}>
        <main className="min-w-0">
          <p className="mb-4 text-muted">{t.tagline}</p>
          {sharedHint !== undefined && (
            <div role="status" className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              {t.sharedNotice}
              {sharedHint !== null && result.complete && sharedHint !== buyTotal && (
                <> {t.sharedPriceChanged(money(sharedHint), money(buyTotal))}</>
              )}
            </div>
          )}
          <Search ctx={ctx} cartIds={cartIds} onAdd={s.add} remember={remember} planCode={s.plan} platform={s.platform} />
        </main>
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-line bg-panel p-4">
            <Panel ctx={ctx} products={products} result={result} loading={loadingIds} failed={loadFailed} onRetry={retry} />
          </div>
        </aside>
      </div>

      {/* Celular: total sempre visível + painel expansível */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 p-3 backdrop-blur lg:hidden">
        <button
          ref={drawerTrigger}
          className="flex w-full items-center justify-between rounded-xl bg-accent px-4 py-3 font-semibold text-black"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
        >
          <span>
            {t.yourList} ({s.cart.length})
          </span>
          <span>{summaryLine(result, ctx, s.months)}</span>
        </button>
      </div>
      {drawer && (
        <div
          className="fixed inset-0 z-30 flex flex-col bg-bg lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t.yourList}
          onKeyDown={(e) => e.key === "Escape" && closeDrawer()}
        >
          <div className="flex items-center justify-between border-b border-line p-3">
            <strong>{t.yourList}</strong>
            <button className="btn-ghost" onClick={closeDrawer} autoFocus>
              {t.close}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <Panel ctx={ctx} products={products} result={result} loading={loadingIds} failed={loadFailed} onRetry={retry} />
          </div>
        </div>
      )}
      <footer className="mx-auto max-w-7xl px-4 pb-32 text-xs text-muted lg:pb-8" inert={drawer}>
        <p>{t.disclaimer}</p>
        <p className="mt-1">{t.essentialNote}</p>
      </footer>
    </div>
  );
}

function summaryLine(r: Comparison, { t, money }: Ctx, months: number) {
  if (r.items.length === 0) return "";
  if (!r.complete) return t.partial;
  if (!r.cheapest) return t.tie;
  const label = r.cheapest === "buy" ? t.scenarioBuy : t.scenarioSubscribe(months);
  const v = r.scenarios.find((x) => x.key === r.cheapest)!.totalMinor;
  return `${label}: ${money(v)}`;
}

function Header({ ctx }: { ctx: Ctx }) {
  const { t, market, locale } = ctx;
  const setS = useApp((s) => s.set);
  const router = useRouter();
  return (
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <Link href={`/${market.toLowerCase()}`} className="text-xl font-extrabold tracking-tight">
        <span className="text-accent">◆</span> {t.appName}
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <label className="sr-only" htmlFor="market">
          {t.marketLabel}
        </label>
        <select
          id="market"
          className="select"
          value={market}
          onChange={(e) => {
            const m = e.target.value.toLowerCase();
            document.cookie = `market=${m}; path=/; max-age=31536000; samesite=lax`;
            router.push(`/${m}`);
          }}
        >
          <option value="BR">🇧🇷 Brasil · R$</option>
          <option value="US">🇺🇸 United States · $</option>
        </select>
        <label className="sr-only" htmlFor="lang">
          {t.languageLabel}
        </label>
        <select id="lang" className="select" value={locale} onChange={(e) => setS({ locale: e.target.value as Locale })}>
          <option value="pt-BR">Português</option>
          <option value="en-US">English</option>
        </select>
      </div>
    </header>
  );
}

function Search({
  ctx,
  cartIds,
  onAdd,
  remember,
  planCode,
  platform,
}: {
  ctx: Ctx;
  cartIds: Set<string>;
  onAdd: (id: string) => void;
  remember: (p: Product[]) => void;
  planCode: string;
  platform: string;
}) {
  const { t, market } = ctx;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Product[] | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [onlyGp, setOnlyGp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/featured?market=${market}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (cancelled) return;
        setFeatured(d.items);
        remember(d.items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [market, remember]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setState("loading");
      fetch(`/api/search?market=${market}&q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((d) => {
          setItems(d.items);
          remember(d.items);
          setState("idle");
        })
        .catch((e) => {
          if (e?.name !== "AbortError") setState("error");
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, market, remember]);

  const searching = q.trim().length >= 2;
  const shown = searching ? items : null;
  const status = searching ? state : "idle";
  const plan = planByCode(planCode as never);
  const list = (shown ?? featured).filter((p) => !onlyGp || (p.includedIn[plan.code] ?? []).includes(platform as never));

  return (
    <section aria-label={t.searchPlaceholder}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-lg outline-none focus:border-accent"
        />
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyGp} onChange={(e) => setOnlyGp(e.target.checked)} />
          {t.inPlan(plan.name)}
        </label>
      </div>
      <div className="mt-2 h-5 text-sm text-muted" aria-live="polite">
        {status === "loading" && t.searching}
        {status === "error" && <span className="text-warn">{t.sourceError}</span>}
        {status === "idle" && shown && list.length === 0 && t.noResults}
        {!shown && featured.length > 0 && t.featured}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <li key={p.id}>
            <ProductCard ctx={ctx} p={p} added={cartIds.has(p.id)} onAdd={() => onAdd(p.id)} planName={plan.name} planCode={plan.code} platform={platform} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Cover({ p, className }: { p: Product; className: string }) {
  const [err, setErr] = useState(false);
  if (!p.cover || err)
    return (
      <div className={`${className} flex items-center justify-center bg-line text-center text-xs text-muted`} aria-hidden="true">
        {p.title}
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`${p.cover}?w=300`} alt={`Capa: ${p.title}`} loading="lazy" onError={() => setErr(true)} className={`${className} object-cover`} />
  );
}

function PriceTag({ ctx, p }: { ctx: Ctx; p: Product }) {
  const { t, money, locale, planCode } = ctx;
  const member = p.memberPrices[planCode];
  if (p.priceMinor === null) return <span className="text-sm text-warn">{p.available ? t.noPrice : t.unavailable}</span>;
  const onSale = p.regularPriceMinor !== null && p.priceMinor < p.regularPriceMinor;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <strong className="text-base">{p.priceMinor === 0 ? "Free" : money(p.priceMinor)}</strong>
      {onSale && (
        <>
          <s className="text-muted">{money(p.regularPriceMinor!)}</s>
          <span className="rounded bg-warn/20 px-1 text-xs text-warn">
            {t.sale}
            {p.saleEndsAt && ` ${t.saleUntil(new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(p.saleEndsAt)))}`}
          </span>
        </>
      )}
      {member !== undefined && (
        <span className="text-xs text-muted">
          {money(member)} {t.memberPrice}
        </span>
      )}
    </span>
  );
}

function ProductCard({
  ctx,
  p,
  added,
  onAdd,
  planName,
  planCode,
  platform,
}: {
  ctx: Ctx;
  p: Product;
  added: boolean;
  onAdd: () => void;
  planName: string;
  planCode: string;
  platform: string;
}) {
  const { t } = ctx;
  const inPlan = (p.includedIn[planCode as never] as string[] | undefined)?.includes(platform);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel">
      <Cover p={p} className="aspect-[2/3] w-full" />
      <div className="flex flex-1 flex-col gap-1 p-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{p.title}</h3>
        <PriceTag ctx={ctx} p={p} />
        <span className={`w-fit rounded px-1.5 py-0.5 text-xs ${inPlan ? "bg-accent/20 text-accent" : "bg-line text-muted"}`}>
          {inPlan ? `✓ ${t.inPlan(planName)}` : t.notInPlan}
        </span>
        <button
          className={`mt-auto rounded-lg px-3 py-2 text-sm font-semibold ${added ? "bg-line text-muted" : "bg-accent text-black hover:brightness-110"}`}
          onClick={onAdd}
          disabled={added}
          aria-pressed={added}
        >
          {added ? `✓ ${t.added}` : `+ ${t.add}`}
        </button>
      </div>
    </article>
  );
}

function Panel({
  ctx,
  products,
  result,
  loading,
  failed,
  onRetry,
}: {
  ctx: Ctx;
  products: Record<string, Product>;
  result: Comparison;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const { t, money, market, locale } = ctx;
  const s = useApp();
  const plan = planByCode(s.plan);
  const [copied, setCopied] = useState(false);
  const statusById = Object.fromEntries(result.items.map((i) => [i.id, i.status]));
  const upperById = Object.fromEntries(result.items.map((i) => [i.id, i.upperEditionOutside]));
  const verified = Object.values(products)
    .filter((p) => s.cart.some((c) => c.id === p.id))
    .map((p) => p.verifiedAt)
    .sort()[0];

  const share = async () => {
    const qs = encodeShare(s, result.complete ? result.scenarios[0].totalMinor : null);
    const url = `${location.origin}/${market.toLowerCase()}?${qs}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt(t.share, url);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {t.yourList} ({s.cart.length})
        </h2>
        {s.cart.length > 0 && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={share}>
              {copied ? t.copied : t.share}
            </button>
            <button className="btn-ghost" onClick={s.clear}>
              {t.clear}
            </button>
          </div>
        )}
      </div>

      {failed && (
        <div role="alert" className="flex items-center justify-between gap-2 rounded-lg border border-warn/50 bg-warn/10 p-2 text-sm">
          <span>{t.sourceError}</span>
          <button className="btn-ghost" onClick={onRetry}>
            {t.retry}
          </button>
        </div>
      )}
      {s.cart.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">{t.emptyCart}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {s.cart.map((c) => {
            const p = products[c.id];
            const st = statusById[c.id];
            return (
              <li key={c.id} className="flex gap-3 rounded-lg border border-line p-2">
                {p ? <Cover p={p} className="h-20 w-14 shrink-0 rounded" /> : <div className="h-20 w-14 shrink-0 rounded bg-line" />}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold leading-tight">{p?.title ?? (loading ? t.loading : c.id)}</span>
                    <button className="text-muted hover:text-fg" aria-label={`${t.remove} ${p?.title ?? c.id}`} onClick={() => s.remove(c.id)}>
                      ✕
                    </button>
                  </div>
                  {p ? <PriceTag ctx={ctx} p={p} /> : !loading && <span className="text-xs text-warn">{t.unavailable}</span>}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className={st === "included" ? "text-accent" : "text-muted"}>
                      {st === "included" ? `✓ ${t.inPlan(plan.name)}` : st === "owned" ? t.owned : t.notInPlan}
                    </span>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={c.owned} onChange={() => s.toggle(c.id, "owned")} />
                      {t.owned}
                    </label>
                    {upperById[c.id] && <span className="basis-full text-warn">{t.upperEditionHint}</span>}
                    {st === "included" && (
                      <label className="flex items-center gap-1" title={t.keepHint}>
                        <input type="checkbox" checked={c.keep} onChange={() => s.toggle(c.id, "keep")} />
                        {t.keep}
                      </label>
                    )}
                    {p && (
                      <a href={p.storeUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        {t.store}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <fieldset className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          {t.platform}
          <select className="select" value={s.platform} onChange={(e) => s.set({ platform: e.target.value as never })}>
            <option value="console">{t.console}</option>
            <option value="pc">{t.pc}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t.plan}
          <select className="select" value={s.plan} onChange={(e) => s.set({ plan: e.target.value as never })}>
            {PLANS.filter((p) => p.platforms.includes(s.platform)).map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} · {money(p.monthlyMinor[market])}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1">
          <span className="flex justify-between">
            {t.months} <strong>{t.monthsValue(s.months)}</strong>
          </span>
          <input type="range" min={MIN_MONTHS} max={MAX_MONTHS} value={s.months} onChange={(e) => s.set({ months: Number(e.target.value) })} className="accent-[var(--accent)]" />
        </label>
      </fieldset>

      {s.cart.length > 0 && <Results ctx={ctx} result={result} products={products} />}

      {s.cart.length > 0 && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">{t.assumptions}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {t.assumptionList(plan.name, money(plan.monthlyMinor[market])).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      )}
      {market === "US" && t.usTax && <p className="text-xs text-muted">{t.usTax}</p>}
      {verified && <p className="text-xs text-muted">{t.updated(formatDateTime(verified, locale))}</p>}
    </div>
  );
}

function Results({ ctx, result, products }: { ctx: Ctx; result: Comparison; products: Record<string, Product> }) {
  const { t, money } = ctx;
  const months = useApp((s) => s.months);
  const label = (k: string) => (k === "buy" ? t.scenarioBuy : k === "subscribe" ? t.scenarioSubscribe(months) : t.scenarioKeep);
  const mustBuy = result.items.filter((i) => i.status === "buy");
  const max = Math.max(...result.scenarios.map((s) => s.totalMinor), 1);

  return (
    <section aria-live="polite" className="flex flex-col gap-3 rounded-xl bg-bg p-3">
      {!result.complete && (
        <div className="rounded-lg border border-warn/50 bg-warn/10 p-2 text-sm">
          <strong className="text-warn">⚠ {t.partial}.</strong> {t.partialWhy(result.missing.length)}
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {result.scenarios.map((sc) => {
          const best = sc.key === result.cheapest;
          return (
            <li key={sc.key} className={`rounded-lg border p-2 ${best ? "border-accent" : "border-line"}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">
                  {label(sc.key)}
                  {best && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-black">{t.cheaper}</span>}
                </span>
                <strong className="text-lg tabular-nums">{money(sc.totalMinor)}</strong>
              </div>
              <div className="mt-1 h-1.5 rounded bg-line">
                <div className={`h-1.5 rounded ${best ? "bg-accent" : "bg-muted"}`} style={{ width: `${(sc.totalMinor / max) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      {result.complete && result.cheapest && <p className="text-sm font-semibold">{t.youSave(money(result.differenceMinor))}</p>}
      {result.complete && !result.cheapest && result.items.some((i) => i.status !== "owned") && <p className="text-sm">{t.tie}</p>}
      {result.breakEvenMonths !== null && (
        <p className="text-sm">
          {result.breakEvenMonths < 1 ? t.breakEvenNever : t.breakEven(t.monthsValue(Math.floor(result.breakEvenMonths)))}
        </p>
      )}
      {mustBuy.length > 0 && (
        <div className="text-xs text-muted">
          {t.needsPurchase}: {mustBuy.map((i) => products[i.id]?.title ?? i.id).join(", ")}
        </div>
      )}
    </section>
  );
}
