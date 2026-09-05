import * as React from 'npm:react@18.3.1'
import { Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface CleaningReminderProps {
  customerName?: string
  scheduledDate?: string
  scheduledTime?: string
  address?: string
  businessName?: string
}

const CleaningReminderEmail = ({ customerName, scheduledDate, scheduledTime, address, businessName }: CleaningReminderProps) => (
  <EmailShell
    preview={`Reminder: Your cleaning is ${scheduledDate === 'tomorrow' ? 'tomorrow' : `on ${scheduledDate || 'soon'}`}`}
    businessName={businessName}
    eyebrow="Friendly Reminder"
    title="Your cleaning is coming up"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      A quick reminder about your upcoming cleaning with <strong>{businessName || SITE_NAME}</strong>.
    </Text>
    <div style={s.card}>
      {scheduledDate && <DetailRow label="Date" value={scheduledDate} />}
      {scheduledDate && scheduledTime && <Hr style={s.divider} />}
      {scheduledTime && <DetailRow label="Time" value={scheduledTime} />}
      {address && (<><Hr style={s.divider} /><DetailRow label="Address" value={address} /></>)}
    </div>
    <Text style={s.p}>Please make sure the space is accessible. If you need to reschedule, contact us as soon as possible.</Text>
  </EmailShell>
)

export const template = {
  component: CleaningReminderEmail,
  subject: (data: Record<string, any>) => `Reminder: Your cleaning is ${data?.scheduledDate === 'tomorrow' ? 'tomorrow' : `on ${data?.scheduledDate || 'soon'}`}`,
  displayName: 'Cleaning reminder',
  previewData: { customerName: 'Jane', scheduledDate: 'tomorrow', scheduledTime: '10:00 AM', address: '123 Main St', businessName: 'Sparkle Cleaning' },
}
