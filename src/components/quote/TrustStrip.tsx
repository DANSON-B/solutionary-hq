import { useState } from "react";
import {
  Sliders, Zap, ShieldCheck, Sparkles, BadgeCheck,
  Umbrella, Award, Package, GraduationCap, ChevronDown,
} from "lucide-react";

const ITEMS = [
  { Icon: ShieldCheck, text: "Fully insured" },
  { Icon: Umbrella, text: "Bonded for your protection" },
  { Icon: Package, text: "We bring our own products & tools" },
  { Icon: GraduationCap, text: "Background-checked, trained teams" },
  { Icon: Award, text: "Satisfaction guaranteed" },
  { Icon: Sliders, text: "Customize to your budget" },
  { Icon: Zap, text: "Total updates instantly" },
  { Icon: BadgeCheck, text: "No hidden fees" },
  { Icon: Sparkles, text: "Reserved after payment" },
];

export function TrustStrip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
      {/* Mobile collapsible header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 sm:hidden"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Why book with us</span>
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            Insured · Bonded
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Desktop label */}
      <div className="mb-2 hidden items-center gap-2 sm:flex">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Why book with us
        </span>
      </div>

      {/* Items */}
      <ul
        className={`${
          open ? "mt-3 grid" : "hidden"
        } grid-cols-1 gap-2 text-[12px] text-foreground sm:mt-0 sm:grid sm:grid-cols-3 lg:grid-cols-3`}
      >
        {ITEMS.map(({ Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-2"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-medium leading-tight">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
