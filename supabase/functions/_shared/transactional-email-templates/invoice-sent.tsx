import * as React from 'npm:react@18.3.1'
import { Button, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface InvoiceSentProps {
  customerName?: string
  invoiceNumber?: string
  total?: string
  businessName?: string
  paymentUrl?: string
}

const InvoiceSentEmail = ({ customerName, invoiceNumber, total, businessName, paymentUrl }: InvoiceSentProps) => (
  <EmailShell
    preview={`Invoice ${invoiceNumber || ''} from ${businessName || SITE_NAME} — $${total || '0.00'}`}
    businessName={businessName}
    eyebrow="New Invoice"
    title="You have a new invoice"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      <strong>{businessName || SITE_NAME}</strong> has sent you invoice{invoiceNumber ? ` #${invoiceNumber}` : ''}. Review the amount below and pay securely online.
    </Text>
    <div style={s.card}>
      {invoiceNumber && <DetailRow label="Invoice" value={`#${invoiceNumber}`} />}
      {invoiceNumber && total && <Hr style={s.divider} />}
      {total && <DetailRow label="Amount due" value={`$${total}`} />}
    </div>
    {paymentUrl ? (
      <div style={s.ctaWrap}>
        <Button style={s.button} href={paymentUrl}>Pay Now — ${total || '0.00'}</Button>
      </div>
    ) : (
      <Text style={s.p}>Please contact the business for payment details.</Text>
    )}
  </EmailShell>
)

export const template = {
  component: InvoiceSentEmail,
  subject: (data: Record<string, any>) => `Invoice${data?.invoiceNumber ? ` #${data.invoiceNumber}` : ''} from ${data?.businessName || SITE_NAME}`,
  displayName: 'Invoice sent to customer',
  previewData: { customerName: 'Jane', invoiceNumber: 'INV-001', total: '250.00', businessName: 'Sparkle Cleaning', paymentUrl: 'https://example.com/pay/abc' },
}
