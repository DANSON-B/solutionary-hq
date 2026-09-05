import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsCleaning } from "@/hooks/useIsCleaning";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, CheckCircle, Briefcase, CreditCard, CalendarPlus } from "lucide-react";
import { CleaningBookingDialog } from "@/components/dashboard/cleaning/CleaningBookingDialog";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { business } = useAuth();
  const isCleaning = useIsCleaning();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data: q } = await supabase.from("quotes").select("*, customers(first_name, last_name, email, phone, address)").eq("id", id).single();
      setQuote(q);
      const { data: qi } = await supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order");
      setItems(qi || []);
    };
    fetch();
  }, [id]);

  const updateStatus = async (status: "sent" | "approved" | "declined") => {
    const updates: any = { status };
    if (status === "sent") updates.sent_at = new Date().toISOString();
    if (status === "approved") updates.approved_at = new Date().toISOString();
    await supabase.from("quotes").update(updates).eq("id", id);
    setQuote({ ...quote, ...updates });
    toast({ title: `Quote ${status}!` });

    // Send email when quote is marked as sent
    if (status === "sent" && quote?.customers?.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "quote-sent",
          recipientEmail: quote.customers.email,
          idempotencyKey: `quote-sent-${id}`,
          templateData: {
            customerName: quote.customers.first_name,
            quoteNumber: quote.quote_number,
            total: (quote.total || 0).toFixed(2),
            businessName: business?.name,
          },
        },
      });
    }
  };

  const convertToJob = async () => {
    if (!quote || !business) return;
    const { data: job, error } = await supabase.from("jobs").insert({
      business_id: business.id,
      customer_id: quote.customer_id,
      quote_id: quote.id,
      title: `Job from Quote ${quote.quote_number}`,
      description: quote.notes,
      status: "scheduled" as const,
      total: quote.total,
      address: quote.customers?.address,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Job created!", description: "Quote converted to a scheduled job." });
    navigate(`/dashboard/jobs`);
  };

  const convertToInvoice = async () => {
    if (!quote || !business) return;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const { data: invoice, error } = await supabase.from("invoices").insert({
      business_id: business.id,
      customer_id: quote.customer_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      status: "draft" as const,
      subtotal: quote.subtotal,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      total: quote.total,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Copy line items
    const invoiceItems = items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      sort_order: item.sort_order,
    }));
    await supabase.from("invoice_items").insert(invoiceItems);
    toast({ title: "Invoice created!" });
    navigate("/dashboard/invoices");
  };

  if (!quote) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    approved: "bg-green-100 text-green-700",
    declined: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard/quotes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Quote {quote.quote_number}</h1>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[quote.status] || ""}`}>
          {quote.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-3">Customer</h2>
            <p className="font-medium">{quote.customers?.first_name} {quote.customers?.last_name}</p>
            {quote.customers?.email && <p className="text-sm text-muted-foreground">{quote.customers.email}</p>}
            {quote.customers?.phone && <p className="text-sm text-muted-foreground">{quote.customers.phone}</p>}
          </div>

          {/* Line Items */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="font-semibold mb-4">Line Items</h2>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium pb-2">Description</th>
                    <th className="text-right font-medium pb-2">Qty</th>
                    <th className="text-right font-medium pb-2">Price</th>
                    <th className="text-right font-medium pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile stacked */}
            <div className="sm:hidden space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <p className="font-medium text-sm">{item.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Qty {item.quantity} × ${item.unit_price.toFixed(2)}</span>
                    <span className="font-semibold text-foreground">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-1">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>${(quote.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax ({quote.tax_rate || 0}%)</span><span>${(quote.tax_amount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Total</span><span>${(quote.total || 0).toFixed(2)}</span></div>
            </div>
          </div>

          {quote.notes && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {quote.status === "draft" && (
            <Button className="w-full" onClick={() => updateStatus("sent")}>
              <Send className="h-4 w-4 mr-2" /> Mark as Sent
            </Button>
          )}
          {(quote.status === "sent" || quote.status === "viewed") && (
            <>
              <Button className="w-full" onClick={() => updateStatus("approved")}>
                <CheckCircle className="h-4 w-4 mr-2" /> Mark Approved
              </Button>
              <Button className="w-full" variant="destructive" onClick={() => updateStatus("declined")}>
                Mark Declined
              </Button>
            </>
          )}
          {quote.status === "approved" && (
            <>
              {isCleaning ? (
                <Button className="w-full" onClick={() => setBookingOpen(true)}>
                  <CalendarPlus className="h-4 w-4 mr-2" /> Schedule Cleaning
                </Button>
              ) : (
                <Button className="w-full" onClick={convertToJob}>
                  <Briefcase className="h-4 w-4 mr-2" /> Convert to Job
                </Button>
              )}
              <Button className="w-full" variant="outline" onClick={convertToInvoice}>
                <CreditCard className="h-4 w-4 mr-2" /> Convert to Invoice
              </Button>
            </>
          )}
          {(quote.status === "draft" || quote.status === "sent" || quote.status === "viewed") && isCleaning && (
            <Button className="w-full" variant="secondary" onClick={() => setBookingOpen(true)}>
              <CalendarPlus className="h-4 w-4 mr-2" /> Quick Book
            </Button>
          )}
        </div>
      </div>

      {isCleaning && (
        <CleaningBookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          quote={quote}
          items={items}
        />
      )}
    </div>
  );
}
