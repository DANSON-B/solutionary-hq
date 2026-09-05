import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings as SettingsIcon, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_CONFIG, SERVICE_LABELS, FREQUENCY_LABELS, ADDON_CATEGORY_LABELS,
  type WizardConfig, type ServiceType, type Frequency, type AddOn, type CustomService,
} from "@/components/booking/cleaning-wizard/types";

export default function CleaningWizardConfigPage() {
  const isCleaning = useIsCleaning();
  const { business } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<WizardConfig | null>(null);
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [saving, setSaving] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState("");

  const loadCustomServices = async (businessId: string) => {
    const { data } = await supabase
      .from("cleaning_custom_services")
      .select("id,label,price,enabled,sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setCustomServices(
      ((data as any[]) ?? []).map((s) => ({
        id: String(s.id),
        label: String(s.label),
        price: Number(s.price) || 0,
        enabled: !!s.enabled,
      }))
    );
  };

  useEffect(() => {
    if (!business) return;
    (async () => {
      const { data } = await supabase
        .from("cleaning_wizard_config")
        .select("*")
        .eq("business_id", business.id)
        .maybeSingle();
      setConfig(data ? (data as any) : { business_id: business.id, ...DEFAULT_CONFIG });
      await loadCustomServices(business.id);
    })();
  }, [business]);

  if (!isCleaning) return <Navigate to="/dashboard" replace />;
  if (!config) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;


  const persistConfig = async (nextConfig: WizardConfig) => {
    if (!business) return;
    const payload = {
      business_id: business.id,
      services: nextConfig.services,
      frequencies: nextConfig.frequencies,
      residential_rates: nextConfig.residential_rates,
      commercial_rates: nextConfig.commercial_rates,
      condition_multipliers: nextConfig.condition_multipliers,
      residential_addons: nextConfig.residential_addons,
      commercial_addons: nextConfig.commercial_addons,
      min_residential: nextConfig.min_residential,
      min_commercial: nextConfig.min_commercial,
      hide_price_above_sqft: nextConfig.hide_price_above_sqft,
    };
    const { error } = await supabase
      .from("cleaning_wizard_config")
      .upsert([payload as any], { onConflict: "business_id" });
    return error;
  };

  const save = async () => {
    setSaving(true);
    const error = await persistConfig(config);
    setSaving(false);
    toast(error
      ? { title: "Save failed", description: error.message, variant: "destructive" }
      : { title: "Saved", description: "Booking wizard config updated." });
  };

  const toggleService = (s: ServiceType) =>
    setConfig({ ...config, services: { ...config.services, [s]: !config.services[s] } });

  const addCustomService = async () => {
    const label = customServiceName.trim().slice(0, 80);
    if (!label || !business) return;

    setSaving(true);
    const { error } = await supabase.from("cleaning_custom_services").insert({
      business_id: business.id,
      label,
      price: Math.max(0, Number.parseFloat(customServicePrice) || 0),
      enabled: true,
      sort_order: customServices.length,
    });
    if (!error) await loadCustomServices(business.id);
    setSaving(false);
    if (error) {
      toast({ title: "Service not saved", description: error.message, variant: "destructive" });
      return;
    }

    setCustomServiceName("");
    setCustomServicePrice("");
    toast({ title: "Custom service saved", description: `${label} is now active in the booking widget.` });
  };

  const updateCustomService = async (id: string, patch: Partial<CustomService>) => {
    setCustomServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const { error } = await supabase
      .from("cleaning_custom_services")
      .update(patch as any)
      .eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
  };

  const removeCustomService = async (id: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("cleaning_custom_services").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  };


  const toggleFreq = (f: Frequency) =>
    setConfig({ ...config, frequencies: { ...config.frequencies, [f]: !config.frequencies[f] } });

  const updateRate = (kind: "residential_rates" | "commercial_rates", f: Frequency, v: string) => {
    const num = parseFloat(v) || 0;
    setConfig({ ...config, [kind]: { ...config[kind], [f]: num } });
  };

  const updateAddOn = (kind: "residential_addons" | "commercial_addons", id: string, patch: Partial<AddOn>) => {
    setConfig({
      ...config,
      [kind]: config[kind].map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  const addAddOn = (kind: "residential_addons" | "commercial_addons", addon: AddOn) => {
    setConfig({ ...config, [kind]: [...config[kind], addon] });
  };

  const removeAddOn = (kind: "residential_addons" | "commercial_addons", id: string) => {
    setConfig({ ...config, [kind]: config[kind].filter((a) => a.id !== id) });
  };


  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Booking Wizard</h1>
            <p className="text-sm text-muted-foreground">Toggle services, edit pricing, and manage add-ons.</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="h-11">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="services">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="frequency">Frequency</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="res-addons">Residential Add-Ons</TabsTrigger>
          <TabsTrigger value="com-addons">Commercial Add-Ons</TabsTrigger>
          <TabsTrigger value="rules">Global Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card data-custom-service-form="true" className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add Custom Service
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Create a service and set the amount shown in your public booking widget.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end">
                <div>
                  <Label htmlFor="custom-service-name">Service name</Label>
                  <Input
                    id="custom-service-name"
                    value={customServiceName}
                    maxLength={80}
                    placeholder="e.g. Airbnb Turnover Clean"
                    onChange={(event) => setCustomServiceName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addCustomService();
                      }
                    }}
                    className="mt-1 h-12 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="custom-service-price">Price ($)</Label>
                  <Input
                    id="custom-service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={customServicePrice}
                    placeholder="0.00"
                    onChange={(event) => setCustomServicePrice(event.target.value)}
                    className="mt-1 h-12 text-base"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => void addCustomService()}
                  disabled={saving || !customServiceName.trim()}
                  className="h-12 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Add to list"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card aria-labelledby="available-services-heading">
            <CardHeader className="pb-3">
              <CardTitle id="available-services-heading">Available Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {(["residential", "deep", "move", "commercial", "post_construction"] as ServiceType[]).map((s) => (
                  <div key={s} className="flex items-center justify-between border rounded-lg p-3">
                    <span className="font-medium">{SERVICE_LABELS[s]}</span>
                    <Switch checked={config.services[s]} onCheckedChange={() => toggleService(s)} />
                  </div>
                ))}
            </CardContent>
          </Card>

          {customServices.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Custom Services</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {customServices.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 border rounded-lg p-3">
                    <Switch checked={s.enabled} onCheckedChange={(v) => updateCustomService(s.id, { enabled: v })} />
                    <Input
                      value={s.label}
                      maxLength={80}
                      onChange={(e) => updateCustomService(s.id, { label: e.target.value })}
                      className="flex-1 h-9 min-w-0"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={s.price}
                        onChange={(e) => updateCustomService(s.id, { price: parseFloat(e.target.value) || 0 })}
                        className="w-24 h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeCustomService(s.id)}
                      aria-label={`Remove ${s.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Custom services save automatically and appear in your public booking widget.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="frequency">
          <Card><CardHeader><CardTitle>Frequency Options</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(["one_time", "weekly", "biweekly", "monthly", "daily"] as Frequency[]).map((f) => (
                <div key={f} className="flex items-center justify-between border rounded-lg p-3">
                  <span className="font-medium">{FREQUENCY_LABELS[f]}</span>
                  <Switch checked={config.frequencies[f]} onCheckedChange={() => toggleFreq(f)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Residential — $/sq ft</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(["one_time", "weekly", "biweekly", "monthly", "daily"] as Frequency[]).map((f) => (
                  <div key={f}>
                    <Label>{FREQUENCY_LABELS[f]}</Label>
                    <Input type="number" step="0.01" value={config.residential_rates[f]}
                      onChange={(e) => updateRate("residential_rates", f, e.target.value)} className="mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle>Commercial — $/sq ft</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(["one_time", "weekly", "biweekly", "monthly", "daily"] as Frequency[]).map((f) => (
                  <div key={f}>
                    <Label>{FREQUENCY_LABELS[f]}</Label>
                    <Input type="number" step="0.01" value={config.commercial_rates[f]}
                      onChange={(e) => updateRate("commercial_rates", f, e.target.value)} className="mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="md:col-span-2"><CardHeader><CardTitle>Condition Multipliers</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["light", "moderate", "heavy_residential", "heavy_commercial"] as const).map((k) => (
                  <div key={k}>
                    <Label className="text-xs">{k.replace(/_/g, " ")}</Label>
                    <Input type="number" step="0.05" value={config.condition_multipliers[k]}
                      onChange={(e) => setConfig({ ...config, condition_multipliers: { ...config.condition_multipliers, [k]: parseFloat(e.target.value) || 0 } })}
                      className="mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="res-addons">
          <AddOnEditor
            list={config.residential_addons}
            onChange={(id, patch) => updateAddOn("residential_addons", id, patch)}
            onAdd={(a) => addAddOn("residential_addons", a)}
            onRemove={(id) => removeAddOn("residential_addons", id)}
          />
        </TabsContent>

        <TabsContent value="com-addons">
          <AddOnEditor
            list={config.commercial_addons}
            onChange={(id, patch) => updateAddOn("commercial_addons", id, patch)}
            onAdd={(a) => addAddOn("commercial_addons", a)}
            onRemove={(id) => removeAddOn("commercial_addons", id)}
          />
        </TabsContent>


        <TabsContent value="rules">
          <Card><CardHeader><CardTitle>Global Rules</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Minimum Residential Job ($)</Label>
                <Input type="number" value={config.min_residential}
                  onChange={(e) => setConfig({ ...config, min_residential: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Minimum Commercial Job ($)</Label>
                <Input type="number" value={config.min_commercial}
                  onChange={(e) => setConfig({ ...config, min_commercial: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Hide Price When sq ft &gt;</Label>
                <Input type="number" value={config.hide_price_above_sqft}
                  onChange={(e) => setConfig({ ...config, hide_price_above_sqft: parseInt(e.target.value) || 0 })} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Properties above this size will see "Request On-Site Quote".</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddOnEditor({
  list,
  onChange,
  onAdd,
  onRemove,
}: {
  list: AddOn[];
  onChange: (id: string, patch: Partial<AddOn>) => void;
  onAdd: (addon: AddOn) => void;
  onRemove: (id: string) => void;
}) {
  const grouped: Record<string, AddOn[]> = {};
  for (const a of list) (grouped[a.category] ||= []).push(a);
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-primary" />
            Add New Add-On
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a section, enter the service name and price, then save your changes.
          </p>
        </CardHeader>
        <CardContent>
          <AddAddOnForm categories={categories} onAdd={onAdd} defaultOpen />
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader><CardTitle className="text-base">{ADDON_CATEGORY_LABELS[cat] || cat}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-3 border rounded-lg p-3">
                <Switch checked={a.enabled} onCheckedChange={(v) => onChange(a.id, { enabled: v })} />
                <Input
                  value={a.label}
                  onChange={(e) => onChange(a.id, { label: e.target.value })}
                  className="flex-1 h-9 min-w-0"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input type="number" step="0.01" value={a.price}
                    onChange={(e) => onChange(a.id, { price: parseFloat(e.target.value) || 0 })}
                    className="w-24 h-9" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onRemove(a.id)}
                  aria-label={`Remove ${a.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <AddAddOnForm category={cat} onAdd={onAdd} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AddAddOnForm({
  category,
  categories,
  onAdd,
  defaultOpen,
}: {
  category?: string;
  categories?: string[];
  onAdd: (addon: AddOn) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const allCats = categories ?? [];
  const [cat, setCat] = useState(category ?? allCats[0] ?? "standard");

  const submit = () => {
    const trimmed = label.trim().slice(0, 80);
    if (!trimmed) return;
    onAdd({
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: trimmed,
      price: Math.max(0, parseFloat(price) || 0),
      category: category ?? cat,
      enabled: true,
    });
    setLabel("");
    setPrice("");
    if (!defaultOpen) setOpen(false);
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" /> Add service
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed p-3 space-y-3 bg-muted/30">
      {!category && allCats.length > 0 && (
        <div>
          <Label className="text-xs">Section</Label>
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 text-base"
          >
            {allCats.map((c) => (
              <option key={c} value={c}>{ADDON_CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label className="text-xs">Service name</Label>
          <Input
            value={label}
            maxLength={80}
            placeholder="e.g. Inside Windows"
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            className="mt-1 h-11"
          />
        </div>
        <div className="sm:w-32">
          <Label className="text-xs">Price ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            placeholder="0"
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 h-11"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={!label.trim()} className="h-11 flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
        {!defaultOpen && (
          <Button type="button" variant="ghost" className="h-11" onClick={() => setOpen(false)}>Cancel</Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Custom services save automatically and appear in your public booking widget.</p>
    </div>
  );
}

