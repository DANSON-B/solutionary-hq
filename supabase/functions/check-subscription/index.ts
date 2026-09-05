import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim() ?? "";

    // No (or anonymous) session: this is a normal signed-out state, not an error.
    if (!token) {
      logStep("No auth token - treating as unsubscribed");
      return jsonResponse(req, { subscribed: false, status: null });
    }

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.email) {
      logStep("Unauthenticated request - treating as unsubscribed", { message: userError?.message });
      return jsonResponse(req, { subscribed: false, status: null });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for subscription override (beta testers, internal QA, etc.)
    const { data: override } = await supabaseClient
      .from("subscription_overrides")
      .select("id, reason")
      .eq("user_id", user.id)
      .maybeSingle();

    if (override) {
      logStep("Subscription override found", { reason: override.reason });
      return jsonResponse(req, {
        subscribed: true,
        product_id: null,
        status: "override",
        subscription_end: null,
        trial_end: null,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return jsonResponse(req, { subscribed: false });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const trialingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    const allSubs = [...subscriptions.data, ...trialingSubs.data];
    const hasSub = allSubs.length > 0;

    let productId = null;
    let subscriptionEnd = null;
    let status = null;
    let trialEnd = null;

    if (hasSub) {
      const subscription = allSubs[0];
      status = subscription.status;
      const item = subscription.items.data[0];
      const periodEnd = (item as any)?.current_period_end ?? (subscription as any).current_period_end;
      if (periodEnd && Number.isFinite(periodEnd)) {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      }
      productId = item?.price?.product ?? null;
      if (subscription.trial_end && Number.isFinite(subscription.trial_end)) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      logStep("Subscription found", { status, productId, subscriptionEnd });
    } else {
      logStep("No active/trialing subscription found");
    }

    return jsonResponse(req, {
      subscribed: hasSub,
      product_id: productId,
      status,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return jsonResponse(req, { error: errorMessage }, 500);
  }
});
