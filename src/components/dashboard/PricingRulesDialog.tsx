import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ROOM_FIELDS, SQFT_TIERS, type PricingRules } from "@/components/quote/quoteTypes";

const DEFAULT: PricingRules = {
  min_job_price: 120,
  tier_multipliers: { basic: 0.85, standard: 1, deep: 1.4 },
  room_prices: {
    bedrooms: 25, bathrooms: 35, kitchens: 40, living_rooms: 20,
    dining_rooms: 15, offices: 20, finished_basement: 45, laundry_room: 15,
  },
  sqft_tier_prices: {
    u1000: 140, "1000_1500": 175, "1500_2000": 210, "2000_2500": 255,
    "2500_3000": 300, "3000_4000": 360, "4000p": 425,
  },
  discount_by_tier: { basic: 0, standard: 0, deep: 0 },
};

export function PricingRulesDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<PricingRules>(DEFAULT);

  useEffect(() => {
    if (!open || !businessId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase.from("pricing_rules").select("*").eq("business_id", businessId).maybeSingle();
      if (data) {
        setRules({
          min_job_price: Number(data.min_job_price),
          tier_multipliers: (data.tier_multipliers as any) ?? DEFAULT.tier_multipliers,
          room_prices: (data.room_prices as any) ?? DEFAULT.room_prices,
          sqft_tier_prices: (data.sqft_tier_prices as any) ?? DEFAULT.sqft_tier_prices,
          discount_by_tier: (data.discount_by_tier as any) ?? DEFAULT.discount_by_tier,
        });
      }
      setLoading(false);
    })();
  }, [open, businessId]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("pricing_rules").upsert({
        business_id: businessId,
        min_job_price: rules.min_job_price,
        tier_multipliers: rules.tier_multipliers,
        room_prices: rules.room_prices,
        sqft_tier_prices: rules.sqft_tier_prices,
        discount_by_tier: rules.discount_by_tier,
      });
      if (error) throw error;
      toast({ title: "Pricing rules saved" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const numField = (v: number, set: (n: number) => void, step = 1) => (
    <Input
      type="number" inputMode="decimal" step={step}
      className="h-9"
      value={v}
      onChange={(e) => set(Number(e.target.value))}
    />
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Settings2 className="mr-1 h-4 w-4" />Pricing rules</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Customer-facing pricing rules</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            <section>
              <Label className="text-sm font-bold">Minimum job price</Label>
              <p className="mb-1 text-xs text-muted-foreground">Total can never fall below this floor.</p>
              {numField(rules.min_job_price, (n) => setRules({ ...rules, min_job_price: n }))}
            </section>

            <section>
              <Label className="text-sm font-bold">Service tier multipliers</Label>
              <p className="mb-2 text-xs text-muted-foreground">Deep must be highest. Basic typically lowest.</p>
              <div className="grid grid-cols-3 gap-2">
                {(["basic", "standard", "deep"] as const).map((t) => (
                  <div key={t}>
                    <Label className="text-xs capitalize">{t}</Label>
                    {numField(rules.tier_multipliers[t], (n) =>
                      setRules({ ...rules, tier_multipliers: { ...rules.tier_multipliers, [t]: n } }), 0.05)}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <Label className="text-sm font-bold">Per-room prices ($)</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROOM_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    {numField(rules.room_prices[key] ?? 0, (n) =>
                      setRules({ ...rules, room_prices: { ...rules.room_prices, [key]: n } }))}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <Label className="text-sm font-bold">Square-footage tier prices ($)</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SQFT_TIERS.map((t) => (
                  <div key={t.id}>
                    <Label className="text-xs">{t.label}</Label>
                    {numField(rules.sqft_tier_prices[t.id] ?? 0, (n) =>
                      setRules({ ...rules, sqft_tier_prices: { ...rules.sqft_tier_prices, [t.id]: n } }))}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <Label className="text-sm font-bold">Promotional discount per tier (%)</Label>
              <p className="mb-2 text-xs text-muted-foreground">Shown as savings on the customer quote. Minimum job price still applies.</p>
              <div className="grid grid-cols-3 gap-2">
                {(["basic", "standard", "deep"] as const).map((t) => (
                  <div key={t}>
                    <Label className="text-xs capitalize">{t}</Label>
                    {numField(rules.discount_by_tier[t] ?? 0, (n) =>
                      setRules({ ...rules, discount_by_tier: { ...rules.discount_by_tier, [t]: Math.max(0, Math.min(50, n)) } }))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save pricing rules
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
