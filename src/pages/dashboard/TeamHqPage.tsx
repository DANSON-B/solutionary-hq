import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarClock,
  Clock,
  TrendingUp,
  DollarSign,
  Sparkles,
  ArrowRight,
  Crown,
  Shield,
  Wrench,
} from "lucide-react";

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "manager" | "technician";
  is_active: boolean;
};

const roleMeta = {
  admin: { label: "Admin", icon: Crown, className: "bg-amber-100 text-amber-800 border-amber-200" },
  manager: { label: "Manager", icon: Shield, className: "bg-blue-100 text-blue-800 border-blue-200" },
  technician: { label: "Cleaner", icon: Wrench, className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
} as const;

const phases = [
  {
    n: 1,
    title: "People Database",
    tag: "WHO",
    status: "live" as const,
    icon: Users,
    desc: "Your digital employee book. Profiles, roles, and identity for every worker.",
    href: "/dashboard/team",
    cta: "Manage employees",
  },
  {
    n: 2,
    title: "Operations Control",
    tag: "WHEN",
    status: "live" as const,
    icon: CalendarClock,
    desc: "Daily dispatch board — who is working today, tomorrow, and this week.",
    href: "/dashboard/team/schedule",
    cta: "Open schedule",
  },
  {
    n: 3,
    title: "Time & Accountability",
    tag: "HOW LONG",
    status: "soon" as const,
    icon: Clock,
    desc: "Clock-in / clock-out with GPS check-in at the job site. Real hours, real timesheets.",
  },
  {
    n: 4,
    title: "Performance Engine",
    tag: "HOW GOOD",
    status: "soon" as const,
    icon: TrendingUp,
    desc: "Jobs completed, revenue per cleaner, ratings, and attendance score.",
  },
  {
    n: 5,
    title: "Payroll & Cost Control",
    tag: "HOW MUCH",
    status: "soon" as const,
    icon: DollarSign,
    desc: "Hours × pay rate, weekly payroll summary, overtime and commission tracking.",
  },
  {
    n: 6,
    title: "Smart Automations",
    tag: "AI",
    status: "later" as const,
    icon: Sparkles,
    desc: "AI staffing suggestions, route optimization, and automated job assignment.",
  },
];

export default function TeamHqPage() {
  const { business } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("team_members")
        .select("id, full_name, email, role, is_active")
        .eq("business_id", business.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setMembers((data as TeamMember[]) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  const active = members.filter((m) => m.is_active);
  const counts = {
    total: active.length,
    admins: active.filter((m) => m.role === "admin").length,
    managers: active.filter((m) => m.role === "manager").length,
    cleaners: active.filter((m) => m.role === "technician").length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 md:p-8">
        <Badge className="bg-white/15 text-primary-foreground border-0 hover:bg-white/20">Team HQ</Badge>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold font-display">
          Your workforce control center
        </h1>
        <p className="mt-2 text-primary-foreground/85 max-w-2xl">
          People, schedules, time, performance, and payroll — one brain that runs every
          worker in your business.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="h-11">
            <Link to="/dashboard/team">
              <Users className="mr-2 h-4 w-4" /> Manage employees
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 bg-transparent text-primary-foreground border-white/30 hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/dashboard/team/schedule">
              <CalendarClock className="mr-2 h-4 w-4" /> View schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active team", value: counts.total, icon: Users },
          { label: "Admins", value: counts.admins, icon: Crown },
          { label: "Managers", value: counts.managers, icon: Shield },
          { label: "Cleaners", value: counts.cleaners, icon: Wrench },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-2xl font-bold mt-1">{loading ? "—" : s.value}</div>
                </div>
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap pillars */}
      <div>
        <h2 className="text-lg font-semibold mb-3">The 6 pillars</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {phases.map((p) => {
            const Icon = p.icon;
            const statusBadge =
              p.status === "live" ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Live</Badge>
              ) : p.status === "soon" ? (
                <Badge variant="secondary">Coming soon</Badge>
              ) : (
                <Badge variant="outline">Later</Badge>
              );
            return (
              <Card key={p.n} className={p.status === "live" ? "border-primary/30" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Phase {p.n} · {p.tag}
                        </div>
                        <CardTitle className="text-base">{p.title}</CardTitle>
                      </div>
                    </div>
                    {statusBadge}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">{p.desc}</CardDescription>
                  {p.status === "live" && p.href ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to={p.href}>
                        {p.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled>
                      In roadmap
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent team */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Your team</CardTitle>
            <CardDescription>Most recent employees in your workforce.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/team">All employees</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : active.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No employees yet.{" "}
              <Link to="/dashboard/team" className="text-primary underline">
                Add your first one
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-y">
              {active.slice(0, 6).map((m) => {
                const meta = roleMeta[m.role] ?? roleMeta.technician;
                const RIcon = meta.icon;
                return (
                  <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{m.full_name || m.email || "Unnamed"}</div>
                      {m.email && (
                        <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                      )}
                    </div>
                    <Badge variant="outline" className={meta.className}>
                      <RIcon className="h-3 w-3 mr-1" />
                      {meta.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
