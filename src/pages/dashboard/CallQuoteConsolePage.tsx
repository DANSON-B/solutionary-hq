import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, Send, CreditCard, CheckCircle2, Tag, Copy, RotateCcw, Pencil, Plus, Trash2, Check, X, Lock, Eye, MousePointerClick, DollarSign, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PricingRulesDialog } from "@/components/dashboard/PricingRulesDialog";
import { SqftTierPicker } from "@/components/quote/SqftTierPicker";
import { ServiceTierTabs } from "@/components/quote/ServiceTierTabs";
import { SQFT_TIERS, type ServiceTier, type PricingRules } from "@/components/quote/quoteTypes";
import { SalesScriptDrawer } from "@/components/dashboard/SalesScriptDrawer";
import { FrequencyPicker, type Frequency } from "@/components/quote/FrequencyPicker";

const DEFAULT_PRICING_RULES: PricingRules = {
  min_job_price: 120,
  tier_multipliers: { basic: 0.85, standard: 1, deep: 1.4 },
  room_prices: { bedrooms: 25, bathrooms: 35, kitchens: 30, living_rooms: 20, dining_rooms: 15, offices: 20, finished_basement: 40, laundry_room: 15 },
  sqft_tier_prices: { u1000: 140, "1000_1500": 175, "1500_2000": 210, "2000_2500": 255, "2500_3000": 300, "3000_4000": 360, "4000p": 425 },
  discount_by_tier: { basic: 0, standard: 0, deep: 0 },
};

const DEFAULT_SQFT_TIER_PRICES: Record<string, number> = {
  u1000: 140,
  "1000_1500": 175,
  "1500_2000": 210,
  "2000_2500": 255,
  "2500_3000": 300,
  "3000_4000": 360,
  "4000p": 425,
};

type ServiceType = { id: string; label: string; base: number };
type AddOn = { id: string; label: string; price: number };

const DEFAULT_SERVICES: ServiceType[] = [
  { id: "basic", label: "Basic Cleaning", base: 120 },
  { id: "deep", label: "Deep Cleaning", base: 220 },
  { id: "moveinout", label: "Move-In / Move-Out", base: 280 },
  { id: "postconstruction", label: "Post-Construction", base: 350 },
];

const DEFAULT_ROOM_PRICING = { bedrooms: 25, bathrooms: 35, kitchens: 30, living_rooms: 20 };

const DEFAULT_ADDONS: AddOn[] = [
  { id: "oven", label: "Oven cleaning", price: 35 },
  { id: "fridge", label: "Fridge cleaning", price: 30 },
  { id: "cabinets", label: "Inside cabinets", price: 45 },
  { id: "windows", label: "Windows interior cleaning", price: 50 },
  { id: "extra_hour", label: "Extra hour 3tech", price: 75 },
  { id: "deep_detail", label: "Deep detail add-on", price: 75 },
  { id: "baseboards", label: "Baseboards", price: 40 },
  { id: "basement", label: "Basement", price: 80 },
  { id: "microwave", label: "Microwave", price: 20 },
  { id: "organizing", label: "Organizing", price: 35 },
  { id: "sun_room", label: "Sun room", price: 20 },
  { id: "add_dining", label: "Additional dining room", price: 20 },
  { id: "family_room", label: "Family room", price: 20 },
  { id: "den", label: "Den", price: 20 },
  { id: "laundry_room", label: "Laundry room", price: 25 },
  { id: "garage", label: "Garage sweep", price: 45 },
  { id: "patio", label: "Patio cleaning", price: 40 },
  { id: "blinds", label: "Blinds (per room)", price: 15 },
  { id: "pet_hair", label: "Pet hair removal", price: 50 },
  { id: "disinfection", label: "Disinfection", price: 75 },
  { id: "carpet_shampoo", label: "Carpet shampoo (per room)", price: 40 },
  { id: "grout", label: "Grout scrubbing", price: 50 },
  { id: "mold", label: "Mold treatment", price: 35 },
  { id: "closets", label: "Closets (each)", price: 10 },
];

const storageKey = (bizId: string | undefined, k: string) => `cqc:${bizId ?? "anon"}:${k}`;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

interface Counter { value: number; onChange: (n: number) => void; label: string; }
function CountField({ value, onChange, label }: Counter) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" className="h-10 w-10 shrink-0 rounded-full p-0 text-lg" onClick={() => onChange(Math.max(0, value - 1))}>−</Button>
        <span className="min-w-[2ch] text-center text-xl font-bold tabular-nums">{value}</span>
        <Button type="button" variant="outline" className="h-10 w-10 shrink-0 rounded-full p-0 text-lg" onClick={() => onChange(value + 1)}>+</Button>
      </div>
    </div>
  );
}

