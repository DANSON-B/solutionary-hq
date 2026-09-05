import { useEffect, useMemo, useRef, useState } from "react";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, Loader2, ShieldCheck, Lock, Sparkles, BadgeCheck,
  Clock, MapPin, ChevronRight, ChevronDown, AlertCircle, XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ServiceTierTabs } from "@/components/quote/ServiceTierTabs";
import { RoomSteppers } from "@/components/quote/RoomSteppers";
import { SqftTierPicker } from "@/components/quote/SqftTierPicker";
import { LiveQuoteCart } from "@/components/quote/LiveQuoteCart";
import { TrustStrip } from "@/components/quote/TrustStrip";
import { FrequencyPicker, type Frequency } from "@/components/quote/FrequencyPicker";
import type { PricingRules, RoomKey, ServiceTier } from "@/components/quote/quoteTypes";

type Addon = { id: string; label: string; price: number; required?: boolean; included?: boolean };

const roomKeys: RoomKey[] = [
  "bedrooms", "bathrooms", "kitchens", "living_rooms",
  "dining_rooms", "offices", "finished_basement", "laundry_room",
];

export default function CallQuoteViewPage() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quote, setQuote] = useState<any | null>(null);
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  useBrandFavicon(quote?.businesses?.logo_url ?? quote?.business?.logo_url, quote?.businesses?.name ?? quote?.business?.name);

  // Local working state (debounced -> server)
  const [tier, setTier] = useState<ServiceTier>("standard");
  const [sqft, setSqft] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Record<RoomKey, number>>({
    bedrooms: 0, bathrooms: 0, kitchens: 0, living_rooms: 0,
    dining_rooms: 0, offices: 0, finished_basement: 0, laundry_room: 0,
  });
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [depositPercent, setDepositPercent] = useState(50);
  const [frequency, setFrequency] = useState<Frequency>("one_time");
  const [freqBusy, setFreqBusy] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const skipNextPushRef = useRef(true); // skip first hydration

  // Load quote + rules
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const [{ data: qRaw }, { data: r }] = await Promise.all([
        supabase.rpc("get_call_quote_by_token", { p_token: token }),
        supabase.rpc("get_pricing_rules_for_token", { p_token: token }),
      ]);
      const q: any = qRaw;
      setQuote(q);
      setRules(r as any);
      if (q) {
        skipNextPushRef.current = true;
        setTier((q.service_tier as ServiceTier) || "standard");
        setSqft(q.sqft_tier ?? null);
        setRooms({
          bedrooms: q.bedrooms ?? 0, bathrooms: q.bathrooms ?? 0,
          kitchens: q.kitchens ?? 0, living_rooms: q.living_rooms ?? 0,
          dining_rooms: q.dining_rooms ?? 0, offices: q.offices ?? 0,
          finished_basement: q.finished_basement ?? 0, laundry_room: q.laundry_room ?? 0,
        });
        setDepositPercent(q.deposit_percent ?? 50);
        setFrequency((q.frequency as Frequency) || "one_time");
        const map: Record<string, boolean> = {};
        for (const a of (q.addons as Addon[]) || []) map[a.id] = a.included !== false;
        setIncluded(map);
        if (!q.viewed_at) await supabase.rpc("mark_call_quote_viewed", { p_token: token });
      }
      setLoading(false);
    };
    load();
  }, [token]);

  // Realtime: office-side edits push down
  useEffect(() => {
    if (!quote?.id) return;
    const channel = supabase
      .channel(`pub-cq-${quote.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "call_quotes", filter: `id=eq.${quote.id}` },
        async () => {
          const { data } = await supabase.rpc("get_call_quote_by_token", { p_token: token! });
          if (data) {
            skipNextPushRef.current = true;
            setQuote(data);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [quote?.id, token]);

  // Debounced push to server whenever local config changes
  useEffect(() => {
    if (!quote || !token) return;
    if (skipNextPushRef.current) { skipNextPushRef.current = false; return; }
    if (!quote.allow_customer_edits) return;
    if (quote.status === "paid") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setBusy(true);
      try {
        const ids = Object.keys(included).filter((k) => included[k]);
        const { data, error } = await supabase.rpc("customer_update_call_quote_config", {
          p_token: token,
          p_config: {
            service_tier: tier,
            sqft_tier: sqft,
            ...rooms,
            deposit_percent: depositPercent,
            included_addon_ids: ids,
          } as any,
        });
        if (error) throw error;
        if (data) {
          skipNextPushRef.current = true;
          setQuote(data);
        }
      } catch (e: any) {
        toast({ title: "Update failed", description: e.message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, sqft, rooms.bedrooms, rooms.bathrooms, rooms.kitchens, rooms.living_rooms,
      rooms.dining_rooms, rooms.offices, rooms.finished_basement, rooms.laundry_room,
      depositPercent, JSON.stringify(included)]);

  const changeFrequency = async (f: Frequency) => {
    if (!token || readOnlyGuard()) return;
    setFrequency(f);
    setFreqBusy(true);
    try {
      const { data, error } = await supabase.rpc("customer_update_call_quote_frequency", {
        p_token: token,
        p_frequency: f,
      });
      if (error) throw error;
      if (data) {
        skipNextPushRef.current = true;
        setQuote(data);
      }
    } catch (e: any) {
      toast({ title: "Couldn't update frequency", description: e.message, variant: "destructive" });
    } finally {
      setFreqBusy(false);
    }
  };
  const readOnlyGuard = () => {
    if (!quote) return true;
    if (!quote.allow_customer_edits) return true;
    if (quote.status === "paid") return true;
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) return true;
    return false;
  };

  const accept = async () => {
    if (!quote || !token) return;
    setPayError(null);
    setBusy(true);
    try {
      const { error: acceptErr } = await supabase.rpc("accept_call_quote", { p_token: token });
      if (acceptErr) throw acceptErr;
      const mode = depositPercent === 100 ? "full" : "deposit";
      const { data, error } = await supabase.functions.invoke("call-quote-checkout", {
        body: { call_quote_id: quote.id, mode },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned. Please try again or contact support.");
      window.location.href = data.url;
    } catch (e: any) {
      const msg = e?.message || "We couldn't start your secure checkout. Please try again in a moment.";
      setPayError(msg);
      toast({ title: "Payment couldn't start", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Handle return from Stripe (cancel or generic error via URL param)
  useEffect(() => {
    const canceled = searchParams.get("canceled");
    const err = searchParams.get("payment_error");
    if (canceled === "1") {
      setPayError("Payment was canceled. Your quote is saved — you can review and try again anytime.");
      searchParams.delete("canceled");
      setSearchParams(searchParams, { replace: true });
    } else if (err) {
      setPayError(decodeURIComponent(err));
      searchParams.delete("payment_error");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addons: Addon[] = useMemo(() => (quote?.addons as Addon[]) || [], [quote]);
  const requiredAddons = useMemo(() => addons.filter((a) => a.required), [addons]);
  const optionalAddons = useMemo(() => addons.filter((a) => !a.required), [addons]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!quote) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Quote not found.</div>;
  }

  const expired = quote.expires_at && new Date(quote.expires_at) < new Date();
  const isPaid = quote.status === "paid";
  const readOnly = !quote.allow_customer_edits || isPaid || expired;
  const biz = quote.businesses || {};
  const bizName = biz.name || "Solutionary HQ";
  const total = Number(quote.total) || 0;
  const subtotal = Number(quote.subtotal) || 0;
  const discount = Number(quote.discount_amount) || 0;
  const hasDiscount = discount > 0;
  const minJob = rules?.min_job_price;
  const hitFloor = !!(minJob && total <= minJob && subtotal - discount < minJob);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white dark:from-black dark:via-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(251,191,36,0.18),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:py-12">
          <div className="flex items-center gap-3">
            {biz.logo_url ? (
              <img src={biz.logo_url} alt={`${bizName} logo`} className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/20" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 text-sm font-bold uppercase text-amber-300">
                {(bizName || "B").charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{bizName}</p>
              <p className="text-[11px] text-white/50">Interactive service proposal</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> Secure
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Customize your cleaning
          </h1>
          <p className="mt-2 text-sm text-white/70 sm:text-base">
            Prepared for <span className="font-semibold text-white">{quote.customer_name}</span> · price updates instantly
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/70">
            {quote.service_address && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                <MapPin className="h-3 w-3" /> {quote.service_address}
              </span>
            )}
            {quote.expires_at && !expired && !isPaid && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                <Clock className="h-3 w-3" /> Valid until {new Date(quote.expires_at).toLocaleDateString()}
              </span>
            )}
            {expired && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 font-semibold text-white">Expired</span>}
            {isPaid && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 font-semibold text-white"><BadgeCheck className="h-3 w-3" /> Paid</span>}
            {!quote.allow_customer_edits && !isPaid && !expired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-semibold">
                <Lock className="h-3 w-3" /> Read-only quote
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-5 lg:grid-cols-[1fr_360px]">
        {/* LEFT: configurator */}
        <div className="space-y-5 pb-24 lg:pb-0">
          {payError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Payment couldn't be completed</p>
                <p className="mt-0.5 text-sm text-red-800/90 dark:text-red-200/90">{payError}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={accept}
                    disabled={busy || readOnly}
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayError(null)}
                    className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-transparent dark:text-red-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          <TrustStrip />

          {/* Service tier */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Step 1 · Service level</p>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Choose your cleaning</h2>
            <ServiceTierTabs value={tier} onChange={setTier} disabled={!!readOnly} multipliers={rules?.tier_multipliers} />
          </section>

          {/* Square footage */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Step 2 · Home size</p>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Square footage</h2>
            <SqftTierPicker value={sqft} onChange={setSqft} prices={rules?.sqft_tier_prices} disabled={!!readOnly} />
            <p className="mt-2 text-[11px] text-muted-foreground">Optional — gives the most accurate base price.</p>
          </section>

          {/* Rooms */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Step 3 · Rooms</p>
            <h2 className="mb-3 text-lg font-bold tracking-tight">Tell us about your home</h2>
            <RoomSteppers
              values={rooms}
              onChange={(k, v) => setRooms((p) => ({ ...p, [k]: v }))}
              disabled={!!readOnly}
            />
          </section>

          {/* Frequency */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Step 4 · Frequency</p>
                <h2 className="text-lg font-bold tracking-tight">How often should we clean?</h2>
              </div>
              {freqBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <FrequencyPicker
              value={frequency}
              onChange={changeFrequency}
              discounts={(rules as any)?.frequency_discounts}
              disabled={!!readOnly}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">Recurring plans save you money — cancel or change anytime.</p>
          </section>



          {/* Required */}
          {requiredAddons.length > 0 && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Included to complete the job</h3>
              </div>
              <ul className="divide-y rounded-xl border bg-background">
                {requiredAddons.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-sm font-medium">{a.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">${a.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Optional */}
          {optionalAddons.length > 0 && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Optional enhancements</h3>
                </div>
                {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <ul className="space-y-2">
                {optionalAddons.map((a) => {
                  const on = !!included[a.id];
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setIncluded((p) => ({ ...p, [a.id]: !p[a.id] }))}
                        disabled={!!readOnly}
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all ${
                          on ? "border-primary/60 bg-primary/5 shadow-sm"
                             : "border-border bg-background hover:border-primary/40 hover:bg-accent/40"
                        } disabled:opacity-60`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                          }`}>
                            {on && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{a.label}</div>
                            <div className="text-[11px] text-muted-foreground">{on ? "Added to your quote" : "Tap to add"}</div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${on ? "text-primary" : "text-muted-foreground"}`}>
                            {on ? "+" : ""}${a.price.toFixed(2)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <footer className="pt-2 text-center text-[11px] text-muted-foreground">
            Quote ID {String(quote.id).slice(0, 8)} · {bizName}
          </footer>
        </div>

        {/* RIGHT: sticky cart on desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <LiveQuoteCart
              subtotal={subtotal}
              discount={discount}
              total={total}
              depositPercent={depositPercent}
              setDepositPercent={setDepositPercent}
              onApprove={accept}
              busy={busy}
              readOnly={!!readOnly}
              expired={!!expired}
              isPaid={isPaid}
              hasDiscount={hasDiscount}
              minJobPrice={minJob}
              hitFloor={hitFloor}
            />
          </div>
        </aside>
      </main>

      {/* MOBILE sticky cart — collapsible so it doesn't block the configurator */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        {mobileCartOpen && (
          <div
            className="absolute inset-0 -top-screen h-screen bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileCartOpen(false)}
          />
        )}
        <div className="relative border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur">
          {/* Compact summary bar (always visible) */}
          <div className="flex w-full items-stretch gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={() => setMobileCartOpen((v) => !v)}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-expanded={mobileCartOpen}
              aria-label={mobileCartOpen ? "Collapse live quote" : "Expand live quote"}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {mobileCartOpen ? "Tap to collapse" : "Live quote · tap to expand"}
                </p>
                <p className="text-lg font-extrabold tabular-nums">${total.toFixed(2)}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${mobileCartOpen ? "rotate-180" : ""}`}
              />
            </button>
            {!isPaid && !expired && (
              <button
                type="button"
                onClick={accept}
                disabled={busy || total <= 0}
                className="inline-flex h-11 shrink-0 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
              >
                Approve & pay
              </button>
            )}
          </div>

          {mobileCartOpen && (
            <div className="max-h-[70vh] overflow-y-auto border-t px-3 py-3">
              <LiveQuoteCart
                subtotal={subtotal}
                discount={discount}
                total={total}
                depositPercent={depositPercent}
                setDepositPercent={setDepositPercent}
                onApprove={accept}
                busy={busy}
                readOnly={!!readOnly}
                expired={!!expired}
                isPaid={isPaid}
                hasDiscount={hasDiscount}
                minJobPrice={minJob}
                hitFloor={hitFloor}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
