import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Circle,
  Play,
  CheckCheck,
  User,
  Phone,
  FileText,
  Camera,
  Loader2,
  CalendarDays,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  status: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  assigned_to: string | null;
  address: string | null;
  description: string | null;
  notes: string | null;
  customer_id: string;
  business_id: string;
  customers?: { first_name: string; last_name: string; phone: string | null; email: string | null; address: string | null };
}

interface ChecklistItem {
  id: string;
  job_id: string;
  label: string;
  is_completed: boolean;
  sort_order: number | null;
}

interface JobNote {
  id: string;
  job_id: string;
  content: string;
  created_at: string;
}

interface JobPhoto {
  id: string;
  job_id: string;
  storage_path: string;
  photo_type: string;
  caption: string | null;
  created_at: string;
}

const STATUS_FLOW: Record<string, { next: string; nextLabel: string; icon: typeof Play; color: string }> = {
  scheduled: { next: "in_progress", nextLabel: "Start Job", icon: Play, color: "bg-primary text-primary-foreground" },
  in_progress: { next: "completed", nextLabel: "Complete Job", icon: CheckCheck, color: "bg-primary text-primary-foreground" },
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const PHOTO_TYPES = ["before", "during", "after"] as const;

export default function TechnicianViewPage() {
  const { business, user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [jobNotes, setJobNotes] = useState<Record<string, JobNote[]>>({});
  const [jobPhotos, setJobPhotos] = useState<Record<string, JobPhoto[]>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteJobId, setNoteJobId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [techName, setTechName] = useState<string | null>(null);
  const [teamMemberId, setTeamMemberId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string>("during");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoJobId, setPhotoJobId] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!business || !user) return;
      const { data } = await supabase
        .from("team_members")
        .select("id, full_name")
        .eq("business_id", business.id)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();
      if (data) {
        setTechName(data.full_name);
        setTeamMemberId(data.id);
      } else {
        setTechName(null);
        setTeamMemberId(null);
      }
    };
    resolve();
  }, [business, user]);

  const dateStr = currentDate.toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!business) return;
    setLoading(true);

    let query = supabase
      .from("jobs")
      .select("*, customers(first_name, last_name, phone, email, address)")
      .eq("business_id", business.id)
      .not("status", "eq", "cancelled")
      .gte("scheduled_start", dateStr + "T00:00:00")
      .lte("scheduled_start", dateStr + "T23:59:59")
      .order("scheduled_start");

    if (techName) {
      query = query.eq("assigned_to", techName);
    }

    const { data: jobsData } = await query;
    const jobsList = (jobsData as Job[]) || [];
    setJobs(jobsList);

    const jobIds = jobsList.map((j) => j.id);
    if (jobIds.length > 0) {
      const [{ data: clData }, { data: notesData }, { data: photosData }] = await Promise.all([
        supabase.from("job_checklist_items").select("*").in("job_id", jobIds).order("sort_order"),
        supabase.from("job_notes").select("*").in("job_id", jobIds).order("created_at", { ascending: false }),
        supabase.from("job_photos").select("*").in("job_id", jobIds).order("created_at", { ascending: false }),
      ]);

      const groupedCl: Record<string, ChecklistItem[]> = {};
      (clData || []).forEach((item: any) => {
        if (!groupedCl[item.job_id]) groupedCl[item.job_id] = [];
        groupedCl[item.job_id].push(item);
      });
      setChecklists(groupedCl);

      const groupedNotes: Record<string, JobNote[]> = {};
      (notesData || []).forEach((note: any) => {
        if (!groupedNotes[note.job_id]) groupedNotes[note.job_id] = [];
        groupedNotes[note.job_id].push(note);
      });
      setJobNotes(groupedNotes);

      const groupedPhotos: Record<string, JobPhoto[]> = {};
      (photosData || []).forEach((photo: any) => {
        if (!groupedPhotos[photo.job_id]) groupedPhotos[photo.job_id] = [];
        groupedPhotos[photo.job_id].push(photo);
      });
      setJobPhotos(groupedPhotos);

      const allPaths = (photosData || []).map((p: any) => p.storage_path);
      if (allPaths.length > 0) {
        const { data: signed } = await supabase.storage.from("job-photos").createSignedUrls(allPaths, 3600);
        const map: Record<string, string> = {};
        (signed || []).forEach((s: any) => { if (s.signedUrl && s.path) map[s.path] = s.signedUrl; });
        setPhotoUrls(map);
      } else {
        setPhotoUrls({});
      }
    } else {
      setChecklists({});
      setJobNotes({});
      setJobPhotos({});
      setPhotoUrls({});
    }

    setLoading(false);
  }, [business, dateStr, techName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navigateDay = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = currentDate.toDateString() === today.toDateString();

  const getGps = (): Promise<GeolocationPosition | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(p),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });

  const haversineMeters = (a: {lat:number,lng:number}, b: {lat:number,lng:number}) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };

  const updateJobStatus = async (job: Job, newStatus: string) => {
    setUpdatingStatus(job.id);

    // Geofence enforcement on clock-in
    let pos: GeolocationPosition | null = null;
    if (newStatus === "in_progress") {
      const { data: settings } = await supabase
        .from("business_settings")
        .select("require_geofence, geofence_radius_meters")
        .eq("business_id", job.business_id)
        .maybeSingle();
      if ((settings as any)?.require_geofence) {
        pos = await getGps();
        if (!pos) {
          toast({ title: "Location required", description: "Enable GPS to clock in.", variant: "destructive" });
          setUpdatingStatus(null);
          return;
        }
        const { data: prop } = await supabase
          .from("customer_properties")
          .select("latitude, longitude")
          .eq("customer_id", job.customer_id)
          .not("latitude", "is", null)
          .limit(1)
          .maybeSingle();
        const plat = (prop as any)?.latitude;
        const plng = (prop as any)?.longitude;
        if (plat != null && plng != null) {
          const dist = haversineMeters(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            { lat: Number(plat), lng: Number(plng) }
          );
          const radius = (settings as any)?.geofence_radius_meters ?? 150;
          if (dist > radius) {
            toast({
              title: "Outside geofence",
              description: `You're ${Math.round(dist)}m from the site (limit ${radius}m).`,
              variant: "destructive",
            });
            setUpdatingStatus(null);
            return;
          }
        }
      }
    }

    const update: any = { status: newStatus };
    if (newStatus === "completed") update.completed_at = new Date().toISOString();

    const { error } = await supabase.from("jobs").update(update).eq("id", job.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setUpdatingStatus(null);
      return;
    }

    // GPS-tagged time tracking (non-blocking on failure)
    if (teamMemberId) {
      if (!pos) pos = await getGps();
      const lat = pos?.coords.latitude ?? null;
      const lng = pos?.coords.longitude ?? null;
      const acc = pos?.coords.accuracy ?? null;
      try {
        if (newStatus === "in_progress") {
          await supabase.from("time_entries").insert({
            business_id: job.business_id,
            team_member_id: teamMemberId,
            job_id: job.id,
            clock_in: new Date().toISOString(),
            clock_in_lat: lat,
            clock_in_lng: lng,
            clock_in_accuracy: acc,
          });
        } else if (newStatus === "completed") {
          const { data: open } = await supabase
            .from("time_entries")
            .select("id")
            .eq("job_id", job.id)
            .eq("team_member_id", teamMemberId)
            .is("clock_out", null)
            .order("clock_in", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (open) {
            await supabase.from("time_entries").update({
              clock_out: new Date().toISOString(),
              clock_out_lat: lat,
              clock_out_lng: lng,
              clock_out_accuracy: acc,
            }).eq("id", open.id);
          }
        }
      } catch { /* ignore tracking errors */ }
    }

    toast({ title: newStatus === "in_progress" ? "Job started — clocked in" : "Job completed! 🎉" });
    fetchData();
    setUpdatingStatus(null);
  };

  const toggleChecklist = async (item: ChecklistItem) => {
    const { error } = await supabase.from("job_checklist_items").update({
      is_completed: !item.is_completed,
      completed_at: !item.is_completed ? new Date().toISOString() : null,
    }).eq("id", item.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setChecklists((prev) => ({
        ...prev,
        [item.job_id]: (prev[item.job_id] || []).map((i) =>
          i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
        ),
      }));
    }
  };

  const addNote = async () => {
    if (!noteJobId || !noteText.trim() || !business) return;
    const { data, error } = await supabase.from("job_notes").insert({
      job_id: noteJobId,
      business_id: business.id,
      content: noteText.trim(),
    }).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note added" });
      if (data) {
        setJobNotes((prev) => ({
          ...prev,
          [noteJobId]: [data as JobNote, ...(prev[noteJobId] || [])],
        }));
      }
      setShowNoteDialog(false);
      setNoteText("");
    }
  };

  const handlePhotoCapture = (jobId: string) => {
    setPhotoJobId(jobId);
    fileInputRef.current?.click();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoJobId || !business) return;

    setUploadingPhoto(photoJobId);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${business.id}/${photoJobId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploadingPhoto(null);
      return;
    }

    const { data: record, error: insertErr } = await supabase.from("job_photos").insert({
      job_id: photoJobId,
      business_id: business.id,
      storage_path: path,
      photo_type: photoType,
    }).select().single();

    if (insertErr) {
      toast({ title: "Error", description: insertErr.message, variant: "destructive" });
    } else {
      toast({ title: "Photo uploaded" });
      if (record) {
        setJobPhotos((prev) => ({
          ...prev,
          [photoJobId]: [record as JobPhoto, ...(prev[photoJobId] || [])],
        }));
        const { data: signed } = await supabase.storage.from("job-photos").createSignedUrl(path, 3600);
        if (signed?.signedUrl) setPhotoUrls((prev) => ({ ...prev, [path]: signed.signedUrl }));
      }
    }
    setUploadingPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getPhotoUrl = (storagePath: string) => photoUrls[storagePath] || "";

  const openMaps = (address: string) => {
    const encoded = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${encoded}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    window.open(url, "_blank");
  };

  const callCustomer = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const totalJobs = jobs.length;
  const dayLabel = currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Hidden file input for photo capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={uploadPhoto}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Schedule</h1>
          {techName && <p className="text-xs text-muted-foreground">{techName}</p>}
        </div>
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Date Nav */}
      <div className="flex items-center gap-2 justify-center">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className={`flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors ${
            isToday ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          {isToday ? "Today" : dayLabel}
        </button>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!isToday && (
        <p className="text-center text-xs text-muted-foreground">{dayLabel}</p>
      )}

      {/* Progress Summary */}
      {totalJobs > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(completedJobs / totalJobs) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {completedJobs}/{totalJobs} done
          </span>
        </div>
      )}

      {/* Job Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No jobs scheduled</p>
            <p className="text-xs mt-1">{isToday ? "You're all clear today!" : `Nothing scheduled for ${dayLabel}`}</p>
          </CardContent>
        </Card>
      ) : (
        jobs.map((job) => {
          const isExpanded = expandedJobId === job.id;
          const flow = STATUS_FLOW[job.status];
          const items = checklists[job.id] || [];
          const completedItems = items.filter((i) => i.is_completed);
          const customer = job.customers;
          const customerName = customer ? `${customer.first_name} ${customer.last_name}` : "";
          const jobAddress = job.address || customer?.address;
          const notes = jobNotes[job.id] || [];
          const photos = jobPhotos[job.id] || [];

          return (
            <Card
              key={job.id}
              className={`overflow-hidden transition-shadow ${
                job.status === "in_progress" ? "ring-2 ring-primary/50 shadow-lg" : ""
              }`}
            >
              <CardContent className="p-0">
                {/* Job Header */}
                <button
                  className="w-full text-left p-4 flex items-start gap-3"
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                >
                  <div className="shrink-0 text-center min-w-[48px]">
                    {job.scheduled_start ? (
                      <>
                        <p className="text-lg font-bold leading-tight">
                          {new Date(job.scheduled_start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        {job.scheduled_end && (
                          <p className="text-[10px] text-muted-foreground">
                            to {new Date(job.scheduled_end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </p>
                        )}
                      </>
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{job.title}</h3>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${STATUS_BADGE[job.status] || "bg-muted"}`}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {customerName && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <User className="h-3 w-3" /> {customerName}
                      </p>
                    )}
                    {jobAddress && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {jobAddress}
                      </p>
                    )}
                    {items.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(completedItems.length / items.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{completedItems.length}/{items.length}</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 space-y-3">
                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-3">
                      {jobAddress && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openMaps(jobAddress)}>
                          <Navigation className="h-3.5 w-3.5 mr-1" /> Navigate
                        </Button>
                      )}
                      {customer?.phone && (
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => callCustomer(customer.phone!)}>
                          <Phone className="h-3.5 w-3.5 mr-1" /> Call
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setNoteJobId(job.id); setShowNoteDialog(true); }}>
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePhotoCapture(job.id)}
                        disabled={uploadingPhoto === job.id}
                      >
                        {uploadingPhoto === job.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {/* Photo Type Selector (shows when uploading) */}
                    <div className="flex gap-1">
                      {PHOTO_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setPhotoType(type)}
                          className={`text-[10px] px-2 py-1 rounded-full capitalize transition-colors ${
                            photoType === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Photos Grid */}
                    {photos.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> Photos ({photos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {photos.map((photo) => (
                            <div key={photo.id} className="relative group">
                              <img
                                src={getPhotoUrl(photo.storage_path)}
                                alt={photo.caption || photo.photo_type}
                                className="w-full aspect-square object-cover rounded-md"
                              />
                              <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/60 text-white px-1 rounded capitalize">
                                {photo.photo_type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {job.description && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2.5">{job.description}</p>
                    )}

                    {/* Job Notes (from job record) */}
                    {job.notes && (
                      <div className="text-xs">
                        <p className="font-medium text-muted-foreground mb-1">Job Notes</p>
                        <p className="text-muted-foreground bg-muted rounded-lg p-2.5">{job.notes}</p>
                      </div>
                    )}

                    {/* Field Notes (from job_notes table) */}
                    {notes.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Field Notes</p>
                        {notes.map((note) => (
                          <div key={note.id} className="bg-muted rounded-lg p-2.5">
                            <p className="text-xs">{note.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {new Date(note.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Checklist */}
                    {items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Checklist</p>
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => toggleChecklist(item)}
                            className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-md hover:bg-muted transition-colors"
                          >
                            {item.is_completed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-sm ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Status Action */}
                    {flow && (
                      <Button
                        className={`w-full ${flow.color}`}
                        onClick={() => updateJobStatus(job, flow.next)}
                        disabled={updatingStatus === job.id}
                      >
                        {updatingStatus === job.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <flow.icon className="h-4 w-4 mr-1" />
                        )}
                        {flow.nextLabel}
                      </Button>
                    )}

                    {job.status === "completed" && (
                      <div className="text-center text-primary font-medium text-sm py-1">
                        ✅ Job Complete
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Field Note</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Note</Label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Observation, issue, or update..."
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
            <Button onClick={addNote} disabled={!noteText.trim()}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
