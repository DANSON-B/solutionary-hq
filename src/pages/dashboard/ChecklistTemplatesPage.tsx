import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Plus, Trash2, Camera, AlertCircle, ChevronRight,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

type Tmpl = {
  id: string;
  name: string;
  service_type: string;
  is_default: boolean;
  is_active: boolean;
};

type Item = {
  id: string;
  template_id: string;
  room: string | null;
  label: string;
  sort_order: number;
  is_required: boolean;
  photo_required: boolean;
  rotation_frequency: number;
};

const SERVICE_TYPES = [
  { value: "standard", label: "Standard Clean" },
  { value: "deep", label: "Deep Clean" },
  { value: "move_in_out", label: "Move-in / Move-out" },
  { value: "recurring", label: "Recurring Visit" },
  { value: "other", label: "Other" },
];

const COMMON_ROOMS = [
  "Kitchen", "Bathroom", "Bedroom", "Living Room",
  "Dining Room", "Laundry Room", "Office", "Entryway", "General",
];

export default function ChecklistTemplatesPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Tmpl[]>([]);
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("standard");
  const [newItemRoom, setNewItemRoom] = useState("Kitchen");
  const [newItemLabel, setNewItemLabel] = useState("");

  const fetchAll = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const { data: t } = await (supabase as any)
      .from("checklist_templates").select("*")
      .eq("business_id", business.id).order("created_at", { ascending: false });
    setTemplates(t || []);
    if (t?.length) {
      const ids = t.map((x: Tmpl) => x.id);
      const { data: it } = await (supabase as any)
        .from("checklist_template_items").select("*")
        .in("template_id", ids).order("sort_order");
      const grouped: Record<string, Item[]> = {};
      (it || []).forEach((i: Item) => {
        (grouped[i.template_id] = grouped[i.template_id] || []).push(i);
      });
      setItems(grouped);
      if (!activeId) setActiveId(t[0].id);
    } else {
      setItems({}); setActiveId(null);
    }
    setLoading(false);
  }, [business, activeId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createTemplate = async () => {
    if (!business || !newName.trim()) return;
    const { data, error } = await (supabase as any).from("checklist_templates")
      .insert({ business_id: business.id, name: newName.trim(), service_type: newType })
      .select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewName("");
    setActiveId(data.id);
    fetchAll();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template? Existing jobs are not affected.")) return;
    await (supabase as any).from("checklist_templates").delete().eq("id", id);
    setActiveId(null);
    fetchAll();
  };

  const setDefault = async (id: string, serviceType: string) => {
    if (!business) return;
    // Clear other defaults for same service type
    await (supabase as any).from("checklist_templates")
      .update({ is_default: false })
      .eq("business_id", business.id).eq("service_type", serviceType);
    await (supabase as any).from("checklist_templates")
      .update({ is_default: true }).eq("id", id);
    fetchAll();
  };

  const addItem = async () => {
    if (!activeId || !newItemLabel.trim()) return;
    const existing = items[activeId] || [];
    const nextSort = existing.length ? Math.max(...existing.map(i => i.sort_order)) + 1 : 0;
    await (supabase as any).from("checklist_template_items").insert({
      template_id: activeId, room: newItemRoom, label: newItemLabel.trim(), sort_order: nextSort,
    });
    setNewItemLabel("");
    fetchAll();
  };

  const updateItem = async (id: string, patch: Partial<Item>) => {
    await (supabase as any).from("checklist_template_items").update(patch).eq("id", id);
    fetchAll();
  };

  const deleteItem = async (id: string) => {
    await (supabase as any).from("checklist_template_items").delete().eq("id", id);
    fetchAll();
  };

  const active = templates.find(t => t.id === activeId);
  const activeItems = activeId ? (items[activeId] || []) : [];
  const byRoom: Record<string, Item[]> = {};
  activeItems.forEach(i => { const k = i.room || "General"; (byRoom[k] = byRoom[k] || []).push(i); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Checklist Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Build reusable checklists your techs use to complete jobs consistently.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            if (!business) return;
            if (!confirm("Apply default template to every scheduled/in-progress job that has no checklist?")) return;
            const { data, error } = await (supabase as any).rpc("bulk_apply_default_checklist_templates", { p_business_id: business.id });
            if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
            toast({ title: "Applied", description: `Applied defaults to ${data ?? 0} job(s).` });
          }}
        >
          Bulk apply defaults
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* LEFT: template list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Input placeholder="Template name" value={newName}
                onChange={(e) => setNewName(e.target.value)} />
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={createTemplate} disabled={!newName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> New Template
              </Button>
            </div>

            <div className="border-t pt-3 space-y-1">
              {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
              {!loading && templates.length === 0 && (
                <p className="text-xs text-muted-foreground">No templates yet.</p>
              )}
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm flex items-center justify-between transition ${
                    activeId === t.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <span className="truncate">
                    <span className="font-medium">{t.name}</span>
                    {t.is_default && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">Default</span>}
                    <span className="block text-[11px] text-muted-foreground capitalize">{t.service_type.replace("_"," ")}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: editor */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                {active ? active.name : "Select a template"}
              </CardTitle>
              {active && (
                <p className="text-xs text-muted-foreground capitalize">
                  {SERVICE_TYPES.find(s => s.value === active.service_type)?.label}
                </p>
              )}
            </div>
            {active && (
              <div className="flex gap-2">
                {!active.is_default && (
                  <Button variant="outline" size="sm" onClick={() => setDefault(active.id, active.service_type)}>
                    Set as default
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTemplate(active.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>

          {active && (
            <CardContent className="space-y-4">
              {/* Add item */}
              <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                <Select value={newItemRoom} onValueChange={setNewItemRoom}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMON_ROOMS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Task label (e.g. Wipe countertops, sanitize sink)"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                />
                <Button onClick={addItem} disabled={!newItemLabel.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {activeItems.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No items yet. Add tasks room by room above.
                </div>
              )}

              <Accordion type="multiple" defaultValue={Object.keys(byRoom)} className="w-full">
                {Object.entries(byRoom).map(([room, list]) => (
                  <AccordionItem value={room} key={room}>
                    <AccordionTrigger className="text-sm">
                      <span className="flex items-center gap-2">
                        {room} <span className="text-xs text-muted-foreground">({list.length})</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {list.map(it => (
                          <div key={it.id} className="flex items-center gap-3 rounded-md border p-2">
                            <Input
                              className="flex-1"
                              defaultValue={it.label}
                              onBlur={(e) => e.target.value !== it.label && updateItem(it.id, { label: e.target.value })}
                            />
                            <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Checkbox checked={it.is_required}
                                onCheckedChange={(v) => updateItem(it.id, { is_required: !!v })} />
                              <AlertCircle className="h-3.5 w-3.5" /> Required
                            </label>
                            <label className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                              <Checkbox checked={it.photo_required}
                                onCheckedChange={(v) => updateItem(it.id, { photo_required: !!v })} />
                              <Camera className="h-3.5 w-3.5" /> Photo
                            </label>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0" title="Rotate: task appears every N recurring visits (1 = every visit)">
                              <span>Every</span>
                              <Input
                                type="number" min={1} max={12}
                                defaultValue={it.rotation_frequency || 1}
                                className="w-14 h-8"
                                onBlur={(e) => {
                                  const n = Math.max(1, parseInt(e.target.value) || 1);
                                  if (n !== (it.rotation_frequency || 1)) updateItem(it.id, { rotation_frequency: n });
                                }}
                              />
                              <span>visit(s)</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteItem(it.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
