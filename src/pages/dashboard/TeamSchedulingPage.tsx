import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  X,
  User,
  Briefcase,
} from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface Availability {
  id: string;
  team_member_id: string;
  date: string;
  type: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

interface Job {
  id: string;
  title: string;
  assigned_to: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
}

interface Conflict {
  member: TeamMember;
  job: Job;
  availability: Availability;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  time_off: { label: "Time Off", color: "bg-destructive/10 text-destructive border-destructive/20", bgColor: "bg-destructive/10" },
  available: { label: "Available", color: "bg-green-100 text-green-700 border-green-200", bgColor: "bg-green-50" },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-700 border-amber-200", bgColor: "bg-amber-50" },
};

export default function TeamSchedulingPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formMemberId, setFormMemberId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formType, setFormType] = useState("time_off");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formReason, setFormReason] = useState("");

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }),
  [weekStart]);

  const fetchData = useCallback(async () => {
    if (!business) return;
    setLoading(true);

    const startStr = weekDays[0].toISOString().split("T")[0];
    const endStr = weekDays[6].toISOString().split("T")[0];

    const [membersRes, availRes, jobsRes] = await Promise.all([
      supabase.from("team_members").select("id, full_name, role, is_active").eq("business_id", business.id).eq("is_active", true).order("full_name"),
      supabase.from("team_availability").select("*").eq("business_id", business.id).gte("date", startStr).lte("date", endStr),
      supabase.from("jobs").select("id, title, assigned_to, scheduled_start, scheduled_end, status")
        .eq("business_id", business.id)
        .not("status", "eq", "cancelled")
        .gte("scheduled_start", startStr)
        .lte("scheduled_start", endStr + "T23:59:59"),
    ]);

    setMembers((membersRes.data as TeamMember[]) || []);
    setAvailability((availRes.data as Availability[]) || []);
    setJobs((jobsRes.data as Job[]) || []);
    setLoading(false);
  }, [business, weekDays]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  // Get availability for a member on a date
  const getAvailability = (memberId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availability.filter((a) => a.team_member_id === memberId && a.date === dateStr);
  };

  // Get jobs for a member on a date
  const getJobsForMember = (memberName: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return jobs.filter((j) => j.assigned_to === memberName && j.scheduled_start?.startsWith(dateStr));
  };

  // Detect conflicts: jobs scheduled when member has time off
  const conflicts = useMemo<Conflict[]>(() => {
    const result: Conflict[] = [];
    const timeOffEntries = availability.filter((a) => a.type === "time_off");

    for (const entry of timeOffEntries) {
      const member = members.find((m) => m.id === entry.team_member_id);
      if (!member) continue;

      const memberJobs = jobs.filter(
        (j) => j.assigned_to === member.full_name && j.scheduled_start?.startsWith(entry.date)
      );

      for (const job of memberJobs) {
        // If time-off is all day, or overlaps with job time
        if (!entry.start_time || !entry.end_time) {
          result.push({ member, job, availability: entry });
        } else if (job.scheduled_start) {
          const jobHour = new Date(job.scheduled_start).getHours();
          const offStart = parseInt(entry.start_time.split(":")[0]);
          const offEnd = parseInt(entry.end_time.split(":")[0]);
          if (jobHour >= offStart && jobHour < offEnd) {
            result.push({ member, job, availability: entry });
          }
        }
      }
    }
    return result;
  }, [availability, jobs, members]);

  const handleAdd = async () => {
    if (!business || !formMemberId || !formDate) {
      toast({ title: "Missing fields", description: "Member and date are required.", variant: "destructive" });
      return;
    }

    const startDate = new Date(formDate);
    const endDate = formEndDate ? new Date(formEndDate) : startDate;
    const entries = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      entries.push({
        business_id: business.id,
        team_member_id: formMemberId,
        date: d.toISOString().split("T")[0],
        type: formType,
        start_time: formType === "partial" && formStartTime ? formStartTime : null,
        end_time: formType === "partial" && formEndTime ? formEndTime : null,
        reason: formReason.trim() || null,
      });
    }

    const { error } = await supabase.from("team_availability").upsert(entries, {
      onConflict: "team_member_id,date,type",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Availability updated", description: `${entries.length} day${entries.length > 1 ? "s" : ""} recorded.` });
      setShowAddForm(false);
      setFormMemberId(""); setFormDate(""); setFormEndDate(""); setFormType("time_off");
      setFormStartTime(""); setFormEndTime(""); setFormReason("");
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("team_availability").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Entry removed" });
      fetchData();
    }
  };

  const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Team Schedule</h1>
          <p className="text-sm text-muted-foreground">Manage technician availability, time-off, and detect scheduling conflicts.</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Availability
        </Button>
      </div>

      {/* Conflict Alerts */}
      {conflicts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-medium text-amber-800 text-sm">
                  {conflicts.length} Scheduling Conflict{conflicts.length > 1 ? "s" : ""} Detected
                </p>
                {conflicts.map((c, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    • <strong>{c.member.full_name}</strong> has "{c.job.title}" scheduled on {new Date(c.availability.date).toLocaleDateString()} but is marked as time off
                    {c.availability.reason && ` (${c.availability.reason})`}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[220px] text-center">{weekLabel}</h2>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
      </div>

      {/* Availability Heatmap */}
      {members.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Availability heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Booked hours vs team capacity ({members.length} tech · 8h/day)</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
              {weekDays.map((d, i) => {
                const capacity = members.length * 8;
                let booked = 0;
                members.forEach((m) => {
                  getJobsForMember(m.full_name, d).forEach((j) => {
                    if (j.scheduled_start && j.scheduled_end) {
                      booked += (new Date(j.scheduled_end).getTime() - new Date(j.scheduled_start).getTime()) / 3.6e6;
                    } else if (j.scheduled_start) {
                      booked += 1;
                    }
                  });
                });
                const pct = capacity > 0 ? Math.min(100, (booked / capacity) * 100) : 0;
                const tone =
                  pct >= 90 ? "bg-destructive/80 text-white" :
                  pct >= 70 ? "bg-amber-500/80 text-white" :
                  pct >= 30 ? "bg-emerald-500/70 text-white" :
                  pct > 0 ? "bg-emerald-500/30 text-emerald-900" :
                  "bg-muted text-muted-foreground";
                return (
                  <div key={i} className={`rounded-lg p-2 text-center ${tone}`}>
                    <div className="text-[10px] font-medium opacity-90">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    <div className="text-lg font-bold leading-tight">{booked.toFixed(1)}h</div>
                    <div className="text-[10px] opacity-80">{pct.toFixed(0)}% full</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Schedule Grid */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No active team members. Add team members in the Team page first.</p>
            </div>
          ) : (
            <div className="text-xs">
              {/* Header row */}
              <div className="grid border-b" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
                <div className="p-3 font-medium text-muted-foreground border-r">Team Member</div>
                {weekDays.map((d, i) => (
                  <div key={i} className={`text-center p-2 border-r last:border-r-0 font-medium ${isToday(d) ? "bg-primary/5" : ""}`}>
                    <div className="text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    <div className={`text-sm ${isToday(d) ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""}`}>
                      {d.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Member rows */}
              {members.map((member) => (
                <div key={member.id} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: "160px repeat(7, 1fr)" }}>
                  <div className="p-3 border-r flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{member.full_name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  {weekDays.map((d, di) => {
                    const dayAvail = getAvailability(member.id, d);
                    const dayJobs = getJobsForMember(member.full_name, d);
                    const hasTimeOff = dayAvail.some((a) => a.type === "time_off");
                    const hasConflict = conflicts.some(
                      (c) => c.member.id === member.id && c.availability.date === d.toISOString().split("T")[0]
                    );

                    return (
                      <div
                        key={di}
                        className={`min-h-[80px] p-1.5 border-r last:border-r-0 space-y-1 ${
                          hasTimeOff ? "bg-destructive/5" : isToday(d) ? "bg-primary/5" : ""
                        } ${hasConflict ? "ring-2 ring-inset ring-amber-400" : ""}`}
                      >
                        {/* Availability badges */}
                        {dayAvail.map((a) => {
                          const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.time_off;
                          return (
                            <div key={a.id} className="group relative">
                              <div className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${cfg.color}`}>
                                {cfg.label}
                                {a.start_time && a.end_time && (
                                  <span className="ml-1 opacity-70">
                                    {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                                  </span>
                                )}
                                {a.reason && <div className="text-[9px] opacity-70 truncate">{a.reason}</div>}
                              </div>
                              <button
                                onClick={() => handleDelete(a.id)}
                                className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[8px]"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Jobs */}
                        {dayJobs.map((j) => (
                          <div key={j.id} className="rounded px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary border border-primary/20">
                            <div className="flex items-center gap-0.5">
                              <Briefcase className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{j.title}</span>
                            </div>
                            {j.scheduled_start && (
                              <div className="text-[9px] opacity-70">
                                {new Date(j.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Availability Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Availability / Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Team Member</Label>
              <Select value={formMemberId} onValueChange={setFormMemberId}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name} ({m.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_off">Time Off (Unavailable)</SelectItem>
                  <SelectItem value="available">Available (Override)</SelectItem>
                  <SelectItem value="partial">Partial Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date (optional)</Label>
                <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
              </div>
            </div>
            {formType === "partial" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> From</Label>
                  <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> To</Label>
                  <Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <Label>Reason (optional)</Label>
              <Input value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="Vacation, doctor appointment, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
