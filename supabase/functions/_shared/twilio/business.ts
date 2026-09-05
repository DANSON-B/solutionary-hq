import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createSubaccountClient } from "./client.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: {
    persistSession: false,
  },
});

export interface BusinessTwilio {
  business_id: string;
  subaccount_sid: string;
  phone_number: string;
  phone_sid: string;
  twilio_status: string;
}

export async function getBusinessTwilio(businessId: string): Promise<BusinessTwilio> {
  const { data, error } = await supabase.from("business_twilio").select("*").eq("business_id", businessId).single();

  if (error || !data) {
    throw new Error("Business Twilio account not found.");
  }

  if (data.twilio_status !== "active") {
    throw new Error("Business Twilio account is not active.");
  }

  return data;
}

export async function getBusinessClient(businessId: string) {
  const twilio = await getBusinessTwilio(businessId);

  const client = createSubaccountClient(twilio.subaccount_sid);

  return {
    twilio,

    client,

    fromNumber: twilio.phone_number,
  };
}
