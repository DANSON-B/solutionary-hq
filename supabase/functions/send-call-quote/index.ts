import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";
import { getAuthedUser, userHasBusinessAccess } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  try {
    const user = await getAuthedUser(req);
    if (!user) return jsonResponse(req, { error: "Unauthorized" }, 401);

    const { call_quote_id } = await req.json();
    if (!call_quote_id) throw new Error("call_quote_id required");

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

    const hasAccess = await userHasBusinessAccess(user.userId, quote.business_id);
    if (!hasAccess) return jsonResponse(req, { error: "Forbidden" }, 403);


    const origin = req.headers.get("origin") || "https://solutionaryhq.com";
    const link = `${origin}/quote/${quote.share_token}`;
    const biz = quote.businesses?.name || "Solutionary HQ";
    const total = Number(quote.total).toFixed(2);
    const smsBody = `Hi ${quote.customer_name}, here's your cleaning quote from ${biz}: $${total}. View & approve: ${link}`;

    // EMAIL via Resend (gateway)
    let email_sent = false;
    if (quote.customer_email) {
      try {
        const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
        const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
        const useGateway = !!LOVABLE_KEY && !!RESEND_KEY;
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
            <h2 style="color:#1e293b">Your quote from ${biz}</h2>
            <p>Hi ${quote.customer_name},</p>
            <p>Thanks for the call! Here's the quote we discussed:</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
              <p><strong>${quote.breakdown?.service_label || quote.service_type}</strong></p>
              <p>${quote.bedrooms} bed · ${quote.bathrooms} bath · ${quote.kitchens} kitchen · ${quote.living_rooms} living</p>
              <p style="font-size:24px;font-weight:bold;color:#0f172a">Total: $${total}</p>
            </div>
            <a href="${link}" style="display:inline-block;background:#1e40af;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View & Approve Quote</a>
            <p style="color:#64748b;font-size:12px;margin-top:24px">Quote expires in 24 hours.</p>
          </div>`;

        if (RESEND_KEY) {
          const url = useGateway
            ? "https://connector-gateway.lovable.dev/resend/emails"
            : "https://api.resend.com/emails";
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (useGateway) {
            headers["Authorization"] = `Bearer ${LOVABLE_KEY}`;
            headers["X-Connection-Api-Key"] = RESEND_KEY;
          } else {
            headers["Authorization"] = `Bearer ${RESEND_KEY}`;
          }
          const r = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              from: `${biz} <onboarding@resend.dev>`,
              to: [quote.customer_email],
              subject: `Your quote from ${biz} - $${total}`,
              html,
            }),
          });
          email_sent = r.ok;
          if (!r.ok) console.error("Resend error", await r.text());
        }
      } catch (e) { console.error("Email error", e); }
    }

    // SMS via Twilio gateway (if connected)
    let sms_sent = false;
    let sms_link: string | null = null;
    if (quote.customer_phone) {
      const TWILIO_KEY = Deno.env.get("TWILIO_API_KEY");
      const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
      const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");
      if (TWILIO_KEY && LOVABLE_KEY && TWILIO_FROM) {
        try {
          const body = new URLSearchParams({ To: quote.customer_phone, From: TWILIO_FROM, Body: smsBody });
          const r = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_KEY}`,
              "X-Connection-Api-Key": TWILIO_KEY,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          });
          sms_sent = r.ok;
          if (!r.ok) console.error("Twilio error", await r.text());
        } catch (e) { console.error("SMS error", e); }
      }
      if (!sms_sent) {
        // Fallback: native SMS deep link the operator can tap
        sms_link = `sms:${quote.customer_phone}?&body=${encodeURIComponent(smsBody)}`;
      }
    }

    await supa.from("call_quotes")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", call_quote_id);

    return jsonResponse(req, { ok: true, email_sent, sms_sent, sms_link, link }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(req, { error: msg }, 500);
  }
});
