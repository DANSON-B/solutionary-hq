import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useNavigate } from "react-router-dom";
import { Sparkles, Calculator, Plus, Home } from "lucide-react";

interface AddOn {
  name: string;
  price: number;
}

interface PricingRule {
  id: string;
  cleaning_type: string;
  base_price: number;
  price_per_sqft: number;
  bedroom_price: number;
  bathroom_price: number;
  add_ons: AddOn[];
}

const DEFAULT_CLEANING_TYPES = ["standard", "deep", "move_in_out"];
const CLEANING_TYPE_LABELS: Record<string, string> = {
  standard: "Standard Cleaning",
  deep: "Deep Cleaning",
  move_in_out: "Move-In / Move-Out",
};

export default function CleaningQuotePage() {
  const isCleaning = useIsCleaning();
  const { business } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quote form
  const [customerId, setCustomerId] = useState("");
  const [sqft, setSqft] = useState(1000);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [cleaningType, setCleaningType] = useState("standard");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    Promise.all([
      supabase.from("cleaning_pricing_rules").select("*").eq("business_id", business.id),
      supabase.from("customers").select("id, first_name, last_name").eq("business_id", business.id).order("first_name"),
    ]).then(([rulesRes, custRes]) => {
      setPricingRules((rulesRes.data as any[]) || []);
      setCustomers(custRes.data || []);
      setLoading(false);
    });
  }, [business]);

  if (!isCleaning) return <Navigate to="/dashboard" replace />;

  const currentRule = pricingRules.find((r) => r.cleaning_type === cleaningType);
  const addOns: AddOn[] = currentRule?.add_ons && Array.isArray(currentRule.add_ons) ? currentRule.add_ons : [];

  const calculateTotal = () => {
    if (!currentRule) return 0;
    let total = currentRule.base_price;
    total += sqft * currentRule.price_per_sqft;
    total += bedrooms * currentRule.bedroom_price;
    total += bathrooms * currentRule.bathroom_price;
    for (const addOn of addOns) {
      if (selectedAddOns.includes(addOn.name)) total += addOn.price;
    }
    return Math.round(total * 100) / 100;
  };

  const total = calculateTotal();

  const handleCreateQuote = async () => {
    if (!business || !customerId) {
      toast({ title: "Select a customer", variant: "destructive" });
      return;
    }
    setSaving(true);
    const quoteNumber = `CLN-${Date.now().toString(36).toUpperCase()}`;
    const description = `${CLEANING_TYPE_LABELS[cleaningType] || cleaningType} — ${sqft} sqft, ${bedrooms} bed, ${bathrooms} bath${selectedAddOns.length ? ` + ${selectedAddOns.join(", ")}` : ""}`;

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        business_id: business.id,
        customer_id: customerId,
        quote_number: quoteNumber,
        subtotal: total,
        total: total,
        status: "draft",
        notes: description,
      })
      .select("id")
      .single();

    if (error || !quote) {
      toast({ title: "Error creating quote", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    await supabase.from("quote_items").insert({
      quote_id: quote.id,
      description,
      quantity: 1,
      unit_price: total,
      total: total,
    });

    // Save cleaning details to customer
    await supabase.from("cleaning_customer_details").upsert({
      customer_id: customerId,
      business_id: business.id,
      property_sqft: sqft,
      bedrooms,
      bathrooms,
      preferred_service_type: cleaningType,
    }, { onConflict: "customer_id" });

    toast({ title: "Cleaning quote created!" });
    navigate(`/dashboard/quotes/${quote.id}`);
  };

  const hasPricingRules = pricingRules.length > 0;

  // Seed default pricing rules
  const seedDefaults = async () => {
    if (!business) return;
    const defaults = [
      { business_id: business.id, cleaning_type: "standard", base_price: 80, price_per_sqft: 0.05, bedroom_price: 15, bathroom_price: 20, add_ons: [{ name: "Inside Fridge", price: 25 }, { name: "Inside Oven", price: 30 }, { name: "Inside Cabinets", price: 35 }, { name: "Laundry", price: 20 }, { name: "Windows (Interior)", price: 40 }] },
      { business_id: business.id, cleaning_type: "deep", base_price: 150, price_per_sqft: 0.08, bedroom_price: 25, bathroom_price: 35, add_ons: [{ name: "Inside Fridge", price: 30 }, { name: "Inside Oven", price: 35 }, { name: "Inside Cabinets", price: 40 }, { name: "Laundry", price: 25 }, { name: "Windows (Interior)", price: 50 }, { name: "Garage", price: 60 }] },
      { business_id: business.id, cleaning_type: "move_in_out", base_price: 200, price_per_sqft: 0.10, bedroom_price: 30, bathroom_price: 40, add_ons: [{ name: "Inside Fridge", price: 30 }, { name: "Inside Oven", price: 35 }, { name: "Inside Cabinets", price: 45 }, { name: "Garage", price: 75 }, { name: "Windows (All)", price: 80 }] },
    ];
    const { error } = await supabase.from("cleaning_pricing_rules").insert(defaults);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Default pricing loaded!" });
    const { data } = await supabase.from("cleaning_pricing_rules").select("*").eq("business_id", business.id);
    setPricingRules((data as any[]) || []);
  };

  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cleaning Quote Engine</h1>
          <p className="text-sm text-muted-foreground">Generate instant quotes based on property details</p>
        </div>
      </div>

      {!hasPricingRules ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Set Up Pricing Rules</h2>
            <p className="text-muted-foreground mb-4">You need pricing rules before generating quotes. Load defaults to get started.</p>
            <Button onClick={seedDefaults}><Plus className="h-4 w-4 mr-2" /> Load Default Pricing</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Customer select */}
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Property details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-4 w-4" /> Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Sq Ft</Label>
                  <Input type="number" value={sqft} onChange={(e) => setSqft(Number(e.target.value))} min={100} />
                </div>
                <div>
                  <Label>Bedrooms</Label>
                  <Input type="number" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} min={0} />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <Input type="number" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} min={0} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cleaning type */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cleaning Type</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEFAULT_CLEANING_TYPES.map((type) => {
                  const rule = pricingRules.find((r) => r.cleaning_type === type);
                  if (!rule) return null;
                  return (
                    <button
                      key={type}
                      onClick={() => { setCleaningType(type); setSelectedAddOns([]); }}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${cleaningType === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <p className="font-medium text-sm">{CLEANING_TYPE_LABELS[type]}</p>
                      <p className="text-xs text-muted-foreground mt-1">From ${rule.base_price}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Add-ons */}
          {addOns.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Add-Ons</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addOns.map((a) => (
                    <label key={a.name} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30">
                      <Checkbox
                        checked={selectedAddOns.includes(a.name)}
                        onCheckedChange={(checked) =>
                          setSelectedAddOns(checked ? [...selectedAddOns, a.name] : selectedAddOns.filter((n) => n !== a.name))
                        }
                      />
                      <span className="flex-1 text-sm">{a.name}</span>
                      <span className="text-sm font-medium text-muted-foreground">+${a.price}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total & submit */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Estimated Total</span>
                <span className="text-3xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <Button onClick={handleCreateQuote} disabled={saving || !customerId} className="w-full" size="lg">
                {saving ? "Creating..." : "Create Quote"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
