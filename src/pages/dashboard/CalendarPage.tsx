import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, GripVertical } from "lucide-react";

function conflictToast(error: { message?: string } | null): { title: string; description: string; variant: "destructive" } {
  const msg = error?.message || "";
  if (msg.toLowerCase().includes("scheduling conflict")) {
    return { title: "Scheduling conflict", description: "This technician is already booked during that time. Pick another slot or assign a different team member.", variant: "destructive" };
  }
  return { title: "Something went wrong", description: msg || "Please try again.", variant: "destructive" };
}

type ViewMode = "month" | "week" | "day";

interface Job {
  id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_to: string | null;
  address: string | null;
  customer_id: string;
  customers?: { first_name: string; last_name: string };
}

interface Customer { id: string; first_name: string; last_name: string; }
interface TeamMember { id: string; full_name: string; role: string; }

export default function CalendarPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const dragJobRef = useRef<Job | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const fetchData = useCallback(async () => {
    if (!business) return;
    const [jobsRes, custRes, teamRes] = await Promise.all([
      supabase.from("jobs").select("*, customers(first_name, last_name)").eq("business_id", business.id).not("status", "eq", "cancelled").order("scheduled_start"),
      supabase.from("customers").select("id, first_name, last_name").eq("business_id", business.id).order("first_name"),
      supabase.from("team_members").select("id, full_name, role").eq("business_id", business.id).eq("is_active", true).order("full_name"),
    ]);
    setJobs((jobsRes.data as Job[]) || []);
    setCustomers(custRes.data || []);
    setTeamMembers((teamRes.data as TeamMember[]) || []);
  }, [business]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const getJobsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return jobs.filter((j) => j.scheduled_start?.startsWith(dateStr));
  };

  const statusColor: Record<string, string> = {
    scheduled: "bg-primary/15 text-primary border-primary/30",
    in_progress: "bg-accent/20 text-accent-foreground border-accent/40",
    completed: "bg-green-100 text-green-700 border-green-300",
  };

  const toLocalDatetime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openNewJob = (date?: Date) => {
    setIsNew(true); setSelectedJob(null);
    setFormTitle(""); setFormCustomerId("");
    setFormStart(date ? toLocalDatetime(date) : "");
    setFormEnd(""); setFormAssignedTo(""); setFormAddress("");
    setShowModal(true);
  };

  const openEditJob = (job: Job) => {
    setIsNew(false); setSelectedJob(job);
    setFormTitle(job.title); setFormCustomerId(job.customer_id);
    setFormStart(job.scheduled_start ? toLocalDatetime(new Date(job.scheduled_start)) : "");
    setFormEnd(job.scheduled_end ? toLocalDatetime(new Date(job.scheduled_end)) : "");
    setFormAssignedTo(job.assigned_to || ""); setFormAddress(job.address || "");
    setShowModal(true);
  };

  const saveJob = async () => {
    if (!business || !formTitle || !formCustomerId) {
      toast({ title: "Missing fields", description: "Title and customer are required.", variant: "destructive" });
      return;
    }
    const payload: any = {
      title: formTitle, customer_id: formCustomerId, business_id: business.id,
      scheduled_start: formStart || null, scheduled_end: formEnd || null,
      assigned_to: formAssignedTo || null, address: formAddress || null,
    };
    if (isNew) {
      payload.status = "scheduled";
      const { error } = await supabase.from("jobs").insert(payload);
      if (error) { toast(conflictToast(error)); return; }
      toast({ title: "Job scheduled!" });
    } else if (selectedJob) {
      const { error } = await supabase.from("jobs").update(payload).eq("id", selectedJob.id);
      if (error) { toast(conflictToast(error)); return; }
      toast({ title: "Job updated!" });
    }
    setShowModal(false);
    fetchData();
  };

  // ─── Drag & Drop ───
  const onDragStart = (e: React.DragEvent, job: Job) => {
    dragJobRef.current = job;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", job.id);
    // Make the dragged element semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      setTimeout(() => e.currentTarget.classList.add("opacity-40"), 0);
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    dragJobRef.current = null;
    setDragOverCell(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("opacity-40");
    }
  };

  const onDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(cellKey);
  };

  const onDragLeave = () => {
    setDragOverCell(null);
  };

  const onDrop = async (e: React.DragEvent, targetDate: Date, targetHour?: number) => {
    e.preventDefault();
    setDragOverCell(null);
    const job = dragJobRef.current;
    if (!job) return;

    const newStart = new Date(targetDate);
    if (targetHour != null) {
      newStart.setHours(targetHour, 0, 0, 0);
    } else {
      // Month view: keep the original time, change the date
      if (job.scheduled_start) {
        const orig = new Date(job.scheduled_start);
        newStart.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
      } else {
        newStart.setHours(9, 0, 0, 0);
      }
    }

    // Calculate duration to shift end time
    let newEnd: Date | null = null;
    if (job.scheduled_start && job.scheduled_end) {
      const duration = new Date(job.scheduled_end).getTime() - new Date(job.scheduled_start).getTime();
      newEnd = new Date(newStart.getTime() + duration);
    }

    // Optimistic update
    setJobs((prev) => prev.map((j) =>
      j.id === job.id
        ? { ...j, scheduled_start: newStart.toISOString(), scheduled_end: newEnd?.toISOString() ?? j.scheduled_end }
        : j
    ));

    const { error } = await supabase.from("jobs").update({
      scheduled_start: newStart.toISOString(),
      scheduled_end: newEnd?.toISOString() ?? null,
    }).eq("id", job.id);

    if (error) {
      toast(conflictToast(error));
      fetchData(); // revert
    } else {
      toast({ title: "Job rescheduled", description: `${job.title} moved to ${newStart.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}${targetHour != null ? ` at ${newStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}` });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  // ─── Job Chip (draggable) ───
  const JobChip = ({ job, compact = false }: { job: Job; compact?: boolean }) => (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.stopPropagation(); openEditJob(job); }}
      className={`group text-[11px] leading-tight px-1.5 py-0.5 rounded border truncate cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity ${statusColor[job.status] || "bg-muted"}`}
    >
      <div className="flex items-center gap-0.5">
        <GripVertical className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
        <span className="truncate">
          {!compact && job.scheduled_start && (
            <span className="font-medium">{new Date(job.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} </span>
          )}
          {job.title}
        </span>
      </div>
      {!compact && job.assigned_to && <div className="text-[10px] opacity-70 pl-3.5">{job.assigned_to}</div>}
    </div>
  );

  // ─── MONTH VIEW ───
  const renderMonth = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`e-${i}`} className="min-h-[100px] border-r border-b bg-muted/20" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayJobs = getJobsForDate(date);
      const cellKey = `month-${day}`;
      const isOver = dragOverCell === cellKey;
      cells.push(
        <div
          key={day}
          className={`min-h-[100px] border-r border-b p-1.5 cursor-pointer transition-colors ${isToday(date) ? "bg-primary/5" : ""} ${isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : "hover:bg-muted/30"}`}
          onClick={() => openNewJob(date)}
          onDragOver={(e) => onDragOver(e, cellKey)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, date)}
        >
          <span className={`text-xs font-medium ${isToday(date) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : "text-muted-foreground"}`}>
            {day}
          </span>
          <div className="mt-1 space-y-0.5">
            {dayJobs.slice(0, 3).map((j) => (
              <JobChip key={j.id} job={j} />
            ))}
            {dayJobs.length > 3 && <span className="text-[10px] text-muted-foreground pl-1">+{dayJobs.length - 3} more</span>}
          </div>
        </div>
      );
    }
    return cells;
  };

  // ─── WEEK VIEW ───
  const hours = Array.from({ length: 14 }, (_, i) => i + 6);
  const halfHours = hours.flatMap((h) => [{ hour: h, min: 0 }, { hour: h, min: 30 }]);

  const renderWeek = () => (
    <div className="grid grid-cols-[60px_repeat(7,1fr)] text-xs">
      <div className="border-b border-r" />
      {weekDays.map((d, i) => (
        <div key={i} className={`text-center border-b border-r py-2 font-medium ${isToday(d) ? "bg-primary/5" : ""}`}>
          <div className="text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
          <div className={`text-sm ${isToday(d) ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""}`}>
            {d.getDate()}
          </div>
        </div>
      ))}
      {hours.map((h) => (
        <div key={h} className="contents">
          <div className="border-r border-b text-right pr-2 py-3 text-muted-foreground">
            {h > 12 ? h - 12 : h}{h >= 12 ? "pm" : "am"}
          </div>
          {weekDays.map((d, di) => {
            const cellKey = `week-${di}-${h}`;
            const isOver = dragOverCell === cellKey;
            const cellJobs = jobs.filter((j) => {
              if (!j.scheduled_start) return false;
              const jDate = new Date(j.scheduled_start);
              return jDate.toDateString() === d.toDateString() && jDate.getHours() === h;
            });
            return (
              <div
                key={di}
                className={`border-r border-b min-h-[48px] p-0.5 cursor-pointer transition-colors ${isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : "hover:bg-muted/20"}`}
                onClick={() => {
                  const nd = new Date(d);
                  nd.setHours(h, 0, 0, 0);
                  openNewJob(nd);
                }}
                onDragOver={(e) => onDragOver(e, cellKey)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, d, h)}
              >
                {cellJobs.map((j) => (
                  <div key={j.id} className="mb-0.5">
                    <JobChip job={j} compact />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  // ─── DAY VIEW ───
  const dayJobs = useMemo(() => {
    const dateStr = currentDate.toISOString().split("T")[0];
    return jobs.filter((j) => j.scheduled_start?.startsWith(dateStr));
  }, [jobs, currentDate]);

  const getJobDuration = (job: Job) => {
    if (job.scheduled_start && job.scheduled_end) {
      return (new Date(job.scheduled_end).getTime() - new Date(job.scheduled_start).getTime()) / (1000 * 60);
    }
    return 60;
  };

  const renderDay = () => (
    <div className="grid grid-cols-[60px_1fr] text-xs">
      <div className="border-b border-r py-2 text-center font-medium text-muted-foreground text-[10px]">Time</div>
      <div className={`border-b py-2 px-3 font-medium ${isToday(currentDate) ? "bg-primary/5" : ""}`}>
        <span className={`text-sm ${isToday(currentDate) ? "bg-primary text-primary-foreground rounded-full px-2 py-0.5" : ""}`}>
          {currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </span>
        <span className="ml-2 text-muted-foreground">{dayJobs.length} job{dayJobs.length !== 1 ? "s" : ""}</span>
      </div>
      {halfHours.map(({ hour: h, min: m }) => {
        const cellKey = `day-${h}-${m}`;
        const isOver = dragOverCell === cellKey;
        const isHalfHour = m === 30;
        const cellJobs = jobs.filter((j) => {
          if (!j.scheduled_start) return false;
          const jDate = new Date(j.scheduled_start);
          return jDate.toDateString() === currentDate.toDateString() && jDate.getHours() === h && (isHalfHour ? jDate.getMinutes() >= 30 : jDate.getMinutes() < 30);
        });
        const timeLabel = isHalfHour ? "" : `${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"}`;
        return (
          <div key={cellKey} className="contents">
            <div className={`border-r text-right pr-2 py-1 text-muted-foreground ${isHalfHour ? "border-b border-dashed" : "border-b"}`}>
              {timeLabel}
            </div>
            <div
              className={`min-h-[52px] p-1 cursor-pointer transition-colors ${isHalfHour ? "border-b border-dashed" : "border-b"} ${isOver ? "bg-primary/10 ring-2 ring-inset ring-primary/30" : "hover:bg-muted/20"}`}
              onClick={() => {
                const nd = new Date(currentDate);
                nd.setHours(h, m, 0, 0);
                openNewJob(nd);
              }}
              onDragOver={(e) => onDragOver(e, cellKey)}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCell(null);
                const job = dragJobRef.current;
                if (!job) return;
                const newStart = new Date(currentDate);
                newStart.setHours(h, m, 0, 0);
                let newEnd: Date | null = null;
                if (job.scheduled_start && job.scheduled_end) {
                  const duration = new Date(job.scheduled_end).getTime() - new Date(job.scheduled_start).getTime();
                  newEnd = new Date(newStart.getTime() + duration);
                }
                setJobs((prev) => prev.map((j) =>
                  j.id === job.id ? { ...j, scheduled_start: newStart.toISOString(), scheduled_end: newEnd?.toISOString() ?? j.scheduled_end } : j
                ));
                supabase.from("jobs").update({
                  scheduled_start: newStart.toISOString(),
                  scheduled_end: newEnd?.toISOString() ?? null,
                }).eq("id", job.id).then(({ error }) => {
                  if (error) { toast(conflictToast(error)); fetchData(); }
                  else { toast({ title: "Job rescheduled", description: `${job.title} moved to ${newStart.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` }); }
                });
              }}
            >
              {cellJobs.map((j) => {
                const dur = getJobDuration(j);
                const startTime = j.scheduled_start ? new Date(j.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
                const endTime = j.scheduled_end ? new Date(j.scheduled_end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
                const customerName = j.customers ? `${j.customers.first_name} ${j.customers.last_name}` : "";
                return (
                  <div
                    key={j.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, j)}
                    onDragEnd={onDragEnd}
                    onClick={(e) => { e.stopPropagation(); openEditJob(j); }}
                    className={`group rounded-md border p-2 mb-1 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${statusColor[j.status] || "bg-muted"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                          <span className="font-semibold text-sm truncate">{j.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] opacity-80">
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{startTime}{endTime ? ` – ${endTime}` : ""}</span>
                          <span className="text-muted-foreground">({dur}min)</span>
                        </div>
                        {customerName && <div className="flex items-center gap-0.5 mt-0.5 text-[11px] opacity-70"><User className="h-3 w-3" />{customerName}</div>}
                        {j.address && <div className="flex items-center gap-0.5 mt-0.5 text-[11px] opacity-70 truncate"><MapPin className="h-3 w-3 shrink-0" />{j.address}</div>}
                        {j.assigned_to && <div className="mt-0.5 text-[11px] opacity-70">👷 {j.assigned_to}</div>}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColor[j.status] || "bg-muted"}`}>{j.status.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  const dayLabel = currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">{viewMode === "month" ? monthLabel : viewMode === "week" ? weekLabel : dayLabel}</h2>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <button onClick={() => setViewMode("month")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Month</button>
            <button onClick={() => setViewMode("week")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Week</button>
            <button onClick={() => setViewMode("day")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Day</button>
          </div>
          <Button size="sm" onClick={() => openNewJob()}><Plus className="h-4 w-4 mr-1" /> Schedule Job</Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Drag and drop jobs between slots to reschedule them instantly.</p>

      {/* Calendar */}
      <Card>
        <CardContent className="p-0 overflow-auto">
          {viewMode === "month" ? (
            <div>
              <div className="grid grid-cols-7 border-b">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-r last:border-r-0">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">{renderMonth()}</div>
            </div>
          ) : viewMode === "week" ? renderWeek() : renderDay()}
        </CardContent>
      </Card>

      {/* Scheduling Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNew ? "Schedule Job" : "Edit Job"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Job title" />
            </div>
            <div>
              <Label>Customer</Label>
              <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> Start</Label>
                <Input type="datetime-local" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock className="h-3 w-3" /> End</Label>
                <Input type="datetime-local" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1"><User className="h-3 w-3" /> Assigned To</Label>
              {teamMembers.length > 0 ? (
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((tm) => (
                      <SelectItem key={tm.id} value={tm.full_name}>{tm.full_name} ({tm.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={formAssignedTo} onChange={(e) => setFormAssignedTo(e.target.value)} placeholder="Technician name" />
              )}
            </div>
            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Job site address" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={saveJob}>{isNew ? "Schedule" : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
