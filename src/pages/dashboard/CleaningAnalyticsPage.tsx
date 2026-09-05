import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Loader2, DollarSign, CalendarCheck, TrendingUp, XCircle, AlertTriangle } from "lucide-react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(175, 60%, 45%)",
  "hsl(var(--destructive))",
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

export default function CleaningAnalyticsPage() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("6");
  const [jobs, setJobs] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!business) return;
    const load = async () => {
      const [jobRes, quoRes, invRes] = await Promise.all([
        supabase.from("jobs").select("id, status, total, created_at, completed_at").eq("business_id", business.id),
        supabase.from("quotes").select("id, status, total, created_at").eq("business_id", business.id),
        supabase.from("invoices").select("id, status, total, amount_paid, paid_at, created_at").eq("business_id", business.id),
      ]);
      setJobs(jobRes.data || []);
      setQuotes(quoRes.data || []);
      setInvoices(invRes.data || []);
      setLoading(false);
    };
    load();
  }, [business]);

  const months = parseInt(range);
  const monthLabels = useMemo(() => getMonthLabels(months), [months]);

  // KPIs
  const totalBookings = jobs.length;
  const completedJobs = jobs.filter(j => j.status === "completed");
  const cancelledJobs = jobs.filter(j => j.status === "cancelled");
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount_paid || i.total || 0), 0);
  const avgRevenuePerJob = completedJobs.length > 0
    ? completedJobs.reduce((s, j) => s + (j.total || 0), 0) / completedJobs.length
    : 0;
  const approvedQuotes = quotes.filter(q => q.status === "approved").length;
  const conversionRate = quotes.length > 0 ? Math.round((approvedQuotes / quotes.length) * 100) : 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledJobs.length / totalBookings) * 100) : 0;
  const missedRevenue = quotes.filter(q => ["declined", "expired"].includes(q.status)).reduce((s, q) => s + (q.total || 0), 0);

  // Revenue by month
  const revenueData = useMemo(() => {
    const paid = invoices.filter(i => i.status === "paid" && i.paid_at);
    const map = new Map<string, number>();
    monthLabels.forEach(l => map.set(l, 0));
    paid.forEach(i => {
      const key = new Date(i.paid_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (map.has(key)) map.set(key, map.get(key)! + (i.amount_paid || i.total || 0));
    });
    return monthLabels.map(m => ({ month: m, revenue: map.get(m) || 0 }));
  }, [invoices, monthLabels]);

  // Bookings by month
  const bookingsData = useMemo(() => {
    const map = new Map<string, number>();
    monthLabels.forEach(l => map.set(l, 0));
    jobs.forEach(j => {
      const key = new Date(j.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return monthLabels.map(m => ({ month: m, bookings: map.get(m) || 0 }));
  }, [jobs, monthLabels]);

  // Quote funnel
  const funnelData = useMemo(() => {
    const statuses = ["draft", "sent", "viewed", "approved", "declined", "expired"];
    return statuses.map(s => ({ status: s, count: quotes.filter(q => q.status === s).length }));
  }, [quotes]);

  // Job status pie
  const jobStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [jobs]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const kpis = [
    { label: "Total Bookings", value: totalBookings, icon: CalendarCheck, color: "text-primary" },
    { label: "Revenue", value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`, icon: DollarSign, color: "text-green-600" },
    { label: "Avg / Job", value: `$${avgRevenuePerJob.toFixed(0)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-accent" },
    { label: "Cancellation", value: `${cancellationRate}%`, icon: XCircle, color: "text-destructive" },
    { label: "Missed Revenue", value: `$${missedRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cleaning Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance metrics for your cleaning business</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{kpi.label}</p>
              </div>
              <p className="text-lg sm:text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Bookings</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ bookings: { label: "Bookings", color: "hsl(var(--accent))" } }} className="h-[250px] w-full">
              <LineChart data={bookingsData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="bookings" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--accent))" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Job Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {jobStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Quote Funnel</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Quotes", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
