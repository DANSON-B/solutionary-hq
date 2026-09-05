import * as React from 'npm:react@18.3.1'
import { Button, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface QuoteApprovedProps {
  customerName?: string
  quoteNumber?: string
  total?: string
  dashboardUrl?: string
  businessName?: string
}

const QuoteApprovedEmail = ({ customerName, quoteNumber, total, dashboardUrl, businessName }: QuoteApprovedProps) => (
  <EmailShell
    preview={`Quote #${quoteNumber || ''} has been approved!`}
    businessName={businessName}
    eyebrow="Quote Approved ✓"
    title="Great news — your quote was approved"
  >
    <Text style={s.p}>
      <strong>{customerName || 'A customer'}</strong> has approved quote{quoteNumber ? ` #${quoteNumber}` : ''}{total ? ` for $${total}` : ''}.
    </Text>
    {(quoteNumber || total) && (
      <div style={s.card}>
        {quoteNumber && <DetailRow label="Quote" value={`#${quoteNumber}`} />}
        {quoteNumber && total && <Hr style={s.divider} />}
        {total && <DetailRow label="Total" value={`$${total}`} />}
      </div>
    )}
    <Text style={s.p}>You can now convert this quote to a job or invoice from your dashboard.</Text>
    {dashboardUrl && (
      <div style={s.ctaWrap}>
        <Button style={s.button} href={dashboardUrl}>View in dashboard</Button>
      </div>
    )}
  </EmailShell>
)

export const template = {
  component: QuoteApprovedEmail,
  subject: (data: Record<string, any>) => `Quote${data?.quoteNumber ? ` #${data.quoteNumber}` : ''} approved by ${data?.customerName || 'customer'}`,
  displayName: 'Quote approved notification',
  previewData: { customerName: 'Jane Smith', quoteNumber: 'Q-001', total: '250.00', dashboardUrl: 'https://example.com/dashboard/quotes' },
}
