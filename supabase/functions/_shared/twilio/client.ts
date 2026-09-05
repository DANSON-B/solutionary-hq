import Twilio from "npm:twilio";

const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

if (!ACCOUNT_SID) {
  throw new Error("TWILIO_ACCOUNT_SID missing");
}

if (!AUTH_TOKEN) {
  throw new Error("TWILIO_AUTH_TOKEN missing");
}

export const masterAccountSid = ACCOUNT_SID;

export const masterClient = Twilio(ACCOUNT_SID, AUTH_TOKEN);

/**
 * Creates a client that operates inside a Twilio subaccount
 * while authenticating with the master account credentials.
 */
export function createSubaccountClient(subaccountSid: string) {
  return Twilio(ACCOUNT_SID, AUTH_TOKEN, {
    accountSid: subaccountSid,
  });
}
