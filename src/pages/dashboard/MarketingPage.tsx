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
import { Send, Mail, MessageSquare, Users, Gift } from "lucide-react";

type Campaign = {
  id: string; name: string; channel: "email" | "sms"; subject: string | null;
  body: string; status: string; recipient_count: number; delivered_count: number;
  failed_count: number; sent_at: string | null; created_at: string;
  audience: { inactive_days?: number; only_opted_in?: boolean };
};

export default function MarketingPage() {
  const { business } = useAuth();
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [refCustomers, setRefCustomers] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", channel: "email" as "email" | "sms", subject: "", body: "",
    inactive_days: "", only_opted_in: true,
  });

  const load = async () => {
    if (!business?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("marketing_campaigns")
      .select("*").eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setCampaigns((data as any) || []);
    const { data: refs } = await supabase
      .from("customers")
      .select("id,first_name,last_name,email,referral_code,referral_credit_cents")
      .eq("business_id", business.id)
      .not("referral_code", "is", null)
      .order("referral_credit_cents", { ascending: false })
      .limit(50);
    setRefCustomers(refs || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [business?.id]);

  const createCampaign = async () => {
    if (!business?.id || !form.name.trim() || !form.body.trim()) {
      toast.error("Name and message are required"); return;
    }
    if (form.channel === "email" && !form.subject.trim()) {
      toast.error("Subject is required for email"); return;
    }
    setCreating(true);
    const audience: any = { only_opted_in: form.only_opted_in };
    if (form.inactive_days) audience.inactive_days = Number(form.inactive_days);
    const { error } = await supabase.from("marketing_campaigns").insert({
      business_id: business.id, name: form.name, channel: form.channel,
      subject: form.subject || null, body: form.body, audience, status: "draft",
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Campaign saved as draft");
    setForm({ name: "", channel: "email", subject: "", body: "", inactive_days: "", only_opted_in: true });
    setTab("campaigns");
    load();
  };

  const send = async (c: Campaign) => {
    if (!confirm(`Send "${c.name}" now? This cannot be undone.`)) return;
    setSending(c.id);
    const { data, error } = await supabase.functions.invoke("send-marketing-campaign", {
      body: { campaign_id: c.id },
    });
    setSending(null);
    if (error) return toast.error(error.message || "Send failed");
    toast.success(`Sent to ${data?.delivered ?? 0} recipient(s)`);
    load();
  };

  const generateReferralCodes = async () => {
    if (!business?.id) return;
    const { data: missing } = await supabase.from("customers")
      .select("id,first_name,last_name")
      .eq("business_id", business.id).is("referral_code", null).limit(500);
    if (!missing?.length) return toast.info("All customers have referral codes");
    const updates = missing.map((c: any) => {
      const base = `${(c.first_name || "REF").slice(0, 4)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      return supabase.from("customers").update({ referral_code: base }).eq("id", c.id);
    });
    await Promise.all(updates);
    toast.success(`Generated ${updates.length} referral codes`);
    load();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Marketing</h1>
        <p className="text-muted-foreground">Send email campaigns and track referrals.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="campaigns"><Mail className="h-4 w-4 mr-2" />Campaigns</TabsTrigger>
          <TabsTrigger value="new"><Send className="h-4 w-4 mr-2" />New</TabsTrigger>
          <TabsTrigger value="referrals"><Gift className="h-4 w-4 mr-2" />Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-3 mt-4">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> :
            campaigns.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                No campaigns yet. Create your first one in the New tab.
              </CardContent></Card>
            ) : campaigns.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {c.channel === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                      <span className="font-semibold">{c.name}</span>
                      <Badge variant={c.status === "sent" ? "default" : c.status === "failed" ? "destructive" : "secondary"}>{c.status}</Badge>
                    </div>
                    {c.subject && <div className="text-sm text-muted-foreground mt-1">Subject: {c.subject}</div>}
                    <div className="text-xs text-muted-foreground mt-1">
                      {c.recipient_count} recipients · {c.delivered_count} delivered · {c.failed_count} failed
                      {c.sent_at && <> · sent {new Date(c.sent_at).toLocaleString()}</>}
                    </div>
                  </div>
                  {c.status === "draft" && (
                    <Button onClick={() => send(c)} disabled={sending === c.id} className="h-12">
                      <Send className="h-4 w-4 mr-2" />{sending === c.id ? "Sending..." : "Send now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          }
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader><CardTitle>New campaign</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Name (internal)</Label>
                  <Input className="h-12 text-base" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Spring cleaning promo" />
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select value={form.channel} onValueChange={(v: any) => setForm({ ...form, channel: v })}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms" disabled>SMS (coming soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.channel === "email" && (
                <div>
                  <Label>Subject</Label>
                  <Input className="h-12 text-base" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="15% off your next clean" />
                </div>
              )}
              <div>
                <Label>Message body</Label>
                <Textarea rows={8} value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  placeholder={`Hi {{first_name}},\n\nWe're offering 15% off cleanings booked this month...`} />
                <p className="text-xs text-muted-foreground mt-1">Use {"{{first_name}}"} or {"{{last_name}}"} for personalization.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Only inactive customers (days)</Label>
                  <Input type="number" className="h-12 text-base" value={form.inactive_days}
                    onChange={e => setForm({ ...form, inactive_days: e.target.value })}
                    placeholder="Leave blank for all" />
                </div>
                <div className="flex items-end gap-2">
                  <input id="optin" type="checkbox" checked={form.only_opted_in}
                    onChange={e => setForm({ ...form, only_opted_in: e.target.checked })}
                    className="h-5 w-5" />
                  <Label htmlFor="optin">Only send to customers with marketing consent</Label>
                </div>
              </div>
              <Button onClick={createCampaign} disabled={creating} className="h-12 w-full md:w-auto">
                {creating ? "Saving..." : "Save as draft"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="mt-4 space-y-3">
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Referral program</p>
                <p className="text-sm text-muted-foreground">Assign a unique code to every customer so you can track word-of-mouth signups.</p>
              </div>
              <Button onClick={generateReferralCodes} className="h-12">
                <Users className="h-4 w-4 mr-2" />Generate missing codes
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top referrers</CardTitle></CardHeader>
            <CardContent>
              {refCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No referral codes yet.</p>
              ) : (
                <div className="space-y-2">
                  {refCustomers.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded border">
                      <div>
                        <div className="font-medium">{c.first_name} {c.last_name}</div>
                        <div className="text-xs text-muted-foreground">Code: <span className="font-mono">{c.referral_code}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${((c.referral_credit_cents || 0) / 100).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">credit</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
