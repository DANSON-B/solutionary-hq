// Opt-out helpers for STOP / UNSTOP / HELP inbound keywords.

export type InboundKeyword = "STOP" | "UNSTOP" | "START" | "HELP" | "UNKNOWN";

export function parseInboundKeyword(_body: string): InboundKeyword {
  // TODO: normalize casing / trim, map STOP|STOPALL|UNSUBSCRIBE|CANCEL|END|QUIT -> STOP,
  //       START|UNSTOP -> UNSTOP, HELP|INFO -> HELP.
  return "UNKNOWN";
}

export async function isOptedOut(_businessId: string, _phone: string): Promise<boolean> {
  // TODO: query customer_sms_opt_outs.
  return false;
}

export async function recordOptOut(_businessId: string, _phone: string): Promise<void> {
  // TODO: insert into customer_sms_opt_outs.
}

export async function recordOptIn(_businessId: string, _phone: string): Promise<void> {
  // TODO: delete from customer_sms_opt_outs.
}
