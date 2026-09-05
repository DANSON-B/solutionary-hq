import * as React from 'npm:react@18.3.1'
import { Button, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, s } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface ReviewRequestProps {
  customerName?: string
  jobTitle?: string
  businessName?: string
  reviewUrl?: string
}

const ReviewRequestEmail = ({ customerName, jobTitle, businessName, reviewUrl }: ReviewRequestProps) => (
  <EmailShell
    preview={`How did we do? Leave a review for ${businessName || SITE_NAME}`}
    businessName={businessName}
    eyebrow="⭐ Quick Favor"
    title="How did we do?"
  >
    <Text style={s.p}>Hi {customerName || 'there'},</Text>
    <Text style={s.p}>
      We hope you loved your recent <strong>{jobTitle || 'service'}</strong> with <strong>{businessName || SITE_NAME}</strong>.
    </Text>
    <Text style={s.p}>
      A short review helps other customers find us — and it means the world to our team. Would you take 30 seconds?
    </Text>
    {reviewUrl && (
      <div style={s.ctaWrap}>
        <Button style={s.buttonAmber} href={reviewUrl}>Leave a review</Button>
      </div>
    )}
  </EmailShell>
)

export const template = {
  component: ReviewRequestEmail,
  subject: (data: Record<string, any>) => `How was your experience with ${data?.businessName || SITE_NAME}?`,
  displayName: 'Review request',
  previewData: { customerName: 'Jane', jobTitle: 'Deep Cleaning', businessName: 'Sparkle Cleaning', reviewUrl: 'https://example.com/review/abc' },
}
