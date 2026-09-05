// SMS message templates. All messages must be prefixed with the business name
// and include STOP-to-opt-out wording on first-touch messages.

export interface TemplateContext {
  business: string;
  customerName?: string;
  date?: string;
  time?: string;
  service?: string;
  reviewUrl?: string;
}

export function bookingConfirmationTemplate(_ctx: TemplateContext): string {
  // TODO: `${business}: Booking confirmed for ${date} at ${time}. Reply STOP to opt out.`
  return "";
}

export function reminder24hTemplate(_ctx: TemplateContext): string {
  // TODO: `${business}: Reminder — ${service} tomorrow at ${time}. Reply C to confirm.`
  return "";
}

export function jobCompletionTemplate(_ctx: TemplateContext): string {
  // TODO: `${business}: Your ${service} is complete. Leave a review: ${reviewUrl}`
  return "";
}
