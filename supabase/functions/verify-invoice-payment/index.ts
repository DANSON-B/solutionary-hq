import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { sessionId, invoiceId } = await req.json();
    if (!sessionId || !invoiceId) throw new Error("sessionId and invoiceId required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { data: invoice } = await supabaseClient
      .from("invoices")
      .select("id, total, amount_paid, business_id, status, stripe_session_id")
      .eq("id", invoiceId)
      .single();

    if (!invoice) throw new Error("Invoice not found");
    if (!invoice.stripe_session_id || invoice.stripe_session_id !== sessionId) {
      return jsonResponse(req, { error: "Checkout session does not match this invoice" }, 400);
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return jsonResponse(req, { paid: false });
    }

    const sessionInvoiceId = session.metadata?.invoice_id;
    if (sessionInvoiceId && sessionInvoiceId !== invoiceId) {
      return jsonResponse(req, { error: "Invalid invoice metadata on checkout session" }, 400);
    }

    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;
    if (!paymentIntent) throw new Error("Missing payment intent on checkout session");

    const { data: existingPayment } = await supabaseClient
      .from("payments")
      .select("id, amount")
      .eq("invoice_id", invoiceId)
      .eq("reference", paymentIntent)
      .maybeSingle();

    if (existingPayment) {
      const fullyPaid = Number(invoice.amount_paid || 0) >= Number(invoice.total || 0);
      return jsonResponse(req, { paid: true, amount: Number(existingPayment.amount || 0), fully_paid: fullyPaid });
    }

    const amountPaid = (session.amount_total || 0) / 100;
    const { error: paymentInsertError } = await supabaseClient.from("payments").insert({
      business_id: invoice.business_id,
      invoice_id: invoiceId,
      amount: amountPaid,
      method: "card",
      reference: paymentIntent,
    });

    if (paymentInsertError?.code === "23505") {
      const { data: dupe } = await supabaseClient
        .from("payments")
        .select("amount")
        .eq("invoice_id", invoiceId)
        .eq("reference", paymentIntent)
        .maybeSingle();
      const fullyPaid = Number(invoice.amount_paid || 0) >= Number(invoice.total || 0);
      return jsonResponse(req, { paid: true, amount: Number(dupe?.amount || amountPaid), fully_paid: fullyPaid });
    }
    if (paymentInsertError) throw paymentInsertError;

    const { data: freshInvoice, error: freshInvoiceError } = await supabaseClient
      .from("invoices")
      .select("total, amount_paid")
      .eq("id", invoiceId)
      .single();
    if (freshInvoiceError || !freshInvoice) throw freshInvoiceError ?? new Error("Invoice not found after payment insert");

    const total = Number(freshInvoice.total || 0);
    const currentAmountPaid = Number(freshInvoice.amount_paid || 0);
    const updatedAmountPaid = total > 0 ? Math.min(total, currentAmountPaid + amountPaid) : currentAmountPaid + amountPaid;
    const isFullyPaid = total > 0 && updatedAmountPaid >= total;

    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({
        amount_paid: updatedAmountPaid,
        status: isFullyPaid ? "paid" : "sent",
        paid_at: isFullyPaid ? new Date().toISOString() : null,
      })
      .eq("id", invoiceId);
    if (updateError) throw updateError;

    return jsonResponse(req, { paid: true, amount: amountPaid, fully_paid: isFullyPaid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse(req, { error: message }, 500);
  }
});
