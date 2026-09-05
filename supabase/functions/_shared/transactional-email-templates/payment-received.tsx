import * as React from 'npm:react@18.3.1'
import { Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface PaymentReceivedProps {
  customerName?: string
  invoiceNumber?: string
  amount?: string
  businessName?: string
}

const PaymentReceivedEmail = ({ customerName, invoiceNumber, amount, businessName }: PaymentReceivedProps) => (
  <EmailShell
    preview="Payment received — thank you!"
    businessName={businessName}
    eyebrow="Payment Received"
    title="Thanks — your payment is in 🎉"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      We've received your payment{amount ? ` of $${amount}` : ''}{invoiceNumber ? ` for invoice #${invoiceNumber}` : ''}.
    </Text>
    {(invoiceNumber || amount) && (
      <div style={s.card}>
        {invoiceNumber && <DetailRow label="Invoice" value={`#${invoiceNumber}`} />}
        {invoiceNumber && amount && <Hr style={s.divider} />}
        {amount && <DetailRow label="Amount paid" value={`$${amount}`} />}
      </div>
    )}
    <Text style={s.p}>We appreciate your prompt payment — {businessName || SITE_NAME}.</Text>
  </EmailShell>
)

export const template = {
  component: PaymentReceivedEmail,
  subject: 'Payment received — thank you!',
  displayName: 'Payment receipt',
  previewData: { customerName: 'Jane', invoiceNumber: 'INV-001', amount: '250.00', businessName: 'Sparkle Cleaning' },
}
