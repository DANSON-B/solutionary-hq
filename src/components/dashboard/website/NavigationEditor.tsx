import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2, Wand2, Lightbulb, Save, CornerDownRight } from "lucide-react";
import { buildDefaultNav, auditNav, NavItem } from "@/lib/tenantNav";

interface Props {
  base: string;
  industry?: string | null;
  services: { slug: string; title: string }[];
  areas: { slug: string; city: string }[];
  value: NavItem[] | null;
  onSave: (items: NavItem[]) => void;
}

export function NavigationEditor({ base, industry, services, areas, value, onSave }: Props) {
  const [items, setItems] = useState<NavItem[]>(
    value && value.length ? value : buildDefaultNav(base, industry, services, areas)
  );
  const notes = useMemo(() => auditNav(items), [items]);

  const update = (i: number, patch: Partial<NavItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const addItem = () => setItems((prev) => [...prev, { label: "New page", to: `${base}/services` }]);

  const addChild = (i: number) =>
    update(i, { children: [...(items[i].children || []), { label: "New link", to: `${base}/services` }] });

  const updateChild = (i: number, ci: number, patch: Partial<NavItem>) =>
    update(i, { children: (items[i].children || []).map((c, idx) => (idx === ci ? { ...c, ...patch } : c)) });

  const removeChild = (i: number, ci: number) =>
    update(i, { children: (items[i].children || []).filter((_, idx) => idx !== ci) });

  const regenerate = () => {
    setItems(buildDefaultNav(base, industry, services, areas));
    toast.success("Menu rebuilt from your industry, services and service areas");
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg">Main Navigation</h2>
          <p className="text-sm text-muted-foreground">Rename, reorder, nest dropdowns, or link anywhere.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={regenerate} className="h-11">
            <Wand2 size={16} className="mr-2" /> Auto-generate
          </Button>
          <Button onClick={() => onSave(items)} className="h-11">
            <Save size={16} className="mr-2" /> Save menu
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-3">
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input className="h-11" value={item.label} onChange={(e) => update(i, { label: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Link</Label>
                <Input className="h-11" value={item.to} onChange={(e) => update(i, { to: e.target.value })} />
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={16} /></Button>
                <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={16} /></Button>
                <Button size="icon" variant="ghost" className="h-11 w-11 text-destructive" onClick={() => remove(i)} aria-label="Remove"><Trash2 size={16} /></Button>
              </div>
            </div>

            {item.children?.map((c, ci) => (
              <div key={ci} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end pl-4 border-l">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><CornerDownRight size={12} /> Dropdown label</Label>
                  <Input className="h-11" value={c.label} onChange={(e) => updateChild(i, ci, { label: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link</Label>
                  <Input className="h-11" value={c.to} onChange={(e) => updateChild(i, ci, { to: e.target.value })} />
                </div>
                <Button size="icon" variant="ghost" className="h-11 w-11 text-destructive" onClick={() => removeChild(i, ci)} aria-label="Remove link"><Trash2 size={16} /></Button>
              </div>
            ))}

            <Button size="sm" variant="ghost" onClick={() => addChild(i)}>
              <Plus size={14} className="mr-1" /> Add dropdown link
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addItem} className="h-11">
        <Plus size={16} className="mr-2" /> Add menu item
      </Button>

      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={16} className="text-primary" />
          <span className="font-medium text-sm">Navigation review</span>
          <Badge variant="secondary">{items.length} top-level</Badge>
        </div>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </div>
    </Card>
  );
}
