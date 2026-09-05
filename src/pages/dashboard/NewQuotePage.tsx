import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewQuotePage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!business) return;
    supabase.from("customers").select("id, first_name, last_name").eq("business_id", business.id)
      .then(({ data }) => setCustomers(data || []));

    // Load AI-generated items if coming from AI Estimator or MapMeasure
    if (searchParams.get("from") === "ai") {
      const storedItems = sessionStorage.getItem("ai_estimate_items");
      const storedNotes = sessionStorage.getItem("ai_estimate_notes");
      if (storedItems) {
        try {
          const parsed = JSON.parse(storedItems) as LineItem[];
          if (parsed.length > 0) setItems(parsed);
        } catch {}
        sessionStorage.removeItem("ai_estimate_items");
      }
      if (storedNotes) {
        setNotes(storedNotes);
        sessionStorage.removeItem("ai_estimate_notes");
      }
    }
  }, [business, searchParams]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) =>
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !customerId || items.some((i) => !i.description)) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const quoteNumber = `Q-${Date.now().toString().slice(-6)}`;
      const { data: quote, error } = await supabase
        .from("quotes")
        .insert({
          business_id: business.id,
          customer_id: customerId,
          quote_number: quoteNumber,
          status: "draft" as const,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total,
          notes,
        })
        .select()
        .single();
      if (error) throw error;

      const quoteItems = items.map((item, idx) => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        sort_order: idx,
      }));
      const { error: itemsError } = await supabase.from("quote_items").insert(quoteItems);
      if (itemsError) throw itemsError;

      toast({ title: "Quote created!", description: `Quote ${quoteNumber} saved as draft.` });
      navigate("/dashboard/quotes");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/quotes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">New Quote</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select a customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customers.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No customers yet. <Link to="/dashboard/customers" className="text-primary hover:underline">Add one first</Link>.
              </p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Line Items</h2>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <Label className="text-xs">Description *</Label>}
                  <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Service description" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-xs">Qty</Label>}
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <Label className="text-xs">Price</Label>}
                  <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2 text-right font-medium text-sm pt-2">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-3">
            <Plus className="h-4 w-4 mr-1" /> Add Line Item
          </Button>
        </div>

        {/* Totals */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 gap-4">
            <span className="text-sm text-muted-foreground">Tax Rate (%)</span>
            <Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-24 text-right" />
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Tax</span>
            <span className="font-medium">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2 mt-2">
            <span className="font-bold">Total</span>
            <span className="font-bold text-lg">${total.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." className="mt-1" />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Quote"}</Button>
          <Link to="/dashboard/quotes"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
