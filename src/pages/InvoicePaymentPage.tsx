import { BusinessLogo } from "@/components/BusinessLogo";
import { useBrandFavicon } from "@/hooks/useBrandFavicon";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Loader2 } from "lucide-react";

export default function InvoicePaymentPage() {
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();
  const isSuccess = window.location.pathname.endsWith("/success");
  const sessionId = searchParams.get("session_id");

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verified, setVerified] = useState(false);
  useBrandFavicon(invoice?.businesses?.logo_url, invoice?.businesses?.name);

  useEffect(() => {
    const load = async () => {
      if (!invoiceId) return;
      const { data } = await supabase.rpc("get_invoice_for_payment", { p_invoice_id: invoiceId });
      setInvoice(data as any);
      setLoading(false);
    };
    load();
  }, [invoiceId]);

  // Verify payment on success page
  useEffect(() => {
    if (!isSuccess || !sessionId || !invoiceId) return;
    const verify = async () => {
      const { data } = await supabase.functions.invoke("verify-invoice-payment", {
        body: { sessionId, invoiceId },
      });
      if (data?.paid) {
        setVerified(true);
        // Send payment receipt email
        if (invoice?.customers?.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "payment-received",
              recipientEmail: invoice.customers.email,
              idempotencyKey: `payment-receipt-${invoiceId}-${sessionId}`,
              templateData: {
                customerName: invoice.customers.first_name,
                invoiceNumber: invoice.invoice_number,
                amount: ((invoice.total || 0) - (invoice.amount_paid || 0)).toFixed(2),
                businessName: invoice.businesses?.name,
              },
            },
          });
        }
      }
    };
    verify();
  }, [isSuccess, sessionId, invoiceId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", {
        body: { invoiceId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground">This payment link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (isSuccess && verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-2">
            Thank you for your payment of <span className="font-bold text-foreground">${((invoice.total || 0) - (invoice.amount_paid || 0)).toFixed(2)}</span>
          </p>
          <p className="text-sm text-muted-foreground">Invoice #{invoice.invoice_number} from {invoice.businesses?.name}</p>
        </div>
      </div>
    );
  }

  const balanceDue = (invoice.total || 0) - (invoice.amount_paid || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <BusinessLogo
              name={invoice.businesses?.name}
              logoUrl={invoice.businesses?.logo_url}
              className="h-12 w-12 mx-auto mb-3"
            />
            <h1 className="text-xl font-bold">{invoice.businesses?.name}</h1>
            <p className="text-sm text-muted-foreground">Invoice #{invoice.invoice_number}</p>
          </div>

          {/* Customer */}
          <div className="mb-6 text-sm text-muted-foreground">
            <span>Bill to: </span>
            <span className="font-medium text-foreground">{invoice.customers?.first_name} {invoice.customers?.last_name}</span>
          </div>

          {/* Line Items */}
          <div className="space-y-2 mb-6">
            {(invoice.invoice_items || []).map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.description} × {item.quantity}</span>
                <span className="font-medium">${(item.total || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            {(invoice.tax_amount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${(invoice.tax_amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>${(invoice.total || 0).toFixed(2)}</span>
            </div>
            {(invoice.amount_paid || 0) > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span>-${(invoice.amount_paid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Balance Due</span>
                  <span>${balanceDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Pay Button */}
          {invoice.status !== "paid" && balanceDue > 0 ? (
            <Button className="w-full mt-6" size="lg" disabled={paying} onClick={handlePay}>
              {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {paying ? "Processing..." : `Pay $${balanceDue.toFixed(2)}`}
            </Button>
          ) : (
            <div className="mt-6 text-center text-green-600 font-semibold">✅ Paid in Full</div>
          )}

          {invoice.notes && (
            <p className="text-xs text-muted-foreground mt-4 text-center">{invoice.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
