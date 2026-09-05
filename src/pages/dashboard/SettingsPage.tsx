import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Upload, Building2, Receipt, Bell, Code2, Copy, CreditCard, ExternalLink, History, AlertTriangle } from "lucide-react";
import EmbedShareTab from "@/components/dashboard/settings/EmbedShareTab";
import { CleaningBookingSettings } from "@/components/dashboard/cleaning/CleaningBookingSettings";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { industries } from "@/data/industries";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const CLEANING_KEYWORDS = ["clean", "janitorial", "maid", "housekeeping"];
const isCleaningIndustry = (v: string) =>
  !!v && CLEANING_KEYWORDS.some((k) => v.toLowerCase().includes(k));

export default function SettingsPage() {
  const { business, user, refreshBusiness, subscription } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [industryLog, setIndustryLog] = useState<any[]>([]);
  const [pendingIndustry, setPendingIndustry] = useState<string | null>(null);
  const [industryReason, setIndustryReason] = useState("");
  const [switchingIndustry, setSwitchingIndustry] = useState(false);

  // Business profile fields
  const [biz, setBiz] = useState({
    name: "", email: "", phone: "", website: "",
    address: "", city: "", state: "", zip: "",
    industry: "", logo_url: "", slug: "",
  });

  // Settings fields
  const [settings, setSettings] = useState({
    default_tax_rate: 0,
    quote_valid_days: 30,
    invoice_due_days: 30,
    auto_review_request: true,
    quote_footer_note: "",
    invoice_footer_note: "",
    checklists_enabled: true,
    checklist_block_completion: false,
    checklist_customer_visible: true,
    auto_reschedule_on_cancel: false,
    require_geofence: false,
    geofence_radius_meters: 150,
  });

  useEffect(() => {
    if (!business) return;
    setBiz({
      name: business.name || "",
      email: business.email || "",
      phone: business.phone || "",
      website: business.website || "",
      address: business.address || "",
      city: business.city || "",
      state: business.state || "",
      zip: business.zip || "",
      industry: business.industry || "",
      logo_url: business.logo_url || "",
      slug: business.slug || "",
    });

    supabase
      .from("business_settings")
      .select("*")
      .eq("business_id", business.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings({
            default_tax_rate: data.default_tax_rate ?? 0,
            quote_valid_days: data.quote_valid_days ?? 30,
            invoice_due_days: data.invoice_due_days ?? 30,
            auto_review_request: data.auto_review_request ?? true,
            quote_footer_note: data.quote_footer_note ?? "",
            invoice_footer_note: data.invoice_footer_note ?? "",
            checklists_enabled: (data as any).checklists_enabled ?? true,
            checklist_block_completion: (data as any).checklist_block_completion ?? false,
            checklist_customer_visible: (data as any).checklist_customer_visible ?? true,
            auto_reschedule_on_cancel: (data as any).auto_reschedule_on_cancel ?? false,
            require_geofence: (data as any).require_geofence ?? false,
            geofence_radius_meters: (data as any).geofence_radius_meters ?? 150,
          });
        }
        setLoading(false);
      });

    supabase
      .from("industry_change_log" as any)
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setIndustryLog((data as any[]) || []));
  }, [business]);

  const commitIndustryChange = async () => {
    if (!business || !pendingIndustry || !user) return;
    setSwitchingIndustry(true);
    const oldIndustry = business.industry || null;
    const newIndustry = pendingIndustry;

    // Tenant-safe: scoped to this business_id only
    const { error: bizErr } = await supabase
      .from("businesses")
      .update({ industry: newIndustry })
      .eq("id", business.id);

    if (bizErr) {
      toast({ title: "Update failed", description: bizErr.message, variant: "destructive" });
      setSwitchingIndustry(false);
      return;
    }

    // Audit log
    await supabase.from("industry_change_log" as any).insert({
      business_id: business.id,
      changed_by: user.id,
      old_industry: oldIndustry,
      new_industry: newIndustry,
      reason: industryReason.trim() || null,
    });

    // Industry-specific setup: seed cleaning defaults when switching into cleaning
    if (isCleaningIndustry(newIndustry) && !isCleaningIndustry(oldIndustry || "")) {
      await supabase
        .from("cleaning_booking_settings")
        .upsert(
          { business_id: business.id, require_deposit: false, deposit_percentage: 25, buffer_minutes: 30, allow_recurring: true, cancellation_policy: "Free cancellation up to 24 hours before the scheduled time." },
          { onConflict: "business_id" }
        );
    }

    setBiz((p) => ({ ...p, industry: newIndustry }));
    await refreshBusiness();

    // Reload log
    const { data: logData } = await supabase
      .from("industry_change_log" as any)
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setIndustryLog((logData as any[]) || []);

    toast({ title: "Industry updated", description: `Now set to ${newIndustry}. Industry-specific features refreshed.` });
    setPendingIndustry(null);
    setIndustryReason("");
    setSwitchingIndustry(false);
  };

  const saveProfile = async () => {
    if (!business) return;
    setSaving(true);

    // Validate slug uniqueness if changed
    if (biz.slug && biz.slug !== business.slug) {
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("slug", biz.slug)
        .neq("id", business.id)
        .maybeSingle();

      if (existing) {
        toast({ title: "Slug already taken", description: "Please choose a different URL slug.", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("businesses")
      .update(biz)
      .eq("id", business.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
      await refreshBusiness();
    }
    setSaving(false);
  };

  const saveSettings = async () => {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase
      .from("business_settings")
      .upsert(
        {
          ...settings,
          business_id: business.id,
        },
        { onConflict: "business_id" }
      );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${business.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("business-assets")
      .getPublicUrl(path);

    const logoUrl = urlData.publicUrl;
    setBiz((prev) => ({ ...prev, logo_url: logoUrl }));

    await supabase.from("businesses").update({ logo_url: logoUrl }).eq("id", business.id);
    await refreshBusiness();
    toast({ title: "Logo updated" });
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
          <TabsList className="w-max md:w-auto">
            <TabsTrigger value="profile" className="gap-1.5">
              <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Company Profile</span><span className="sm:hidden">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <Receipt className="h-4 w-4" /> <span className="hidden sm:inline">Tax & Billing</span><span className="sm:hidden">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-4 w-4" /> <span className="hidden sm:inline">Preferences</span><span className="sm:hidden">Prefs</span>
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-1.5">
              <Code2 className="h-4 w-4" /> <span className="hidden sm:inline">Embed & Share</span><span className="sm:hidden">Embed</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5">
              <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Subscription</span><span className="sm:hidden">Plan</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* COMPANY PROFILE */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Logo</CardTitle>
              <CardDescription>Upload your company logo to appear on quotes, invoices, and the customer portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                  {biz.logo_url ? (
                    <img src={biz.logo_url} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    {uploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input id="name" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={biz.industry}
                    onValueChange={(v) => {
                      if (v && v !== (business?.industry || "")) {
                        setPendingIndustry(v);
                      } else {
                        setBiz({ ...biz, industry: v });
                      }
                    }}
                  >
                    <SelectTrigger id="industry"><SelectValue placeholder="Select your industry" /></SelectTrigger>
                    <SelectContent>
                      {industries.map((i) => (
                        <SelectItem key={i.slug} value={i.name}>{i.name}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Changing this updates industry-specific features (e.g. Cleaning tools).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={biz.email} onChange={(e) => setBiz({ ...biz, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={biz.phone} onChange={(e) => setBiz({ ...biz, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={biz.website} onChange={(e) => setBiz({ ...biz, website: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={biz.slug}
                    onChange={(e) => setBiz({ ...biz, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="my-business"
                  />
                  {biz.slug && (
                    <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Your Public URLs</p>
                      {[
                        { label: "InstaQuote", url: `${window.location.origin}/q/${biz.slug}` },
                        { label: "Booking", url: `${window.location.origin}/book/${biz.slug}` },
                      ].map(({ label, url }) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="text-xs font-medium shrink-0 w-20">{label}:</span>
                          <code className="text-xs bg-background border rounded px-2 py-1 truncate flex-1 min-w-0">{url}</code>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 h-7 px-2"
                            onClick={() => { navigator.clipboard.writeText(url); toast({ title: `${label} URL copied!` }); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Letters, numbers, and hyphens only. Used for your public-facing forms.</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" value={biz.address} onChange={(e) => setBiz({ ...biz, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={biz.city} onChange={(e) => setBiz({ ...biz, city: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={biz.state} onChange={(e) => setBiz({ ...biz, state: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input id="zip" value={biz.zip} onChange={(e) => setBiz({ ...biz, zip: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Industry Change Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Industry Change Audit Log
              </CardTitle>
              <CardDescription>A tenant-safe history of every industry change made to this business.</CardDescription>
            </CardHeader>
            <CardContent>
              {industryLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No industry changes recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {industryLog.map((entry) => (
                    <li key={entry.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border bg-muted/30 p-3">
                      <div className="text-sm">
                        <span className="font-medium">{entry.old_industry || "—"}</span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="font-medium text-primary">{entry.new_industry}</span>
                        {entry.reason && <p className="text-xs text-muted-foreground mt-1">"{entry.reason}"</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), "MMM d, yyyy h:mm a")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Confirm Industry Change */}
        <AlertDialog open={!!pendingIndustry} onOpenChange={(o) => { if (!o) { setPendingIndustry(null); setIndustryReason(""); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Industry Change
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm">
                  <p>
                    You're switching from <strong>{business?.industry || "—"}</strong> to <strong>{pendingIndustry}</strong>.
                  </p>
                  <p className="text-muted-foreground">
                    This updates only your business ({business?.name}). Industry-specific tools (like Cleaning module features) will re-enable to match the new selection. Other tenants are unaffected.
                  </p>
                  {isCleaningIndustry(pendingIndustry || "") && !isCleaningIndustry(business?.industry || "") && (
                    <p className="rounded-md bg-primary/10 text-primary p-2 text-xs">
                      Cleaning defaults (booking settings, buffer time, cancellation policy) will be seeded automatically.
                    </p>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="reason" className="text-xs">Reason (optional, saved to audit log)</Label>
                    <Textarea
                      id="reason"
                      rows={2}
                      value={industryReason}
                      onChange={(e) => setIndustryReason(e.target.value)}
                      placeholder="e.g., Selected wrong industry during onboarding"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={switchingIndustry}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => { e.preventDefault(); commitIndustryChange(); }} disabled={switchingIndustry}>
                {switchingIndustry ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Confirm & Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {/* TAX & BILLING */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Tax & Terms</CardTitle>
              <CardDescription>These defaults apply to new quotes and invoices. You can override them per document.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={settings.default_tax_rate}
                    onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quoteValid">Quote Valid (days)</Label>
                  <Input
                    id="quoteValid"
                    type="number"
                    min={1}
                    value={settings.quote_valid_days}
                    onChange={(e) => setSettings({ ...settings, quote_valid_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDue">Invoice Due (days)</Label>
                  <Input
                    id="invoiceDue"
                    type="number"
                    min={1}
                    value={settings.invoice_due_days}
                    onChange={(e) => setSettings({ ...settings, invoice_due_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quoteFooter">Quote Footer Note</Label>
                  <Textarea
                    id="quoteFooter"
                    placeholder="e.g., Thank you for your business! This quote is valid for the period listed above."
                    value={settings.quote_footer_note}
                    onChange={(e) => setSettings({ ...settings, quote_footer_note: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceFooter">Invoice Footer Note</Label>
                  <Textarea
                    id="invoiceFooter"
                    placeholder="e.g., Payment is due within the terms listed above. Late payments may incur a fee."
                    value={settings.invoice_footer_note}
                    onChange={(e) => setSettings({ ...settings, invoice_footer_note: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automation Preferences</CardTitle>
              <CardDescription>Control automated actions triggered by your workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto Review Requests</p>
                  <p className="text-xs text-muted-foreground">Automatically generate review request links when a job is marked as completed.</p>
                </div>
                <Switch
                  checked={settings.auto_review_request}
                  onCheckedChange={(v) => setSettings({ ...settings, auto_review_request: v })}
                />
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Cleaning Checklists</p>
                    <p className="text-xs text-muted-foreground">Show room-by-room checklists on jobs so techs can complete work consistently.</p>
                  </div>
                  <Switch
                    checked={settings.checklists_enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, checklists_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Block Job Completion Until Done</p>
                    <p className="text-xs text-muted-foreground">Prevent techs from marking jobs Completed while required items or required photos are missing.</p>
                  </div>
                  <Switch
                    disabled={!settings.checklists_enabled}
                    checked={settings.checklist_block_completion}
                    onCheckedChange={(v) => setSettings({ ...settings, checklist_block_completion: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Share Completed Checklist With Customers</p>
                    <p className="text-xs text-muted-foreground">Include the completed checklist in the customer portal after a job is finished.</p>
                  </div>
                  <Switch
                    disabled={!settings.checklists_enabled}
                    checked={settings.checklist_customer_visible}
                    onCheckedChange={(v) => setSettings({ ...settings, checklist_customer_visible: v })}
                  />
                </div>

                <div className="pt-4 mt-2 border-t space-y-4">
                  <p className="text-sm font-semibold">Operations</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Auto-reschedule on cancel</p>
                      <p className="text-xs text-muted-foreground">When a customer cancels a recurring visit, automatically push it to the next available slot.</p>
                    </div>
                    <Switch
                      checked={settings.auto_reschedule_on_cancel}
                      onCheckedChange={(v) => setSettings({ ...settings, auto_reschedule_on_cancel: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Require GPS geofence for clock-in</p>
                      <p className="text-xs text-muted-foreground">Warn techs when clocking in outside the job's location radius.</p>
                    </div>
                    <Switch
                      checked={settings.require_geofence}
                      onCheckedChange={(v) => setSettings({ ...settings, require_geofence: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">Geofence radius (meters)</p>
                      <p className="text-xs text-muted-foreground">Acceptable distance from the job address for a valid clock-in.</p>
                    </div>
                    <Input
                      type="number" min={25} max={2000}
                      className="w-28"
                      disabled={!settings.require_geofence}
                      value={settings.geofence_radius_meters}
                      onChange={(e) => setSettings({ ...settings, geofence_radius_meters: parseInt(e.target.value) || 150 })}
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/dashboard/checklist-templates">Manage checklist templates →</a>
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <CleaningBookingSettings />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Email:</span> {user?.email}</p>
                <p className="text-sm"><span className="text-muted-foreground">Account created:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMBED & SHARE */}
        <TabsContent value="embed">
          <EmbedShareTab businessSlug={business?.slug || null} />
        </TabsContent>

        {/* SUBSCRIPTION */}
        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionManagement subscription={subscription} toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubscriptionManagement({ subscription, toast }: { subscription: any; toast: any }) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const tierOrder: Array<keyof typeof SUBSCRIPTION_TIERS> = ["starter", "professional", "business"];
  const currentKey = subscription.plan as keyof typeof SUBSCRIPTION_TIERS | null;
  const currentTier = currentKey ? SUBSCRIPTION_TIERS[currentKey] : null;
  const currentIndex = currentKey ? tierOrder.indexOf(currentKey) : -1;

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to open billing portal", variant: "destructive" });
    }
    setLoadingPortal(false);
  };

  const handleSwitchPlan = async (priceId: string, tierKey: string) => {
    setSwitchingTo(tierKey);
    try {
      // If user has no active sub, send them through checkout. Otherwise route through portal.
      if (!subscription.subscribed) {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { price_id: priceId },
        });
        if (error) throw error;
        if (data?.url) window.location.href = data.url;
      } else {
        const { data, error } = await supabase.functions.invoke("customer-portal");
        if (error) throw error;
        if (data?.url) window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to change plan", variant: "destructive" });
    }
    setSwitchingTo(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Subscription</CardTitle>
          <CardDescription>Your active plan and billing status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="font-semibold text-lg">{currentTier?.name ?? "No plan"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{subscription.status ?? "—"}</p>
            </div>
            {subscription.trialEnd && subscription.status === "trialing" && (
              <div>
                <p className="text-sm text-muted-foreground">Trial Ends</p>
                <p className="font-semibold">{new Date(subscription.trialEnd).toLocaleDateString()}</p>
              </div>
            )}
            {subscription.subscriptionEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Current Period Ends</p>
                <p className="font-semibold">{new Date(subscription.subscriptionEnd).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleManageSubscription} disabled={loadingPortal} variant="outline">
              {loadingPortal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Billing Portal (Update card / Cancel)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use the billing portal to update your payment method, download invoices, or cancel.
            To upgrade or downgrade, choose a plan below.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Plan</CardTitle>
          <CardDescription>Upgrade or downgrade at any time. Changes are prorated by Stripe.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tierOrder.map((key, idx) => {
              const tier = SUBSCRIPTION_TIERS[key];
              const isCurrent = key === currentKey;
              const isUpgrade = currentIndex >= 0 && idx > currentIndex;
              const isDowngrade = currentIndex >= 0 && idx < currentIndex;
              const label = isCurrent
                ? "Current Plan"
                : isUpgrade
                ? `Upgrade to ${tier.name}`
                : isDowngrade
                ? `Downgrade to ${tier.name}`
                : `Choose ${tier.name}`;
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-4 flex flex-col ${
                    isCurrent ? "border-accent ring-2 ring-accent bg-accent/5" : ""
                  }`}
                >
                  <p className="font-semibold">{tier.name}</p>
                  <p className="text-2xl font-extrabold mt-1">
                    ${tier.price}
                    <span className="text-sm text-muted-foreground font-normal">/mo</span>
                  </p>
                  <ul className="text-xs text-muted-foreground mt-3 space-y-1 flex-1">
                    {tier.features.slice(0, 4).map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    variant={isCurrent ? "secondary" : isUpgrade ? "default" : "outline"}
                    disabled={isCurrent || switchingTo !== null}
                    onClick={() => handleSwitchPlan(tier.price_id, key)}
                  >
                    {switchingTo === key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {label}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
