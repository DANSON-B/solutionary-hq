import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  DollarSign,
  FileText,
  XCircle,
  RefreshCw,
  Send,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

interface MissedLead {
  id: string;
  type: "unbooked_quote" | "cancelled_job" | "expired_quote";
  customerName: string;
  customerEmail: string | null;
  customerId: string;
  amount: number;
  date: string;
  status: string;
  quoteNumber?: string;
  title?: string;
}

export default function MissedLeadsPage() {
  const isCleaning = useIsCleaning();
  const { business } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<MissedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!business) return;
    fetchMissedLeads();
  }, [business]);

  const fetchMissedLeads = async () => {
    if (!business) return;
    setLoading(true);

    const [quotesRes, jobsRes] = await Promise.all([
      // Unbooked/expired/declined quotes older than 2 days
      supabase
        .from("quotes")
        .select("id, quote_number, total, status, created_at, customer_id, customers(first_name, last_name, email)")
        .eq("business_id", business.id)
        .in("status", ["draft", "sent", "viewed", "declined", "expired"])
        .order("created_at", { ascending: false })
        .limit(100),
      // Cancelled jobs
      supabase
        .from("jobs")
        .select("id, title, total, status, created_at, customer_id, customers(first_name, last_name, email)")
        .eq("business_id", business.id)
        .eq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const missedLeads: MissedLead[] = [];

    // Map unbooked quotes
    for (const q of quotesRes.data || []) {
      const customer = q.customers as any;
      const type = q.status === "expired" ? "expired_quote" : "unbooked_quote";
      missedLeads.push({
        id: q.id,
        type,
        customerName: `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim(),
        customerEmail: customer?.email || null,
        customerId: q.customer_id,
        amount: q.total || 0,
        date: q.created_at,
        status: q.status,
        quoteNumber: q.quote_number,
      });
    }

    // Map cancelled jobs
    for (const j of jobsRes.data || []) {
      const customer = j.customers as any;
      missedLeads.push({
        id: j.id,
        type: "cancelled_job",
        customerName: `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim(),
        customerEmail: customer?.email || null,
        customerId: j.customer_id,
        amount: j.total || 0,
        date: j.created_at,
        status: j.status,
        title: j.title,
      });
    }

    // Sort by date descending
    missedLeads.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLeads(missedLeads);
    setLoading(false);
  };

  const resendQuote = async (lead: MissedLead) => {
    await supabase.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", lead.id);
    toast({ title: "Quote re-sent!", description: `Follow-up sent for ${lead.quoteNumber}` });
    fetchMissedLeads();
  };

  if (!isCleaning) return <Navigate to="/dashboard" replace />;

  const filtered = tab === "all" ? leads
    : tab === "unbooked" ? leads.filter((l) => l.type === "unbooked_quote")
    : tab === "cancelled" ? leads.filter((l) => l.type === "cancelled_job")
    : leads.filter((l) => l.type === "expired_quote");

  const totalMissedRevenue = leads.reduce((sum, l) => sum + l.amount, 0);
  const unbookedCount = leads.filter((l) => l.type === "unbooked_quote").length;
  const cancelledCount = leads.filter((l) => l.type === "cancelled_job").length;
  const expiredCount = leads.filter((l) => l.type === "expired_quote").length;

  const typeConfig: Record<string, { label: string; color: string; icon: typeof FileText }> = {
    unbooked_quote: { label: "Unbooked Quote", color: "bg-amber-100 text-amber-700", icon: FileText },
    cancelled_job: { label: "Cancelled Job", color: "bg-destructive/10 text-destructive", icon: XCircle },
    expired_quote: { label: "Expired Quote", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Missed Leads</h1>
            <p className="text-sm text-muted-foreground">Track and recover lost opportunities</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMissedLeads} className="sm:ml-auto">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Missed Revenue</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-destructive">${totalMissedRevenue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Unbooked</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{unbookedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Cancelled</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{cancelledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Expired</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{expiredCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="all">All ({leads.length})</TabsTrigger>
          <TabsTrigger value="unbooked">Unbooked ({unbookedCount})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledCount})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2">No missed leads</h2>
                <p className="text-muted-foreground">Great job! No lost opportunities right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((lead) => {
                const config = typeConfig[lead.type];
                const Icon = config.icon;
                return (
                  <Card key={`${lead.type}-${lead.id}`} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Lead info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {lead.customerName || "Unknown Customer"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lead.quoteNumber || lead.title || lead.id.slice(0, 8)}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary" className={`text-[10px] ${config.color}`}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(lead.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount + Actions */}
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          <span className="font-bold text-base">${lead.amount.toFixed(0)}</span>
                          <div className="flex gap-2 ml-auto sm:ml-0">
                            {lead.type === "unbooked_quote" && (
                              <Button size="sm" variant="outline" onClick={() => resendQuote(lead)}>
                                <Send className="h-3 w-3 mr-1" /> Follow Up
                              </Button>
                            )}
                            {lead.type === "unbooked_quote" && (
                              <Link to={`/dashboard/quotes/${lead.id}`}>
                                <Button size="sm">
                                  <ArrowRight className="h-3 w-3 mr-1" /> View
                                </Button>
                              </Link>
                            )}
                            {lead.type === "cancelled_job" && (
                              <Link to={`/dashboard/quotes/cleaning-quote`}>
                                <Button size="sm">
                                  <RefreshCw className="h-3 w-3 mr-1" /> Rebook
                                </Button>
                              </Link>
                            )}
                            {lead.type === "expired_quote" && (
                              <Link to={`/dashboard/quotes/${lead.id}`}>
                                <Button size="sm" variant="outline">
                                  <ArrowRight className="h-3 w-3 mr-1" /> View
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
