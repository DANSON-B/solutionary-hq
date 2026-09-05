import * as React from 'npm:react@18.3.1'
import { Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface JobCancelledProps {
  customerName?: string
  jobTitle?: string
  scheduledDate?: string
  businessName?: string
}

const JobCancelledEmail = ({ customerName, jobTitle, scheduledDate, businessName }: JobCancelledProps) => (
  <EmailShell
    preview={`Your ${jobTitle || 'job'} has been cancelled`}
    businessName={businessName}
    eyebrow="Booking Update"
    title="Your job has been cancelled"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      Your <strong>{jobTitle || 'scheduled service'}</strong>{scheduledDate ? ` on ${scheduledDate}` : ''} has been cancelled.
    </Text>
    <Text style={s.p}>
      If you have any questions or would like to reschedule, please contact <strong>{businessName || SITE_NAME}</strong> directly.
    </Text>
  </EmailShell>
)

export const template = {
  component: JobCancelledEmail,
  subject: (data: Record<string, any>) => `Your ${data?.jobTitle || 'job'} has been cancelled`,
  displayName: 'Job cancellation notice',
  previewData: { customerName: 'Jane', jobTitle: 'Deep Cleaning', scheduledDate: 'Jan 15, 2025', businessName: 'Sparkle Cleaning' },
}
