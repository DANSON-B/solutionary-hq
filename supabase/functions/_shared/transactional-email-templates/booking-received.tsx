import * as React from 'npm:react@18.3.1'
import { Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface BookingReceivedProps {
  customerName?: string
  category?: string
  serviceName?: string
  scheduledDate?: string
  scheduledTime?: string
  address?: string
  total?: string
  businessName?: string
}

const categoryLabels: Record<string, string> = {
  residential: 'Residential Cleaning',
  commercial: 'Commercial Cleaning',
  post_construction: 'Post-Construction Cleaning',
}

const BookingReceivedEmail = ({
  customerName, category, serviceName, scheduledDate, scheduledTime, address, total, businessName,
}: BookingReceivedProps) => (
  <EmailShell
    preview={`We've received your ${categoryLabels[category || ''] || 'cleaning'} booking request`}
    businessName={businessName}
    eyebrow="Booking Received"
    title="Thanks — we've got your request"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      Thank you for booking with <strong>{businessName || SITE_NAME}</strong>. We'll review your request and confirm within 24 hours.
    </Text>
    <div style={s.card}>
      <DetailRow label="Service" value={serviceName || categoryLabels[category || ''] || 'Cleaning Service'} />
      {scheduledDate && (<><Hr style={s.divider} /><DetailRow label="Preferred date & time" value={`${scheduledDate}${scheduledTime ? ` at ${scheduledTime}` : ''}`} /></>)}
      {address && (<><Hr style={s.divider} /><DetailRow label="Address" value={address} /></>)}
      {total && (<><Hr style={s.divider} /><DetailRow label="Estimated total" value={`$${total}`} /></>)}
    </div>
    <Text style={s.p}>If you have any questions in the meantime, just reply to this email or reach out to us directly.</Text>
  </EmailShell>
)

export const template = {
  component: BookingReceivedEmail,
  subject: (data: Record<string, any>) => `Booking Request Received — ${data.serviceName || 'Cleaning Service'}`,
  displayName: 'Booking Request Received',
}
