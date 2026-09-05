# SMS Notifications + Pricing Overhaul — Plan (On Standby)

> Status: **Approved, paused before implementation.** Resume by re-reading this file.

Two coordinated workstreams: ship Twilio-powered SMS, then re-tier pricing around it with a credit-based usage model.

---

## Part 1 — SMS Notifications (Twilio via shared number)

**Architecture decision:** one Solutionary-owned Twilio number sends for all tenants. Every message is prefixed with the business name (`Acme Cleaning: Reminder — your appointment is tomorrow at 10am. Reply STOP to opt out.`). Avoids per-tenant number provisioning, A2P 10DLC complexity per business, and recurring per-number cost.

### Triggers (3 events shipping in v1)

| Event | When fires | Template |
|---|---|---|
| Booking confirmation | `bookings` row created (or status → `confirmed`) | `"{Business}: Booking confirmed for {date} at {time}. We'll see you then."` |
| Appointment reminder | 24h before scheduled job (cron) | `"{Business}: Reminder — {service} tomorrow at {time}. Reply C to confirm."` |
| Job completion | `jobs.status` → `completed` | `"{Business}: Your {service} is complete. Thanks! Leave a review: {short_url}"` |

### New infrastructure

1. **Connector**: link Twilio via the standard connectors flow (gateway-based, auto token refresh).
2. **DB tables (migration):**
   - `sms_messages` — log every send: `id, business_id, customer_id, to_phone, body, twilio_sid, status, error, credits_used, created_at`. RLS: business members only.
   - `sms_credit_balances` — `business_id (PK), included_remaining_this_period, prepaid_credits, period_resets_at`. 1 row per business.
   - `sms_credit_transactions` — audit log: `business_id, delta, reason ('monthly_grant'|'send'|'pack_purchase'|'refund'), stripe_payment_intent, created_at`.
   - `notification_preferences` — `business_id, sms_booking_confirmation, sms_reminder_24h, sms_job_completion, customer_can_opt_out`. Defaults all true.
   - `customer_sms_opt_outs` — track STOP replies per `(business_id, phone)`.
3. **Edge functions:**
   - `send-sms` — core sender. Validates: business has credits → not on opt-out list → phone is E.164 → rate limit (5/min/business). Decrements credits atomically via SQL function `consume_sms_credit(business_id)`. Logs to `sms_messages`.
   - `sms-cron-reminders` — runs hourly via `pg_cron`, finds jobs scheduled in the next 24–25h window, calls `send-sms` for each with `notification_preferences.sms_reminder_24h = true`.
   - `sms-webhook-inbound` — receives Twilio inbound webhook, handles STOP/UNSTOP/HELP keywords, writes to `customer_sms_opt_outs`. `verify_jwt = false`.
   - `purchase-sms-credits` — Stripe Checkout for prepaid packs.
   - `stripe-webhook-sms` — on `checkout.session.completed` for an SMS pack, atomically credits `sms_credit_balances.prepaid_credits`.
4. **Triggers in existing flows:** add `supabase.functions.invoke('send-sms', …)` calls inside `BookingContactForm` submit, in `JobDetailPage` status-change handler, and in the booking-confirmation server flow. All wrapped so an SMS failure never blocks the underlying business action.

### Settings UI

`src/pages/dashboard/SettingsPage.tsx` → new "SMS & Notifications" tab:
- Toggle each of the 3 SMS triggers
- Show current period: "127 / 200 included SMS used this month"
- Show prepaid balance: "85 credits remaining"
- "Buy SMS credits" button → opens pack selector
- View send log (last 100 messages, status, error)
- TCPA-compliance note (auto-included STOP wording, link to terms)

### Compliance must-haves before going live

- A2P 10DLC brand + campaign registration on the shared Solutionary Twilio number (handled in Twilio console, ~1–2 weeks approval).
- STOP/HELP auto-handling via inbound webhook (built in).
- Customer opt-in: Booking form gets a checkbox "Send me SMS updates about my appointment" (stored on `customers` row).
- Twilio SMS Pumping Protection + Geo Permissions limited to US/CA initially.

---

## Part 2 — Pricing Overhaul (4 tiers + usage credits)

### New tier table

