/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import {
  buildCorsHeaders,
} from "../_shared/security.ts";

import { validateTwilioSignature, twilioForbidden } from "../_shared/twilio/signature.ts";

import { toE164 } from "../_shared/twilio/phone.ts";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false,
    },
  },
);
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

  const from = toE164(String(form.get("From")));

  const to = toE164(String(form.get("To")));

  const body = String(form.get("Body") ?? "").trim();

  const sid = String(form.get("MessageSid"));

  if (!from || !to) {

    return twiml("<Response/>");

  }

  const { data: businessTwilio } = await supabase

    .from("business_twilio")

    .select("business_id")

    .eq("phone_number", to)

    .single();

  if (!businessTwilio) {

    return twiml("<Response/>");

  }

  const businessId = businessTwilio.business_id;
  // --------------------------------------------------
// Find existing customer
// --------------------------------------------------

let { data: customer } = await supabase
  .from("customers")
  .select("id")
  .eq("business_id", businessId)
  .eq("phone", from)
  .maybeSingle();

// --------------------------------------------------
// Create customer automatically if not found
// --------------------------------------------------

if (!customer) {

  const { data: createdCustomer, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      phone: from,
      first_name: "Unknown",
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return twiml("<Response/>");
  }

  customer = createdCustomer;
}
  await supabase
  .from("sms_messages")
  .insert({

    business_id: businessId,

    customer_id: customer.id,

    customer_phone: from,

    twilio_sid: sid,

    direction: "inbound",

    message: body,

    status: "received",

  });
  const keyword = body.toUpperCase();

if (
  [
    "STOP",
    "STOPALL",
    "UNSUBSCRIBE",
    "CANCEL",
    "END",
    "QUIT",
  ].includes(keyword)
) {

  await supabase
    .from("customer_sms_opt_outs")
    .upsert({
      business_id: businessId,
      customer_phone: from,
      opted_out: true,
    });

  return twiml(`
<Response>

<Message>

You have successfully been unsubscribed.

</Message>

</Response>
`);

}
  if (
  keyword === "START" ||
  keyword === "UNSTOP"
) {

  await supabase
    .from("customer_sms_opt_outs")
    .upsert({
      business_id: businessId,
      customer_phone: from,
      opted_out: false,
    });

  return twiml(`
<Response>

<Message>

You are subscribed again.

</Message>

</Response>
`);

}
  return twiml("<Response/>");