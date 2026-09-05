import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ServicesPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", default_price: "", duration_minutes: "" });

  const fetchServices = async () => {
    if (!business) return;
    const { data } = await supabase.from("services").select("*").eq("business_id", business.id).order("name");
    setServices(data || []);
  };

  useEffect(() => { fetchServices(); }, [business]);

  const openAdd = () => {
    setEditingService(null);
    setForm({ name: "", description: "", default_price: "", duration_minutes: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingService(s);
    setForm({
      name: s.name,
      description: s.description || "",
      default_price: s.default_price?.toString() || "",
      duration_minutes: s.duration_minutes?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !form.name) return;

    const payload = {
      name: form.name,
      description: form.description || null,
      default_price: form.default_price ? parseFloat(form.default_price) : null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
    };

    if (editingService) {
      const { error } = await supabase.from("services").update(payload).eq("id", editingService.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Service updated!" });
    } else {
      const { error } = await supabase.from("services").insert({ ...payload, business_id: business.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Service added!" });
    }

    setForm({ name: "", description: "", default_price: "", duration_minutes: "" });
    setEditingService(null);
    setDialogOpen(false);
    fetchServices();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("services").delete().eq("id", deleteId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Service deleted." });
    setDeleteId(null);
    fetchServices();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("services").update({ is_active: !currentActive }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: !currentActive ? "Service activated" : "Service deactivated" });
    fetchServices();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Services</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingService(null); }}>
          <DialogTrigger asChild><Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Service</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Drain Cleaning" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Default Price ($)</Label><Input type="number" step="0.01" value={form.default_price} onChange={(e) => setForm({ ...form, default_price: e.target.value })} /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">{editingService ? "Save Changes" : "Add Service"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground p-8 rounded-xl border bg-card">No services yet.</div>
        ) : services.map((s) => (
          <div key={s.id} className={`rounded-xl border bg-card p-5 ${s.is_active === false ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{s.name}</h3>
              <Badge variant={s.is_active !== false ? "default" : "secondary"} className="text-[10px] shrink-0">
                {s.is_active !== false ? "Active" : "Inactive"}
              </Badge>
            </div>
            {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
            <div className="flex gap-4 mt-3 text-sm">
              {s.default_price && <span className="font-medium">${s.default_price}</span>}
              {s.duration_minutes && <span className="text-muted-foreground">{s.duration_minutes} min</span>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={s.is_active !== false} onCheckedChange={() => toggleActive(s.id, s.is_active !== false)} />
                <span className="text-xs text-muted-foreground">{s.is_active !== false ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this service. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
