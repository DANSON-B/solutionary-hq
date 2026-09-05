/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { analyzeVoicemail } from "../_shared/ai/analyzeVoicemail.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { validateTwilioSignature, twilioForbidden } from "../_shared/twilio/signature.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: {
    persistSession: false,
  },
});

// Only allow Twilio-hosted recording URLs — prevents SSRF via forged callbacks.
const TWILIO_RECORDING_HOSTS = /^https:\/\/api\.twilio\.com\//i;

Deno.serve(async (req) => {
  const form = await req.formData();
  if (!validateTwilioSignature(req, form)) return twilioForbidden();

  const recordingSid = String(form.get("RecordingSid"));
  const recordingUrl = String(form.get("RecordingUrl"));
  const duration = Number(form.get("RecordingDuration") ?? 0);

  if (!TWILIO_RECORDING_HOSTS.test(recordingUrl)) {
    console.error("recording-complete: rejected non-Twilio recording URL", recordingUrl);
    return new Response("Invalid recording URL", { status: 400 });
  }

  const to = String(form.get("To"));
  const from = String(form.get("From"));

  const { data: twilio } = await supabase.from("business_twilio").select("business_id").eq("phone_number", to).single();

  if (!twilio) {
    return new Response("Business not found");
  }

  const { data: voicemail, error } = await supabase
    .from("voicemails")
    .insert({
      business_id: twilio.business_id,
      phone_number: to,
      caller_number: from,
      recording_sid: recordingSid,
      recording_url: recordingUrl,
      duration_seconds: duration,
      status: "processing",
    })
    .select()
    .single();

  if (error || !voicemail) {
    throw new Error("Unable to save voicemail.");
  }

  try {
    const ai = await analyzeVoicemail(recordingUrl);

    await supabase
      .from("voicemails")
      .update({
        transcription: ai.transcript,
        ai_summary: ai.summary,
        intent: ai.intent,
        urgency: ai.urgency,
        sentiment: ai.sentiment,
        customer_name: ai.customer_name,
        recommended_action: ai.recommended_action,
        tags: ai.tags,
        status: "completed",
      })
      .eq("id", voicemail.id);
  } catch (err) {
    console.error(err);

    await supabase
      .from("voicemails")
      .update({
        status: "ai_failed",
      })
      .eq("id", voicemail.id);
  }

  return new Response("OK");
});
