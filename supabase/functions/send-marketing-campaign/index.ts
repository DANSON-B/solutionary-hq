// Marketing campaign sender (email via Resend). Owner/team only.
import { getAuthedUser, userHasBusinessAccess, serviceRoleClient } from "../_shared/auth.ts";
import { buildCorsHeaders, jsonResponse } from "../_shared/security.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = "Solutionary <noreply@solutionaryhq.com>";
const EMAIL_RE = /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/;

interface Body { campaign_id: string }

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const user = await getAuthedUser(req);
  if (!user) return jsonResponse(req, { error: "Unauthorized" }, 401);

  const { campaign_id } = (await req.json().catch(() => ({}))) as Body;
  if (!campaign_id) return jsonResponse(req, { error: "campaign_id required" }, 400);

  const admin = serviceRoleClient();
  const { data: campaign, error: cErr } = await admin
    .from("marketing_campaigns").select("*").eq("id", campaign_id).maybeSingle();
  if (cErr || !campaign) return jsonResponse(req, { error: "Campaign not found" }, 404);

  const ok = await userHasBusinessAccess(user.userId, campaign.business_id);
  if (!ok) return jsonResponse(req, { error: "Forbidden" }, 403);

  if (campaign.status === "sending" || campaign.status === "sent") {
    return jsonResponse(req, { error: `Campaign already ${campaign.status}` }, 409);
  }
  if (campaign.channel !== "email") {
    return jsonResponse(req, { error: "SMS campaigns coming soon" }, 400);
  }
  if (!RESEND_API_KEY) return jsonResponse(req, { error: "Email service not configured" }, 500);

  // Load audience
  const aud = campaign.audience || {};
  let q = admin.from("customers")
    .select("id,email,first_name,last_name,marketing_email_consent,last_job_at,tags")
    .eq("business_id", campaign.business_id)
    .not("email", "is", null);
  if (aud.only_opted_in !== false) q = q.eq("marketing_email_consent", true);
  if (aud.inactive_days) {
    const since = new Date(Date.now() - Number(aud.inactive_days) * 86400_000).toISOString();
    q = q.or(`last_job_at.is.null,last_job_at.lt.${since}`);
  }
  const { data: customers, error: custErr } = await q;
  if (custErr) return jsonResponse(req, { error: custErr.message }, 500);

  const recipients = (customers ?? []).filter((c: any) => c.email && EMAIL_RE.test(c.email));
  await admin.from("marketing_campaigns").update({
    status: "sending", recipient_count: recipients.length,
  }).eq("id", campaign_id);

  let delivered = 0, failed = 0;
  const subject = campaign.subject || campaign.name;
  const bodyHtml = (campaign.body || "").replace(/\n/g, "<br/>");

  for (const c of recipients) {
    const personalized = bodyHtml
      .replaceAll("{{first_name}}", c.first_name || "there")
      .replaceAll("{{last_name}}", c.last_name || "");
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [c.email], subject, html: `<!DOCTYPE html><html><body>${personalized}</body></html>` }),
      });
      const data = await res.json().catch(() => ({}));
      const okSend = res.ok;
      await admin.from("marketing_campaign_sends").insert({
        campaign_id, business_id: campaign.business_id, customer_id: c.id,
        recipient: c.email, status: okSend ? "sent" : "failed",
        error: okSend ? null : (data?.message || `HTTP ${res.status}`),
        sent_at: new Date().toISOString(),
      });
      okSend ? delivered++ : failed++;
    } catch (e) {
      failed++;
      await admin.from("marketing_campaign_sends").insert({
        campaign_id, business_id: campaign.business_id, customer_id: c.id,
        recipient: c.email, status: "failed", error: String((e as Error).message ?? e),
      });
    }
  }

  await admin.from("marketing_campaigns").update({
    status: "sent", sent_at: new Date().toISOString(),
    delivered_count: delivered, failed_count: failed,
  }).eq("id", campaign_id);

  return jsonResponse(req, { ok: true, recipients: recipients.length, delivered, failed }, 200);
});
