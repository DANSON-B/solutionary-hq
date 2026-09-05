import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: {
    persistSession: false,
  },
});

function currentBillingMonth(): string {
  const now = new Date();

  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/*
|--------------------------------------------------------------------------
| PLAN
|--------------------------------------------------------------------------
*/

export async function getBusinessPlan(businessId: string) {
  const { data: business, error } = await supabase
    .from("businesses")
    .select("stripe_price_id")
    .eq("id", businessId)
    .single();

  if (error || !business) {
    throw new Error("Business not found.");
  }

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("stripe_price_id", business.stripe_price_id)
    .single();

  if (planError || !plan) {
    throw new Error("Subscription plan not found.");
  }

  return plan;
}

/*
|--------------------------------------------------------------------------
| USAGE
|--------------------------------------------------------------------------
*/

export async function getUsage(businessId: string) {
  const month = currentBillingMonth();

  let { data } = await supabase
    .from("twilio_usage")
    .select("*")
    .eq("business_id", businessId)
    .eq("billing_month", month)
    .maybeSingle();

  if (!data) {
    const { data: created } = await supabase
      .from("twilio_usage")
      .insert({
        business_id: businessId,
        billing_month: month,
      })
      .select()
      .single();

    data = created!;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| SMS
|--------------------------------------------------------------------------
*/

export async function canSendSMS(businessId: string) {
  const usage = await getUsage(businessId);

  const plan = await getBusinessPlan(businessId);

  return usage.sms_used < plan.sms_limit;
}

export async function incrementSMS(businessId: string, quantity = 1, referenceId?: string) {
  await supabase.rpc("increment_sms_usage", {
    p_business_id: businessId,
    p_quantity: quantity,
  });

  await supabase.from("twilio_usage_logs").insert({
    business_id: businessId,
    event_type: "sms",
    quantity,
    reference_id: referenceId ?? null,
  });
}

/*
|--------------------------------------------------------------------------
| VOICE
|--------------------------------------------------------------------------
*/

export async function canMakeCall(businessId: string) {
  const usage = await getUsage(businessId);

  const plan = await getBusinessPlan(businessId);

  return usage.voice_minutes_used < plan.voice_minutes;
}

export async function incrementVoiceMinutes(businessId: string, minutes: number, callSid?: string) {
  await supabase.rpc("increment_voice_usage", {
    p_business_id: businessId,
    p_minutes: minutes,
  });

  await supabase.from("twilio_usage_logs").insert({
    business_id: businessId,
    event_type: "voice",
    quantity: minutes,
    reference_id: callSid ?? null,
  });
}

/*
|--------------------------------------------------------------------------
| RESET
|--------------------------------------------------------------------------
*/

export async function resetUsage(businessId: string) {
  const month = currentBillingMonth();

  await supabase.from("twilio_usage").upsert({
    business_id: businessId,
    billing_month: month,
    sms_used: 0,
    voice_minutes_used: 0,
  });
}
