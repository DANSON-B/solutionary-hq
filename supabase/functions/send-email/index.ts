import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

// Sender identity is server-controlled to prevent spoofing via a
// client-supplied `from` field.
const FIXED_FROM = 'Solutionary <noreply@solutionaryhq.com>'
const MAX_RECIPIENTS = 10

interface SendEmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  reply_to?: string
}


Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const blocked = rejectMissingOrDisallowedOrigin(req)
  if (blocked) return blocked

  // Require authenticated business user — blocks anonymous spam/phishing
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: claims, error: authErr } = await supabaseClient.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (authErr || !claims?.claims?.sub) {
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }


  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return jsonResponse(req, { error: 'Email service not configured' }, 500)
    }

    const payload: SendEmailPayload = await req.json()

    if (!payload.to || !payload.subject || !payload.html) {
      return jsonResponse(req, { error: 'Missing required fields: to, subject, html' }, 400)
    }

    const recipients = [...new Set(
      (Array.isArray(payload.to) ? payload.to : [payload.to])
        .map((address) => String(address).trim().toLowerCase())
        .filter(Boolean),
    )]

    if (recipients.length === 0 || recipients.length > MAX_RECIPIENTS) {
      return jsonResponse(req, { error: `Provide between 1 and ${MAX_RECIPIENTS} recipients` }, 400)
    }

    // Recipients must belong to a business the caller owns or works for.
    const userId = String(claims.claims.sub)
    const callerEmail = claims.claims.email ? String(claims.claims.email).toLowerCase() : null

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    )

    const [{ data: ownedBusinesses }, { data: memberships }] = await Promise.all([
      admin.from("businesses").select("id").eq("owner_id", userId),
      admin.from("team_members").select("business_id").eq("user_id", userId).eq("is_active", true),
    ])

    const businessIds = [...new Set([
      ...(ownedBusinesses ?? []).map((b) => b.id),
      ...(memberships ?? []).map((m) => m.business_id),
    ])]

    if (businessIds.length === 0) {
      return jsonResponse(req, { error: 'No business associated with this account' }, 403)
    }

    const [{ data: customers }, { data: teammates }, { data: businessContacts }] = await Promise.all([
      admin.from("customers").select("email").in("business_id", businessIds).in("email", recipients),
      admin.from("team_members").select("email").in("business_id", businessIds).in("email", recipients),
      admin.from("businesses").select("email").in("id", businessIds),
    ])

    const allowed = new Set<string>()
    if (callerEmail) allowed.add(callerEmail)
    for (const row of customers ?? []) if (row.email) allowed.add(String(row.email).toLowerCase())
    for (const row of teammates ?? []) if (row.email) allowed.add(String(row.email).toLowerCase())
    for (const row of businessContacts ?? []) if (row.email) allowed.add(String(row.email).toLowerCase())

    const disallowed = recipients.filter((address) => !allowed.has(address))
    if (disallowed.length > 0) {
      console.warn('send-email blocked recipients outside caller business', { userId, count: disallowed.length })
      return jsonResponse(req, { error: 'Recipients must be contacts of your business' }, 403)
    }

    const resendPayload: Record<string, unknown> = {
      from: FIXED_FROM,
      to: recipients,
      subject: payload.subject,
      html: payload.html,
    }

    if (payload.text) resendPayload.text = payload.text
    if (payload.reply_to) resendPayload.reply_to = payload.reply_to


    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend API error:', resendData)
      return jsonResponse(req, { error: 'Failed to send email', details: resendData }, resendRes.status)
    }

    console.log('Email sent successfully:', resendData)
    return jsonResponse(req, { success: true, id: resendData.id }, 200)
  } catch (error) {
    console.error('send-email error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse(req, { error: message }, 500)
  }
})
