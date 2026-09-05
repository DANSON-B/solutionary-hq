import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  buildCorsHeaders,
  getSafeAppOrigin,
  jsonResponse,
  rejectMissingOrDisallowedOrigin,
} from "../_shared/security.ts";

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(req, { error: "Missing or invalid authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const { data } = await supabaseClient.auth.getUser(token);

    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    // Find the user's business
    const { data: business, error: businessError } = await supabaseClient
      .from("businesses")
      .select("id,name,stripe_customer_id")
      .eq("owner_id", user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found for this user.");
    }

    const { price_id } = await req.json();

    if (!price_id || typeof price_id !== "string" || !/^price_[A-Za-z0-9]+$/.test(price_id)) {
      return jsonResponse(req, { error: "Valid price_id is required" }, 400);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verify the price exists and is active
    let priceObj;

    try {
      priceObj = await stripe.prices.retrieve(price_id);
    } catch {
      return jsonResponse(req, { error: "Unsupported price_id" }, 403);
    }

    if (!priceObj.active || priceObj.type !== "recurring") {
      return jsonResponse(req, { error: "Unsupported price_id" }, 403);
    }

    let customerId = business.stripe_customer_id ?? undefined;

    // If no customer stored yet, try finding one by email
    if (!customerId) {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      }
    }

    // If still none, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: business.name,
        metadata: {
          business_id: business.id,
        },
      });

      customerId = customer.id;
    }

    // Persist customer id
    if (customerId !== business.stripe_customer_id) {
      await supabaseClient
        .from("businesses")
        .update({
          stripe_customer_id: customerId,
        })
        .eq("id", business.id);
    }

    const appOrigin = getSafeAppOrigin(req);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,

      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],

      mode: "subscription",

      metadata: {
        business_id: business.id,
      },

      subscription_data: {
        trial_period_days: 14,

        metadata: {
          business_id: business.id,
        },
      },

      success_url: `${appOrigin}/dashboard?subscription=success`,

      cancel_url: `${appOrigin}/choose-plan`,
    });

    return jsonResponse(req, {
      url: session.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return jsonResponse(req, { error: message }, 500);
  }
});
