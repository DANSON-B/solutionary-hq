// Credit accounting scaffold. Send order: included monthly first, then prepaid.

export interface CreditBalance {
  includedRemaining: number;
  prepaidRemaining: number;
  periodResetsAt: string | null;
}

export async function getCreditBalance(_businessId: string): Promise<CreditBalance> {
  // TODO: read sms_credit_balances row.
  return { includedRemaining: 0, prepaidRemaining: 0, periodResetsAt: null };
}

export async function consumeCredit(_businessId: string): Promise<boolean> {
  // TODO: call SQL fn consume_sms_credit(business_id) — atomic decrement.
  return false;
}

export async function creditPrepaid(
  _businessId: string,
  _amount: number,
  _stripePaymentIntent: string,
): Promise<void> {
  // TODO: increment prepaid_credits + insert sms_credit_transactions row.
}
