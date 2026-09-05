import * as React from 'npm:react@18.3.1'
import { Button, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface ServiceRequestReceivedProps {
  customerName?: string
  requestTitle?: string
  preferredDate?: string
  dashboardUrl?: string
  businessName?: string
}

const ServiceRequestReceivedEmail = ({ customerName, requestTitle, preferredDate, dashboardUrl, businessName }: ServiceRequestReceivedProps) => (
  <EmailShell
    preview={`New service request from ${customerName || 'a customer'}`}
    businessName={businessName}
    eyebrow="New Request"
    title="New service request"
  >
    <Text style={s.p}>
      <strong>{customerName || 'A customer'}</strong> has submitted a new service request.
    </Text>
    <div style={s.card}>
      <DetailRow label="Request" value={requestTitle || 'Service request'} />
      {preferredDate && (<><Hr style={s.divider} /><DetailRow label="Preferred date" value={preferredDate} /></>)}
    </div>
    {dashboardUrl && (
      <div style={s.ctaWrap}>
        <Button style={s.button} href={dashboardUrl}>View in dashboard</Button>
      </div>
    )}
  </EmailShell>
)

export const template = {
  component: ServiceRequestReceivedEmail,
  subject: (data: Record<string, any>) => `New service request from ${data?.customerName || 'a customer'}`,
  displayName: 'Service request notification',
  previewData: { customerName: 'Jane Smith', requestTitle: 'Deep Cleaning', preferredDate: 'Jan 20, 2025', dashboardUrl: 'https://example.com/dashboard' },
}
