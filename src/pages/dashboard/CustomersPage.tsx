import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Link as LinkIcon,
  Users,
  Dog,
  KeyRound,
  DoorOpen,
  Mail,
  MessageSquare,
  Cake,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BLANK = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  gate_code: "",
  entry_instructions: "",
  preferred_contact: "email",
  birthday: "",
  referral_source: "",
  marketing_email_consent: false,
  marketing_sms_consent: false,
  pets_text: "",
  notes: "",
  is_commercial: false,
  company_name: "",
  po_number: "",
  payment_terms_days: 0,
  billing_email: "",
};

const CLEAN_BLANK = {
  property_sqft: "",
  bedrooms: "",
  bathrooms: "",
  preferred_service_type: "standard",
};

export default function CustomersPage() {
  const { business } = useAuth();
  const isCleaning = useIsCleaning();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [cleaningForm, setCleaningForm] = useState({ ...CLEAN_BLANK });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setCustomers(data || []);
  };

  useEffect(() => {
    fetchCustomers();
  }, [business]);

  const resetForm = () => {
    setForm({ ...BLANK });
    setCleaningForm({ ...CLEAN_BLANK });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (c: any) => {
    setEditingId(c.id);
    setForm({
      first_name: c.first_name || "",
      last_name: c.last_name || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      zip: c.zip || "",
      gate_code: c.gate_code || "",
      entry_instructions: c.entry_instructions || "",
      preferred_contact: c.preferred_contact || "email",
      birthday: c.birthday || "",
      referral_source: c.referral_source || "",
      marketing_email_consent: !!c.marketing_email_consent,
      marketing_sms_consent: !!c.marketing_sms_consent,
      pets_text: Array.isArray(c.pets) ? c.pets.map((p: any) => p?.name).filter(Boolean).join(", ") : "",
      notes: c.notes || "",
      is_commercial: !!c.is_commercial,
      company_name: c.company_name || "",
      po_number: c.po_number || "",
      payment_terms_days: c.payment_terms_days || 0,
      billing_email: c.billing_email || "",
    });
    if (isCleaning) {
      const { data: d } = await supabase
        .from("cleaning_customer_details")
        .select("*")
        .eq("customer_id", c.id)
        .maybeSingle();
      setCleaningForm({
        property_sqft: d?.property_sqft?.toString() || "",
        bedrooms: d?.bedrooms?.toString() || "",
        bathrooms: d?.bathrooms?.toString() || "",
        preferred_service_type: d?.preferred_service_type || "standard",
      });
    } else {
      setCleaningForm({ ...CLEAN_BLANK });
    }
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("customers").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer deleted" });
      setCustomers((prev) => prev.filter((c) => c.id !== deleteId));
    }
    setDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !form.first_name || !form.last_name) return;

    const pets = form.pets_text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    const payload: any = {
      business_id: business.id,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      gate_code: form.gate_code || null,
      entry_instructions: form.entry_instructions || null,
      preferred_contact: form.preferred_contact,
      birthday: form.birthday || null,
      referral_source: form.referral_source || null,
      marketing_email_consent: form.marketing_email_consent,
      marketing_sms_consent: form.marketing_sms_consent,
      pets,
      notes: form.notes || null,
      is_commercial: form.is_commercial,
      company_name: form.company_name || null,
      po_number: form.po_number || null,
      payment_terms_days: form.payment_terms_days || 0,
      billing_email: form.billing_email || null,
    };

    let customerId = editingId;

    if (editingId) {
      const { error } = await supabase.from("customers").update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert(payload)
        .select("id")
        .single();
      if (error || !newCustomer) {
        toast({ title: "Error", description: error?.message, variant: "destructive" });
        return;
      }
      customerId = newCustomer.id;
    }

    if (isCleaning && customerId) {
      const cleaningPayload = {
        customer_id: customerId,
        business_id: business.id,
        property_sqft: cleaningForm.property_sqft ? Number(cleaningForm.property_sqft) : null,
        bedrooms: cleaningForm.bedrooms ? Number(cleaningForm.bedrooms) : null,
        bathrooms: cleaningForm.bathrooms ? Number(cleaningForm.bathrooms) : null,
        preferred_service_type: cleaningForm.preferred_service_type,
      };
      if (editingId) {
        const { data: existing } = await supabase
          .from("cleaning_customer_details")
          .select("id")
          .eq("customer_id", customerId)
          .maybeSingle();
        if (existing) {
          await supabase.from("cleaning_customer_details").update(cleaningPayload).eq("id", existing.id);
        } else {
          await supabase.from("cleaning_customer_details").insert(cleaningPayload);
        }
      } else {
        await supabase.from("cleaning_customer_details").insert(cleaningPayload);

        // Also seed as primary property so multi-property list is ready to use
        if (form.address) {
          await supabase.from("customer_properties").insert({
            business_id: business.id,
            customer_id: customerId,
            label: "Primary",
            address: form.address,
            city: form.city || null,
            state: form.state || null,
            zip: form.zip || null,
            bedrooms: cleaningForm.bedrooms ? Number(cleaningForm.bedrooms) : null,
            bathrooms: cleaningForm.bathrooms ? Number(cleaningForm.bathrooms) : null,
            sqft: cleaningForm.property_sqft ? Number(cleaningForm.property_sqft) : null,
            gate_code: form.gate_code || null,
            entry_instructions: form.entry_instructions || null,
            is_primary: true,
          });
        }
      }
    }

    toast({ title: editingId ? "Customer updated" : "Customer added!" });
    resetForm();
    setDialogOpen(false);
    fetchCustomers();
  };


  const generatePortalLink = async (customerId: string) => {
    if (!business) return;
    const { data: existing } = await supabase
      .from("customer_portal_tokens")
      .select("token")
      .eq("customer_id", customerId)
      .eq("business_id", business.id)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    let token = existing?.token;
    if (!token) {
      const { data: newToken, error } = await supabase
        .from("customer_portal_tokens")
        .insert({ customer_id: customerId, business_id: business.id })
        .select("token")
        .single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      token = newToken.token;
    }

    const url = `${window.location.origin}/portal/${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Portal link copied!", description: "Share this link with your customer." });
  };

  const filtered = customers.filter((c) =>
    `${c.first_name} ${c.last_name} ${c.email} ${c.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-11" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Customer" : "Add Customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    inputMode="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Street Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="h-11 text-base"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <Label>Zip</Label>
                  <Input
                    inputMode="numeric"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              {/* Property access */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" /> Property Access
                </p>
                <div>
                  <Label>Gate / Alarm Code</Label>
                  <Input
                    value={form.gate_code}
                    onChange={(e) => setForm({ ...form, gate_code: e.target.value })}
                    className="h-11 text-base"
                    placeholder="e.g. #1234"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5">
                    <DoorOpen className="h-3.5 w-3.5" /> Entry Instructions
                  </Label>
                  <Textarea
                    value={form.entry_instructions}
                    onChange={(e) => setForm({ ...form, entry_instructions: e.target.value })}
                    rows={2}
                    className="text-base"
                    placeholder="Key under mat / lockbox 8842 / doorbell 3B"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5">
                    <Dog className="h-3.5 w-3.5" /> Pets in Home
                  </Label>
                  <Input
                    value={form.pets_text}
                    onChange={(e) => setForm({ ...form, pets_text: e.target.value })}
                    className="h-11 text-base"
                    placeholder="Bella (dog, friendly), Milo (cat)"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Comma-separated names</p>
                </div>
              </div>

              {/* Preferences */}
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Preferences
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Preferred Contact</Label>
                    <Select
                      value={form.preferred_contact}
                      onValueChange={(v) => setForm({ ...form, preferred_contact: v })}
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">Text (SMS)</SelectItem>
                        <SelectItem value="phone">Phone Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5">
                      <Cake className="h-3.5 w-3.5" /> Birthday
                    </Label>
                    <Input
                      type="date"
                      value={form.birthday}
                      onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                      className="h-11 text-base"
                    />
                  </div>
                </div>
                <div>
                  <Label>How did they hear about you?</Label>
                  <Select
                    value={form.referral_source}
                    onValueChange={(v) => setForm({ ...form, referral_source: v })}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Search</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="yelp">Yelp</SelectItem>
                      <SelectItem value="nextdoor">Nextdoor</SelectItem>
                      <SelectItem value="flyer">Flyer / Mailer</SelectItem>
                      <SelectItem value="repeat">Repeat Customer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email marketing OK</span>
                    </div>
                    <Switch
                      checked={form.marketing_email_consent}
                      onCheckedChange={(v) => setForm({ ...form, marketing_email_consent: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">SMS marketing OK</span>
                    </div>
                    <Switch
                      checked={form.marketing_sms_consent}
                      onCheckedChange={(v) => setForm({ ...form, marketing_sms_consent: v })}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">🏢 Commercial account</p>
                  <Switch
                    checked={form.is_commercial}
                    onCheckedChange={(v) => setForm({ ...form, is_commercial: v })}
                  />
                </div>
                {form.is_commercial && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Company name</Label>
                      <Input
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        className="h-11 text-base"
                        placeholder="Acme Property Mgmt"
                      />
                    </div>
                    <div>
                      <Label>PO number</Label>
                      <Input
                        value={form.po_number}
                        onChange={(e) => setForm({ ...form, po_number: e.target.value })}
                        className="h-11 text-base"
                        placeholder="PO-1234"
                      />
                    </div>
                    <div>
                      <Label>Net days</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={form.payment_terms_days}
                        onChange={(e) => setForm({ ...form, payment_terms_days: parseInt(e.target.value) || 0 })}
                        className="h-11 text-base"
                        placeholder="30"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Billing email</Label>
                      <Input
                        type="email"
                        value={form.billing_email}
                        onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
                        className="h-11 text-base"
                        placeholder="ap@company.com"
                      />
                    </div>
                  </div>
                )}
              </div>



              {isCleaning && (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-semibold">🏠 Property Details</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Sq Ft</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={cleaningForm.property_sqft}
                        onChange={(e) =>
                          setCleaningForm({ ...cleaningForm, property_sqft: e.target.value })
                        }
                        className="h-11 text-base"
                        placeholder="1200"
                      />
                    </div>
                    <div>
                      <Label>Beds</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={cleaningForm.bedrooms}
                        onChange={(e) =>
                          setCleaningForm({ ...cleaningForm, bedrooms: e.target.value })
                        }
                        className="h-11 text-base"
                      />
                    </div>
                    <div>
                      <Label>Baths</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={cleaningForm.bathrooms}
                        onChange={(e) =>
                          setCleaningForm({ ...cleaningForm, bathrooms: e.target.value })
                        }
                        className="h-11 text-base"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Preferred Service</Label>
                    <Select
                      value={cleaningForm.preferred_service_type}
                      onValueChange={(v) =>
                        setCleaningForm({ ...cleaningForm, preferred_service_type: v })
                      }
                    >
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Cleaning</SelectItem>
                        <SelectItem value="deep">Deep Cleaning</SelectItem>
                        <SelectItem value="move_in_out">Move-In / Move-Out</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="text-base"
                  placeholder="Anything the crew should know"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base">
                {editingId ? "Save Changes" : "Add Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-10 h-11 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          No customers yet. Add your first customer above.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="rounded-xl border bg-card hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium p-4">Name</th>
                    <th className="text-left font-medium p-4">Contact</th>
                    <th className="text-left font-medium p-4">Address</th>
                    <th className="text-left font-medium p-4">Access</th>
                    <th className="text-right font-medium p-4">LTV</th>
                    <th className="text-right font-medium p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const petCount = Array.isArray(c.pets) ? c.pets.length : 0;
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <p className="font-medium">
                            {c.first_name} {c.last_name}
                          </p>
                          {c.referral_source && (
                            <p className="text-[11px] text-muted-foreground capitalize">
                              via {c.referral_source}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {c.email && <p className="text-xs">{c.email}</p>}
                          {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                          {!c.email && !c.phone && "—"}
                        </td>
                        <td className="p-4 text-muted-foreground">{c.address || "—"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {c.gate_code && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 text-[10px] px-2 py-0.5 font-medium">
                                <KeyRound className="h-3 w-3" />
                                {c.gate_code}
                              </span>
                            )}
                            {petCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] px-2 py-0.5 font-medium">
                                <Dog className="h-3 w-3" />
                                {petCount}
                              </span>
                            )}
                            {c.entry_instructions && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-700 text-[10px] px-2 py-0.5 font-medium">
                                <DoorOpen className="h-3 w-3" />
                                notes
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold tabular-nums">
                          ${Number(c.lifetime_value || 0).toFixed(0)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => generatePortalLink(c.id)} aria-label="Copy portal link">
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit customer">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setDeleteId(c.id)} aria-label="Delete customer" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((c) => {
              const petCount = Array.isArray(c.pets) ? c.pets.length : 0;
              return (
                <div key={c.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">
                          {c.first_name} {c.last_name}
                        </p>
                        {c.email && (
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        )}
                        {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold tabular-nums text-primary">
                        ${Number(c.lifetime_value || 0).toFixed(0)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generatePortalLink(c.id)}
                        className="h-10 w-10 p-0"
                        aria-label="Copy portal link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="flex-1 h-9">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(c.id)} className="flex-1 h-9 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                  {c.address && (
                    <p className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      📍 {c.address}
                    </p>
                  )}
                  {(c.gate_code || petCount > 0 || c.entry_instructions) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.gate_code && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 text-[10px] px-2 py-0.5 font-medium">
                          <KeyRound className="h-3 w-3" />
                          {c.gate_code}
                        </span>
                      )}
                      {petCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] px-2 py-0.5 font-medium">
                          <Dog className="h-3 w-3" />
                          {petCount} pet{petCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {c.entry_instructions && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 text-sky-700 text-[10px] px-2 py-0.5 font-medium">
                          <DoorOpen className="h-3 w-3" />
                          entry notes
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the customer and their linked details. Jobs, quotes, and invoices referencing them may be affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
