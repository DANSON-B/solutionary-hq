import { Calendar, Repeat, CalendarDays, CalendarClock } from "lucide-react";

export type Frequency = "one_time" | "weekly" | "biweekly" | "monthly";

const OPTIONS: { id: Frequency; label: string; sub: string; Icon: any }[] = [
  { id: "one_time", label: "One-time", sub: "Just this cleaning", Icon: Calendar },
  { id: "weekly", label: "Weekly", sub: "Every week", Icon: Repeat },
  { id: "biweekly", label: "Every 2 weeks", sub: "Most popular", Icon: CalendarDays },
  { id: "monthly", label: "Monthly", sub: "Once a month", Icon: CalendarClock },
];

export function FrequencyPicker({
  value,
  onChange,
  discounts,
  disabled,
}: {
  value: Frequency;
  onChange: (v: Frequency) => void;
  discounts?: Record<string, number>;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {OPTIONS.map((o) => {
        const pct = Number(discounts?.[o.id] || 0);
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.id)}
            className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background hover:border-primary/40"
            } disabled:opacity-60`}
          >
            {pct > 0 && (
              <span className="absolute -top-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                Save {pct}%
              </span>
            )}
            <o.Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{o.label}</div>
              <div className="text-[11px] text-muted-foreground">{o.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
