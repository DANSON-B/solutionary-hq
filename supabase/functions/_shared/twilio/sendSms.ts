// sendSms scaffold — core outbound SMS helper.
// Will handle: credit check, opt-out check, E.164 validation, rate limit,
// gateway call, sms_messages logging, credit decrement.

export interface SendSmsParams {
  businessId: string;
  customerId?: string | null;
  toPhone: string;
  body: string;
}

export interface SendSmsResult {
  ok: boolean;
  twilioSid?: string;
  status?: string;
  error?: string;
  creditsUsed?: number;
}

export async function sendSms(_params: SendSmsParams): Promise<SendSmsResult> {
  // TODO: implement per .lovable/sms-pricing-plan.md
  throw new Error("sendSms not implemented");
}
