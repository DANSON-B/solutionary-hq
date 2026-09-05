import { motion } from "framer-motion";
import { Building2, Check, Home, Ruler, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PC_CEILING_OPTIONS,
  PC_PHASES,
  PC_BUNDLE_DISCOUNT,
  type PCCeiling,
  type PCEnvironment,
  type PCPhaseId,
  type PCQuote,
} from "./postConstruction";

/* ── shared luxury surfaces ─────────────────────────────────────────── */

const panel =
  "rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_12px_32px_-12px_hsl(var(--foreground)/0.16)]";

const selectedRing =
  "border-foreground ring-1 ring-foreground/80 shadow-[0_8px_28px_-10px_hsl(var(--foreground)/0.35)] -translate-y-0.5";

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mb-7">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-2 text-[26px] font-medium leading-[1.15] tracking-[-0.02em] text-foreground">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{sub}</p>
    </div>
  );
}

function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "solid" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide",
        tone === "solid" ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/* ── Step 1 · Project classification ────────────────────────────────── */

export function PCStepProject({
  environment,
  setEnvironment,
  contractor,
  setContractor,
}: {
  environment: PCEnvironment | "";
  setEnvironment: (e: PCEnvironment) => void;
  contractor: { company: string; siteContact: string; permitRef: string };
  setContractor: (c: { company: string; siteContact: string; permitRef: string }) => void;
}) {
  const opts: { id: PCEnvironment; label: string; desc: string; icon: typeof Home }[] = [
    { id: "residential", label: "Residential Build", desc: "New homes, additions, full renovations.", icon: Home },
    { id: "commercial", label: "Commercial Build", desc: "Offices, retail build-outs, tenant improvements.", icon: Building2 },
  ];
  return (
    <div>
      <Heading
        eyebrow="Step 1"
        title="Project classification"
        sub="Tell us what kind of site our crew is walking into."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {opts.map((o) => {
          const sel = environment === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setEnvironment(o.id)}
              className={cn(panel, "p-5 text-left transition-all duration-300", sel ? selectedRing : "hover:-translate-y-0.5")}
            >
              <o.icon className="mb-4 h-6 w-6 text-foreground/80" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-medium tracking-[-0.01em]">{o.label}</span>
                {sel && <Check className="h-4 w-4" />}
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{o.desc}</p>
            </button>
          );
        })}
      </div>

      <div className={cn(panel, "mt-5 space-y-4 p-5")}>
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Contractor details
        </div>
        <div>
          <Label className="text-[13px]">General contractor / company</Label>
          <Input
            className="mt-1.5 h-12 rounded-xl text-base"
            value={contractor.company}
            onChange={(e) => setContractor({ ...contractor, company: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-[13px]">Site contact</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl text-base"
              value={contractor.siteContact}
              onChange={(e) => setContractor({ ...contractor, siteContact: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label className="text-[13px]">Permit / job #</Label>
            <Input
              className="mt-1.5 h-12 rounded-xl text-base"
              value={contractor.permitRef}
              onChange={(e) => setContractor({ ...contractor, permitRef: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 2 · Property metrics ──────────────────────────────────────── */

export function PCStepMetrics({
  sqft,
  setSqft,
  ceiling,
  setCeiling,
  rooms,
  setRooms,
}: {
  sqft: string;
  setSqft: (v: string) => void;
  ceiling: PCCeiling;
  setCeiling: (c: PCCeiling) => void;
  rooms: string;
  setRooms: (v: string) => void;
}) {
  return (
    <div>
      <Heading eyebrow="Step 2" title="Property metrics" sub="Dimensions drive crew size, hours and dust control." />

      <div className={cn(panel, "space-y-6 p-5")}>
        <div>
          <Label className="text-[13px]">Total square footage</Label>
          <div className="relative mt-1.5">
            <Ruler className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              inputMode="numeric"
              className="h-13 rounded-xl pl-11 text-base"
              placeholder="e.g. 4,200"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-[13px]">Ceiling height</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {PC_CEILING_OPTIONS.map((c) => {
              const sel = ceiling === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCeiling(c.id)}
                  className={cn(
                    "rounded-2xl border border-border/60 bg-card/60 p-4 text-left transition-all duration-300 backdrop-blur",
                    sel ? selectedRing : "hover:-translate-y-0.5",
                  )}
                >
                  <div className="text-[14px] font-medium">{c.label}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{c.note}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-[13px]">Rough-in rooms</Label>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Kitchens, baths and utility rooms with exposed rough-in work.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => setRooms(String(Math.max(0, (parseInt(rooms) || 0) - 1)))}
              className="h-12 w-12 rounded-full border border-border/70 text-lg transition-colors hover:bg-muted"
              aria-label="Decrease rooms"
            >
              −
            </button>
            <span className="w-10 text-center text-lg font-medium tabular-nums">{parseInt(rooms) || 0}</span>
            <button
              onClick={() => setRooms(String((parseInt(rooms) || 0) + 1))}
              className="h-12 w-12 rounded-full border border-border/70 text-lg transition-colors hover:bg-muted"
              aria-label="Increase rooms"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step 3 · Phase grid ────────────────────────────────────────────── */

export function PCStepPhases({
  environment,
  phases,
  togglePhase,
  quote,
}: {
  environment: PCEnvironment;
  phases: PCPhaseId[];
  togglePhase: (id: PCPhaseId) => void;
  quote: PCQuote | null;
}) {
  return (
    <div>
      <Heading
        eyebrow="Step 3"
        title="Choose your phases"
        sub="Book one phase or sequence the full build-out lifecycle."
      />

      <div className="space-y-3">
        {PC_PHASES.map((p, i) => {
          const sel = phases.includes(p.id);
          const line = quote?.lines.find((l) => l.id === p.id);
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => togglePhase(p.id)}
              className={cn(panel, "w-full p-5 text-left transition-all duration-300", sel ? selectedRing : "hover:-translate-y-0.5")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium tracking-[-0.01em]">{p.label}</span>
                    {p.badge && <Pill tone={sel ? "solid" : "muted"}>{p.badge}</Pill>}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{p.tagline}</p>
                </div>
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                    sel ? "border-foreground bg-foreground text-background" : "border-border",
                  )}
                >
                  {sel && <Check className="h-3.5 w-3.5" />}
                </div>
              </div>

              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {p.scope.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                    {s}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-[12px] text-muted-foreground">
                  ${p.rate[environment].toFixed(2)}/sq ft · from ${p.minimum[environment]}
                </span>
                {line && <span className="text-[15px] font-medium tabular-nums">${line.amount.toFixed(2)}</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-4 flex items-center gap-3 rounded-2xl border p-4 transition-colors",
          quote?.bundleApplied ? "border-foreground bg-foreground text-background" : "border-dashed border-border bg-card/50",
        )}
      >
        <Sparkles className="h-5 w-5 shrink-0" />
        <div className="text-[13px] leading-relaxed">
          {quote?.bundleApplied ? (
            <>
              <span className="font-medium">Full lifecycle bundle applied.</span>{" "}
              You saved ${quote.bundleDiscount.toFixed(2)} ({Math.round(PC_BUNDLE_DISCOUNT * 100)}% off).
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">Bundle all three phases</span>{" "}
              <span className="text-muted-foreground">
                and save {Math.round(PC_BUNDLE_DISCOUNT * 100)}% across the whole project.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Step 4 · Milestone timeline ────────────────────────────────────── */

const PC_TIMES = ["7:00 AM", "9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"];

export function PCStepTimeline({
  phases,
  schedule,
  setSchedule,
}: {
  phases: PCPhaseId[];
  schedule: Record<string, { date: string; time: string }>;
  setSchedule: (s: Record<string, { date: string; time: string }>) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const active = PC_PHASES.filter((p) => phases.includes(p.id));

  return (
    <div>
      <Heading
        eyebrow="Step 4"
        title="Milestone timeline"
        sub="Align each phase to your construction schedule — we'll hold the crew."
      />
      <div className="space-y-4">
        {active.map((p) => {
          const row = schedule[p.id] || { date: "", time: "" };
          return (
            <div key={p.id} className={cn(panel, "p-5")}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-medium tracking-[-0.01em]">{p.label}</span>
                {p.badge && <Pill>{p.badge}</Pill>}
              </div>
              <div className="mt-4">
                <Label className="text-[13px]">Target date</Label>
                <Input
                  type="date"
                  min={today}
                  className="mt-1.5 h-12 rounded-xl text-base"
                  value={row.date}
                  onChange={(e) => setSchedule({ ...schedule, [p.id]: { ...row, date: e.target.value } })}
                />
              </div>
              <div className="mt-4">
                <Label className="text-[13px]">Crew arrival</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PC_TIMES.map((t) => {
                    const sel = row.time === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSchedule({ ...schedule, [p.id]: { ...row, time: t } })}
                        className={cn(
                          "h-11 rounded-xl border text-[12.5px] font-medium transition-all",
                          sel ? "border-foreground bg-foreground text-background" : "border-border/70 hover:bg-muted",
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Review summary card ────────────────────────────────────────────── */

export function PCSummary({ quote }: { quote: PCQuote }) {
  return (
    <div className={cn(panel, "p-5")}>
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Project phases</div>
      <div className="mt-3 space-y-2">
        {quote.lines.map((l) => (
          <div key={l.id} className="flex justify-between gap-3 text-[14px]">
            <span className="text-muted-foreground">{l.label}</span>
            <span className="font-medium tabular-nums">${l.amount.toFixed(2)}</span>
          </div>
        ))}
        {quote.bundleApplied && (
          <div className="flex justify-between gap-3 text-[14px]">
            <span className="text-muted-foreground">Bundle discount</span>
            <span className="font-medium tabular-nums">−${quote.bundleDiscount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
        <span className="text-[14px] font-medium">Project total</span>
        <span className="text-2xl font-medium tabular-nums tracking-[-0.02em]">${quote.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
