import * as React from 'npm:react@18.3.1'
import { Button, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface QuoteSentProps {
  customerName?: string
  quoteNumber?: string
  total?: string
  businessName?: string
  portalUrl?: string
}

const QuoteSentEmail = ({ customerName, quoteNumber, total, businessName, portalUrl }: QuoteSentProps) => (
  <EmailShell
    preview={`You have a new quote from ${businessName || SITE_NAME}`}
    businessName={businessName}
    eyebrow="New Quote"
    title="Your quote is ready to review"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      <strong>{businessName || SITE_NAME}</strong> has prepared a quote for you. Take a look and approve when you're ready.
    </Text>
    {(quoteNumber || total) && (
      <div style={s.card}>
        {quoteNumber && <DetailRow label="Quote" value={`#${quoteNumber}`} />}
        {quoteNumber && total && <Hr style={s.divider} />}
        {total && <DetailRow label="Total" value={`$${total}`} />}
      </div>
    )}
    {portalUrl && (
      <div style={s.ctaWrap}>
        <Button style={s.button} href={portalUrl}>View & approve quote</Button>
      </div>
    )}
    <Text style={s.p}>Questions? Just reply to this email — we're happy to help.</Text>
  </EmailShell>
)

export const template = {
  component: QuoteSentEmail,
  subject: (data: Record<string, any>) => `New quote${data?.quoteNumber ? ` #${data.quoteNumber}` : ''} from ${data?.businessName || SITE_NAME}`,
  displayName: 'Quote sent to customer',
  previewData: { customerName: 'Jane', quoteNumber: 'Q-001', total: '250.00', businessName: 'Sparkle Cleaning', portalUrl: 'https://example.com/portal/abc' },
}
