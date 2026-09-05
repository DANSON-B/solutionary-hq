import { Minus, Plus } from "lucide-react";
import { ROOM_FIELDS, type RoomKey } from "./quoteTypes";

export function RoomSteppers({
  values,
  onChange,
  disabled,
}: {
  values: Record<RoomKey, number>;
  onChange: (k: RoomKey, v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {ROOM_FIELDS.map(({ key, label }) => {
        const v = values[key] ?? 0;
        return (
          <div key={key} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            <div className="flex w-full items-center justify-between gap-1">
              <button
                type="button"
                disabled={disabled || v <= 0}
                onClick={() => onChange(key, Math.max(0, v - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[1.5ch] text-center text-xl font-extrabold tabular-nums">{v}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(key, v + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
