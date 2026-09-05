import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Building2,
  Users,
  CreditCard,
  Shield,
  ShieldOff,
  ExternalLink,
  Search,
  RefreshCw,
} from "lucide-react";
import { Seo } from "@/components/Seo";

const SUPER_ADMIN_EMAIL = "support@solutionaryhq.com";

interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  industry: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  owner_id: string;
  owner_email: string | null;
  owner_signup: string | null;
  customer_count: number;
  override: { reason: string | null; created_at: string } | null;
  stripe: {
    customer_id: string;
    subscription_id: string | null;
    status: string | null;
    current_period_end: string | null;
    trial_end: string | null;
    amount: number | null;
    currency: string | null;
    interval: string | null;
  } | null;
}

export default function AdminTenantsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuperAdmin =
    user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-tenants", {
        body: { action: "list" },
      });
      if (error) throw error;
      setTenants(data?.tenants ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchTenants();
  }, [isSuperAdmin]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = tenants.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.owner_email?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q)
    );
  });

  const handleGrantOverride = async (t: Tenant) => {
    setBusyId(t.id);
    try {
      const { error } = await supabase.functions.invoke("admin-tenants", {
        body: { action: "grant_override", user_id: t.owner_id, reason: "Super admin grant" },
      });
      if (error) throw error;
      toast.success(`Free access granted to ${t.name}`);
      fetchTenants();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to grant access");
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeOverride = async (t: Tenant) => {
    setBusyId(t.id);
    try {
      const { error } = await supabase.functions.invoke("admin-tenants", {
        body: { action: "revoke_override", user_id: t.owner_id },
      });
      if (error) throw error;
      toast.success(`Override revoked for ${t.name}`);
      fetchTenants();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to revoke");
    } finally {
      setBusyId(null);
    }
  };

  const handleStripePortal = async (t: Tenant) => {
    if (!t.stripe?.customer_id) return;
    setBusyId(t.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-tenants", {
        body: { action: "stripe_portal", customer_id: t.stripe.customer_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to open portal");
    } finally {
      setBusyId(null);
    }
  };

  const totalCustomers = tenants.reduce((sum, t) => sum + t.customer_count, 0);
  const activeSubs = tenants.filter(
    (t) => t.stripe?.status === "active" || t.stripe?.status === "trialing",
  ).length;
  const overrideCount = tenants.filter((t) => t.override).length;
  const mrr =
    tenants
      .filter((t) => t.stripe?.status === "active" && t.stripe?.amount)
      .reduce((sum, t) => sum + (t.stripe!.amount ?? 0), 0) / 100;

  const fmtMoney = (cents: number | null, currency: string | null) =>
    cents == null ? "—" : `${(cents / 100).toFixed(0)} ${(currency ?? "usd").toUpperCase()}`;

  const statusVariant = (s: string | null) => {
    if (!s) return "secondary" as const;
    if (s === "active") return "default" as const;
    if (s === "trialing") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Super Admin · Solutionary HQ" description="Manage all tenants and subscriptions" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Super Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage every tenant, subscription and free-access override.
            </p>
          </div>
          <Button variant="outline" onClick={fetchTenants} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Building2} label="Tenants" value={tenants.length} />
          <StatCard icon={CreditCard} label="Active subs" value={activeSubs} />
          <StatCard icon={Shield} label="Free overrides" value={overrideCount} />
          <StatCard
            icon={Users}
            label="Total customers"
            value={totalCustomers}
            subtitle={`MRR ~$${mrr.toFixed(0)}`}
          />
        </div>

        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Tenants</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, slug..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tenants found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan / Status</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.industry ?? "—"} · /{t.slug ?? "no-slug"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{t.owner_email ?? "—"}</div>
                        {t.phone && (
                          <div className="text-xs text-muted-foreground">{t.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {t.override && (
                            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
                              Override
                            </Badge>
                          )}
                          {t.stripe ? (
                            <>
                              <Badge variant={statusVariant(t.stripe.status)}>
                                {t.stripe.status ?? "no sub"}
                              </Badge>
                              {t.stripe.amount != null && (
                                <span className="text-xs text-muted-foreground">
                                  {fmtMoney(t.stripe.amount, t.stripe.currency)}/
                                  {t.stripe.interval ?? "mo"}
                                </span>
                              )}
                            </>
                          ) : (
                            !t.override && (
                              <Badge variant="outline">No Stripe customer</Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.customer_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {t.override ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === t.id}
                              onClick={() => handleRevokeOverride(t)}
                            >
                              <ShieldOff className="mr-1 h-3.5 w-3.5" />
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === t.id}
                              onClick={() => handleGrantOverride(t)}
                            >
                              <Shield className="mr-1 h-3.5 w-3.5" />
                              Grant free
                            </Button>
                          )}
                          {t.stripe?.customer_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyId === t.id}
                              onClick={() => handleStripePortal(t)}
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              Stripe
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: any;
  label: string;
  value: number | string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="font-display text-2xl font-bold">{value}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
