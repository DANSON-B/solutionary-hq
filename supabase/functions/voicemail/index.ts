/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { buildCorsHeaders } from "../_shared/security.ts";
import { validateTwilioSignature, twilioForbidden } from "../_shared/twilio/signature.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: {
    persistSession: false,
  },
});

const FUNCTIONS_BASE_URL = `${new URL(Deno.env.get("SUPABASE_URL")!).origin}/functions/v1`;
const RECORDING_COMPLETE_URL = `${FUNCTIONS_BASE_URL}/recording-complete`;

function twiml(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: buildCorsHeaders(req),
    });
  }

  const form = await req.formData();
  if (!validateTwilioSignature(req, form)) return twilioForbidden();

  const called = String(form.get("To"));

  const { data: businessTwilio } = await supabase
    .from("business_twilio")
    .select("business_id")
    .eq("phone_number", called)
    .single();

  if (!businessTwilio) {
    return twiml(`
<Response>
    <Say>This number is unavailable.</Say>
</Response>
`);
  }

  const { data: business } = await supabase
    .from("businesses")
    .select(
      `
      voicemail_enabled,
      voicemail_greeting
    `,
    )
    .eq("id", businessTwilio.business_id)
    .single();

  if (!business?.voicemail_enabled) {
    return twiml(`
<Response>
    <Hangup/>
</Response>
`);
  }

  const greeting = business.voicemail_greeting ?? "Sorry we missed your call. Please leave a message after the tone.";

  return twiml(`
<Response>

    <Say>${greeting}</Say>

    <Record
        playBeep="true"
        maxLength="180"
        transcribe="false"
        recordingStatusCallback="${RECORDING_COMPLETE_URL}"
        recordingStatusCallbackMethod="POST"
        action="${RECORDING_COMPLETE_URL}"
        method="POST"
    />

</Response>
`);
});
