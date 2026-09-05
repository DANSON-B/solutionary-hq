import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, AlertTriangle, Plus, Minus, Edit2 } from "lucide-react";

type Item = {
  id: string; name: string; sku: string | null; unit: string; on_hand: number;
  reorder_threshold: number; unit_cost_cents: number; vendor: string | null; is_active: boolean;
};

export default function InventoryPage() {
  const { business } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", sku: "", unit: "each", on_hand: 0, reorder_threshold: 5, unit_cost_cents: 0, vendor: "" });
  const [move, setMove] = useState({ item_id: "", movement_type: "purchase", quantity: 1, note: "" });

  const load = async () => {
    if (!business?.id) return;
    setLoading(true);
    const { data } = await supabase.from("inventory_items").select("*").eq("business_id", business.id).order("name");
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [business?.id]);

  const addItem = async () => {
    if (!business?.id || !form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("inventory_items").insert({ business_id: business.id, ...form });
    if (error) return toast.error(error.message);
    setForm({ name: "", sku: "", unit: "each", on_hand: 0, reorder_threshold: 5, unit_cost_cents: 0, vendor: "" });
    toast.success("Item added");
    load();
  };

  const recordMovement = async () => {
    if (!business?.id || !move.item_id || !move.quantity) return toast.error("Item + quantity required");
    const { error } = await supabase.from("inventory_movements").insert({
      business_id: business.id, item_id: move.item_id, movement_type: move.movement_type,
      quantity: move.quantity, note: move.note || null,
    });
    if (error) return toast.error(error.message);
    setMove({ item_id: "", movement_type: "purchase", quantity: 1, note: "" });
    toast.success("Movement recorded");
    load();
  };

  const lowStock = items.filter(i => i.is_active && i.on_hand <= i.reorder_threshold);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Inventory</h1>
        <p className="text-muted-foreground">Track cleaning supplies and consumption.</p>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="text-sm">
              <div className="font-semibold">{lowStock.length} item(s) at or below reorder threshold</div>
              <div className="text-muted-foreground">{lowStock.map(i => i.name).join(", ")}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Add supply</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name</Label><Input className="h-12" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Microfiber cloths" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SKU</Label><Input className="h-12" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Unit</Label><Input className="h-12" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              <div><Label>On hand</Label><Input type="number" className="h-12" value={form.on_hand} onChange={e => setForm({ ...form, on_hand: Number(e.target.value) })} /></div>
              <div><Label>Reorder at</Label><Input type="number" className="h-12" value={form.reorder_threshold} onChange={e => setForm({ ...form, reorder_threshold: Number(e.target.value) })} /></div>
              <div><Label>Unit cost (¢)</Label><Input type="number" className="h-12" value={form.unit_cost_cents} onChange={e => setForm({ ...form, unit_cost_cents: Number(e.target.value) })} /></div>
              <div><Label>Vendor</Label><Input className="h-12" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} /></div>
            </div>
            <Button onClick={addItem} className="h-12 w-full"><Plus className="h-4 w-4 mr-2" />Add supply</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Record movement</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={move.item_id} onValueChange={v => setMove({ ...move, item_id: v })}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Item" /></SelectTrigger>
              <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={move.movement_type} onValueChange={v => setMove({ ...move, movement_type: v })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase (add)</SelectItem>
                <SelectItem value="usage">Usage (subtract)</SelectItem>
                <SelectItem value="adjustment">Adjustment (set exact)</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" className="h-12" placeholder="Quantity" value={move.quantity} onChange={e => setMove({ ...move, quantity: Number(e.target.value) })} />
            <Input className="h-12" placeholder="Note (optional)" value={move.note} onChange={e => setMove({ ...move, note: e.target.value })} />
            <Button onClick={recordMovement} className="h-12 w-full">Record</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Supplies</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> :
            items.length === 0 ? <p className="text-sm text-muted-foreground">No items yet.</p> :
              items.map(i => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded border">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{i.name} {i.sku && <span className="text-xs text-muted-foreground">({i.sku})</span>}</div>
                    <div className="text-xs text-muted-foreground">{i.vendor || "No vendor"} · ${(i.unit_cost_cents / 100).toFixed(2)}/{i.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{i.on_hand} {i.unit}</div>
                    {i.on_hand <= i.reorder_threshold && <Badge variant="destructive" className="text-xs">Low</Badge>}
                  </div>
                </div>
              ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
