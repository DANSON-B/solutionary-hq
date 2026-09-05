import { masterClient } from "./client.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

export async function provisionBusinessTwilio(businessId: string, businessName: string) {
  // Has this business already been provisioned?

  const { data: existing } = await supabase
    .from("business_twilio")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  console.log("Creating Twilio Subaccount...");

  const subaccount = await masterClient.api.v2010.accounts.create({
    friendlyName: businessName,
  });

  console.log("Subaccount Created");

  const subClient = masterClient.api.v2010.account(subaccount.sid);

  const available = await subClient.availablePhoneNumbers("US").local.list({
    limit: 1,
  });

  if (!available.length) {
    throw new Error("No Twilio numbers available.");
  }

  const purchased = await subClient.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
  });

  const { data, error } = await supabase
    .from("business_twilio")
    .insert({
      business_id: businessId,

      subaccount_sid: subaccount.sid,

      subaccount_auth_token: subaccount.authToken,

      phone_sid: purchased.sid,

      phone_number: purchased.phoneNumber,

      status: "active",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
