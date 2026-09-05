import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Send, DollarSign, RefreshCw, Loader2, Eye } from "lucide-react";

export default function InvoicesPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState<string>("cash");
  const [sendingPayment, setSendingPayment] = useState<string | null>(null);

  const fetchInvoices = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("invoices")
      .select("*, customers(first_name, last_name, email)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setInvoices(data || []);
  };

  const fetchPayments = async () => {
    if (!business) return;
    const { data } = await supabase
      .from("payments")
      .select("*, invoices(invoice_number)")
      .eq("business_id", business.id)
      .order("paid_at", { ascending: false })
      .limit(50);
    setPayments(data || []);
  };

  useEffect(() => { fetchInvoices(); fetchPayments(); }, [business]);

  const markSent = async (id: string) => {
    await supabase.from("invoices").update({ status: "sent" as const, sent_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Invoice sent!" });

    // Send invoice email to customer
    const inv = invoices.find((i) => i.id === id);
    if (inv?.customers?.email) {
      const payUrl = `${window.location.origin}/pay/${id}`;
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-sent",
          recipientEmail: inv.customers.email,
          idempotencyKey: `invoice-sent-${id}`,
          templateData: {
            customerName: inv.customers.first_name,
            invoiceNumber: inv.invoice_number,
            total: (inv.total || 0).toFixed(2),
            businessName: business?.name,
            paymentUrl: payUrl,
          },
        },
      });
    }

    fetchInvoices();
  };

  const sendPaymentLink = async (inv: any) => {
    setSendingPayment(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", {
        body: { invoiceId: inv.id },
      });
      if (error) throw error;
      if (data?.url) {
        await navigator.clipboard.writeText(data.url);
        toast({ title: "Payment link copied!", description: "Share this link with your customer." });
        if (inv.status === "draft") {
          await supabase.from("invoices").update({ status: "sent" as const, sent_at: new Date().toISOString() }).eq("id", inv.id);
        }
        fetchInvoices();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingPayment(null);
    }
  };

  const recordDeposit = async () => {
    if (!selectedInvoice || !business || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    await supabase.from("payments").insert({
      business_id: business.id,
      invoice_id: selectedInvoice.id,
      amount,
      method: depositMethod as any,
    });

    const newPaid = (selectedInvoice.amount_paid || 0) + amount;
    const isFullyPaid = newPaid >= (selectedInvoice.total || 0);
    await supabase.from("invoices").update({
      amount_paid: newPaid,
      status: isFullyPaid ? ("paid" as const) : selectedInvoice.status,
      paid_at: isFullyPaid ? new Date().toISOString() : null,
    }).eq("id", selectedInvoice.id);

    toast({ title: isFullyPaid ? "Invoice fully paid!" : "Deposit recorded!" });
    setDepositDialogOpen(false);
    setDepositAmount("");
    setSelectedInvoice(null);
    fetchInvoices();
    fetchPayments();
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    viewed: "bg-accent/20 text-accent-foreground",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-destructive/10 text-destructive",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button variant="outline" size="sm" onClick={() => { fetchInvoices(); fetchPayments(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Invoice List */}
      <div className="mb-8">
        {invoices.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No invoices yet. Create one from a completed job or approved quote.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="rounded-xl border bg-card hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left font-medium p-4">Invoice #</th>
                      <th className="text-left font-medium p-4">Customer</th>
                      <th className="text-left font-medium p-4">Status</th>
                      <th className="text-right font-medium p-4">Total</th>
                      <th className="text-right font-medium p-4">Paid</th>
                      <th className="text-right font-medium p-4">Balance</th>
                      <th className="text-right font-medium p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const balance = (inv.total || 0) - (inv.amount_paid || 0);
                      return (
                        <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 font-medium">{inv.invoice_number}</td>
                          <td className="p-4">{inv.customers?.first_name} {inv.customers?.last_name}</td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[inv.status] || ""}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-medium">${(inv.total || 0).toFixed(2)}</td>
                          <td className="p-4 text-right text-green-600">${(inv.amount_paid || 0).toFixed(2)}</td>
                          <td className="p-4 text-right font-medium">${balance.toFixed(2)}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-1 justify-end">
                              {inv.status === "draft" && (
                                <Button size="sm" variant="outline" onClick={() => markSent(inv.id)}>
                                  <Send className="h-3 w-3 mr-1" /> Send
                                </Button>
                              )}
                              {inv.status !== "paid" && balance > 0 && (
                                <>
                                  <Button size="sm" variant="outline" disabled={sendingPayment === inv.id} onClick={() => sendPaymentLink(inv)}>
                                    {sendingPayment === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3 mr-1" />}
                                    Pay Link
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(inv); setDepositDialogOpen(true); }}>
                                    <DollarSign className="h-3 w-3 mr-1" /> Deposit
                                  </Button>
                                </>
                              )}
                              {inv.stripe_payment_url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={`/pay/${inv.id}`} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {invoices.map((inv) => {
                const balance = (inv.total || 0) - (inv.amount_paid || 0);
                return (
                  <div key={inv.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{inv.invoice_number}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {inv.customers?.first_name} {inv.customers?.last_name}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize shrink-0 ${statusColors[inv.status] || ""}`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                        <p className="text-sm font-semibold">${(inv.total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Paid</p>
                        <p className="text-sm font-semibold text-green-600">${(inv.amount_paid || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
                        <p className="text-sm font-semibold">${balance.toFixed(2)}</p>
                      </div>
                    </div>

                    {(inv.status !== "paid" || inv.status === "draft") && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                        {inv.status === "draft" && (
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => markSent(inv.id)}>
                            <Send className="h-3 w-3 mr-1" /> Send
                          </Button>
                        )}
                        {inv.status !== "paid" && balance > 0 && (
                          <>
                            <Button size="sm" variant="outline" className="flex-1" disabled={sendingPayment === inv.id} onClick={() => sendPaymentLink(inv)}>
                              {sendingPayment === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3 mr-1" />}
                              Pay Link
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => { setSelectedInvoice(inv); setDepositDialogOpen(true); }}>
                              <DollarSign className="h-3 w-3 mr-1" /> Deposit
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Payment History */}
      <div className="rounded-xl border bg-card">
        <div className="p-5 border-b">
          <h2 className="font-semibold">Recent Payments</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No payments recorded yet.</div>
        ) : (
          <>
            {/* Desktop */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium p-4">Date</th>
                    <th className="text-left font-medium p-4">Invoice</th>
                    <th className="text-left font-medium p-4">Method</th>
                    <th className="text-right font-medium p-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="p-4">{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">{p.invoices?.invoice_number || "—"}</td>
                      <td className="p-4 capitalize">{p.method}</td>
                      <td className="p-4 text-right font-medium text-green-600">${(p.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y md:hidden">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.invoices?.invoice_number || "—"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()} · <span className="capitalize">{p.method}</span></p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">${(p.amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment / Deposit</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invoice #{selectedInvoice.invoice_number} — Balance: ${((selectedInvoice.total || 0) - (selectedInvoice.amount_paid || 0)).toFixed(2)}
              </p>
              <div>
                <Label>Amount</Label>
                <Input type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={depositMethod} onValueChange={setDepositMethod}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="ach">ACH / Bank Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={recordDeposit} className="w-full">Record Payment</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
