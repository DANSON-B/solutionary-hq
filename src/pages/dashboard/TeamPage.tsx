import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus, Users, Shield, Wrench, Crown, MoreHorizontal, Trash2, Edit,
  Clock, Play, Square, TrendingUp, Star, DollarSign, Download,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type TeamRole = "admin" | "manager" | "technician";

interface TeamMember {
  id: string;
  business_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: TeamRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  pay_rate_cents: number | null;
  pay_type: string | null;
  hire_date: string | null;
  emergency_contact: string | null;
  notes: string | null;
}

interface TimeEntry {
  id: string;
  team_member_id: string;
  job_id: string | null;
  clock_in: string;
  clock_out: string | null;
  minutes: number | null;
  notes: string | null;
}

interface Job {
  id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_to: string | null;
  assigned_team_member_id: string | null;
  total: number | null;
  completed_at: string | null;
}

const roleConfig: Record<TeamRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Admin", icon: Crown, color: "bg-amber-100 text-amber-800 border-amber-200" },
  manager: { label: "Manager", icon: Shield, color: "bg-blue-100 text-blue-800 border-blue-200" },
  technician: { label: "Cleaner", icon: Wrench, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
};

const dollars = (cents: number | null | undefined) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(2)}`;

const fmtHours = (mins: number) => `${(mins / 60).toFixed(2)}h`;

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function TeamPage() {
  const { business, user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<{ rating: number; job_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [clockJobId, setClockJobId] = useState<Record<string, string>>({});
  const [conflictDialog, setConflictDialog] = useState<{
    jobId: string;
    memberId: string;
    conflicts: Job[];
    proposed: { id: string; newStart: Date; newEnd: Date; title: string }[];
  } | null>(null);

  const [invEmail, setInvEmail] = useState("");
  const [invName, setInvName] = useState("");
  const [invRole, setInvRole] = useState<TeamRole>("technician");
  const [invPhone, setInvPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!business) return;
    setLoading(true);
    const weekStart = startOfWeek();
    const [membersRes, entriesRes, jobsRes, reviewsRes] = await Promise.all([
      supabase.from("team_members").select("*").eq("business_id", business.id).order("created_at"),
      (supabase as any).from("time_entries").select("*").eq("business_id", business.id).gte("clock_in", weekStart.toISOString()).order("clock_in", { ascending: false }),
      supabase.from("jobs").select("id,title,status,scheduled_start,scheduled_end,assigned_to,assigned_team_member_id,total,completed_at").eq("business_id", business.id).order("scheduled_start", { ascending: false }).limit(500),
      supabase.from("reviews").select("rating,job_id").eq("business_id", business.id),
    ]);
    setMembers((membersRes.data as TeamMember[]) || []);
    setTimeEntries((entriesRes.data as TimeEntry[]) || []);
    setJobs((jobsRes.data as Job[]) || []);
    setReviews((reviewsRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [business?.id]);

  const handleInvite = async () => {
    if (!business || !user) return;
    if (!invEmail.trim() || !invName.trim()) {
      toast({ title: "Missing fields", description: "Email and name are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("team_members").insert({
        business_id: business.id,
        user_id: user.id,
        email: invEmail.trim().toLowerCase(),
        full_name: invName.trim(),
        role: invRole,
        phone: invPhone.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Employee added", description: `${invName} is now on your roster.` });
      setInviteOpen(false);
      setInvEmail(""); setInvName(""); setInvRole("technician"); setInvPhone("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (m: TeamMember) => {
    await supabase.from("team_members").update({ is_active: !m.is_active }).eq("id", m.id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("team_members").delete().eq("id", id);
    fetchData();
  };

  const handleUpdateMember = async () => {
    if (!editMember) return;
    setSubmitting(true);
    const { error } = await supabase.from("team_members").update({
      full_name: editMember.full_name,
      phone: editMember.phone,
      role: editMember.role,
      pay_rate_cents: editMember.pay_rate_cents,
      pay_type: editMember.pay_type,
      hire_date: editMember.hire_date,
      emergency_contact: editMember.emergency_contact,
      notes: editMember.notes,
    } as any).eq("id", editMember.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setEditMember(null); fetchData(); }
    setSubmitting(false);
  };

  // Time clock
  const openEntryFor = (memberId: string) =>
    timeEntries.find((e) => e.team_member_id === memberId && !e.clock_out);

  // Smart pick: member's currently-assigned job for today (closest to now),
  // else any job today already assigned to them, else first job they've worked on recently.
  const smartJobForMember = (memberId: string): Job | undefined => {
    const todays = jobs.filter(
      (j) =>
        j.scheduled_start &&
        new Date(j.scheduled_start) >= today &&
        new Date(j.scheduled_start) < tomorrow &&
        j.assigned_team_member_id === memberId,
    );
    if (todays.length) {
      const now = Date.now();
      return [...todays].sort(
        (a, b) =>
          Math.abs(new Date(a.scheduled_start!).getTime() - now) -
          Math.abs(new Date(b.scheduled_start!).getTime() - now),
      )[0];
    }
    return jobs.find((j) => j.assigned_team_member_id === memberId && j.status !== "completed");
  };

  // Conflict detection: jobs assigned to `memberId` whose scheduled window
  // overlaps the candidate job's window. Same-day check covers your spec;
  // overlap math also catches multi-hour spans crossing each other.
  const findConflicts = (memberId: string, candidate: Job, ignoreJobId?: string): Job[] => {
    if (!candidate.scheduled_start) return [];
    const cStart = new Date(candidate.scheduled_start).getTime();
    const cEnd = candidate.scheduled_end
      ? new Date(candidate.scheduled_end).getTime()
      : cStart + 60 * 60 * 1000; // assume 1h if no end
    const cDay = new Date(candidate.scheduled_start).toDateString();
    return jobs.filter((j) => {
      if (j.id === candidate.id || j.id === ignoreJobId) return false;
      if (j.assigned_team_member_id !== memberId) return false;
      if (!j.scheduled_start) return false;
      if (j.status === "completed" || j.status === "cancelled") return false;
      if (new Date(j.scheduled_start).toDateString() !== cDay) return false;
      const jStart = new Date(j.scheduled_start).getTime();
      const jEnd = j.scheduled_end ? new Date(j.scheduled_end).getTime() : jStart + 60 * 60 * 1000;
      return jStart < cEnd && jEnd > cStart;
    });
  };

  const formatJobTime = (j: Job) => {
    if (!j.scheduled_start) return "";
    const s = new Date(j.scheduled_start);
    const e = j.scheduled_end ? new Date(j.scheduled_end) : null;
    const t = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return e ? `${t(s)}–${t(e)}` : t(s);
  };

  const handleClockIn = async (memberId: string) => {
    if (!business) return;
    const chosenJobId = clockJobId[memberId] || smartJobForMember(memberId)?.id || null;
    const chosen = chosenJobId ? jobs.find((j) => j.id === chosenJobId) : null;

    // Smart link + conflict check: if a job is selected but not yet assigned
    // to anyone, assign it now — but block if it conflicts with another job.
    if (chosen && !chosen.assigned_team_member_id) {
      const conflicts = findConflicts(memberId, chosen);
      if (conflicts.length > 0) {
        toast({
          title: "Scheduling conflict",
          description: `${members.find((m) => m.id === memberId)?.full_name} is already on "${conflicts[0].title}" (${formatJobTime(conflicts[0])}). Reassign that job first.`,
          variant: "destructive",
        });
        return;
      }
      await supabase
        .from("jobs")
        .update({ assigned_team_member_id: memberId, assigned_to: memberId } as any)
        .eq("id", chosen.id);
    }

    const { error } = await (supabase as any).from("time_entries").insert({
      business_id: business.id,
      team_member_id: memberId,
      job_id: chosenJobId,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Clocked in", description: chosen ? `Linked to "${chosen.title}"` : "No job linked" });
      fetchData();
    }
  };

  const handleClockOut = async (entryId: string) => {
    const { error } = await (supabase as any).from("time_entries")
      .update({ clock_out: new Date().toISOString() }).eq("id", entryId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Clocked out" }); fetchData(); }
  };

  // --- Auto-reschedule helpers ---
  const DAY_END_HOUR = 22; // jobs must end by 10pm
  const NEXT_DAY_START_HOUR = 8;
  const jobDurationMs = (j: Job) => {
    if (j.scheduled_start && j.scheduled_end) {
      return Math.max(15 * 60 * 1000, new Date(j.scheduled_end).getTime() - new Date(j.scheduled_start).getTime());
    }
    return 60 * 60 * 1000;
  };

  // Find next slot of `durationMs` for memberId that doesn't overlap any job
  // assigned to them (excluding ignoreIds and treating `extraBusy` as taken).
  const findNextSlot = (
    memberId: string,
    durationMs: number,
    earliest: Date,
    ignoreIds: Set<string>,
    extraBusy: { start: number; end: number }[],
  ): Date => {
    const busy: { start: number; end: number }[] = jobs
      .filter(
        (j) =>
          j.assigned_team_member_id === memberId &&
          !ignoreIds.has(j.id) &&
          j.scheduled_start &&
          j.status !== "completed" &&
          j.status !== "cancelled",
      )
      .map((j) => ({
        start: new Date(j.scheduled_start!).getTime(),
        end: j.scheduled_end ? new Date(j.scheduled_end!).getTime() : new Date(j.scheduled_start!).getTime() + 60 * 60 * 1000,
      }))
      .concat(extraBusy)
      .sort((a, b) => a.start - b.start);

    let cursor = earliest.getTime();
    // Day window cap: don't run past DAY_END_HOUR — roll to next day at NEXT_DAY_START_HOUR.
    const dayCap = (t: number) => {
      const d = new Date(t);
      d.setHours(DAY_END_HOUR, 0, 0, 0);
      return d.getTime();
    };
    const rollNextDay = (t: number) => {
      const d = new Date(t);
      d.setDate(d.getDate() + 1);
      d.setHours(NEXT_DAY_START_HOUR, 0, 0, 0);
      return d.getTime();
    };

    // Up to 14 days lookahead to keep this bounded.
    for (let i = 0; i < 14; i++) {
      if (cursor + durationMs > dayCap(cursor)) {
        cursor = rollNextDay(cursor);
        continue;
      }
      let placed = true;
      for (const b of busy) {
        if (cursor < b.end && cursor + durationMs > b.start) {
          cursor = b.end;
          placed = false;
          break;
        }
      }
      if (placed) return new Date(cursor);
      if (cursor + durationMs > dayCap(cursor)) {
        cursor = rollNextDay(cursor);
      }
    }
    return new Date(cursor);
  };

  const buildReschedulePlan = (memberId: string, candidate: Job, conflicts: Job[]) => {
    // Candidate stays put; existing conflicting jobs get pushed.
    const ignore = new Set<string>([candidate.id, ...conflicts.map((c) => c.id)]);
    const taken: { start: number; end: number }[] = [
      {
        start: new Date(candidate.scheduled_start!).getTime(),
        end: candidate.scheduled_end
          ? new Date(candidate.scheduled_end!).getTime()
          : new Date(candidate.scheduled_start!).getTime() + 60 * 60 * 1000,
      },
    ];
    // Sort conflicts by current start to keep order stable.
    const ordered = [...conflicts].sort(
      (a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime(),
    );
    const proposed: { id: string; newStart: Date; newEnd: Date; title: string }[] = [];
    for (const c of ordered) {
      const dur = jobDurationMs(c);
      // Earliest = candidate end (push after the kept job).
      const earliest = new Date(Math.max(taken[0].end, Date.now()));
      const newStart = findNextSlot(memberId, dur, earliest, ignore, taken);
      const newEnd = new Date(newStart.getTime() + dur);
      proposed.push({ id: c.id, newStart, newEnd, title: c.title });
      taken.push({ start: newStart.getTime(), end: newEnd.getTime() });
    }
    return proposed;
  };

  const persistAssignment = async (jobId: string, memberId: string | null) => {
    const { error } = await supabase
      .from("jobs")
      .update({ assigned_team_member_id: memberId, assigned_to: memberId } as any)
      .eq("id", jobId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAssignJob = async (jobId: string, memberId: string | null) => {
    if (!memberId) {
      if (await persistAssignment(jobId, null)) {
        toast({ title: "Job unassigned" });
        fetchData();
      }
      return;
    }
    const candidate = jobs.find((j) => j.id === jobId);
    if (!candidate) return;
    const conflicts = findConflicts(memberId, candidate, jobId);
    if (conflicts.length === 0) {
      if (await persistAssignment(jobId, memberId)) {
        toast({ title: "Job assigned" });
        fetchData();
      }
      return;
    }
    // Build proposal and open dialog.
    const proposed = buildReschedulePlan(memberId, candidate, conflicts);
    setConflictDialog({ jobId, memberId, conflicts, proposed });
  };

  const confirmAssignAnyway = async () => {
    if (!conflictDialog) return;
    const { jobId, memberId } = conflictDialog;
    if (await persistAssignment(jobId, memberId)) {
      toast({ title: "Assigned with double-book", variant: "destructive" });
      setConflictDialog(null);
      fetchData();
    }
  };

  const confirmReschedule = async () => {
    if (!conflictDialog) return;
    const { jobId, memberId, proposed } = conflictDialog;
    // Move each conflicting job first, then assign.
    for (const p of proposed) {
      const { error } = await supabase
        .from("jobs")
        .update({
          scheduled_start: p.newStart.toISOString(),
          scheduled_end: p.newEnd.toISOString(),
        } as any)
        .eq("id", p.id);
      if (error) {
        toast({ title: "Reschedule failed", description: error.message, variant: "destructive" });
        return;
      }
    }
    if (await persistAssignment(jobId, memberId)) {
      toast({
        title: "Conflicts rescheduled",
        description: `${proposed.length} job${proposed.length > 1 ? "s" : ""} moved to the next available slot.`,
      });
      setConflictDialog(null);
      fetchData();
    }
  };

  // Derived
  const activeMembers = members.filter((m) => m.is_active);
  const inactiveMembers = members.filter((m) => !m.is_active);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const workingToday = jobs.filter((j) => j.scheduled_start && new Date(j.scheduled_start) >= today && new Date(j.scheduled_start) < tomorrow);


  const minutesByMember = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of timeEntries) {
      if (e.minutes) map[e.team_member_id] = (map[e.team_member_id] || 0) + e.minutes;
    }
    return map;
  }, [timeEntries]);

  // Performance per member — prefer the new FK, fall back to legacy text field.
  const perf = useMemo(() => {
    const map: Record<string, { jobs: number; revenue: number; ratingSum: number; ratingCount: number }> = {};
    const jobToMember = new Map<string, string>();
    for (const j of jobs) {
      const target =
        activeMembers.find((m) => m.id === j.assigned_team_member_id) ||
        activeMembers.find((m) => m.id === j.assigned_to || m.full_name === j.assigned_to);
      if (!target) continue;
      jobToMember.set(j.id, target.id);
      if (j.status === "completed") {
        if (!map[target.id]) map[target.id] = { jobs: 0, revenue: 0, ratingSum: 0, ratingCount: 0 };
        map[target.id].jobs += 1;
        map[target.id].revenue += Number(j.total || 0);
      }
    }
    for (const r of reviews) {
      const mid = r.job_id ? jobToMember.get(r.job_id) : undefined;
      if (!mid) continue;
      if (!map[mid]) map[mid] = { jobs: 0, revenue: 0, ratingSum: 0, ratingCount: 0 };
      map[mid].ratingSum += r.rating;
      map[mid].ratingCount += 1;
    }
    return map;
  }, [jobs, reviews, activeMembers]);

  // Payroll (this week)
  const payroll = activeMembers.map((m) => {
    const mins = minutesByMember[m.id] || 0;
    const hours = mins / 60;
    const reg = Math.min(hours, 40);
    const ot = Math.max(0, hours - 40);
    const rate = (m.pay_rate_cents || 0) / 100;
    const otRate = rate * 1.5;
    const gross = m.pay_type === "salary" ? rate : reg * rate + ot * otRate;
    return { member: m, hours, reg, ot, rate, gross };
  });

  const exportPayrollCsv = () => {
    const rows = [
      ["Name", "Role", "Pay Type", "Rate", "Hours", "Regular", "Overtime", "Gross Pay"],
      ...payroll.map((p) => [
        p.member.full_name,
        roleConfig[p.member.role].label,
        p.member.pay_type || "hourly",
        p.rate.toFixed(2),
        p.hours.toFixed(2),
        p.reg.toFixed(2),
        p.ot.toFixed(2),
        p.gross.toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [savingPeriod, setSavingPeriod] = useState(false);
  const savePayrollPeriod = async () => {
    if (!business) return;
    if (payroll.length === 0) { toast({ title: "No employees to save", variant: "destructive" }); return; }
    setSavingPeriod(true);
    const wkStart = startOfWeek();
    const wkEnd = new Date(wkStart); wkEnd.setDate(wkEnd.getDate() + 6);
    const totalCents = Math.round(totalPayroll * 100);
    const { data: period, error: pErr } = await (supabase as any)
      .from("payroll_periods")
      .insert({
        business_id: business.id,
        period_start: wkStart.toISOString().slice(0, 10),
        period_end: wkEnd.toISOString().slice(0, 10),
        status: "draft",
        total_cents: totalCents,
      })
      .select()
      .single();
    if (pErr || !period) {
      toast({ title: "Save failed", description: pErr?.message, variant: "destructive" });
      setSavingPeriod(false); return;
    }
    const lines = payroll.map((p) => ({
      period_id: period.id,
      business_id: business.id,
      team_member_id: p.member.id,
      hours_worked: Number(p.hours.toFixed(2)),
      hourly_pay_cents: Math.round(p.gross * 100),
      total_cents: Math.round(p.gross * 100),
    }));
    if (lines.length) await (supabase as any).from("payroll_line_items").insert(lines);
    toast({ title: "Payroll period saved as draft" });
    setSavingPeriod(false);
    loadPeriods();
  };

  const [periods, setPeriods] = useState<any[]>([]);
  const loadPeriods = useCallback(async () => {
    if (!business) return;
    const { data } = await (supabase as any)
      .from("payroll_periods")
      .select("*")
      .eq("business_id", business.id)
      .order("period_start", { ascending: false })
      .limit(12);
    setPeriods(data || []);
  }, [business]);
  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const markPeriodPaid = async (id: string) => {
    await (supabase as any).from("payroll_periods").update({ status: "paid" }).eq("id", id);
    loadPeriods();
  };

  const totalPayroll = payroll.reduce((s, p) => s + p.gross, 0);
  const totalHoursWeek = payroll.reduce((s, p) => s + p.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Manager</h1>
          <p className="text-muted-foreground">Roster, time clock, performance, and payroll — all in one place.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="h-11">
          <UserPlus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Active team</div><div className="text-2xl font-bold mt-1">{activeMembers.length}</div></div><Users className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Working today</div><div className="text-2xl font-bold mt-1">{workingToday.length}</div></div><Clock className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Hours this week</div><div className="text-2xl font-bold mt-1">{totalHoursWeek.toFixed(1)}</div></div><TrendingUp className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs text-muted-foreground">Payroll (week)</div><div className="text-2xl font-bold mt-1">${totalPayroll.toFixed(0)}</div></div><DollarSign className="h-5 w-5 text-muted-foreground" /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-flex">
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="time">Time Clock</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* ROSTER */}
        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Employees</CardTitle><CardDescription>Profiles, roles, pay rate, and hire date.</CardDescription></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground py-8 text-center">Loading…</p> :
                activeMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">No employees yet. Add your first one to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Name</TableHead><TableHead>Role</TableHead>
                      <TableHead>Pay</TableHead><TableHead>Hired</TableHead>
                      <TableHead>Contact</TableHead><TableHead className="w-12"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {activeMembers.map((m) => {
                        const rc = roleConfig[m.role];
                        return (
                          <TableRow key={m.id}>
                            <TableCell><div className="font-medium">{m.full_name}</div><div className="text-xs text-muted-foreground">{m.email}</div></TableCell>
                            <TableCell><Badge variant="outline" className={rc.color}><rc.icon className="h-3 w-3 mr-1" />{rc.label}</Badge></TableCell>
                            <TableCell>{m.pay_rate_cents ? <span>{dollars(m.pay_rate_cents)}<span className="text-xs text-muted-foreground">/{m.pay_type === "salary" ? "wk" : "hr"}</span></span> : <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-muted-foreground">{m.hire_date ? new Date(m.hire_date).toLocaleDateString() : "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{m.phone || "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 md:h-8 md:w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditMember(m)}><Edit className="h-4 w-4 mr-2" />Edit profile</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(m)}>Deactivate</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(m.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Remove</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>

          {inactiveMembers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Inactive</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {inactiveMembers.map((m) => (
                      <TableRow key={m.id} className="opacity-60">
                        <TableCell>{m.full_name}<div className="text-xs text-muted-foreground">{m.email}</div></TableCell>
                        <TableCell><Badge variant="outline">{roleConfig[m.role].label}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => handleToggleActive(m)}>Reactivate</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TIME CLOCK */}
        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Clock in / out</CardTitle><CardDescription>Smart-linked to the employee's assigned job for today.</CardDescription></CardHeader>
            <CardContent>
              {activeMembers.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Add employees first to start tracking time.</p>
              ) : (
                <div className="space-y-3">
                  {activeMembers.map((m) => {
                    const open = openEntryFor(m.id);
                    const smart = smartJobForMember(m.id);
                    const effectiveJobId = clockJobId[m.id] ?? smart?.id ?? "";
                    const openJob = open?.job_id ? jobs.find((j) => j.id === open.job_id) : null;
                    const minsToday = timeEntries
                      .filter((e) => e.team_member_id === m.id && new Date(e.clock_in) >= today)
                      .reduce((s, e) => s + (e.minutes || (e.clock_out ? 0 : Math.floor((Date.now() - new Date(e.clock_in).getTime()) / 60000))), 0);
                    return (
                      <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-2.5 w-2.5 rounded-full ${open ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{m.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {open ? `On the clock since ${new Date(open.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Off the clock"}
                              {minsToday > 0 && ` · ${fmtHours(minsToday)} today`}
                            </div>
                            {open && openJob && (
                              <div className="text-xs text-primary mt-0.5">Linked to: {openJob.title}</div>
                            )}
                            {!open && smart && !clockJobId[m.id] && (
                              <div className="text-xs text-primary mt-0.5">Auto-link: {smart.title}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!open && (
                            <Select value={effectiveJobId} onValueChange={(v) => setClockJobId({ ...clockJobId, [m.id]: v })}>
                              <SelectTrigger className="h-10 w-44"><SelectValue placeholder="Tag a job (optional)" /></SelectTrigger>
                              <SelectContent>
                                {workingToday.length === 0 && <div className="p-2 text-xs text-muted-foreground">No jobs scheduled today</div>}
                                {workingToday.map((j) => {
                                  const assignee = j.assigned_team_member_id ? members.find((mm) => mm.id === j.assigned_team_member_id) : null;
                                  return (
                                    <SelectItem key={j.id} value={j.id}>
                                      {j.title}{assignee ? ` · ${assignee.full_name}` : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                          {open ? (
                            <Button onClick={() => handleClockOut(open.id)} variant="destructive" className="h-10"><Square className="h-4 w-4 mr-2" />Clock out</Button>
                          ) : (
                            <Button onClick={() => handleClockIn(m.id)} className="h-10"><Play className="h-4 w-4 mr-2" />Clock in</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's smart assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's assignments</CardTitle>
              <CardDescription>Assign each scheduled job to an employee — clock-in will auto-link.</CardDescription>
            </CardHeader>
            <CardContent>
              {workingToday.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No jobs scheduled for today.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Time</TableHead><TableHead>Job</TableHead><TableHead>Assigned to</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {[...workingToday].sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime()).map((j) => {
                      const conflicts = j.assigned_team_member_id ? findConflicts(j.assigned_team_member_id, j, j.id) : [];
                      const hasConflict = conflicts.length > 0;
                      return (
                        <TableRow key={j.id} className={hasConflict ? "bg-destructive/5" : ""}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{formatJobTime(j)}</TableCell>
                          <TableCell>{j.title}</TableCell>
                          <TableCell>
                            <Select value={j.assigned_team_member_id || "__none"} onValueChange={(v) => handleAssignJob(j.id, v === "__none" ? null : v)}>
                              <SelectTrigger className={`h-9 w-48 ${hasConflict ? "border-destructive text-destructive" : ""}`}><SelectValue placeholder="Unassigned" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none">Unassigned</SelectItem>
                                {activeMembers.map((m) => {
                                  const wouldConflict = findConflicts(m.id, j, j.id).length > 0;
                                  return (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.full_name}{wouldConflict ? " ⚠ conflict" : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {hasConflict ? (
                              <Badge variant="destructive" className="whitespace-normal text-left">
                                Conflicts with {conflicts.map((c) => `"${c.title}"`).join(", ")}
                              </Badge>
                            ) : j.assigned_team_member_id ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">OK</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

              )}
            </CardContent>
          </Card>


          <Card>
            <CardHeader><CardTitle className="text-base">This week's timesheet</CardTitle></CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No time entries yet this week.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Job</TableHead>
                    <TableHead>In</TableHead><TableHead>Out</TableHead><TableHead>Hours</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {timeEntries.map((e) => {
                      const m = members.find((x) => x.id === e.team_member_id);
                      const j = jobs.find((x) => x.id === e.job_id);
                      return (
                        <TableRow key={e.id}>
                          <TableCell>{m?.full_name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{j?.title || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(e.clock_in).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</TableCell>
                          <TableCell className="text-muted-foreground">{e.clock_out ? new Date(e.clock_out).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : <Badge variant="secondary">Open</Badge>}</TableCell>
                          <TableCell className="font-medium">{e.minutes ? fmtHours(e.minutes) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Employee scoreboard</CardTitle><CardDescription>Completed jobs, revenue generated, and average rating per employee.</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Jobs done</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg rating</TableHead>
                  <TableHead>Hours (week)</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {activeMembers.map((m) => {
                    const p = perf[m.id];
                    const avg = p && p.ratingCount ? p.ratingSum / p.ratingCount : null;
                    return (
                      <TableRow key={m.id}>
                        <TableCell><div className="font-medium">{m.full_name}</div><div className="text-xs text-muted-foreground">{roleConfig[m.role].label}</div></TableCell>
                        <TableCell>{p?.jobs || 0}</TableCell>
                        <TableCell>${(p?.revenue || 0).toFixed(2)}</TableCell>
                        <TableCell>{avg != null ? (<span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />{avg.toFixed(1)}<span className="text-xs text-muted-foreground">({p!.ratingCount})</span></span>) : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{fmtHours(minutesByMember[m.id] || 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {activeMembers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No employees yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">Jobs are matched to employees via the job's <em>assigned to</em> field (employee ID or name).</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYROLL */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Weekly payroll</CardTitle>
                <CardDescription>Hours × rate, with overtime calculated above 40h/week (1.5×).</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={exportPayrollCsv} className="h-10"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
                <Button onClick={savePayrollPeriod} disabled={savingPeriod} className="h-10">
                  {savingPeriod ? "Saving..." : "Save as period"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Employee</TableHead><TableHead>Rate</TableHead>
                  <TableHead>Hours</TableHead><TableHead>Regular</TableHead>
                  <TableHead>Overtime</TableHead><TableHead className="text-right">Gross</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payroll.map((p) => (
                    <TableRow key={p.member.id}>
                      <TableCell><div className="font-medium">{p.member.full_name}</div><div className="text-xs text-muted-foreground">{p.member.pay_type || "hourly"}</div></TableCell>
                      <TableCell>{p.rate ? `$${p.rate.toFixed(2)}` : <span className="text-muted-foreground">Not set</span>}</TableCell>
                      <TableCell>{p.hours.toFixed(2)}</TableCell>
                      <TableCell>{p.reg.toFixed(2)}</TableCell>
                      <TableCell>{p.ot > 0 ? <span className="text-amber-600 font-medium">{p.ot.toFixed(2)}</span> : "0.00"}</TableCell>
                      <TableCell className="text-right font-semibold">${p.gross.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {payroll.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No employees yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total weekly payroll</div>
                  <div className="text-2xl font-bold">${totalPayroll.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll history</CardTitle>
              <CardDescription>Saved pay periods. Mark as paid when disbursed.</CardDescription>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No periods saved yet.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Period</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {periods.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.period_start} → {p.period_end}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">${(p.total_cents / 100).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {p.status !== "paid" && (
                            <Button size="sm" variant="outline" onClick={() => markPeriodPaid(p.id)} className="h-9">Mark paid</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Add Employee */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Add a new worker to your roster.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full name *</Label><Input value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="John Smith" /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="john@example.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={invRole} onValueChange={(v) => setInvRole(v as TeamRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Cleaner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Phone</Label><Input value={invPhone} onChange={(e) => setInvPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={submitting}>{submitting ? "Adding…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee */}
      <Dialog open={!!editMember} onOpenChange={(o) => !o && setEditMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle><DialogDescription>Profile, pay, and HR details.</DialogDescription></DialogHeader>
          {editMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full name</Label><Input value={editMember.full_name} onChange={(e) => setEditMember({ ...editMember, full_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={editMember.phone || ""} onChange={(e) => setEditMember({ ...editMember, phone: e.target.value || null })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={editMember.role} onValueChange={(v) => setEditMember({ ...editMember, role: v as TeamRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Cleaner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pay type</Label>
                  <Select value={editMember.pay_type || "hourly"} onValueChange={(v) => setEditMember({ ...editMember, pay_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="salary">Salary (weekly)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pay rate ({editMember.pay_type === "salary" ? "$/week" : "$/hour"})</Label>
                  <Input type="number" step="0.01" value={editMember.pay_rate_cents != null ? (editMember.pay_rate_cents / 100).toString() : ""} onChange={(e) => setEditMember({ ...editMember, pay_rate_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Hire date</Label>
                  <Input type="date" value={editMember.hire_date || ""} onChange={(e) => setEditMember({ ...editMember, hire_date: e.target.value || null })} />
                </div>
              </div>
              <div className="space-y-2"><Label>Emergency contact</Label><Input value={editMember.emergency_contact || ""} onChange={(e) => setEditMember({ ...editMember, emergency_contact: e.target.value || null })} placeholder="Name and phone" /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea rows={3} value={editMember.notes || ""} onChange={(e) => setEditMember({ ...editMember, notes: e.target.value || null })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button onClick={handleUpdateMember} disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict resolution */}
      <AlertDialog open={!!conflictDialog} onOpenChange={(o) => !o && setConflictDialog(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Scheduling conflict</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {members.find((m) => m.id === conflictDialog?.memberId)?.full_name} is already
                  assigned to {conflictDialog?.conflicts.length} overlapping job
                  {conflictDialog && conflictDialog.conflicts.length > 1 ? "s" : ""}.
                </p>
                <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                  <div className="font-medium text-foreground">Proposed reschedule</div>
                  {conflictDialog?.proposed.map((p) => {
                    const original = conflictDialog.conflicts.find((c) => c.id === p.id);
                    return (
                      <div key={p.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{p.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {original ? formatJobTime(original) : ""} →{" "}
                            <span className="text-foreground">
                              {p.newStart.toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" – "}
                              {p.newEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rescheduling moves the existing jobs to the next free slot for this employee (within 8am–10pm, rolling to the next day if needed). The new assignment keeps its original time.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={confirmAssignAnyway}>
              Assign anyway (double-book)
            </Button>
            <AlertDialogAction onClick={confirmReschedule}>
              Reschedule conflicts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
}
