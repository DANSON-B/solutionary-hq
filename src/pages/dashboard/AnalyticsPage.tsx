import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Briefcase, Users, TrendingUp, Star } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(175, 60%, 45%)",
  "hsl(var(--muted-foreground))",
];

function getMonthLabels(months: number) {
  const labels: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
  }
  return labels;
}

function groupByMonth<T extends { created_at?: string; paid_at?: string }>(
  items: T[],
  months: number,
  dateField: keyof T = "created_at" as keyof T
): Map<string, T[]> {
  const labels = getMonthLabels(months);
  const map = new Map<string, T[]>();
  labels.forEach((l) => map.set(l, []));

  items.forEach((item) => {
    const val = item[dateField] as string | undefined;
    if (!val) return;
    const d = new Date(val);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (map.has(key)) map.get(key)!.push(item);
  });

  return map;
}

export default function AnalyticsPage() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    if (!business) return;
    const load = async () => {
      const [invRes, jobRes, custRes, revRes, quoRes] = await Promise.all([
        supabase.from("invoices").select("id, total, amount_paid, status, created_at, paid_at").eq("business_id", business.id),
        supabase.from("jobs").select("id, status, created_at, completed_at, total").eq("business_id", business.id),
        supabase.from("customers").select("id, created_at").eq("business_id", business.id),
        supabase.from("reviews").select("id, rating, created_at").eq("business_id", business.id),
        supabase.from("quotes").select("id, status, total, created_at").eq("business_id", business.id),
      ]);
      setInvoices(invRes.data || []);
      setJobs(jobRes.data || []);
      setCustomers(custRes.data || []);
      setReviews(revRes.data || []);
      setQuotes(quoRes.data || []);
      setLoading(false);
    };
    load();
  }, [business]);

  const months = parseInt(range);
  const monthLabels = useMemo(() => getMonthLabels(months), [months]);

  // Revenue data
  const revenueData = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === "paid" && i.paid_at);
    const grouped = groupByMonth(paidInvoices, months, "paid_at" as any);
    return monthLabels.map((label) => ({
      month: label,
      revenue: (grouped.get(label) || []).reduce((s: number, i: any) => s + (i.amount_paid || i.total || 0), 0),
    }));
  }, [invoices, months, monthLabels]);

  // Customer acquisition
  const customerData = useMemo(() => {
    const grouped = groupByMonth(customers, months);
    return monthLabels.map((label) => ({
      month: label,
      customers: (grouped.get(label) || []).length,
    }));
  }, [customers, months, monthLabels]);

  // Job status breakdown
  const jobStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
    }));
  }, [jobs]);

  // Quote conversion
  const quoteConversion = useMemo(() => {
    const total = quotes.length;
    const approved = quotes.filter((q) => q.status === "approved").length;
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }, [quotes]);

  // KPI stats
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount_paid || i.total || 0), 0);
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Business performance overview</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`, icon: DollarSign, color: "text-green-600" },
          { label: "Completed Jobs", value: completedJobs, icon: Briefcase, color: "text-primary" },
          { label: "Total Customers", value: customers.length, icon: Users, color: "text-accent" },
          { label: "Quote Conversion", value: `${quoteConversion}%`, icon: TrendingUp, color: "text-primary" },
          { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) : "—", icon: Star, color: "text-accent" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Customer Acquisition */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ customers: { label: "Customers", color: "hsl(var(--accent))" } }} className="h-[250px] w-full">
              <LineChart data={customerData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="customers" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Job Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {jobStatusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {jobStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{item.name}</span>
                    <span className="text-muted-foreground font-medium">({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quote Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const statuses = ["draft", "sent", "viewed", "approved", "declined", "expired"];
              const data = statuses.map((s) => ({
                status: s,
                count: quotes.filter((q) => q.status === s).length,
              }));
              return (
                <ChartContainer config={{ count: { label: "Quotes", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                  <BarChart data={data} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
