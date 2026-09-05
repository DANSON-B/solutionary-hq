import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, getSafeAppOrigin, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

const SITE_NAME = "Solutionary";
const FROM_ADDRESS = `Solutionary <noreply@solutionaryhq.com>`;

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Resend API error:', data);
    throw new Error(`Resend error: ${JSON.stringify(data)}`);
  }
  console.log('Portal link email sent via Resend:', data.id);
}

function buildPortalEmail(firstName: string, businessName: string, portalUrl: string): string {
  const safeFirstName = escapeHtml(firstName);
  const safeBusinessName = escapeHtml(businessName);
  const safePortalUrl = escapeHtml(portalUrl);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8" /></head>
    <body style="background-color:#ffffff;font-family:'Plus Jakarta Sans',Arial,sans-serif;padding:20px 25px;">
      <h1 style="font-size:22px;font-weight:bold;color:hsl(215,28%,17%);margin:0 0 20px;">
        Your Customer Portal Link
      </h1>
      <p style="font-size:14px;color:hsl(215,13%,45%);line-height:1.5;margin:0 0 25px;">
        Hi ${safeFirstName}, here is your secure link to access your customer portal for <strong>${safeBusinessName}</strong>.
      </p>
      <a href="${safePortalUrl}" style="display:inline-block;background-color:hsl(215,50%,23%);color:#ffffff;font-size:14px;border-radius:12px;padding:12px 20px;text-decoration:none;">
        Access Your Portal
      </a>
      <p style="font-size:12px;color:#999999;margin:30px 0 0;">
        This link is valid for 30 days. If you didn't request this, you can safely ignore this email.
      </p>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = rejectMissingOrDisallowedOrigin(req);
  if (blocked) return blocked;

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return jsonResponse(req, { error: "Email is required" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: customers, error: custErr } = await supabaseAdmin
      .from("customers")
      .select("id, business_id, first_name, email")
      .eq("email", email.toLowerCase().trim());

    if (custErr) throw custErr;

    if (!customers || customers.length === 0) {
      return jsonResponse(req, { success: true, message: "If an account exists with that email, a portal link has been sent." });
    }

    for (const customer of customers) {
      const { data: existingToken } = await supabaseAdmin
        .from("customer_portal_tokens")
        .select("token, expires_at")
        .eq("customer_id", customer.id)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let portalToken: string;

      if (existingToken) {
        portalToken = existingToken.token;
      } else {
        const { data: newToken, error: tokenErr } = await supabaseAdmin
          .from("customer_portal_tokens")
          .insert({
            customer_id: customer.id,
            business_id: customer.business_id,
          })
          .select("token")
          .single();

        if (tokenErr) throw tokenErr;
        portalToken = newToken.token;
      }

      const { data: business } = await supabaseAdmin
        .from("businesses")
        .select("name")
        .eq("id", customer.business_id)
        .single();

      const siteUrl = getSafeAppOrigin(req);
      const portalUrl = `${siteUrl}/portal/${portalToken}`;

      const html = buildPortalEmail(
        customer.first_name || 'there',
        business?.name || SITE_NAME,
        portalUrl
      );

      await sendViaResend(
        customer.email,
        `Your ${business?.name || SITE_NAME} Customer Portal Link`,
        html
      );
    }

    return jsonResponse(req, { success: true, message: "If an account exists with that email, a portal link has been sent." });
  } catch (err) {
    console.error("send-portal-link error:", err);
    return jsonResponse(req, { error: "Internal server error" }, 500);
  }
});
