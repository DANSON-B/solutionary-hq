import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, getSafeAppOrigin, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

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
    const { invoiceId } = await req.json();
    if (!invoiceId) throw new Error("invoiceId is required");

    // Fetch invoice with items and customer
    const { data: invoice, error: invErr } = await supabaseClient
      .from("invoices")
      .select("*, customers(first_name, last_name, email), invoice_items(*), businesses(name)")
      .eq("id", invoiceId)
      .single();
    if (invErr || !invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid" || invoice.status === "cancelled") throw new Error("Invoice cannot be paid");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const amountDue = Math.round(((invoice.total || 0) - (invoice.amount_paid || 0)) * 100);
    if (amountDue <= 0) throw new Error("No balance due");

    // Check/create Stripe customer
    const customerEmail = invoice.customers?.email;
    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const newCust = await stripe.customers.create({
          email: customerEmail,
          name: `${invoice.customers?.first_name} ${invoice.customers?.last_name}`,
        });
        customerId = newCust.id;
      }
    }

    const appOrigin = getSafeAppOrigin(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `Payment for ${invoice.businesses?.name || "services"}`,
            },
            unit_amount: amountDue,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appOrigin}/pay/${invoiceId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appOrigin}/pay/${invoiceId}`,
      metadata: {
        invoice_id: invoiceId,
        business_id: invoice.business_id,
      },
    });

    // Save payment URL to invoice
    await supabaseClient.from("invoices").update({
      stripe_payment_url: session.url,
      stripe_session_id: session.id,
    }).eq("id", invoiceId);

    return jsonResponse(req, { url: session.url, sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse(req, { error: message }, 500);
  }
});
