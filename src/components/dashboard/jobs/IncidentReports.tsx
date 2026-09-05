import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Camera, CheckCircle2, Plus, Trash2 } from "lucide-react";

const TYPES = ["property_damage", "injury", "customer_complaint", "safety", "other"] as const;
const SEVERITY = ["low", "medium", "high", "critical"] as const;

const sevColor: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function IncidentReports({ jobId, businessId }: { jobId: string; businessId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    incident_type: "property_damage",
    severity: "medium",
    description: "",
  });
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("job_incident_reports")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    setItems(data || []);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.description.trim()) { toast({ title: "Description required", variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("job_incident_reports").insert({
      job_id: jobId,
      business_id: businessId,
      incident_type: form.incident_type,
      severity: form.severity,
      description: form.description.trim(),
      reported_by: user?.id ?? null,
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setForm({ incident_type: "property_damage", severity: "medium", description: "" });
    setCreating(false);
    toast({ title: "Incident logged" });
    load();
  };

  const uploadPhoto = async (report: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(report.id);
    const path = `${businessId}/${jobId}/incidents/${report.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (upErr) { toast({ title: "Upload failed", description: upErr.message, variant: "destructive" }); setUploading(null); return; }
    const next = [...(report.photo_urls || []), path];
    await supabase.from("job_incident_reports").update({ photo_urls: next }).eq("id", report.id);
    setUploading(null);
    load();
  };

  const resolve = async (report: any) => {
    const notes = window.prompt("Resolution notes (optional):", report.resolution_notes || "");
    await supabase.from("job_incident_reports").update({
      resolved: true, resolved_at: new Date().toISOString(), resolution_notes: notes || null,
    }).eq("id", report.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this incident?")) return;
    await supabase.from("job_incident_reports").delete().eq("id", id);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Incident Reports ({items.length})
          </CardTitle>
          {!creating && (
            <Button size="sm" onClick={() => setCreating(true)} className="h-11">
              <Plus className="h-4 w-4 mr-1" /> Log incident
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {creating && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select
                  className="mt-1 w-full h-11 border rounded-md px-2 bg-background text-base"
                  value={form.incident_type}
                  onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                >
                  {TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Severity</label>
                <select
                  className="mt-1 w-full h-11 border rounded-md px-2 bg-background text-base"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  {SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <Textarea
              placeholder="What happened? Include location, cause, actions taken..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="text-base"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreating(false)} className="h-11">Cancel</Button>
              <Button onClick={create} className="flex-1 h-11">Save incident</Button>
            </div>
          </div>
        )}

        {items.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No incidents reported. Log any property damage, injuries, or complaints here.
          </p>
        )}

        {items.map((r) => (
          <div key={r.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium capitalize">{r.incident_type.replace("_", " ")}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sevColor[r.severity]}`}>{r.severity}</span>
                {r.resolved && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> resolved
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.description}</p>
            {r.resolution_notes && (
              <p className="text-sm text-muted-foreground border-l-2 border-green-500 pl-3">
                Resolution: {r.resolution_notes}
              </p>
            )}
            {r.photo_urls?.length > 0 && (
              <p className="text-xs text-muted-foreground">{r.photo_urls.length} photo(s) attached</p>
            )}
            <div className="flex gap-2 pt-1 flex-wrap">
              <Button size="sm" variant="outline" asChild className="h-10">
                <label className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-1" />
                  {uploading === r.id ? "Uploading..." : "Add photo"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => uploadPhoto(r, e)} />
                </label>
              </Button>
              {!r.resolved && (
                <Button size="sm" variant="outline" onClick={() => resolve(r)} className="h-10">
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark resolved
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="h-10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