| Tier | Monthly price | Users | Included SMS | Included emails | Jobs/mo |
|---|---|---|---|---|---|
| **Solo (Free)** | $0 | 1 | 0 | 100 | 15 |
| **Starter** | $25 | 1 | 50 | 500 | unlimited |
| **Professional** | $50 | 5 | 200 | 2,000 | unlimited |
| **Business** | $100 | unlimited | 750 | 10,000 | unlimited |

### Overage model: prepaid SMS credit packs

| Pack | Price | Per-SMS cost |
|---|---|---|
| 100 SMS | $5 | $0.050 |
| 500 SMS | $20 | $0.040 |
| 2,000 SMS | $70 | $0.035 |

Credits never expire. Included monthly SMS resets each billing period; prepaid credits roll over. Send order: included first, then prepaid. When both hit zero, send is blocked with a clear in-app prompt: *"Out of SMS credits. Buy a pack to keep sending."*

### Stripe work

- Create 4 new subscription products + prices (Solo $0, Starter $25, Pro $50, Business $100). Old $49/$99/$199 prices stay alive for existing subscribers but are no longer offered to new signups.
- Create 3 one-time products for credit packs.
- Update `ALLOWED_STRIPE_PRICE_IDS` secret to include the new IDs.
- Migrate `subscriptionTiers.ts` with new pricing + included quotas.
- Existing subscribers: keep current price grandfathered, surface a banner "New simpler pricing available — switch and save" on Settings → Billing.

### UI changes

- `PricingPage.tsx` — 4-column grid (Solo highlighted as "Free forever"), Professional remains "Most Popular". Add an **"Included usage"** row per plan and a **"Need more? Buy SMS packs from $5"** footnote linking to a usage-pricing detail section.
- New `UsagePricingSection` component on PricingPage explaining the credit model with the pack table.
- `ChoosePlanPage.tsx` — same 4-tier layout, Solo button says "Continue free" and bypasses Stripe (creates a $0 subscription record directly).
- Dashboard home — add a small "Usage this month" widget (jobs / SMS / email bars).

---

## Technical summary

| Area | Files |
|---|---|
| DB migration | `sms_messages`, `sms_credit_balances`, `sms_credit_transactions`, `notification_preferences`, `customer_sms_opt_outs`, `consume_sms_credit()` SQL fn, `pg_cron` job for reminders |
| Edge functions | `send-sms`, `sms-cron-reminders`, `sms-webhook-inbound`, `purchase-sms-credits`, `stripe-webhook-sms` |
| Connector | Twilio (shared number) |
| Stripe | 4 new subscription prices + 3 pack prices + update `ALLOWED_STRIPE_PRICE_IDS` |
| Frontend | `PricingPage.tsx`, `ChoosePlanPage.tsx`, `subscriptionTiers.ts`, new `SmsSettingsTab`, new `UsageWidget`, `BookingContactForm` opt-in checkbox, send hooks in booking + job-status flows |
| Memory | Update `mem://features/subscription-management` + new `mem://features/communications/sms-system` |

---

## Roll-out order (so nothing breaks)

1. Twilio connector + `send-sms` edge function + DB tables (no UI yet, manual test).
2. A2P 10DLC registration submitted in parallel — gates real production sending.
3. Booking/reminder/completion triggers wired up, gated behind a feature flag per business.
4. New Stripe products + pricing page + plan picker.
5. SMS settings tab + credit purchase flow.
6. Usage widget on dashboard.
7. Flip feature flag on for all tenants once 10DLC approves.

---

## Open items to confirm before resuming

1. **Confirm the new monthly prices** ($0 / $25 / $50 / $100) — these become real Stripe products, hard to undo cleanly.
2. **Confirm SMS pack pricing** ($5 / $20 / $70) — or provide preferred numbers. Twilio US SMS cost is ~$0.0083, so even the cheapest pack is ~6× margin which absorbs A2P fees + failed sends.
3. **Existing paid subscribers** — grandfather them at old price, or auto-migrate to the closest new tier? Recommend grandfather.
4. **A2P 10DLC brand info**: legal business name, EIN, support email, sample message templates.

### User decisions already locked in

- **SMS overage model:** Prepaid credit packs (no metered billing, no hard surprise charges).
- **Twilio numbers:** Shared Solutionary number for all tenants.
- **Free tier scope:** Disregarded — Solo Free tier defined above as default.
