import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  try {
    const { call_quote_id, mode } = await req.json();
    if (!call_quote_id) throw new Error("call_quote_id required");
    const payMode: "full" | "deposit" = mode === "deposit" ? "deposit" : "full";

    const supa = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: quote, error } = await supa
      .from("call_quotes")
      .select("*, businesses(name)")
      .eq("id", call_quote_id)
      .single();
    if (error || !quote) throw new Error("Quote not found");

    const total = Number(quote.total);
    if (total <= 0) throw new Error("Total must be greater than 0");
    const depositPct = Number(quote.deposit_percent ?? 50);
    const amount = payMode === "deposit" ? total * (depositPct / 100) : total;
    const amountCents = Math.round(amount * 100);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const biz = quote.businesses?.name || "Solutionary HQ";
    const origin = req.headers.get("origin") || "https://solutionaryhq.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: quote.customer_email || undefined,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${quote.breakdown?.service_label || quote.service_type} — ${biz}`,
            description: payMode === "deposit" ? `50% deposit for ${quote.customer_name}` : `Full payment for ${quote.customer_name}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: `${origin}/quote/${quote.share_token}?paid=1`,
      cancel_url: `${origin}/quote/${quote.share_token}?canceled=1`,
      metadata: {
        call_quote_id: quote.id,
        pay_mode: payMode,
      },
    });

    await supa.from("call_quotes")
      .update({ stripe_session_id: session.id, payment_mode: payMode })
      .eq("id", call_quote_id);

    return jsonResponse(req, { url: session.url, id: session.id }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(req, { error: msg }, 500);
  }
});
