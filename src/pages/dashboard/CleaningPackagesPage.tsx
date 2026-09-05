import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Users, DollarSign, Trash2 } from "lucide-react";

const CLEANING_TYPE_LABELS: Record<string, string> = {
  standard: "Standard", deep: "Deep", move_in_out: "Move-In/Out",
};

export default function CleaningPackagesPage() {
  const isCleaning = useIsCleaning();
  const { business } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("packages");

  // Create package form
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [cleaningType, setCleaningType] = useState("standard");
  const [visitsTotal, setVisitsTotal] = useState(5);
  const [price, setPrice] = useState(0);
  const [discountPct, setDiscountPct] = useState(10);

  // Sell package form
  const [sellOpen, setSellOpen] = useState(false);
  const [sellPackageId, setSellPackageId] = useState("");
  const [sellCustomerId, setSellCustomerId] = useState("");

  useEffect(() => {
    if (!business) return;
    fetchAll();
  }, [business]);

  const fetchAll = async () => {
    if (!business) return;
    setLoading(true);
    const [pkgRes, purchRes, custRes] = await Promise.all([
      supabase.from("cleaning_packages").select("*").eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("cleaning_package_purchases").select("*, customers(first_name, last_name), cleaning_packages(name, cleaning_type)").eq("business_id", business.id).order("purchased_at", { ascending: false }),
      supabase.from("customers").select("id, first_name, last_name").eq("business_id", business.id).order("first_name"),
    ]);
    setPackages(pkgRes.data || []);
    setPurchases(purchRes.data || []);
    setCustomers(custRes.data || []);
    setLoading(false);
  };

  const handleCreatePackage = async () => {
    if (!business || !name) return;
    const { error } = await supabase.from("cleaning_packages").insert({
      business_id: business.id, name, cleaning_type: cleaningType,
      visits_total: visitsTotal, price, discount_percentage: discountPct,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Package created!" });
    setCreateOpen(false);
    setName(""); setPrice(0); setVisitsTotal(5); setDiscountPct(10);
    fetchAll();
  };

  const handleSellPackage = async () => {
    if (!business || !sellPackageId || !sellCustomerId) return;
    const pkg = packages.find((p) => p.id === sellPackageId);
    if (!pkg) return;
    const { error } = await supabase.from("cleaning_package_purchases").insert({
      business_id: business.id, customer_id: sellCustomerId, package_id: sellPackageId,
      visits_total: pkg.visits_total, price_paid: pkg.price,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Package sold!", description: `${pkg.name} assigned to customer.` });
    setSellOpen(false); setSellPackageId(""); setSellCustomerId("");
    fetchAll();
  };

  const recordVisit = async (purchaseId: string, currentUsed: number) => {
    await supabase.from("cleaning_package_purchases").update({ visits_used: currentUsed + 1, updated_at: new Date().toISOString() }).eq("id", purchaseId);
    toast({ title: "Visit recorded!" });
    fetchAll();
  };

  const togglePackageActive = async (id: string, isActive: boolean) => {
    await supabase.from("cleaning_packages").update({ is_active: !isActive }).eq("id", id);
    fetchAll();
  };

  const deletePackage = async (id: string) => {
    await supabase.from("cleaning_packages").delete().eq("id", id);
    toast({ title: "Package deleted" });
    fetchAll();
  };

  if (!isCleaning) return <Navigate to="/dashboard" replace />;
  if (loading) return <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>;

  const activePackages = packages.filter((p) => p.is_active);
  const activePurchases = purchases.filter((p) => p.status === "active" && p.visits_used < p.visits_total);
  const totalRevenue = purchases.reduce((s, p) => s + (p.price_paid || 0), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Cleaning Packages</h1>
            <p className="text-sm text-muted-foreground">Prepaid visit packages with automatic discounts</p>
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Package</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Package</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Package Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 5-Visit Deep Clean" className="mt-1" /></div>
                <div><Label>Cleaning Type</Label>
                  <Select value={cleaningType} onValueChange={setCleaningType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CLEANING_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Visits</Label><Input type="number" value={visitsTotal} onChange={(e) => setVisitsTotal(Number(e.target.value))} min={1} className="mt-1" /></div>
                  <div><Label>Total Price</Label><Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} step={0.01} className="mt-1" /></div>
                  <div><Label>Discount %</Label><Input type="number" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} min={0} max={50} className="mt-1" /></div>
                </div>
                {price > 0 && visitsTotal > 0 && (
                  <p className="text-sm text-muted-foreground">Per visit: <span className="font-medium text-primary">${(price / visitsTotal).toFixed(2)}</span></p>
                )}
                <Button onClick={handleCreatePackage} disabled={!name || price <= 0} className="w-full">Create Package</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={sellOpen} onOpenChange={setSellOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Users className="h-4 w-4 mr-1" /> Sell Package</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Sell Package to Customer</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label>Package</Label>
                  <Select value={sellPackageId} onValueChange={setSellPackageId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {activePackages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — ${p.price}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Customer</Label>
                  <Select value={sellCustomerId} onValueChange={setSellCustomerId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSellPackage} disabled={!sellPackageId || !sellCustomerId} className="w-full">Confirm Sale</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Active Packages</span></div>
          <p className="text-lg sm:text-2xl font-bold">{activePackages.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Active Subs</span></div>
          <p className="text-lg sm:text-2xl font-bold">{activePurchases.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Revenue</span></div>
          <p className="text-lg sm:text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="purchases">Customer Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4 space-y-3">
          {packages.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No packages yet</h2>
              <p className="text-muted-foreground mb-4">Create prepaid cleaning packages with volume discounts.</p>
              <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create First Package</Button>
            </CardContent></Card>
          ) : (
            packages.map((pkg) => (
              <Card key={pkg.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{pkg.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{CLEANING_TYPE_LABELS[pkg.cleaning_type] || pkg.cleaning_type}</Badge>
                        {!pkg.is_active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pkg.visits_total} visits • ${pkg.price} total • {pkg.discount_percentage}% off • ${(pkg.price / pkg.visits_total).toFixed(2)}/visit
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={pkg.is_active} onCheckedChange={() => togglePackageActive(pkg.id, pkg.is_active)} />
                      <Button size="icon" variant="ghost" onClick={() => deletePackage(pkg.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="purchases" className="mt-4 space-y-3">
          {purchases.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No purchases yet</h2>
              <p className="text-muted-foreground">Sell a package to a customer to get started.</p>
            </CardContent></Card>
          ) : (
            purchases.map((p) => {
              const customer = p.customers as any;
              const pkg = p.cleaning_packages as any;
              const remaining = p.visits_total - p.visits_used;
              const progress = (p.visits_used / p.visits_total) * 100;
              const isComplete = remaining <= 0;
              return (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{customer?.first_name} {customer?.last_name}</p>
                        <p className="text-sm text-muted-foreground">{pkg?.name}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{p.visits_used} of {p.visits_total} visits used</span>
                            <span className={isComplete ? "text-destructive" : "text-primary"}>{remaining} left</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isComplete ? "destructive" : "default"} className="text-xs">
                          {isComplete ? "Complete" : `${remaining} left`}
                        </Badge>
                        {!isComplete && (
                          <Button size="sm" onClick={() => recordVisit(p.id, p.visits_used)}>
                            Use Visit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
