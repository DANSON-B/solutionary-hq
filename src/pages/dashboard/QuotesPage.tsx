import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ArrowRight, LayoutGrid, List } from "lucide-react";
import { CleaningPipeline } from "@/components/dashboard/CleaningPipeline";

export default function QuotesPage() {
  const { business } = useAuth();
  const isCleaning = useIsCleaning();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "pipeline">(isCleaning ? "pipeline" : "list");

  useEffect(() => {
    if (!business) return;
    supabase
      .from("quotes")
      .select("*, customers(first_name, last_name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setQuotes(data || []));
  }, [business]);

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    viewed: "bg-accent/20 text-accent-foreground",
    approved: "bg-green-100 text-green-700",
    declined: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <div className="flex items-center gap-2">
          {isCleaning && (
            <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
              <button onClick={() => setViewMode("pipeline")} className={`px-3 py-1.5 text-xs font-medium ${viewMode === "pipeline" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 text-xs font-medium ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Link to={isCleaning ? "/dashboard/quotes/cleaning-quote" : "/dashboard/quotes/new"}>
            <Button><Plus className="h-4 w-4 mr-2" /> New Quote</Button>
          </Link>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p>No quotes yet.</p>
          <Link to="/dashboard/quotes/new"><Button variant="outline" className="mt-4">Create Your First Quote</Button></Link>
        </div>
      ) : viewMode === "pipeline" && isCleaning ? (
        <CleaningPipeline quotes={quotes} />
      ) : (
        <>
          <div className="rounded-xl border bg-card hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium p-4">Quote #</th>
                    <th className="text-left font-medium p-4">Customer</th>
                    <th className="text-left font-medium p-4">Status</th>
                    <th className="text-left font-medium p-4">Date</th>
                    <th className="text-right font-medium p-4">Total</th>
                    <th className="text-right font-medium p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{q.quote_number}</td>
                      <td className="p-4">{q.customers?.first_name} {q.customers?.last_name}</td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[q.status] || ""}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="p-4">{new Date(q.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-medium">${(q.total || 0).toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <Link to={`/dashboard/quotes/${q.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {quotes.map((q) => (
              <Link
                key={q.id}
                to={`/dashboard/quotes/${q.id}`}
                className="block rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow active:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{q.quote_number}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {q.customers?.first_name} {q.customers?.last_name}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[q.status] || ""}`}>
                      {q.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-sm font-semibold">${(q.total || 0).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
