import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { buildCorsHeaders, jsonResponse, rejectDisallowedOrigin } from "../_shared/security.ts";

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = "Solutionary"
const ROOT_DOMAIN = "solutionaryhq.com"
const FROM_ADDRESS = `Solutionary <noreply@solutionaryhq.com>`

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
      text,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Resend API error:', data)
    throw new Error(`Resend error: ${JSON.stringify(data)}`)
  }
  console.log('Auth email sent via Resend:', data.id)
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const blocked = rejectDisallowedOrigin(req)
  if (blocked) return blocked

  try {
    // Parse the Supabase Auth webhook payload
    const payload = await req.json()
    
    // Supabase Auth sends the hook payload directly
    const emailType = payload.type || payload.data?.action_type
    const email = payload.email || payload.data?.email
    const confirmationUrl = payload.confirmation_url || payload.data?.url
    const token = payload.token || payload.data?.token
    const newEmail = payload.new_email || payload.data?.new_email

    console.log('Received auth event', { emailType, email })

    if (!emailType || !email) {
      return jsonResponse(req, { error: 'Missing email type or recipient' }, 400)
    }

    const EmailTemplate = EMAIL_TEMPLATES[emailType]
    if (!EmailTemplate) {
      console.error('Unknown email type', { emailType })
      return jsonResponse(req, { error: `Unknown email type: ${emailType}` }, 400)
    }

    const templateProps = {
      siteName: SITE_NAME,
      siteUrl: `https://${ROOT_DOMAIN}`,
      recipient: email,
      confirmationUrl,
      token,
      email,
      newEmail,
    }

    const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
    const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
      plainText: true,
    })

    const subject = EMAIL_SUBJECTS[emailType] || 'Notification'

    await sendViaResend(email, subject, html, text)

    return jsonResponse(req, { success: true }, 200)
  } catch (error) {
    console.error('Auth email hook error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse(req, { error: message }, 500)
  }
})
