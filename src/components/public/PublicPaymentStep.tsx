import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  BadgeCheck,
  Umbrella,
  Sparkles,
  Star,
} from "lucide-react";

interface Props {
  kind: "quote" | "booking_request";
  id: string;
  total: number;
  businessName?: string;
  onSkip?: () => void;
}

const OPTIONS = [
  { pct: 25, label: "25% deposit", sub: "Balance due day of service", tag: "Most flexible" },
  { pct: 50, label: "50% deposit", sub: "Balance due day of service", tag: "Most popular" },
  { pct: 100, label: "Pay in full", sub: "Nothing due later", tag: "Save time" },
];

const TRUST_ROW = [
  { Icon: Lock, text: "256-bit SSL" },
  { Icon: ShieldCheck, text: "PCI-DSS" },
  { Icon: BadgeCheck, text: "Stripe secured" },
  { Icon: Umbrella, text: "Bonded & insured" },
];

export default function PublicPaymentStep({ kind, id, total, businessName, onSkip }: Props) {
  const { toast } = useToast();
  const [pct, setPct] = useState<number>(50);
  const [loading, setLoading] = useState(false);

  const dueToday = total * (pct / 100);
  const dueLater = total - dueToday;

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-booking-checkout", {
        body: { kind, id, depositPercent: pct },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("No checkout URL returned");
      const w = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!w) window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Couldn't start checkout",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {/* Card */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white">
          <div className="absolute inset-0 opacity-10 bg-grid" />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 ring-4 ring-primary/10">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
              Reserve Your Booking
            </h2>
            <p className="mt-1 max-w-xs text-xs text-white/70">
              Lock in your spot in seconds. Pay now, pay half, or pay day-of — you choose.
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="border-b bg-muted/30 px-6 py-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Estimated total
          </p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">${total.toFixed(2)}</p>
        </div>

        {/* Payment options */}
        <div className="space-y-3 px-6 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Payment option
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <Sparkles className="h-3 w-3" /> No hidden fees
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {OPTIONS.map((o) => {
              const active = pct === o.pct;
              return (
                <button
                  key={o.pct}
                  type="button"
                  onClick={() => setPct(o.pct)}
                  className={`group relative flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 text-primary-foreground" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{o.label}</p>
                        {o.tag && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                              o.pct === 50
                                ? "bg-amber-100 text-amber-900"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {o.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{o.sub}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold tabular-nums">
                    ${(total * (o.pct / 100)).toFixed(2)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Breakdown */}
          <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due today</span>
              <span className="font-bold tabular-nums">${dueToday.toFixed(2)}</span>
            </div>
            {dueLater > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Due day of service</span>
                <span className="font-semibold tabular-nums">${dueLater.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="h-12 w-full text-sm font-bold shadow-md"
            onClick={handlePay}
            disabled={loading || total <= 0}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Pay & Book Now
          </Button>

          {/* Trust row */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {TRUST_ROW.map(({ Icon, text }) => (
              <div
                key={text}
                className="flex flex-col items-center gap-1 rounded-lg border bg-background px-1 py-2 text-center"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-semibold leading-tight text-muted-foreground">
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Guarantee */}
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                100% Satisfaction Guarantee
              </p>
              <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                Not happy? We'll return within 24 hours to make it right — free of charge.
              </p>
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              Trusted by 2,000+ happy customers
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/20 px-6 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure checkout by
            <span className="font-bold text-foreground">Stripe</span>
            {businessName && <span>· on behalf of {businessName}</span>}
          </div>
        </div>
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="block w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          I'll pay later — just submit the request
        </button>
      )}
    </div>
  );
}
