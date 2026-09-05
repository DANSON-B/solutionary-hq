import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as quoteSent } from './quote-sent.tsx'
import { template as quoteApproved } from './quote-approved.tsx'
import { template as jobConfirmed } from './job-confirmed.tsx'
import { template as jobCancelled } from './job-cancelled.tsx'
import { template as jobCompleted } from './job-completed.tsx'
import { template as invoiceSent } from './invoice-sent.tsx'
import { template as paymentReceived } from './payment-received.tsx'
import { template as reviewRequest } from './review-request.tsx'
import { template as serviceRequestReceived } from './service-request-received.tsx'
import { template as cleaningReminder } from './cleaning-reminder.tsx'
import { template as giftCardDelivered } from './gift-card-delivered.tsx'
import { template as bookingReceived } from './booking-received.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'quote-sent': quoteSent,
  'quote-approved': quoteApproved,
  'job-confirmed': jobConfirmed,
  'job-cancelled': jobCancelled,
  'job-completed': jobCompleted,
  'invoice-sent': invoiceSent,
  'payment-received': paymentReceived,
  'review-request': reviewRequest,
  'service-request-received': serviceRequestReceived,
  'cleaning-reminder': cleaningReminder,
  'gift-card-delivered': giftCardDelivered,
  'booking-received': bookingReceived,
}
