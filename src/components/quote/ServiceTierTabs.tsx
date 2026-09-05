import { Sparkles, Zap, Crown } from "lucide-react";
import type { ServiceTier } from "./quoteTypes";

const TIERS: { id: ServiceTier; label: string; tagline: string; Icon: any }[] = [
  { id: "basic", label: "Basic", tagline: "Essentials, refreshed", Icon: Zap },
  { id: "standard", label: "Standard", tagline: "Our most popular", Icon: Sparkles },
  { id: "deep", label: "Deep", tagline: "Top-to-bottom detail", Icon: Crown },
];

export function ServiceTierTabs({
  value,
  onChange,
  disabled,
  multipliers,
}: {
  value: ServiceTier;
  onChange: (t: ServiceTier) => void;
  disabled?: boolean;
  multipliers?: Record<ServiceTier, number>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TIERS.map(({ id, label, tagline, Icon }) => {
        const active = value === id;
        const mult = multipliers?.[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            disabled={disabled}
            className={`group relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all sm:p-4 ${
              active
                ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
            } disabled:opacity-60`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-bold">{label}</span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">{tagline}</span>
            {mult && (
              <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>
                ×{mult.toFixed(2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
