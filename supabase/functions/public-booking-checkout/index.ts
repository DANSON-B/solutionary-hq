import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  try {
    const { kind, id, depositPercent } = await req.json();
    if (!id) throw new Error("id required");
    if (!["quote", "booking_request"].includes(kind)) throw new Error("invalid kind");
    const pct = [25, 50, 100].includes(Number(depositPercent)) ? Number(depositPercent) : 50;

    const supa = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    let total = 0;
    let email: string | null = null;
    let name = "Customer";
    let businessId: string | null = null;
    let label = "Cleaning service";

    if (kind === "quote") {
      const { data: q, error } = await supa
        .from("quotes")
        .select("id, total, business_id, notes, customer_id, customers(first_name, last_name, email)")
        .eq("id", id)
        .single();
      if (error || !q) throw new Error("Quote not found");
      total = Number(q.total || 0);
      businessId = q.business_id;
      const cust: any = q.customers;
      if (cust) {
        email = cust.email;
        name = `${cust.first_name || ""} ${cust.last_name || ""}`.trim() || name;
      }
      label = q.notes?.slice(0, 80) || "Cleaning service";
    } else {
      const { data: b, error } = await supa
        .from("cleaning_booking_requests")
        .select("id, estimated_total, business_id, name, email, cleaning_type")
        .eq("id", id)
        .single();
      if (error || !b) throw new Error("Booking not found");
      total = Number(b.estimated_total || 0);
      businessId = b.business_id;
      email = b.email;
      name = b.name || name;
      label = `Cleaning — ${b.cleaning_type || "service"}`;
    }

    if (total <= 0) throw new Error("Total must be greater than 0");

    const { data: biz } = await supa
      .from("businesses")
      .select("name")
      .eq("id", businessId!)
      .maybeSingle();
    const bizName = biz?.name || "Solutionary HQ";

    const amountCents = Math.round(total * (pct / 100) * 100);
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://solutionaryhq.com";
    const depositLabel =
      pct === 100 ? "Payment in full" : `${pct}% deposit — balance due day of service`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${label} — ${bizName}`,
              description: `${depositLabel} · ${name}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?paid=1`,
      cancel_url: `${origin}/?canceled=1`,
      metadata: {
        kind,
        record_id: String(id),
        deposit_percent: String(pct),
        business_id: String(businessId),
      },
    });

    const table = kind === "quote" ? "quotes" : "cleaning_booking_requests";
    await supa
      .from(table)
      .update({ stripe_session_id: session.id, deposit_percent: pct })
      .eq("id", id);

    return jsonResponse(req, { url: session.url, id: session.id }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(req, { error: msg }, 500);
  }
});
