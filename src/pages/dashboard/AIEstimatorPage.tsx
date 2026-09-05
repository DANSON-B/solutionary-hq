import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  reasoning?: string;
}

export default function AIEstimatorPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [propertyType, setPropertyType] = useState("residential");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ summary: string; line_items: LineItem[]; notes: string; confidence: string } | null>(null);
  const [editableItems, setEditableItems] = useState<LineItem[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64 && !jobDescription) {
      toast({ title: "Provide a photo or description", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-estimator", {
        body: { imageBase64, jobDescription, propertyType },
      });
      if (error) throw error;
      setResult(data);
      setEditableItems(data.line_items || []);
    } catch (err: any) {
      toast({ title: "AI analysis failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const subtotal = editableItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setEditableItems((items) => items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };
  const removeItem = (idx: number) => setEditableItems((items) => items.filter((_, i) => i !== idx));
  const addItem = () => setEditableItems((items) => [...items, { description: "", quantity: 1, unit_price: 0 }]);

  const createQuote = () => {
    // Store items in sessionStorage and redirect to new quote page
    sessionStorage.setItem("ai_estimate_items", JSON.stringify(editableItems));
    sessionStorage.setItem("ai_estimate_notes", result?.summary || "");
    window.location.href = "/dashboard/quotes/new?from=ai";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" /> AI Estimator
          </h1>
          <p className="text-sm text-muted-foreground">Upload a property photo or describe the job to generate an estimate.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6">
            <Label className="mb-2 block font-semibold">Property Photo</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Property" className="rounded-lg w-full max-h-64 object-cover" />
                <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => { setImagePreview(null); setImageBase64(null); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload photo</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <Label>Job Description</Label>
              <Textarea className="mt-1" rows={3} placeholder="e.g. Full kitchen renovation, replace cabinets and countertops, install new backsplash..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
            </div>
            <div>
              <Label>Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={analyze} disabled={analyzing} className="w-full">
              {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Estimate</>}
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div>
          {analyzing && (
            <div className="rounded-xl border bg-card p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">AI is analyzing your property...</p>
            </div>
          )}

          {result && !analyzing && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">AI Analysis</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.confidence === "high" ? "bg-green-100 text-green-700" : result.confidence === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {result.confidence} confidence
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </div>

              {/* Editable Line Items */}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Estimated Line Items</h3>
                <div className="space-y-3">
                  {editableItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        {idx === 0 && <Label className="text-xs">Description</Label>}
                        <Input value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addItem} className="mt-3">
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>

                <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                  <span>Estimated Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {result.notes && (
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{result.notes}</p>
                </div>
              )}

              <Button onClick={createQuote} className="w-full" size="lg">
                Convert to Quote
              </Button>
            </div>
          )}

          {!result && !analyzing && (
            <div className="rounded-xl border bg-card p-12 flex flex-col items-center justify-center text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Upload a photo or describe the job, then click "Generate Estimate" to get AI-powered pricing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
