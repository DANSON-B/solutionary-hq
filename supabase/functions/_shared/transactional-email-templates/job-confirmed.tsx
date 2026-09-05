import * as React from 'npm:react@18.3.1'
import { Button, Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface JobConfirmedProps {
  customerName?: string
  jobTitle?: string
  scheduledDate?: string
  scheduledTime?: string
  address?: string
  businessName?: string
  portalUrl?: string
}

const JobConfirmedEmail = ({ customerName, jobTitle, scheduledDate, scheduledTime, address, businessName, portalUrl }: JobConfirmedProps) => (
  <EmailShell
    preview={`Your ${jobTitle || 'job'} is confirmed for ${scheduledDate || 'soon'}`}
    businessName={businessName}
    eyebrow="Booking Confirmed"
    title="You're on the schedule 🎉"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      Your <strong>{jobTitle || 'service'}</strong> with <strong>{businessName || SITE_NAME}</strong> is confirmed. Here are the details:
    </Text>
    <div style={s.card}>
      {scheduledDate && <DetailRow label="Date" value={scheduledDate} />}
      {scheduledDate && scheduledTime && <Hr style={s.divider} />}
      {scheduledTime && <DetailRow label="Time" value={scheduledTime} />}
      {address && (<><Hr style={s.divider} /><DetailRow label="Address" value={address} /></>)}
    </div>
    {portalUrl && (
      <div style={s.ctaWrap}>
        <Button style={s.button} href={portalUrl}>View in portal</Button>
      </div>
    )}
    <Text style={s.p}>Need to make a change? Just reply to this email or contact us directly.</Text>
  </EmailShell>
)

export const template = {
  component: JobConfirmedEmail,
  subject: (data: Record<string, any>) => `Your ${data?.jobTitle || 'job'} is confirmed${data?.scheduledDate ? ` for ${data.scheduledDate}` : ''}`,
  displayName: 'Job/booking confirmation',
  previewData: { customerName: 'Jane', jobTitle: 'Deep Cleaning', scheduledDate: 'Jan 15, 2025', scheduledTime: '10:00 AM', address: '123 Main St', businessName: 'Sparkle Cleaning' },
}
