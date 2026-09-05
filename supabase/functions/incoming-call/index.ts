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

  const { data: business } = await supabase
    .from("business_twilio")
    .select(
      `
        business_id,
        phone_number
      `,
    )
    .eq("phone_number", called)
    .single();

  if (!business) {
    return twiml(`
<Response>
    <Say>
        This number is unavailable.
    </Say>
</Response>
`);
  }

const { data: businessInfo, error } = await supabase
  .from("businesses")
  .select("forward_phone")
  .eq("id", business.business_id)
  .single();

if (error || !businessInfo?.forward_phone) {
  return twiml(`
<Response>
  <Say>
    This business has not configured a forwarding number.
  </Say>
</Response>
`);
}

return twiml(`
<Response>

<Dial timeout="20">

<Number>
${businessInfo.forward_phone}
</Number>

</Dial>

</Response>
`);
