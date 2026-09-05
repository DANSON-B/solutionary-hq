import { SQFT_TIERS } from "./quoteTypes";

export function SqftTierPicker({
  value,
  onChange,
  prices,
  disabled,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  prices?: Record<string, number>;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {SQFT_TIERS.map((t) => {
        const active = value === t.id;
        const price = prices?.[t.id];
        return (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? null : t.id)}
            className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all ${
              active
                ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
            } disabled:opacity-60`}
          >
            <span className="text-xs font-semibold">{t.label}</span>
            {price !== undefined && (
              <span className={`text-[11px] tabular-nums ${active ? "text-primary font-bold" : "text-muted-foreground"}`}>
                from ${price.toFixed(0)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
