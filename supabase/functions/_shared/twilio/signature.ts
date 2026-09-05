import Twilio from "npm:twilio";

const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? Deno.env.get("TwilioAuthToken") ?? "";

/**
 * Verifies the X-Twilio-Signature header on an incoming Twilio webhook.
 * The signature is computed over the exact webhook URL (as configured in
 * Twilio) plus the sorted POST form parameters.
 *
 * Returns true when the request is authentic.
 */
export function validateTwilioSignature(req: Request, form: FormData): boolean {
  if (!AUTH_TOKEN) {
    // Fail closed when the auth token isn't configured.
    console.error("twilio-signature: TWILIO_AUTH_TOKEN not configured");
    return false;
  }

  const signature = req.headers.get("X-Twilio-Signature") ?? req.headers.get("x-twilio-signature");
  if (!signature) return false;

  // Twilio signs the full public URL. Behind Supabase's proxy the request URL
  // is already the public functions.supabase.co URL — use it as-is.
  const url = req.url;

  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    params[k] = typeof v === "string" ? v : "";
  }

  try {
    return Twilio.validateRequest(AUTH_TOKEN, signature, url, params);
  } catch (err) {
    console.error("twilio-signature: validation error", err);
    return false;
  }
}

export function twilioForbidden(): Response {
  return new Response("<Response/>", {
    status: 403,
    headers: { "Content-Type": "text/xml" },
  });
}