export default function CallQuoteConsolePage() {
  const { business } = useAuth();

  // Editable pricing config (persisted per business in localStorage)
  const [services, setServices] = useState<ServiceType[]>(DEFAULT_SERVICES);
  const [addons, setAddons] = useState<AddOn[]>(DEFAULT_ADDONS);
  const [roomPricing, setRoomPricing] = useState(DEFAULT_ROOM_PRICING);
  const [sqftTierPrices, setSqftTierPrices] = useState<Record<string, number>>(DEFAULT_SQFT_TIER_PRICES);
  const [editMode, setEditMode] = useState(false);

  // Load saved config when business loads
  useEffect(() => {
    if (!business?.id) return;
    setServices(loadJSON(storageKey(business.id, "services"), DEFAULT_SERVICES));
    setAddons(loadJSON(storageKey(business.id, "addons"), DEFAULT_ADDONS));
    setRoomPricing(loadJSON(storageKey(business.id, "rooms"), DEFAULT_ROOM_PRICING));
    setSqftTierPrices(loadJSON(storageKey(business.id, "sqft_tier_prices"), DEFAULT_SQFT_TIER_PRICES));
  }, [business?.id]);

  // Persist on change
  useEffect(() => {
    if (!business?.id) return;
    localStorage.setItem(storageKey(business.id, "services"), JSON.stringify(services));
  }, [services, business?.id]);
  useEffect(() => {
    if (!business?.id) return;
    localStorage.setItem(storageKey(business.id, "addons"), JSON.stringify(addons));
  }, [addons, business?.id]);
  useEffect(() => {
    if (!business?.id) return;
    localStorage.setItem(storageKey(business.id, "rooms"), JSON.stringify(roomPricing));
  }, [roomPricing, business?.id]);
  useEffect(() => {
    if (!business?.id) return;
    localStorage.setItem(storageKey(business.id, "sqft_tier_prices"), JSON.stringify(sqftTierPrices));
  }, [sqftTierPrices, business?.id]);

  // Customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  // Quote
  const [serviceTypeId, setServiceTypeId] = useState<string>(DEFAULT_SERVICES[0].id);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [kitchens, setKitchens] = useState(1);
  const [livingRooms, setLivingRooms] = useState(1);
  const [sqftTier, setSqftTier] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [requiredAddons, setRequiredAddons] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [overrideOn, setOverrideOn] = useState(false);
  const [overrideTotal, setOverrideTotal] = useState<string>("");
  const [depositMode, setDepositMode] = useState<"full" | "deposit">("deposit");
  const [allowCustomerEdits, setAllowCustomerEdits] = useState(true);
  const [serviceTier, setServiceTier] = useState<ServiceTier>("standard");
  const [frequency, setFrequency] = useState<Frequency>("one_time");
  const [pricingRules, setPricingRules] = useState<PricingRules>(DEFAULT_PRICING_RULES);

  // Load authoritative pricing rules from DB so console preview matches customer view
  useEffect(() => {
    if (!business?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("pricing_rules").select("*").eq("business_id", business.id).maybeSingle();
      if (cancelled || !data) return;
      setPricingRules({
        min_job_price: Number(data.min_job_price) || DEFAULT_PRICING_RULES.min_job_price,
        tier_multipliers: (data.tier_multipliers as any) ?? DEFAULT_PRICING_RULES.tier_multipliers,
        room_prices: (data.room_prices as any) ?? DEFAULT_PRICING_RULES.room_prices,
        sqft_tier_prices: (data.sqft_tier_prices as any) ?? DEFAULT_PRICING_RULES.sqft_tier_prices,
        discount_by_tier: (data.discount_by_tier as any) ?? DEFAULT_PRICING_RULES.discount_by_tier,
      });
    })();
    return () => { cancelled = true; };
  }, [business?.id]);

  // Keep selected service valid if services list changes
  useEffect(() => {
    if (!services.find((s) => s.id === serviceTypeId) && services[0]) {
      setServiceTypeId(services[0].id);
    }
  }, [services, serviceTypeId]);

  // State
  const [savedQuote, setSavedQuote] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Array<{ event_type: string; meta: any; created_at: string }>>([]);

  // Subscribe to live customer activity for the saved quote
  useEffect(() => {
    if (!savedQuote?.id) { setTimeline([]); return; }
    let cancelled = false;
    const loadEvents = async () => {
      if (!savedQuote?.share_token) return;
      const { data } = await supabase.rpc("get_call_quote_events_by_token", { p_token: savedQuote.share_token });
      if (!cancelled && Array.isArray(data)) setTimeline(data as any);
    };
    loadEvents();
    const channel = supabase
      .channel(`cq-${savedQuote.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "call_quote_events", filter: `call_quote_id=eq.${savedQuote.id}` },
        (payload) => setTimeline((prev) => [...prev, payload.new as any]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "call_quotes", filter: `id=eq.${savedQuote.id}` },
        (payload) => setSavedQuote((prev: any) => prev ? { ...prev, ...(payload.new as any) } : prev))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [savedQuote?.id, savedQuote?.share_token]);

  // Quick-add (always visible) state
  const [quickAddonName, setQuickAddonName] = useState("");
  const [quickAddonPrice, setQuickAddonPrice] = useState("");
  const [quickSvcName, setQuickSvcName] = useState("");
  const [quickSvcBase, setQuickSvcBase] = useState("");

  const pricing = useMemo(() => {
    const service = services.find((s) => s.id === serviceTypeId) ?? services[0] ?? DEFAULT_SERVICES[0];
    const base = service?.base ?? 0;
    // Use authoritative pricing_rules for room + sqft (matches server-side customer recompute)
    const rp = pricingRules.room_prices;
    const roomCost =
      bedrooms * (rp.bedrooms ?? 0) +
      bathrooms * (rp.bathrooms ?? 0) +
      kitchens * (rp.kitchens ?? 0) +
      livingRooms * (rp.living_rooms ?? 0);
    const sqftPrice = sqftTier ? (pricingRules.sqft_tier_prices[sqftTier] ?? 0) : 0;
    const effectiveBase = Math.max(base + roomCost, sqftPrice);
    const addonCost = selectedAddons.reduce((sum, id) => {
      const a = addons.find((x) => x.id === id);
      return sum + (a?.price ?? 0);
    }, 0);
    const preTier = effectiveBase + addonCost;
    const multiplier = pricingRules.tier_multipliers[serviceTier] ?? 1;
    const afterTier = preTier * multiplier;
    let couponDiscount = 0;
    if (appliedCoupon) {
      couponDiscount = appliedCoupon.discount_type === "percent"
        ? (afterTier * Number(appliedCoupon.discount_value)) / 100
        : Number(appliedCoupon.discount_value);
      couponDiscount = Math.min(couponDiscount, afterTier);
    }
    const tierDiscountPct = pricingRules.discount_by_tier[serviceTier] ?? 0;
    const tierDiscount = (afterTier * tierDiscountPct) / 100;
    const freqDiscounts = (pricingRules as any).frequency_discounts ?? { weekly: 15, biweekly: 10, monthly: 5, one_time: 0 };
    const frequencyDiscountPct = Number(freqDiscounts[frequency] ?? 0);
    const frequencyDiscount = (afterTier * frequencyDiscountPct) / 100;
    const discount = couponDiscount + tierDiscount + frequencyDiscount;
    const subtotal = afterTier;
    const afterDiscount = Math.max(0, subtotal - discount);
    const computedTotal = Math.max(pricingRules.min_job_price, afterDiscount);
    const total = overrideOn && overrideTotal !== "" ? Math.max(0, Number(overrideTotal)) : computedTotal;
    return { base, roomCost, sqftPrice, effectiveBase, addonCost, subtotal, discount, total, service, multiplier, tierDiscountPct, frequencyDiscountPct, frequencyDiscount };
  }, [serviceTypeId, services, addons, pricingRules, serviceTier, sqftTier, bedrooms, bathrooms, kitchens, livingRooms, selectedAddons, appliedCoupon, overrideOn, overrideTotal, frequency]);

  const toggleAddon = (id: string) =>
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const resetAll = () => {
    setName(""); setPhone(""); setEmail(""); setAddress(""); setSource(""); setNotes("");
    setServiceTypeId(services[0]?.id ?? DEFAULT_SERVICES[0].id);
    setBedrooms(2); setBathrooms(1); setKitchens(1); setLivingRooms(1); setSqftTier(null); setServiceTier("standard");
    setFrequency("one_time");
    setSelectedAddons([]); setRequiredAddons([]); setCouponCode(""); setAppliedCoupon(null);
    setOverrideOn(false); setOverrideTotal(""); setSavedQuote(null);
  };

  const applyCoupon = async () => {
    if (!business?.id || !couponCode.trim()) return;
    const { data: rows, error } = await supabase.rpc("lookup_coupon_by_code", {
      p_business_id: business.id,
      p_code: couponCode.trim(),
    });
    const data: any = Array.isArray(rows) ? rows[0] : rows;
    if (error || !data) {
      toast({ title: "Invalid coupon", description: "Code not found", variant: "destructive" });
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "Coupon expired", variant: "destructive" });
      return;
    }
    if (data.single_use && data.use_count >= 1) {
      toast({ title: "Coupon already used", variant: "destructive" });
      return;
    }
    setAppliedCoupon(data);
    toast({ title: "Coupon applied", description: `${data.code}` });
  };

  const buildPayload = () => ({
    business_id: business!.id,
    customer_name: name.trim(),
    customer_phone: phone.trim() || null,
    customer_email: email.trim() || null,
    service_address: address.trim() || null,
    lead_source: source.trim() || null,
    call_notes: notes.trim() || null,
    service_type: serviceTypeId,
    service_tier: serviceTier,
    bedrooms, bathrooms, kitchens, living_rooms: livingRooms,
    sqft_tier: sqftTier,
    addons: addons.map((a) => ({
      id: a.id,
      label: a.label,
      price: a.price,
      required: requiredAddons.includes(a.id),
      included: selectedAddons.includes(a.id) || requiredAddons.includes(a.id),
    })),
    subtotal: pricing.subtotal,
    discount_amount: pricing.discount,
    total: pricing.total,
    manual_override: overrideOn,
    coupon_id: appliedCoupon?.id ?? null,
    coupon_code: appliedCoupon?.code ?? null,
    deposit_percent: depositMode === "deposit" ? 50 : 100,
    allow_customer_edits: allowCustomerEdits,
    frequency,
    frequency_discount_percent: pricing.frequencyDiscountPct,
    breakdown: {
      base: pricing.base,
      rooms: { bedrooms, bathrooms, kitchens, living_rooms: livingRooms, cost: pricing.roomCost },
      sqft_tier: sqftTier,
      sqft_tier_price: pricing.sqftPrice,
      effective_base: pricing.effectiveBase,
      addons_cost: pricing.addonCost,
      service_label: pricing.service?.label ?? serviceTypeId,
      frequency,
      frequency_discount: pricing.frequencyDiscount,
      ...(appliedCoupon?.discount_type === "percent" ? { coupon_percent: Number(appliedCoupon.discount_value) } : {}),
    },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  const saveDraft = async (status: "draft" | "sent" | "booked" = "draft") => {
    if (!business?.id) return null;
    if (!name.trim()) {
      toast({ title: "Customer name required", variant: "destructive" });
      return null;
    }
    const payload: any = buildPayload();
    payload.status = status;
    if (status === "sent") payload.sent_at = new Date().toISOString();

    if (savedQuote?.id) {
      const { data, error } = await supabase
        .from("call_quotes")
        .update(payload)
        .eq("id", savedQuote.id)
        .select()
        .single();
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return null; }
      setSavedQuote(data);
      return data;
    } else {
      const { data, error } = await supabase
        .from("call_quotes")
        .insert(payload)
        .select()
        .single();
      if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return null; }
      setSavedQuote(data);
      return data;
    }
  };

  const sendQuote = async () => {
    setBusy("send");
    try {
      const q = await saveDraft("sent");
      if (!q) return;
      const { data, error } = await supabase.functions.invoke("send-call-quote", {
        body: { call_quote_id: q.id },
      });
      if (error) throw error;
      toast({
        title: "Quote sent",
        description: `Email: ${data?.email_sent ? "✓" : "—"} · SMS: ${data?.sms_sent ? "✓" : data?.sms_link ? "use link" : "—"}`,
      });
      if (data?.sms_link && !data?.sms_sent) {
        window.open(data.sms_link, "_blank");
      }
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const takePayment = async () => {
    setBusy("pay");
    try {
      const q = await saveDraft(savedQuote?.status === "sent" ? "sent" : "draft");
      if (!q) return;
      const { data, error } = await supabase.functions.invoke("call-quote-checkout", {
        body: { call_quote_id: q.id, mode: depositMode },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const markBooked = async () => {
    setBusy("book");
    try {
      await saveDraft("booked");
      toast({ title: "Marked as booked" });
    } finally { setBusy(null); }
  };

  const copyLink = () => {
    if (!savedQuote?.share_token) return;
    const url = `${window.location.origin}/quote/${savedQuote.share_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  // Add-on editing helpers
  const addAddon = () => {
    const newId = `custom_${Date.now()}`;
    setAddons((prev) => [...prev, { id: newId, label: "New add-on", price: 0 }]);
  };
  const updateAddon = (id: string, patch: Partial<AddOn>) =>
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const removeAddon = (id: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
    setSelectedAddons((prev) => prev.filter((x) => x !== id));
  };

  // Service editing helpers
  const addService = () => {
    const newId = `svc_${Date.now()}`;
    setServices((prev) => [...prev, { id: newId, label: "New service", base: 0 }]);
  };
  const updateService = (id: string, patch: Partial<ServiceType>) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeService = (id: string) => {
    if (services.length <= 1) {
      toast({ title: "Keep at least one service", variant: "destructive" });
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Quick-add handlers (always visible — no edit mode required)
  const quickAddAddon = () => {
    const label = quickAddonName.trim();
    if (!label) { toast({ title: "Add-on name required", variant: "destructive" }); return; }
    const price = Number(quickAddonPrice) || 0;
    const newId = `custom_${Date.now()}`;
    setAddons((prev) => [...prev, { id: newId, label, price }]);
    setSelectedAddons((prev) => [...prev, newId]); // auto-select so it's on the quote
    setQuickAddonName(""); setQuickAddonPrice("");
    toast({ title: "Add-on added", description: `${label} · $${price}` });
  };

  const quickAddService = () => {
    const label = quickSvcName.trim();
    if (!label) { toast({ title: "Service name required", variant: "destructive" }); return; }
    const base = Number(quickSvcBase) || 0;
    const newId = `svc_${Date.now()}`;
    setServices((prev) => [...prev, { id: newId, label, base }]);
    setServiceTypeId(newId); // auto-select
    setQuickSvcName(""); setQuickSvcBase("");
    toast({ title: "Service added", description: `${label} · from $${base}` });
  };

  const resetPricing = () => {
    if (!confirm("Reset all services, rooms, and add-ons to defaults?")) return;
    setServices(DEFAULT_SERVICES);
    setAddons(DEFAULT_ADDONS);
    setRoomPricing(DEFAULT_ROOM_PRICING);
    setSqftTierPrices(DEFAULT_SQFT_TIER_PRICES);
    toast({ title: "Pricing reset to defaults" });
  };

  return (
    <div className="space-y-4 pb-[260px] sm:pb-[220px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Phone className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold sm:text-2xl">Call-Time Quote Console</h1>
          <Badge variant="secondary">Live</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {business?.id && <PricingRulesDialog businessId={business.id} />}
          <div className="flex items-center gap-2 rounded-md border px-2 py-1">
            <Switch id="allow-edits" checked={allowCustomerEdits} onCheckedChange={setAllowCustomerEdits} />
            <Label htmlFor="allow-edits" className="text-xs">Allow customer edits</Label>
          </div>
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? <><Check className="mr-1 h-4 w-4" />Done editing</> : <><Pencil className="mr-1 h-4 w-4" />Edit pricing</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="mr-1 h-4 w-4" />New call</Button>
        </div>
      </div>

      {editMode && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Pricing edit mode — changes save automatically to this browser. Add, rename, or reprice any service or add-on.
          <button onClick={resetPricing} className="ml-2 underline">Reset to defaults</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* CUSTOMER INTAKE */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base">Customer intake</CardTitle>
            <SalesScriptDrawer
              businessId={business?.id}
              onInsertToNotes={(text) => setNotes((prev) => (prev ? `${prev}\n\n${text}` : text))}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Full name *</Label><Input className="h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div><Label>Phone</Label><Input className="h-11" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><Label>Email</Label><Input className="h-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            <div><Label>Service address</Label><Input className="h-11" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div><Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-11"><SelectValue placeholder="How did they hear about us?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="facebook">Facebook ads</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="repeat">Repeat customer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Call notes</Label><Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type while talking..." /></div>
          </CardContent>
        </Card>

        {/* QUOTE BUILDER */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Live quote builder</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {/* Always-visible dropdown managers — rename / reprice / add */}
            <Accordion type="multiple" className="rounded-lg border bg-muted/30">
              <AccordionItem value="svc" className="border-b">
                <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline">
                  Manage services & pricing ({services.length})
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-2">
                    {services.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-md border bg-card p-2">
                        <Input
                          className="h-10 flex-1"
                          value={s.label}
                          onChange={(e) => updateService(s.id, { label: e.target.value })}
                          placeholder="Service name"
                        />
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          className="h-10 w-24"
                          type="number"
                          inputMode="decimal"
                          value={s.base}
                          onChange={(e) => updateService(s.id, { base: Number(e.target.value) || 0 })}
                        />
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeService(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2 rounded-md border border-dashed bg-background p-2 sm:flex-row">
                      <Input
                        className="h-10 flex-1"
                        placeholder="New service name"
                        value={quickSvcName}
                        onChange={(e) => setQuickSvcName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddService(); } }}
                      />
                      <div className="flex gap-2">
                        <Input
                          className="h-10 w-28"
                          type="number"
                          inputMode="decimal"
                          placeholder="Base $"
                          value={quickSvcBase}
                          onChange={(e) => setQuickSvcBase(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddService(); } }}
                        />
                        <Button type="button" onClick={quickAddService} className="h-10 shrink-0">
                          <Plus className="mr-1 h-4 w-4" />Add service
                        </Button>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="addons" className="border-b-0">
                <AccordionTrigger className="px-3 py-2 text-sm font-semibold hover:no-underline">
                  Manage add-ons & pricing ({addons.length})
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-2">
                    {addons.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 rounded-md border bg-card p-2">
                        <Input
                          className="h-10 flex-1"
                          value={a.label}
                          onChange={(e) => updateAddon(a.id, { label: e.target.value })}
                          placeholder="Add-on name"
                        />
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          className="h-10 w-24"
                          type="number"
                          inputMode="decimal"
                          value={a.price}
                          onChange={(e) => updateAddon(a.id, { price: Number(e.target.value) || 0 })}
                        />
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeAddon(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2 rounded-md border border-dashed bg-background p-2 sm:flex-row">
                      <Input
                        className="h-10 flex-1"
                        placeholder="New add-on name"
                        value={quickAddonName}
                        onChange={(e) => setQuickAddonName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddAddon(); } }}
                      />
                      <div className="flex gap-2">
                        <Input
                          className="h-10 w-24"
                          type="number"
                          inputMode="decimal"
                          placeholder="Price $"
                          value={quickAddonPrice}
                          onChange={(e) => setQuickAddonPrice(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddAddon(); } }}
                        />
                        <Button type="button" onClick={quickAddAddon} className="h-10 shrink-0">
                          <Plus className="mr-1 h-4 w-4" />Add add-on
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Edits save automatically to this browser.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>


            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Service type</Label>
                {editMode && (
                  <Button type="button" size="sm" variant="outline" onClick={addService} className="h-8">
                    <Plus className="mr-1 h-3.5 w-3.5" />Add service
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {services.map((s) => (
                  <div key={s.id} className="relative">
                    {editMode ? (
                      <div className="rounded-md border bg-card p-3 space-y-2">
                        <Input
                          className="h-10 text-sm font-semibold"
                          value={s.label}
                          onChange={(e) => updateService(s.id, { label: e.target.value })}
                          placeholder="Service name"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Base $</span>
                          <Input
                            className="h-10"
                            type="number"
                            inputMode="decimal"
                            value={s.base}
                            onChange={(e) => updateService(s.id, { base: Number(e.target.value) || 0 })}
                          />
                          <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => removeService(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant={serviceTypeId === s.id ? "default" : "outline"}
                        className="h-auto w-full flex-col gap-0 whitespace-normal py-3"
                        onClick={() => setServiceTypeId(s.id)}
                      >
                        <span className="text-sm font-semibold leading-tight">{s.label}</span>
                        <span className="mt-0.5 text-xs opacity-70">from ${s.base}</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {/* Quick-add a new service inline (always visible) */}
              <div className="mt-2 flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-2 sm:flex-row sm:items-center">
                <Input
                  className="h-10 flex-1"
                  placeholder="New service name (e.g. Airbnb Turnover)"
                  value={quickSvcName}
                  onChange={(e) => setQuickSvcName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddService(); } }}
                />
                <div className="flex gap-2">
                  <Input
                    className="h-10 w-28"
                    type="number"
                    inputMode="decimal"
                    placeholder="Base $"
                    value={quickSvcBase}
                    onChange={(e) => setQuickSvcBase(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddService(); } }}
                  />
                  <Button type="button" onClick={quickAddService} className="h-10 shrink-0">
                    <Plus className="mr-1 h-4 w-4" />Add
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Service tier</Label>
              <ServiceTierTabs value={serviceTier} onChange={setServiceTier} multipliers={pricingRules.tier_multipliers} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Matches the tier the customer sees. Total = (base + rooms/sqft + add-ons) × tier × (1 − discount), floored at min job price.
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Service frequency</Label>
              <FrequencyPicker
                value={frequency}
                onChange={setFrequency}
                discounts={(pricingRules as any).frequency_discounts}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Recurring visits automatically apply the discount and sync to the customer view.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Square footage tier</Label>
                {sqftTier && (
                  <button
                    type="button"
                    onClick={() => setSqftTier(null)}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <SqftTierPicker value={sqftTier} onChange={setSqftTier} prices={pricingRules.sqft_tier_prices} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Optional — when selected, quote uses the higher of (service + rooms) vs sq-ft tier price.
              </p>
              {editMode && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 sm:grid-cols-4">
                  {SQFT_TIERS.map((t) => (
                    <div key={t.id}>
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground">{t.label}</div>
                      <Input
                        className="h-9"
                        type="number"
                        inputMode="decimal"
                        value={sqftTierPrices[t.id] ?? 0}
                        onChange={(e) =>
                          setSqftTierPrices((prev) => ({ ...prev, [t.id]: Number(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="mb-2 block">Rooms</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <CountField label="Bedrooms" value={bedrooms} onChange={setBedrooms} />
                <CountField label="Bathrooms" value={bathrooms} onChange={setBathrooms} />
                <CountField label="Kitchens" value={kitchens} onChange={setKitchens} />
                <CountField label="Living rooms" value={livingRooms} onChange={setLivingRooms} />
              </div>
              {editMode && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 sm:grid-cols-4">
                  {([
                    ["bedrooms", "Bedroom $"],
                    ["bathrooms", "Bathroom $"],
                    ["kitchens", "Kitchen $"],
                    ["living_rooms", "Living rm $"],
                  ] as const).map(([k, lbl]) => (
                    <div key={k}>
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground">{lbl}</div>
                      <Input
                        className="h-9"
                        type="number"
                        value={roomPricing[k]}
                        onChange={(e) => setRoomPricing((prev) => ({ ...prev, [k]: Number(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Add-ons</Label>
                {editMode && (
                  <Button type="button" size="sm" variant="outline" onClick={addAddon} className="h-8">
                    <Plus className="mr-1 h-3.5 w-3.5" />Add add-on
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {addons.map((a) => {
                  const checked = selectedAddons.includes(a.id);
                  if (editMode) {
                    return (
                      <div key={a.id} className="flex items-center gap-2 rounded-xl border bg-card p-2">
                        <Input
                          className="h-10 flex-1"
                          value={a.label}
                          onChange={(e) => updateAddon(a.id, { label: e.target.value })}
                          placeholder="Add-on name"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">$</span>
                          <Input
                            className="h-10 w-20"
                            type="number"
                            inputMode="decimal"
                            value={a.price}
                            onChange={(e) => updateAddon(a.id, { price: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeAddon(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-colors ${
                        checked ? "border-primary bg-primary/5" : "hover:bg-accent"
                      }`}
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <Checkbox checked={checked} onCheckedChange={() => toggleAddon(a.id)} />
                        <span className="truncate font-medium">{a.label}</span>
                      </label>
                      {checked && (
                        <button
                          type="button"
                          onClick={() => setRequiredAddons((prev) => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                          className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            requiredAddons.includes(a.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50"
                          }`}
                          title="Required services cannot be removed by the customer"
                        >
                          {requiredAddons.includes(a.id) ? <Lock className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                          {requiredAddons.includes(a.id) ? "Required" : "Optional"}
                        </button>
                      )}
                      <span className="shrink-0 font-semibold text-primary">+${a.price}</span>
                    </div>
                  );
                })}
                {addons.length === 0 && (
                  <div className="col-span-full rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No add-ons yet. Use the quick-add row below.
                  </div>
                )}
              </div>
              {/* Quick-add new add-on inline (always visible, auto-selects it) */}
              <div className="mt-2 flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-2 sm:flex-row sm:items-center">
                <Input
                  className="h-10 flex-1"
                  placeholder="New add-on (e.g. Inside microwave)"
                  value={quickAddonName}
                  onChange={(e) => setQuickAddonName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddAddon(); } }}
                />
                <div className="flex gap-2">
                  <Input
                    className="h-10 w-24"
                    type="number"
                    inputMode="decimal"
                    placeholder="Price $"
                    value={quickAddonPrice}
                    onChange={(e) => setQuickAddonPrice(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); quickAddAddon(); } }}
                  />
                  <Button type="button" onClick={quickAddAddon} className="h-10 shrink-0">
                    <Plus className="mr-1 h-4 w-4" />Add
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">Coupon code</Label>
                <div className="flex gap-2">
                  <Input className="h-11 flex-1 min-w-0" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="SAVE20" />
                  <Button type="button" variant="outline" onClick={applyCoupon} className="shrink-0"><Tag className="mr-1 h-4 w-4" />Apply</Button>
                </div>
                {appliedCoupon && (
                  <p className="mt-1 text-xs text-green-600">
                    {appliedCoupon.code} · −{appliedCoupon.discount_type === "percent" ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value}`}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label>Manual override</Label>
                  <Switch checked={overrideOn} onCheckedChange={setOverrideOn} />
                </div>
                {overrideOn && (
                  <Input className="h-11" type="number" inputMode="decimal" value={overrideTotal} onChange={(e) => setOverrideTotal(e.target.value)} placeholder="Total $" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LIVE CUSTOMER ACTIVITY TIMELINE */}
      {savedQuote?.id && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Customer activity
              <span className="ml-1 flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-xs font-normal text-muted-foreground">Live</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Waiting for the customer to open the quote…</p>
            ) : (
              <ol className="relative space-y-3 border-l border-border/60 pl-5">
                {timeline.slice().reverse().map((e, i) => {
                  const icon = e.event_type === "viewed" ? <Eye className="h-3.5 w-3.5" />
                    : e.event_type === "addons_updated" ? <MousePointerClick className="h-3.5 w-3.5" />
                    : e.event_type === "accepted" ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : e.event_type === "paid" ? <DollarSign className="h-3.5 w-3.5" />
                    : <Activity className="h-3.5 w-3.5" />;
                  const label = e.event_type === "viewed" ? "Customer opened the quote"
                    : e.event_type === "addons_updated" ? `Customer updated selection · new total $${Number(e.meta?.new_total ?? 0).toFixed(2)}`
                    : e.event_type === "accepted" ? "Customer approved the quote"
                    : e.event_type === "paid" ? "Payment received"
                    : e.event_type === "addons_change_blocked" ? "Customer tried to change a manually-overridden quote"
                    : e.event_type;
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full border bg-background text-primary">
                        {icon}
                      </span>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="container mx-auto space-y-3 p-3 sm:p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total due</div>
              <div className="bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
                ${pricing.total.toFixed(2)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Subtotal ${pricing.subtotal.toFixed(2)}
                {pricing.discount > 0 && <> · −${pricing.discount.toFixed(2)}</>}
              </div>
            </div>
            <div className="inline-flex shrink-0 rounded-full border bg-muted p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDepositMode("deposit")}
                className={`rounded-full px-3 py-1.5 transition-all ${depositMode === "deposit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >50%</button>
              <button
                type="button"
                onClick={() => setDepositMode("full")}
                className={`rounded-full px-3 py-1.5 transition-all ${depositMode === "full" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >Full</button>
            </div>
          </div>

          <Button size="lg" className="h-14 w-full text-base font-semibold shadow-md" onClick={takePayment} disabled={!!busy}>
            <CreditCard className="mr-2 h-5 w-5" />
            {busy === "pay" ? "Opening checkout..." : depositMode === "deposit" ? `Take 50% deposit · $${(pricing.total / 2).toFixed(2)}` : `Take payment · $${pricing.total.toFixed(2)}`}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="h-11" onClick={sendQuote} disabled={!!busy}>
              <Send className="mr-1.5 h-4 w-4" />{busy === "send" ? "Sending..." : "Send quote"}
            </Button>
            <Button variant="outline" className="h-11" onClick={markBooked} disabled={!!busy}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />Mark booked
            </Button>
          </div>
          {savedQuote?.share_token && (
            <Button variant="ghost" size="sm" className="w-full" onClick={copyLink}>
              <Copy className="mr-1.5 h-4 w-4" />Copy quote link
            </Button>
          )}
        </div>
        {savedQuote && (
          <div className="border-t bg-muted/50 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
            Quote #{savedQuote.id.slice(0, 8)} · <strong className="text-foreground">{savedQuote.status}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
