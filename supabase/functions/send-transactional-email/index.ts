import * as React from 'npm:react@18.3.1'
import { renderToStaticMarkup } from 'npm:react-dom@18.3.1/server'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { buildCorsHeaders, jsonResponse, rejectMissingOrDisallowedOrigin } from "../_shared/security.ts";

interface SendRequest {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}

// Hard-coded sender prevents spoofing via user-controlled from fields.
const FIXED_FROM = 'Solutionary <noreply@solutionaryhq.com>'

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const blocked = rejectMissingOrDisallowedOrigin(req)
  if (blocked) return blocked

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return jsonResponse(req, { error: 'Email service not configured' }, 500)
    }

    const body: SendRequest = await req.json()
    const { templateName, recipientEmail, templateData } = body

    if (!templateName || !recipientEmail) {
      return jsonResponse(req, { error: 'Missing required fields: templateName, recipientEmail' }, 400)
    }

    // Basic RFC-5322-lite validation to prevent using this endpoint as an open relay.
    const EMAIL_RE = /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/;
    if (typeof recipientEmail !== 'string' || recipientEmail.length > 254 || !EMAIL_RE.test(recipientEmail)) {
      return jsonResponse(req, { error: 'Invalid recipientEmail' }, 400)
    }

    // Only registered transactional templates may be sent. Prevents attackers from
    // crafting arbitrary email bodies through this endpoint.
    const entry = TEMPLATES[templateName]
    if (!entry) {
      return jsonResponse(req, { error: `Unknown template: ${templateName}` }, 400)
    }

    // Render template
    const html = renderToStaticMarkup(React.createElement(entry.component, templateData || {}))
    const subject = typeof entry.subject === 'function' ? entry.subject(templateData || {}) : entry.subject

    const from = FIXED_FROM

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipientEmail],
        subject,
        html: `<!DOCTYPE html>${html}`,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend API error:', resendData)
      return jsonResponse(req, { error: 'Failed to send email', details: resendData }, resendRes.status)
    }

    console.log(`Email sent: template=${templateName}, to=${recipientEmail}, id=${resendData.id}`)
    return jsonResponse(req, { success: true, id: resendData.id }, 200)
  } catch (error) {
    console.error('send-transactional-email error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse(req, { error: message }, 500)
  }
})
