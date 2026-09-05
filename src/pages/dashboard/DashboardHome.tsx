import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, Briefcase, CreditCard, Users, Plus, TrendingUp,
  CalendarPlus, UserPlus, Star, ArrowRight, Clock, DollarSign,
  CheckCircle2, AlertCircle, Globe, Sparkles
} from "lucide-react";
import { format } from "date-fns";

interface ActivityItem {
  id: string;
  type: "quote" | "job" | "invoice" | "review";
  title: string;
  subtitle: string;
  status: string;
  date: string;
  link: string;
}

export default function DashboardHome() {
  const { business } = useAuth();
  const [stats, setStats] = useState({
    quotes: 0, jobs: 0, invoices: 0, customers: 0, revenue: 0,
    activeJobs: 0, pendingInvoices: 0, conversionRate: 0,
    monthRevenue: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;

    const fetchAll = async () => {
      setLoading(true);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [q, j, i, c, activeJ, pendingI, approvedQ, paidInv, monthPaid, recentQuotes, recentJobs, recentInvoices, recentReviews] = await Promise.all([
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("business_id", business.id),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("business_id", business.id).in("status", ["scheduled", "in_progress"]),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("business_id", business.id).in("status", ["sent", "overdue"]),
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "approved"),
        supabase.from("invoices").select("total").eq("business_id", business.id).eq("status", "paid"),
        supabase.from("invoices").select("total").eq("business_id", business.id).eq("status", "paid").gte("paid_at", monthStart),
        // Recent activity
        supabase.from("quotes").select("id, quote_number, status, created_at, customers(first_name, last_name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("jobs").select("id, title, status, created_at, customers(first_name, last_name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("invoices").select("id, invoice_number, status, total, created_at, customers(first_name, last_name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(3),
        supabase.from("reviews").select("id, rating, comment, created_at, customers(first_name, last_name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(3),
      ]);

      const totalRevenue = (paidInv.data || []).reduce((sum, inv) => sum + (inv.total || 0), 0);
      const monthRev = (monthPaid.data || []).reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalQuotes = q.count || 0;
      const approvedQuotes = approvedQ.count || 0;
      const conversion = totalQuotes > 0 ? Math.round((approvedQuotes / totalQuotes) * 100) : 0;

      setStats({
        quotes: totalQuotes,
        jobs: j.count || 0,
        invoices: i.count || 0,
        customers: c.count || 0,
        revenue: totalRevenue,
        activeJobs: activeJ.count || 0,
        pendingInvoices: pendingI.count || 0,
        conversionRate: conversion,
        monthRevenue: monthRev,
      });

      // Build activity feed
      const items: ActivityItem[] = [];

      (recentQuotes.data || []).forEach((q: any) => {
        items.push({
          id: q.id,
          type: "quote",
          title: `Quote ${q.quote_number}`,
          subtitle: `${q.customers?.first_name || ""} ${q.customers?.last_name || ""}`.trim(),
          status: q.status,
          date: q.created_at,
          link: `/dashboard/quotes/${q.id}`,
        });
      });

      (recentJobs.data || []).forEach((j: any) => {
        items.push({
          id: j.id,
          type: "job",
          title: j.title,
          subtitle: `${j.customers?.first_name || ""} ${j.customers?.last_name || ""}`.trim(),
          status: j.status,
          date: j.created_at,
          link: `/dashboard/jobs/${j.id}`,
        });
      });

      (recentInvoices.data || []).forEach((inv: any) => {
        items.push({
          id: inv.id,
          type: "invoice",
          title: `Invoice ${inv.invoice_number}`,
          subtitle: `${inv.customers?.first_name || ""} ${inv.customers?.last_name || ""}`.trim() + (inv.total ? ` · $${inv.total.toFixed(2)}` : ""),
          status: inv.status,
          date: inv.created_at,
          link: `/dashboard/invoices`,
        });
      });

      (recentReviews.data || []).forEach((r: any) => {
        items.push({
          id: r.id,
          type: "review",
          title: `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}`,
          subtitle: `${r.customers?.first_name || ""} ${r.customers?.last_name || ""}`.trim() + (r.comment ? ` — "${r.comment.slice(0, 40)}${r.comment.length > 40 ? "…" : ""}"` : ""),
          status: "review",
          date: r.created_at,
          link: `/dashboard/reviews`,
        });
      });

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(items.slice(0, 8));
      setLoading(false);
    };

    fetchAll();
  }, [business]);

  const statCards = [
    { label: "Total Revenue", value: `$${stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-accent" },
    { label: "This Month", value: `$${stats.monthRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-primary" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: CheckCircle2, color: "text-green-600" },
    { label: "Customers", value: stats.customers, icon: Users, color: "text-muted-foreground", link: "/dashboard/customers" },
  ];

  const miniStats = [
    { label: "Quotes", value: stats.quotes, icon: FileText, link: "/dashboard/quotes" },
    { label: "Active Jobs", value: stats.activeJobs, icon: Briefcase, link: "/dashboard/jobs" },
    { label: "Pending Invoices", value: stats.pendingInvoices, icon: AlertCircle, link: "/dashboard/invoices" },
    { label: "Total Jobs", value: stats.jobs, icon: CheckCircle2, link: "/dashboard/jobs" },
  ];

  const quickActions = [
    { label: "Build Website", icon: Globe, link: "/dashboard/website", variant: "default" as const },
    { label: "New Quote", icon: Plus, link: "/dashboard/quotes/new", variant: "outline" as const },
    { label: "Schedule Job", icon: CalendarPlus, link: "/dashboard/calendar", variant: "outline" as const },
    { label: "Add Customer", icon: UserPlus, link: "/dashboard/customers", variant: "outline" as const },
    { label: "Create Invoice", icon: CreditCard, link: "/dashboard/invoices", variant: "outline" as const },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    approved: "bg-green-100 text-green-700",
    declined: "bg-destructive/10 text-destructive",
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-green-100 text-green-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
    review: "bg-amber-100 text-amber-700",
  };

  const typeIcons: Record<string, typeof FileText> = {
    quote: FileText,
    job: Briefcase,
    invoice: CreditCard,
    review: Star,
  };

  return (
    <div className="space-y-6">
      <GettingStartedChecklist />
      {/* Header + Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link key={a.label} to={a.link}>
              <Button variant={a.variant} size="sm">
                <a.icon className="h-4 w-4 mr-1.5" />
                {a.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Website Builder Hero CTA */}
      <Link to="/dashboard/website" className="block group">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute right-10 bottom-0 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="h-14 w-14 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 shadow-lg">
              <Globe className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground tracking-wider">NEW</span>
                <span className="text-xs opacity-80 uppercase tracking-wider">AI Website Generator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight">Launch a premium, SEO-ready website in 60 seconds</h2>
              <p className="text-sm opacity-90 mt-1">AI writes your copy, generates a hero image, and publishes a Fortune-500 quality site with online booking.</p>
            </div>
            <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shrink-0 group-hover:translate-x-1 transition-transform">
              <Sparkles className="h-4 w-4 mr-2" />
              Build My Website
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mini stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {miniStats.map((s) => (
          <Link key={s.label} to={s.link} className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-lg font-semibold leading-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity yet. Create your first quote to get started!</p>
          ) : (
            <div className="space-y-1">
              {activity.map((item) => {
                const Icon = typeIcons[item.type] || FileText;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.link}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{item.title}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[item.status] || "bg-muted text-muted-foreground"}`}>
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                      {format(new Date(item.date), "MMM d")}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
