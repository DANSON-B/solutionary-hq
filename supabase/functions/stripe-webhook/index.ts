import { provisionBusinessTwilio } from "../_shared/twilio/provision.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[stripe-webhook] ${step}${suffix}`);
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-08-27.basil",
});

const supabase: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event, session: Stripe.Checkout.Session) {
  logStep("checkout.session.completed", {
    id: session.id,
    mode: session.mode,
    customer: session.customer,
    subscription: session.subscription,
    eventId: event.id,
  });

  // TODO: Persist checkout outcome / link Stripe customer to business account.
  // TODO: Trigger Twilio provisioning here once implemented:
  //   await provisionBusinessTwilio({ ... });
}

async function handleSubscriptionCreated(event: Stripe.Event, subscription: Stripe.Subscription) {
  logStep("customer.subscription.created", {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    eventId: event.id,
  });

  // Ignore unpaid/incomplete subscriptions
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    logStep("Subscription not eligible", {
      status: subscription.status,
    });
    return;
  }

  const customerId = subscription.customer as string;

  // Find the business that owns this Stripe customer
  const { data: business, error } = await supabase
    .from("businesses")
    .select("id,name,stripe_customer_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (error || !business) {
    throw new Error(`Business not found for Stripe customer ${customerId}`);
  }

  logStep("Provisioning Twilio", {
    businessId: business.id,
  });

  await provisionBusinessTwilio(business.id, business.name);

  logStep("Provisioning complete", {
    businessId: business.id,
  });
}

async function handleSubscriptionUpdated(event: Stripe.Event, subscription: Stripe.Subscription) {
  logStep("customer.subscription.updated", {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    eventId: event.id,
  });

  // TODO: Update subscription record (tier changes, renewals, cancel_at_period_end).
  // TODO: Reconcile Twilio provisioning state if plan changed.
}

async function handleSubscriptionDeleted(event: Stripe.Event, subscription: Stripe.Subscription) {
  logStep("customer.subscription.deleted", {
    id: subscription.id,
    customer: subscription.customer,
    eventId: event.id,
  });

  // TODO: Mark subscription as canceled in the database.
  // TODO: Deprovision Twilio resources for the business (release numbers, etc.).
}

async function processEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event, event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
      await handleSubscriptionCreated(event, event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event, event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event, event.data.object as Stripe.Subscription);
      break;
    default:
      logStep("unhandled event", { type: event.type, id: event.id });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    logStep("missing STRIPE_WEBHOOK_SECRET");
    return jsonResponse({ error: "Webhook secret not configured" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return jsonResponse({ error: "Missing stripe-signature header" }, 400);
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    logStep("signature verification failed", { message });
    return jsonResponse({ error: `Webhook Error: ${message}` }, 400);
  }

  try {
    void supabase; // service-role client available to handlers via closure
    await processEvent(event);
    return jsonResponse({ received: true, type: event.type, id: event.id }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    logStep("handler error", { type: event.type, id: event.id, message });
    return jsonResponse({ error: message }, 500);
  }
});
