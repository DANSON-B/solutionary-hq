import * as React from 'npm:react@18.3.1'
import { Button, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface JobCompletedProps {
  customerName?: string
  jobTitle?: string
  total?: string
  businessName?: string
  portalUrl?: string
}

const JobCompletedEmail = ({ customerName, jobTitle, total, businessName, portalUrl }: JobCompletedProps) => (
  <EmailShell
    preview={`Your ${jobTitle || 'job'} is complete!`}
    businessName={businessName}
    eyebrow="All Done ✓"
    title="Your job is complete"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      Your <strong>{jobTitle || 'service'}</strong> with <strong>{businessName || SITE_NAME}</strong> has been completed{total ? `. Total: $${total}` : ''}.
    </Text>
    <Text style={s.p}>Thank you for choosing us — we hope you love the results!</Text>
    {portalUrl && (
      <div style={s.ctaWrap}>
        <Button style={s.button} href={portalUrl}>View details</Button>
      </div>
    )}
  </EmailShell>
)

export const template = {
  component: JobCompletedEmail,
  subject: (data: Record<string, any>) => `Your ${data?.jobTitle || 'job'} is complete!`,
  displayName: 'Job completed summary',
  previewData: { customerName: 'Jane', jobTitle: 'Deep Cleaning', total: '250.00', businessName: 'Sparkle Cleaning' },
}
