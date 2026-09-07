import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

const envEmailList = (name: string) =>
  (Deno.env.get(name) ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isSuperAdminEmail = (email: string) => {
  const allowedEmails = new Set([
    "support@solutionaryhq.com",
    ...envEmailList("SUPER_ADMIN_EMAILS"),
    ...envEmailList("LIFETIME_OWNER_EMAILS"),
  ]);
  return allowedEmails.has(email.toLowerCase());
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-TENANTS] ${step}${d}`);
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse(req, { error: "Missing auth" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return jsonResponse(req, { error: "Not authenticated" }, 401);
    }

    if (!isSuperAdminEmail(userData.user.email)) {
      log("Forbidden", { email: userData.user.email });
      return jsonResponse(req, { error: "Forbidden" }, 403);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action ?? "list";

    if (action === "list") {
      const { data: businesses, error } = await admin
        .from("businesses")
        .select("id, name, slug, industry, owner_id, email, phone, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ownerIds = [...new Set((businesses ?? []).map((b) => b.owner_id))];

      // Fetch owner emails via auth admin
      const ownerMap = new Map<string, { email: string | null; created_at: string | null }>();
      for (const id of ownerIds) {
        try {
          const { data } = await admin.auth.admin.getUserById(id);
          ownerMap.set(id, {
            email: data.user?.email ?? null,
            created_at: data.user?.created_at ?? null,
          });
        } catch {
          ownerMap.set(id, { email: null, created_at: null });
        }
      }

      // Overrides
      const { data: overrides } = await admin
        .from("subscription_overrides")
        .select("user_id, reason, created_at");
      const overrideMap = new Map((overrides ?? []).map((o) => [o.user_id, o]));

      // Counts
      const { data: customerCounts } = await admin
        .from("customers")
        .select("business_id", { count: "exact", head: false });
      const customerCountMap = new Map<string, number>();
      (customerCounts ?? []).forEach((c) => {
        customerCountMap.set(c.business_id, (customerCountMap.get(c.business_id) ?? 0) + 1);
      });

      // Stripe lookup per owner email
      const tenants = await Promise.all(
        (businesses ?? []).map(async (b) => {
          const owner = ownerMap.get(b.owner_id);
          let stripeSummary: any = null;
          if (stripe && owner?.email) {
            try {
              const customers = await stripe.customers.list({ email: owner.email, limit: 1 });
              if (customers.data.length > 0) {
                const cust = customers.data[0];
                const subs = await stripe.subscriptions.list({
                  customer: cust.id,
                  status: "all",
                  limit: 1,
                });
                const sub = subs.data[0];
                stripeSummary = {
                  customer_id: cust.id,
                  subscription_id: sub?.id ?? null,
                  status: sub?.status ?? null,
                  current_period_end: sub?.current_period_end
                    ? new Date(sub.current_period_end * 1000).toISOString()
                    : null,
                  trial_end: sub?.trial_end
                    ? new Date(sub.trial_end * 1000).toISOString()
                    : null,
                  product_id: sub?.items.data[0]?.price.product ?? null,
                  amount: sub?.items.data[0]?.price.unit_amount ?? null,
                  currency: sub?.items.data[0]?.price.currency ?? null,
                  interval: sub?.items.data[0]?.price.recurring?.interval ?? null,
                };
              }
            } catch (e) {
              log("Stripe lookup failed", { email: owner.email, err: String(e) });
            }
          }

          return {
            id: b.id,
            name: b.name,
            slug: b.slug,
            industry: b.industry,
            email: b.email,
            phone: b.phone,
            created_at: b.created_at,
            owner_id: b.owner_id,
            owner_email: owner?.email ?? null,
            owner_signup: owner?.created_at ?? null,
            customer_count: customerCountMap.get(b.id) ?? 0,
            override: overrideMap.get(b.owner_id) ?? null,
            stripe: stripeSummary,
          };
        }),
      );

      return jsonResponse(req, { tenants });
    }

    if (action === "grant_override") {
      const { user_id, reason } = body;
      if (!user_id) return jsonResponse(req, { error: "user_id required" }, 400);
      const { error } = await admin.from("subscription_overrides").upsert(
        {
          user_id,
          reason: reason ?? "Granted by super admin",
          granted_by: userData.user.id,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      return jsonResponse(req, { success: true });
    }

    if (action === "revoke_override") {
      const { user_id } = body;
      if (!user_id) return jsonResponse(req, { error: "user_id required" }, 400);
      const { error } = await admin
        .from("subscription_overrides")
        .delete()
        .eq("user_id", user_id);
      if (error) throw error;
      return jsonResponse(req, { success: true });
    }

    if (action === "stripe_portal") {
      if (!stripe) return jsonResponse(req, { error: "Stripe not configured" }, 500);
      const { customer_id } = body;
      if (!customer_id) return jsonResponse(req, { error: "customer_id required" }, 400);
      const origin = req.headers.get("origin") ?? "https://solutionaryhq.com";
      const session = await stripe.billingPortal.sessions.create({
        customer: customer_id,
        return_url: `${origin}/admin/tenants`,
      });
      return jsonResponse(req, { url: session.url });
    }

    return jsonResponse(req, { error: "Unknown action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { msg });
    return jsonResponse(req, { error: msg }, 500);
  }
});
