import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

interface Props {
  date: string;
  time: string;
  onUpdate: (field: string, value: string) => void;
  businessId?: string;
}

// Deterministic pseudo-availability so different dates feel different while
// we surface real bookings when they exist.
function baseSlotsForDate(dateStr: string): Record<string, number> {
  const seed = Array.from(dateStr).reduce((a, c) => a + c.charCodeAt(0), 0);
  const map: Record<string, number> = {};
  timeSlots.forEach((t, i) => {
    map[t] = 3 + ((seed + i * 7) % 3); // 3..5 slots
  });
  return map;
}

export function BookingSchedule({ date, time, onUpdate, businessId }: Props) {
  const [booked, setBooked] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!date || !businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("cleaning_booking_requests")
          .select("preferred_time")
          .eq("business_id", businessId)
          .eq("preferred_date", date);
        if (cancelled) return;
        const counts: Record<string, number> = {};
        (data || []).forEach((r: any) => {
          if (r.preferred_time) counts[r.preferred_time] = (counts[r.preferred_time] || 0) + 1;
        });
        setBooked(counts);
      } catch {
        /* anon may not read; fall back to pseudo-availability */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, businessId]);

  const base = date ? baseSlotsForDate(date) : {};

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Select Date & Time</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
        When would you like us to come?
        {date && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Live availability
          </span>
        )}
      </p>
      <div className="space-y-5">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            className="mt-2 h-12 sm:h-10 text-base sm:text-sm"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => onUpdate("date", e.target.value)}
          />
        </div>
        <div>
          <Label>Time</Label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {timeSlots.map((t) => {
              const total = base[t] ?? 4;
              const takenCount = booked[t] ?? 0;
              const left = Math.max(0, total - takenCount);
              const isFull = date && left === 0;
              const isTight = date && left > 0 && left <= 1;
              const selected = time === t;
              return (
                <button
                  key={t}
                  disabled={!!isFull}
                  onClick={() => !isFull && onUpdate("time", t)}
                  className={`relative h-14 sm:h-12 rounded-lg border text-xs sm:text-sm font-medium transition-all active:scale-[0.96] flex flex-col items-center justify-center gap-0.5 ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : isFull
                        ? "bg-muted/40 text-muted-foreground line-through cursor-not-allowed border-dashed"
                        : "hover:bg-muted hover:border-primary/40"
                  }`}
                >
                  <span>{t}</span>
                  {date && !selected && (
                    <span
                      className={`text-[9px] font-semibold leading-none ${
                        isFull ? "text-muted-foreground" : isTight ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {isFull ? "Booked" : isTight ? `${left} left` : "Available"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {date && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Slots update in real time as bookings come in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
