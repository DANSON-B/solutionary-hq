import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Camera, Plus, Trash2, CheckSquare, Square,
  StickyNote, Image as ImageIcon, ChevronLeft, ChevronRight,
  X, Pencil, Check, ClipboardList, PenLine, AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CrewAddonsBrief from "@/components/dashboard/jobs/CrewAddonsBrief";
import SignatureCapture from "@/components/dashboard/jobs/SignatureCapture";
import IncidentReports from "@/components/dashboard/jobs/IncidentReports";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { business } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoType, setPhotoType] = useState<"before" | "during" | "after">("before");
  const [uploadCaption, setUploadCaption] = useState("");

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<any[]>([]);

  // Inline caption editing
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editCaptionValue, setEditCaptionValue] = useState("");

  // Crew add-ons brief check state (persisted per-job in localStorage)
  const briefStorageKey = id ? `crew-brief-checks:${id}` : "";
  const [briefChecks, setBriefChecks] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!briefStorageKey) return;
    try {
      const raw = localStorage.getItem(briefStorageKey);
      if (raw) setBriefChecks(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, [briefStorageKey]);
  const toggleBrief = (addonId: string) => {
    setBriefChecks((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      try { localStorage.setItem(briefStorageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const fetchAll = useCallback(async () => {
    if (!business || !id) return;
    const [jobRes, photosRes, notesRes, checkRes, tmplRes] = await Promise.all([
      supabase.from("jobs").select("*, customers(first_name, last_name)").eq("id", id).single(),
      supabase.from("job_photos").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      supabase.from("job_notes").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      supabase.from("job_checklist_items").select("*").eq("job_id", id).order("sort_order"),
      (supabase as any).from("checklist_templates").select("id,name,service_type,is_default")
        .eq("business_id", business.id).eq("is_active", true).order("name"),
    ]);
    setJob(jobRes.data);
    const ph = photosRes.data || [];
    setPhotos(ph);
    setNotes(notesRes.data || []);
    setChecklist(checkRes.data || []);
    setTemplates(tmplRes.data || []);

    if (ph.length > 0) {
      const paths = ph.map((p: any) => p.storage_path);
      const { data: signed } = await supabase.storage.from("job-photos").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      (signed || []).forEach((s: any) => { if (s.signedUrl && s.path) map[s.path] = s.signedUrl; });
      setPhotoUrls(map);
    } else {
      setPhotoUrls({});
    }
  }, [business, id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const applyTemplate = async (templateId: string) => {
    if (!id) return;
    if (checklist.length > 0 && !confirm("This replaces existing checklist items (manual add-ons kept). Continue?")) return;
    setApplyingTemplate(true);
    const { error } = await (supabase as any).rpc("apply_checklist_template_to_job", {
      p_job_id: id, p_template_id: templateId,
    });
    setApplyingTemplate(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Template applied" });
    fetchAll();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business || !id) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        continue;
      }

      await supabase.from("job_photos").insert({
        job_id: id,
        business_id: business.id,
        storage_path: path,
        photo_type: photoType,
        caption: uploadCaption.trim() || null,
      });
    }

    toast({ title: `${files.length} photo${files.length > 1 ? "s" : ""} uploaded!` });
    setUploading(false);
    setUploadCaption("");
    fetchAll();
  };

  const uploadItemPhoto = async (item: any, file: File) => {
    if (!business || !id) return;
    const ext = file.name.split(".").pop();
    const path = `${id}/checklist-${item.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (upErr) { toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); return; }
    const { data: photo, error: insErr } = await supabase.from("job_photos").insert({
      job_id: id, business_id: business.id, storage_path: path,
      photo_type: "during", caption: `Checklist: ${item.label}`,
    }).select().single();
    if (insErr || !photo) { toast({ title: "Save failed", description: insErr?.message, variant: "destructive" }); return; }
    await (supabase as any).from("job_checklist_items").update({ photo_id: photo.id }).eq("id", item.id);
    toast({ title: "Photo attached" });
    fetchAll();
  };

  const deletePhoto = async (photo: any) => {
    await supabase.storage.from("job-photos").remove([photo.storage_path]);
    await supabase.from("job_photos").delete().eq("id", photo.id);
    fetchAll();
  };

  const saveCaption = async (photoId: string) => {
    await supabase.from("job_photos").update({ caption: editCaptionValue.trim() || null }).eq("id", photoId);
    setEditingCaptionId(null);
    fetchAll();
  };

  const addNote = async () => {
    if (!newNote.trim() || !business || !id) return;
    await supabase.from("job_notes").insert({ job_id: id, business_id: business.id, content: newNote.trim() });
    setNewNote("");
    fetchAll();
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from("job_notes").delete().eq("id", noteId);
    fetchAll();
  };

  const addCheckItem = async () => {
    if (!newCheckItem.trim() || !business || !id) return;
    await supabase.from("job_checklist_items").insert({
      job_id: id,
      business_id: business.id,
      label: newCheckItem.trim(),
      sort_order: checklist.length,
    });
    setNewCheckItem("");
    fetchAll();
  };

  const toggleCheck = async (item: any) => {
    const completed = !item.is_completed;
    await supabase.from("job_checklist_items").update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq("id", item.id);
    fetchAll();
  };

  const deleteCheckItem = async (itemId: string) => {
    await supabase.from("job_checklist_items").delete().eq("id", itemId);
    fetchAll();
  };

  const getPhotoUrl = (path: string) => photoUrls[path] || "";

  const openLightbox = (allPhotos: any[], index: number) => {
    setLightboxPhotos(allPhotos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const completionPct = checklist.length > 0 ? Math.round((checklist.filter(c => c.is_completed).length / checklist.length) * 100) : 0;

  const statusColors: Record<string, string> = {
    scheduled: "bg-primary/10 text-primary",
    in_progress: "bg-accent/20 text-accent-foreground",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-muted text-muted-foreground",
  };

  if (!job) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const allPhotosFlat = ["before", "during", "after"].flatMap(
    (type) => photos.filter((p) => p.photo_type === type)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-sm text-muted-foreground">
            {job.customers?.first_name} {job.customers?.last_name}
          </p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[job.status] || ""}`}>
          {job.status.replace("_", " ")}
        </span>
      </div>

      {/* Progress bar */}
      {checklist.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Completion</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      <Tabs defaultValue="brief" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="brief" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Crew Brief</TabsTrigger>
          <TabsTrigger value="photos" className="gap-1.5"><ImageIcon className="h-4 w-4" /> Photos ({photos.length})</TabsTrigger>
          <TabsTrigger value="checklist" className="gap-1.5"><CheckSquare className="h-4 w-4" /> Checklist</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5"><StickyNote className="h-4 w-4" /> Notes</TabsTrigger>
          <TabsTrigger value="signoff" className="gap-1.5"><PenLine className="h-4 w-4" /> Sign-off</TabsTrigger>
          <TabsTrigger value="incidents" className="gap-1.5"><AlertTriangle className="h-4 w-4" /> Incidents</TabsTrigger>
        </TabsList>

        {/* CREW BRIEF TAB */}
        <TabsContent value="brief">
          <CrewAddonsBrief
            sources={[job.title, job.description, job.notes]}
            checkedIds={briefChecks}
            onToggle={toggleBrief}
          />
        </TabsContent>

        {/* SIGN-OFF TAB */}
        <TabsContent value="signoff">
          <SignatureCapture job={job} onSaved={fetchAll} />
        </TabsContent>

        {/* INCIDENTS TAB */}
        <TabsContent value="incidents">
          {business && <IncidentReports jobId={job.id} businessId={business.id} />}
        </TabsContent>

        {/* PHOTOS TAB */}
        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Photo Gallery</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as any)}
                    className="text-sm border rounded-md px-2 py-1.5 bg-background"
                  >
                    <option value="before">Before</option>
                    <option value="during">During</option>
                    <option value="after">After</option>
                  </select>
                  <Button size="sm" disabled={uploading} asChild>
                    <label className="cursor-pointer">
                      <Camera className="h-4 w-4 mr-1" />
                      {uploading ? "Uploading..." : "Upload"}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={uploadPhoto} />
                    </label>
                  </Button>
                </div>
              </div>
              {/* Caption input for uploads */}
              <Input
                placeholder="Optional caption for uploaded photos..."
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              {/* Before/After side-by-side comparison */}
              {photos.filter(p => p.photo_type === "before").length > 0 && photos.filter(p => p.photo_type === "after").length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Before & After Comparison</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</span>
                      <div
                        className="aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer"
                        onClick={() => openLightbox(allPhotosFlat, 0)}
                      >
                        <img
                          src={getPhotoUrl(photos.filter(p => p.photo_type === "before")[0].storage_path)}
                          alt="Before"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">After</span>
                      <div
                        className="aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer"
                        onClick={() => {
                          const afterIdx = allPhotosFlat.findIndex(p => p.photo_type === "after");
                          openLightbox(allPhotosFlat, afterIdx >= 0 ? afterIdx : 0);
                        }}
                      >
                        <img
                          src={getPhotoUrl(photos.filter(p => p.photo_type === "after")[0].storage_path)}
                          alt="After"
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All photos by category */}
              {["before", "during", "after"].map((type) => {
                const typePhotos = photos.filter((p) => p.photo_type === type);
                if (typePhotos.length === 0) return null;
                return (
                  <div key={type} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-medium text-muted-foreground capitalize mb-3">
                      {type} ({typePhotos.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {typePhotos.map((photo, idx) => {
                        const globalIdx = allPhotosFlat.findIndex(p => p.id === photo.id);
                        return (
                          <div key={photo.id} className="group relative">
                            <div
                              className="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                              onClick={() => openLightbox(allPhotosFlat, globalIdx)}
                            >
                              <img
                                src={getPhotoUrl(photo.storage_path)}
                                alt={photo.caption || type}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                            {/* Caption */}
                            {editingCaptionId === photo.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <Input
                                  value={editCaptionValue}
                                  onChange={(e) => setEditCaptionValue(e.target.value)}
                                  className="h-7 text-xs"
                                  onKeyDown={(e) => e.key === "Enter" && saveCaption(photo.id)}
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => saveCaption(photo.id)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-1 min-h-[20px]">
                                <p className="text-xs text-muted-foreground truncate flex-1">
                                  {photo.caption || "No caption"}
                                </p>
                                <button
                                  onClick={() => { setEditingCaptionId(photo.id); setEditCaptionValue(photo.caption || ""); }}
                                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 ml-1 p-1"
                                  aria-label="Edit caption"
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePhoto(photo); }}
                              className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive/80 text-destructive-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              aria-label="Delete photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {photos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No photos yet. Upload before, during, or after photos.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHECKLIST TAB */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">Checklist</CardTitle>
              {templates.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    disabled={applyingTemplate}
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) { applyTemplate(e.target.value); e.currentTarget.value = ""; } }}
                  >
                    <option value="" disabled>Apply template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.is_default ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const byRoom: Record<string, any[]> = {};
                checklist.forEach((i) => {
                  const k = i.room || "General";
                  (byRoom[k] = byRoom[k] || []).push(i);
                });
                const rooms = Object.keys(byRoom);
                if (rooms.length === 0) {
                  return (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No checklist items yet. Apply a template above or add items below.
                    </div>
                  );
                }
                return rooms.map((room) => (
                  <div key={room} className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {room} <span className="text-muted-foreground/70">({byRoom[room].filter(i=>i.is_completed).length}/{byRoom[room].length})</span>
                    </div>
                    {byRoom[room].map((item) => {
                      const needsPhoto = item.photo_required && !item.photo_id;
                      return (
                        <div key={item.id} className="flex items-start gap-3 group rounded-md border p-2">
                          <button onClick={() => toggleCheck(item)} className="shrink-0 mt-0.5">
                            {item.is_completed ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                              {item.label}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {item.is_required && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                                  Required
                                </span>
                              )}
                              {item.photo_required && (
                                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  item.photo_id ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  <Camera className="h-3 w-3" />
                                  {item.photo_id ? "Photo attached" : "Photo required"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <label className="cursor-pointer text-muted-foreground hover:text-primary p-1" title={item.photo_id ? "Replace photo" : "Attach photo"}>
                              <Camera className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadItemPhoto(item, f); e.currentTarget.value = ""; }}
                              />
                            </label>
                            <button onClick={() => deleteCheckItem(item.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-destructive transition-opacity p-2" aria-label="Delete item">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}

              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Add checklist item..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                />
                <Button size="sm" onClick={addCheckItem}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a field note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button size="sm" onClick={addNote} className="self-end"><Plus className="h-4 w-4" /></Button>
              </div>
              {notes.map((note) => (
                <div key={note.id} className="flex gap-3 group border-b pb-3 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-destructive shrink-0 transition-opacity p-2" aria-label="Delete note">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lightbox Gallery Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none overflow-hidden">
          {lightboxPhotos.length > 0 && (
            <div className="relative flex flex-col items-center">
              {/* Close button */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/20 text-white hover:bg-background/40 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Navigation arrows */}
              {lightboxPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((prev) => (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/20 text-white hover:bg-background/40 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((prev) => (prev + 1) % lightboxPhotos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/20 text-white hover:bg-background/40 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Main image */}
              <div className="w-full flex items-center justify-center min-h-[60vh] max-h-[80vh]">
                <img
                  src={getPhotoUrl(lightboxPhotos[lightboxIndex].storage_path)}
                  alt={lightboxPhotos[lightboxIndex].caption || "Photo"}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>

              {/* Info bar */}
              <div className="w-full px-6 py-4 bg-background/10 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-white/60">
                      {lightboxPhotos[lightboxIndex].photo_type}
                    </span>
                    {lightboxPhotos[lightboxIndex].caption && (
                      <p className="text-sm mt-0.5">{lightboxPhotos[lightboxIndex].caption}</p>
                    )}
                  </div>
                  <span className="text-xs text-white/60">
                    {lightboxIndex + 1} / {lightboxPhotos.length}
                  </span>
                </div>
              </div>

              {/* Thumbnail strip */}
              {lightboxPhotos.length > 1 && (
                <div className="w-full px-4 py-3 flex gap-2 overflow-x-auto bg-background/5">
                  {lightboxPhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => setLightboxIndex(idx)}
                      className={`shrink-0 h-14 w-14 rounded-md overflow-hidden border-2 transition-all ${
                        idx === lightboxIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
