/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "npm:@supabase/supabase-js@2.57.2";

import {
  buildCorsHeaders,
} from "../_shared/security.ts";
import { validateTwilioSignature, twilioForbidden } from "../_shared/twilio/signature.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

function twiml(body = "<Response/>") {
  return new Response(body, {
    headers: { "Content-Type": "text/xml" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return twiml();
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    console.error("sms-status: failed to parse form", err);
    return twiml();
  }

  if (!validateTwilioSignature(req, form)) return twilioForbidden();

  const sid = String(form.get("MessageSid") ?? "").trim();
  const status = String(form.get("MessageStatus") ?? "").trim();
  const errorCode = form.get("ErrorCode") ? String(form.get("ErrorCode")) : null;
  const errorMessage = form.get("ErrorMessage") ? String(form.get("ErrorMessage")) : null;

  if (!sid || !status) {
    return twiml();
  }

  const update: Record<string, unknown> = { status };
  if (errorCode) update.error_code = errorCode;
  if (errorMessage) update.error_message = errorMessage;

  const { error } = await supabase
    .from("sms_messages")
    .update(update)
    .eq("twilio_sid", sid);

  if (error) {
    console.error("sms-status: failed to update sms_messages", { sid, status, error });
  }

  return twiml();
});
