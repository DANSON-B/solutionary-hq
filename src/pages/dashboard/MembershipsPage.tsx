import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Crown, Users, Plus, Trash2 } from "lucide-react";

type Plan = {
  id: string; name: string; description: string | null; price_cents: number;
  billing_period: string; member_discount_percent: number; included_visits: number;
  perks: string[]; is_active: boolean;
};
type Enrollment = {
  id: string; customer_id: string; membership_id: string; status: string;
  started_at: string; renews_at: string | null; visits_used_this_period: number;
  customers: { first_name: string; last_name: string; email: string | null } | null;
  memberships: { name: string; price_cents: number } | null;
};

export default function MembershipsPage() {
  const { business } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [enrolls, setEnrolls] = useState<Enrollment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "", description: "", price_cents: 9900, billing_period: "monthly",
    member_discount_percent: 10, included_visits: 1, perks: "",
  });
  const [enroll, setEnroll] = useState({ customer_id: "", membership_id: "" });

  const load = async () => {
    if (!business?.id) return;
    setLoading(true);
    const [p, e, c] = await Promise.all([
      supabase.from("memberships").select("*").eq("business_id", business.id).order("created_at"),
      supabase.from("customer_memberships")
        .select("*, customers(first_name,last_name,email), memberships(name,price_cents)")
        .eq("business_id", business.id).order("created_at", { ascending: false }),
      supabase.from("customers").select("id,first_name,last_name,email").eq("business_id", business.id).order("first_name"),
    ]);
    setPlans((p.data as any) || []);
    setEnrolls((e.data as any) || []);
    setCustomers(c.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [business?.id]);

  const createPlan = async () => {
    if (!business?.id || !form.name.trim()) return toast.error("Name required");
    const perks = form.perks.split("\n").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("memberships").insert({
      business_id: business.id, name: form.name, description: form.description,
      price_cents: form.price_cents, billing_period: form.billing_period,
      member_discount_percent: form.member_discount_percent, included_visits: form.included_visits,
      perks, is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Plan created");
    setForm({ name: "", description: "", price_cents: 9900, billing_period: "monthly", member_discount_percent: 10, included_visits: 1, perks: "" });
    load();
  };

  const togglePlan = async (p: Plan) => {
    await supabase.from("memberships").update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  };
  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    const { error } = await supabase.from("memberships").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const enrollCustomer = async () => {
    if (!business?.id || !enroll.customer_id || !enroll.membership_id) return toast.error("Pick customer + plan");
    const plan = plans.find(p => p.id === enroll.membership_id);
    const renews = plan?.billing_period === "yearly" ? 365 : plan?.billing_period === "quarterly" ? 90 : 30;
    const { error } = await supabase.from("customer_memberships").insert({
      business_id: business.id, customer_id: enroll.customer_id, membership_id: enroll.membership_id,
      status: "active", renews_at: new Date(Date.now() + renews * 86400_000).toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Customer enrolled");
    setEnroll({ customer_id: "", membership_id: "" });
    load();
  };

  const cancelEnroll = async (id: string) => {
    if (!confirm("Cancel this membership?")) return;
    await supabase.from("customer_memberships").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Memberships</h1>
        <p className="text-muted-foreground">Recurring customer plans with member pricing and perks.</p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans"><Crown className="h-4 w-4 mr-2" />Plans</TabsTrigger>
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" />Enrolled ({enrolls.filter(e => e.status === "active").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Create a plan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Name</Label><Input className="h-12" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sparkle Club" /></div>
                <div>
                  <Label>Billing</Label>
                  <Select value={form.billing_period} onValueChange={v => setForm({ ...form, billing_period: v })}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Price (USD)</Label><Input type="number" step="0.01" className="h-12" value={form.price_cents / 100} onChange={e => setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })} /></div>
                <div><Label>Member discount %</Label><Input type="number" className="h-12" value={form.member_discount_percent} onChange={e => setForm({ ...form, member_discount_percent: Number(e.target.value) })} /></div>
                <div><Label>Included visits / period</Label><Input type="number" className="h-12" value={form.included_visits} onChange={e => setForm({ ...form, included_visits: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Description</Label><Input className="h-12" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Perks (one per line)</Label>
                <Textarea rows={3} value={form.perks} onChange={e => setForm({ ...form, perks: e.target.value })} placeholder={"Priority scheduling\n10% off deep cleans\nFree touch-ups"} />
              </div>
              <Button onClick={createPlan} className="h-12"><Plus className="h-4 w-4 mr-2" />Create plan</Button>
            </CardContent>
          </Card>

          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> :
            plans.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{p.name}</span>
                      <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Paused"}</Badge>
                    </div>
                    <div className="text-sm mt-1">
                      ${(p.price_cents / 100).toFixed(2)} / {p.billing_period} · {p.member_discount_percent}% off · {p.included_visits} visit(s)
                    </div>
                    {p.perks?.length > 0 && <div className="text-xs text-muted-foreground mt-1">{p.perks.join(" • ")}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => togglePlan(p)}>{p.is_active ? "Pause" : "Activate"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePlan(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Enroll a customer</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <Select value={enroll.customer_id} onValueChange={v => setEnroll({ ...enroll, customer_id: v })}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={enroll.membership_id} onValueChange={v => setEnroll({ ...enroll, membership_id: v })}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.is_active).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={enrollCustomer} className="h-12">Enroll</Button>
            </CardContent>
          </Card>
          {enrolls.map(e => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-semibold">{e.customers?.first_name} {e.customers?.last_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {e.memberships?.name} · <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
                    {e.renews_at && <> · renews {new Date(e.renews_at).toLocaleDateString()}</>}
                  </div>
                  <div className="text-xs text-muted-foreground">Visits used: {e.visits_used_this_period}</div>
                </div>
                {e.status === "active" && <Button size="sm" variant="outline" onClick={() => cancelEnroll(e.id)}>Cancel</Button>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
