import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, Briefcase } from "lucide-react";

export default function JobsPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("jobs")
      .select("*, customers(first_name, last_name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setJobs(data || []);
  };

  useEffect(() => { fetchJobs(); }, [business]);

  const updateStatus = async (jobId: string, status: string) => {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await supabase.from("jobs").update(updates).eq("id", jobId);
    toast({ title: `Job ${status}!` });

    // Send email notifications for status changes
    const job = jobs.find((j) => j.id === jobId);
    if (job?.customers) {
      // Get customer email
      const { data: cust } = await supabase.from("customers").select("email, first_name").eq("id", job.customer_id).single();
      if (cust?.email) {
        if (status === "completed") {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "job-completed",
              recipientEmail: cust.email,
              idempotencyKey: `job-completed-${jobId}`,
              templateData: {
                customerName: cust.first_name,
                jobTitle: job.title,
                total: (job.total || 0).toFixed(2),
                businessName: business?.name,
              },
            },
          });
        } else if (status === "cancelled") {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "job-cancelled",
              recipientEmail: cust.email,
              idempotencyKey: `job-cancelled-${jobId}`,
              templateData: {
                customerName: cust.first_name,
                jobTitle: job.title,
                businessName: business?.name,
              },
            },
          });
        }
      }
    }

    fetchJobs();
  };

  const createInvoice = async (job: any) => {
    if (!business) return;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("invoices").insert({
      business_id: business.id,
      customer_id: job.customer_id,
      job_id: job.id,
      quote_id: job.quote_id,
      invoice_number: invoiceNumber,
      status: "draft" as const,
      total: job.total,
      subtotal: job.total,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invoice created!", description: `Invoice ${invoiceNumber} created from job.` });
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-primary/10 text-primary",
    in_progress: "bg-accent/20 text-accent-foreground",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No jobs yet. Convert an approved quote to create a job.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="rounded-xl border bg-card hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium p-4">Title</th>
                    <th className="text-left font-medium p-4">Customer</th>
                    <th className="text-left font-medium p-4">Status</th>
                    <th className="text-right font-medium p-4">Total</th>
                    <th className="text-right font-medium p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{j.title}</td>
                      <td className="p-4">{j.customers?.first_name} {j.customers?.last_name}</td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[j.status] || ""}`}>
                          {j.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium">${(j.total || 0).toFixed(2)}</td>
                      <td className="p-4 text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/jobs/${j.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {j.status === "scheduled" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(j.id, "in_progress")}>Start</Button>
                        )}
                        {j.status === "in_progress" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(j.id, "completed")}>Complete</Button>
                        )}
                        {j.status === "completed" && (
                          <Button size="sm" onClick={() => createInvoice(j)}>Invoice</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="rounded-xl border bg-card p-4 active:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{j.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {j.customers?.first_name} {j.customers?.last_name}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize shrink-0 ${statusColors[j.status] || ""}`}>
                    {j.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm font-semibold">${(j.total || 0).toFixed(2)}</span>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/jobs/${j.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {j.status === "scheduled" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(j.id, "in_progress")}>Start</Button>
                    )}
                    {j.status === "in_progress" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(j.id, "completed")}>Complete</Button>
                    )}
                    {j.status === "completed" && (
                      <Button size="sm" onClick={() => createInvoice(j)}>Invoice</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
