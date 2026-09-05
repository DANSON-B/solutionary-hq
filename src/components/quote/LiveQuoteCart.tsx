import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, CreditCard, Lock, ShieldCheck } from "lucide-react";

export function LiveQuoteCart({
  subtotal,
  discount,
  total,
  depositPercent,
  setDepositPercent,
  onApprove,
  busy,
  readOnly,
  expired,
  isPaid,
  hasDiscount,
  minJobPrice,
  hitFloor,
}: {
  subtotal: number;
  discount: number;
  total: number;
  depositPercent: number;
  setDepositPercent: (n: number) => void;
  onApprove: () => void;
  busy?: boolean;
  readOnly?: boolean;
  expired?: boolean;
  isPaid?: boolean;
  hasDiscount?: boolean;
  minJobPrice?: number;
  hitFloor?: boolean;
}) {
  const depositAmount = total * (depositPercent / 100);
  const savings = hasDiscount ? discount : 0;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
      <div className="border-b bg-muted/40 px-4 py-3 sm:px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live quote</p>
        <p className="text-xs text-muted-foreground">Updates instantly as you customize</p>
      </div>

      <div className="space-y-2 px-4 py-4 text-sm sm:px-5">
        {hasDiscount ? (
          <>
            <div className="flex justify-between text-muted-foreground">
              <span>Original price</span>
              <span className="tabular-nums line-through">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-600">
              <span>Promotion discount</span>
              <span className="tabular-nums">−${discount.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
        )}
        {hitFloor && minJobPrice !== undefined && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            Minimum job price ${minJobPrice.toFixed(0)} applied
          </div>
        )}
      </div>

      <div className="flex items-end justify-between bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-4 text-white sm:px-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Total</p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums">${total.toFixed(2)}</p>
          {savings > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-emerald-300">You saved ${savings.toFixed(2)} today</p>
          )}
        </div>
        <div className="text-right text-[11px] text-white/60">
          <p>Due today</p>
          <p className="text-lg font-bold tabular-nums text-white">${depositAmount.toFixed(2)}</p>
        </div>
      </div>

      {!isPaid && !expired && (
        <div className="space-y-3 border-t bg-background px-4 py-4 sm:px-5">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment option</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { v: 25, label: "25% deposit" },
                { v: 50, label: "50% deposit" },
                { v: 100, label: "Pay in full" },
              ].map((o) => {
                const active = depositPercent === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setDepositPercent(o.v)}
                    disabled={readOnly}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    } disabled:opacity-60`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            size="lg"
            className="h-12 w-full text-sm font-semibold shadow-md"
            onClick={onApprove}
            disabled={busy || total <= 0}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : depositPercent === 100 ? (
              <CreditCard className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Pay & Book Now
          </Button>

          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Reserved instantly</span>
          </div>
        </div>
      )}
    </div>
  );
}
