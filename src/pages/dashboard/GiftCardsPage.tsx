import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift, Plus, Search, DollarSign, CheckCircle2, Clock,
  Package, Eye, Copy, Trash2, Edit, XCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
type GiftCardPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cleaning_type: string;
  max_sqft: number;
  max_rooms: number;
  estimated_duration_minutes: number;
  rooms_included: string[] | null;
  is_active: boolean;
  created_at: string;
};

type GiftCard = {
  id: string;
  code: string;
  amount: number;
  status: string;
  cleaning_type: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_message: string | null;
  rooms_included: string[] | null;
  purchased_at: string;
  expires_at: string;
  redeemed_at: string | null;
  package_id: string | null;
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  redeemed: { label: "Redeemed", variant: "secondary" },
  expired: { label: "Expired", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "outline" },
};

// ─── Component ───────────────────────────────────────────────────
export default function GiftCardsPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bId = business?.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Package dialog
  const [pkgDialog, setPkgDialog] = useState(false);
  const [editPkg, setEditPkg] = useState<GiftCardPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: "", description: "", price: "", cleaning_type: "standard",
    max_sqft: "1500", max_rooms: "3", estimated_duration_minutes: "90",
  });

  // Custom gift card dialog
  const [gcDialog, setGcDialog] = useState(false);
  const [gcForm, setGcForm] = useState({
    buyer_name: "", buyer_email: "", buyer_phone: "",
    recipient_name: "", recipient_email: "", recipient_message: "",
    amount: "", cleaning_type: "standard",
  });

  // Detail dialog
  const [selectedGc, setSelectedGc] = useState<GiftCard | null>(null);

  // ─── Queries ─────────────────────────────────────────────────
  const { data: packages = [] } = useQuery({
    queryKey: ["gift-card-packages", bId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaning_gift_card_packages")
        .select("*")
        .eq("business_id", bId!)
        .order("price", { ascending: true });
      if (error) throw error;
      return data as GiftCardPackage[];
    },
    enabled: !!bId,
  });

  const { data: giftCards = [], isLoading } = useQuery({
    queryKey: ["gift-cards", bId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaning_gift_cards")
        .select("*")
        .eq("business_id", bId!)
        .order("purchased_at", { ascending: false });
      if (error) throw error;
      return data as GiftCard[];
    },
    enabled: !!bId,
  });

  // ─── Stats ───────────────────────────────────────────────────
  const stats = {
    total: giftCards.length,
    active: giftCards.filter((g) => g.status === "active").length,
    redeemed: giftCards.filter((g) => g.status === "redeemed").length,
    revenue: giftCards.reduce((s, g) => s + g.amount, 0),
  };

  // ─── Filtered cards ──────────────────────────────────────────
  const filteredCards = giftCards.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        g.code.toLowerCase().includes(q) ||
        g.buyer_name.toLowerCase().includes(q) ||
        g.buyer_email.toLowerCase().includes(q) ||
        (g.recipient_name?.toLowerCase().includes(q) ?? false) ||
        (g.recipient_email?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // ─── Package CRUD ────────────────────────────────────────────
  const openPkgDialog = (pkg?: GiftCardPackage) => {
    if (pkg) {
      setEditPkg(pkg);
      setPkgForm({
        name: pkg.name,
        description: pkg.description || "",
        price: String(pkg.price),
        cleaning_type: pkg.cleaning_type,
        max_sqft: String(pkg.max_sqft),
        max_rooms: String(pkg.max_rooms),
        estimated_duration_minutes: String(pkg.estimated_duration_minutes),
      });
    } else {
      setEditPkg(null);
      setPkgForm({
        name: "", description: "", price: "", cleaning_type: "standard",
        max_sqft: "1500", max_rooms: "3", estimated_duration_minutes: "90",
      });
    }
    setPkgDialog(true);
  };

  const savePkg = async () => {
    if (!bId || !pkgForm.name || !pkgForm.price) return;
    const payload = {
      business_id: bId,
      name: pkgForm.name,
      description: pkgForm.description || null,
      price: parseFloat(pkgForm.price),
      cleaning_type: pkgForm.cleaning_type,
      max_sqft: parseInt(pkgForm.max_sqft),
      max_rooms: parseInt(pkgForm.max_rooms),
      estimated_duration_minutes: parseInt(pkgForm.estimated_duration_minutes),
    };

    const { error } = editPkg
      ? await supabase.from("cleaning_gift_card_packages").update(payload).eq("id", editPkg.id)
      : await supabase.from("cleaning_gift_card_packages").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["gift-card-packages"] });
      setPkgDialog(false);
      toast({ title: editPkg ? "Package updated" : "Package created" });
    }
  };

  const togglePkgActive = async (pkg: GiftCardPackage) => {
    await supabase.from("cleaning_gift_card_packages").update({ is_active: !pkg.is_active }).eq("id", pkg.id);
    qc.invalidateQueries({ queryKey: ["gift-card-packages"] });
  };

  const deletePkg = async (id: string) => {
    await supabase.from("cleaning_gift_card_packages").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["gift-card-packages"] });
    toast({ title: "Package deleted" });
  };

  // ─── Create custom gift card ─────────────────────────────────
  const createGiftCard = async () => {
    if (!bId || !gcForm.buyer_name || !gcForm.buyer_email || !gcForm.amount) return;
    const { error } = await supabase.from("cleaning_gift_cards").insert({
      business_id: bId,
      buyer_name: gcForm.buyer_name,
      buyer_email: gcForm.buyer_email,
      buyer_phone: gcForm.buyer_phone || null,
      recipient_name: gcForm.recipient_name || null,
      recipient_email: gcForm.recipient_email || null,
      recipient_message: gcForm.recipient_message || null,
      amount: parseFloat(gcForm.amount),
      cleaning_type: gcForm.cleaning_type,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["gift-cards"] });
      setGcDialog(false);
      setGcForm({
        buyer_name: "", buyer_email: "", buyer_phone: "",
        recipient_name: "", recipient_email: "", recipient_message: "",
        amount: "", cleaning_type: "standard",
      });
      toast({ title: "Gift card created!" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code.toUpperCase());
    toast({ title: "Code copied!" });
  };

  const cancelGiftCard = async (id: string) => {
    await supabase.from("cleaning_gift_cards").update({ status: "cancelled" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["gift-cards"] });
    setSelectedGc(null);
    toast({ title: "Gift card cancelled" });
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gift Cards</h1>
          <p className="text-muted-foreground text-sm">Manage packages, view purchases, and track redemptions</p>
        </div>
        <Button onClick={() => { setGcDialog(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create Gift Card
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Gift, label: "Total Cards", value: stats.total, color: "text-primary", bg: "bg-primary/10" },
          { icon: CheckCircle2, label: "Active", value: stats.active, color: "text-green-500", bg: "bg-green-500/10" },
          { icon: Package, label: "Redeemed", value: stats.redeemed, color: "text-blue-500", bg: "bg-blue-500/10" },
          { icon: DollarSign, label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, color: "text-green-600", bg: "bg-green-600/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Purchased Cards</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        {/* ── Purchased Cards Tab ─────────────────────────────── */}
        <TabsContent value="cards" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search code, name, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="redeemed">Redeemed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">Loading…</div>
              ) : filteredCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Gift className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">No gift cards found</p>
                </div>
              ) : (
                <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Purchased</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map((gc) => {
                        const sb = STATUS_BADGE[gc.status] || STATUS_BADGE.active;
                        return (
                          <TableRow key={gc.id}>
                            <TableCell>
                              <button onClick={() => copyCode(gc.code)} className="flex items-center gap-1 font-mono text-xs hover:text-primary transition-colors" title="Copy code">
                                {gc.code.toUpperCase().slice(0, 8)}…
                                <Copy className="h-3 w-3 opacity-50" />
                              </button>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium">{gc.buyer_name}</p>
                              <p className="text-xs text-muted-foreground">{gc.buyer_email}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{gc.recipient_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{gc.recipient_email || ""}</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">${gc.amount}</TableCell>
                            <TableCell className="text-sm">{format(new Date(gc.purchased_at), "MMM d, yyyy")}</TableCell>
                            <TableCell className="text-sm">{format(new Date(gc.expires_at), "MMM d, yyyy")}</TableCell>
                            <TableCell><Badge variant={sb.variant} className="text-xs">{sb.label}</Badge></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedGc(gc)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y">
                  {filteredCards.map((gc) => {
                    const sb = STATUS_BADGE[gc.status] || STATUS_BADGE.active;
                    return (
                      <div key={gc.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <button onClick={() => copyCode(gc.code)} className="flex items-center gap-1 font-mono text-xs text-primary">
                              {gc.code.toUpperCase().slice(0, 8)}… <Copy className="h-3 w-3 opacity-60" />
                            </button>
                            <p className="mt-1 text-sm font-medium truncate">{gc.buyer_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{gc.buyer_email}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold">${gc.amount}</p>
                            <Badge variant={sb.variant} className="text-[10px] mt-1">{sb.label}</Badge>
                          </div>
                        </div>
                        {gc.recipient_name && (
                          <p className="mt-2 text-xs text-muted-foreground">To: {gc.recipient_name} {gc.recipient_email && `· ${gc.recipient_email}`}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(gc.purchased_at), "MMM d, yyyy")} → {format(new Date(gc.expires_at), "MMM d, yyyy")}
                          </p>
                          <Button size="sm" variant="outline" className="h-10" onClick={() => setSelectedGc(gc)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Packages Tab ────────────────────────────────────── */}
        <TabsContent value="packages" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => openPkgDialog()} className="gap-1.5">
              <Plus className="h-4 w-4" /> New Package
            </Button>
          </div>

          {packages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mb-3 opacity-40" />
                <p className="font-medium">No packages yet</p>
                <p className="text-sm">Create gift card packages for your booking form</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={!pkg.is_active ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{pkg.name}</CardTitle>
                        {pkg.description && <CardDescription className="text-xs mt-1">{pkg.description}</CardDescription>}
                      </div>
                      <p className="text-xl font-bold">${pkg.price}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Up to {pkg.max_sqft} sq ft</span>
                      <span>·</span>
                      <span>{pkg.max_rooms} rooms</span>
                      <span>·</span>
                      <span>~{pkg.estimated_duration_minutes} min</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch checked={pkg.is_active} onCheckedChange={() => togglePkgActive(pkg)} />
                        <span className="text-xs text-muted-foreground">{pkg.is_active ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPkgDialog(pkg)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePkg(pkg.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Package Dialog ──────────────────────────────────────── */}
      <Dialog open={pkgDialog} onOpenChange={setPkgDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPkg ? "Edit Package" : "New Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={pkgForm.name} onChange={(e) => setPkgForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Home Sparkle" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={pkgForm.description} onChange={(e) => setPkgForm((p) => ({ ...p, description: e.target.value }))} placeholder="What's included…" className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price ($)</Label>
                <Input type="number" value={pkgForm.price} onChange={(e) => setPkgForm((p) => ({ ...p, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Cleaning Type</Label>
                <Select value={pkgForm.cleaning_type} onValueChange={(v) => setPkgForm((p) => ({ ...p, cleaning_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deep">Deep Clean</SelectItem>
                    <SelectItem value="move_in_out">Move In/Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Max Sq Ft</Label>
                <Input type="number" value={pkgForm.max_sqft} onChange={(e) => setPkgForm((p) => ({ ...p, max_sqft: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Max Rooms</Label>
                <Input type="number" value={pkgForm.max_rooms} onChange={(e) => setPkgForm((p) => ({ ...p, max_rooms: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" value={pkgForm.estimated_duration_minutes} onChange={(e) => setPkgForm((p) => ({ ...p, estimated_duration_minutes: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPkgDialog(false)}>Cancel</Button>
            <Button onClick={savePkg} disabled={!pkgForm.name || !pkgForm.price}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Gift Card Dialog ─────────────────────────────── */}
      <Dialog open={gcDialog} onOpenChange={setGcDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Custom Gift Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Buyer Name *</Label>
                <Input value={gcForm.buyer_name} onChange={(e) => setGcForm((p) => ({ ...p, buyer_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Buyer Email *</Label>
                <Input type="email" value={gcForm.buyer_email} onChange={(e) => setGcForm((p) => ({ ...p, buyer_email: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Buyer Phone</Label>
              <Input value={gcForm.buyer_phone} onChange={(e) => setGcForm((p) => ({ ...p, buyer_phone: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recipient Name</Label>
                <Input value={gcForm.recipient_name} onChange={(e) => setGcForm((p) => ({ ...p, recipient_name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Recipient Email</Label>
                <Input type="email" value={gcForm.recipient_email} onChange={(e) => setGcForm((p) => ({ ...p, recipient_email: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Personal Message</Label>
              <Textarea value={gcForm.recipient_message} onChange={(e) => setGcForm((p) => ({ ...p, recipient_message: e.target.value }))} className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount ($) *</Label>
                <Input type="number" value={gcForm.amount} onChange={(e) => setGcForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Cleaning Type</Label>
                <Select value={gcForm.cleaning_type} onValueChange={(v) => setGcForm((p) => ({ ...p, cleaning_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deep">Deep Clean</SelectItem>
                    <SelectItem value="move_in_out">Move In/Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGcDialog(false)}>Cancel</Button>
            <Button onClick={createGiftCard} disabled={!gcForm.buyer_name || !gcForm.buyer_email || !gcForm.amount}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Gift Card Detail Dialog ─────────────────────────────── */}
      <Dialog open={!!selectedGc} onOpenChange={() => setSelectedGc(null)}>
        <DialogContent className="max-w-md">
          {selectedGc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift Card Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Code</p>
                    <p className="font-mono font-bold text-lg tracking-wider">{selectedGc.code.toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_BADGE[selectedGc.status]?.variant || "default"}>
                      {STATUS_BADGE[selectedGc.status]?.label || selectedGc.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(selectedGc.code)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">${selectedGc.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p>{selectedGc.cleaning_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Buyer</p>
                    <p>{selectedGc.buyer_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedGc.buyer_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recipient</p>
                    <p>{selectedGc.recipient_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{selectedGc.recipient_email || ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Purchased</p>
                    <p>{format(new Date(selectedGc.purchased_at), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p>{format(new Date(selectedGc.expires_at), "MMM d, yyyy")}</p>
                  </div>
                </div>

                {selectedGc.recipient_message && (
                  <div>
                    <p className="text-xs text-muted-foreground">Message</p>
                    <p className="italic">&ldquo;{selectedGc.recipient_message}&rdquo;</p>
                  </div>
                )}

                {selectedGc.redeemed_at && (
                  <div className="p-2 rounded bg-muted/30 text-xs">
                    Redeemed on {format(new Date(selectedGc.redeemed_at), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedGc.status === "active" && (
                  <Button variant="destructive" size="sm" onClick={() => cancelGiftCard(selectedGc.id)}>
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel Card
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
