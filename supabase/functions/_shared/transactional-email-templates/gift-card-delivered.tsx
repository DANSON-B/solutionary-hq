import * as React from 'npm:react@18.3.1'
import { Hr, Text } from 'npm:@react-email/components@0.0.22'
import { EmailShell, DetailRow, s, BRAND } from './_layout.tsx'

const SITE_NAME = 'Solutionary HQ'

interface GiftCardEmailProps {
  recipientName?: string
  buyerName?: string
  packageName?: string
  packageDescription?: string
  giftCardCode?: string
  amount?: string
  personalMessage?: string
  businessName?: string
  redeemUrl?: string
  expiresAt?: string
}

const codeStyle: React.CSSProperties = {
  color: BRAND.navy,
  fontSize: '26px',
  fontWeight: 800,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  letterSpacing: '0.18em',
  margin: '6px 0 0',
  textAlign: 'center',
}

const msgBox: React.CSSProperties = {
  backgroundColor: '#FEF3C7',
  border: `1px solid #FDE68A`,
  borderRadius: '10px',
  padding: '16px 18px',
  margin: '18px 0',
}

const GiftCardEmail = ({
  recipientName, buyerName, packageName, packageDescription,
  giftCardCode, amount, personalMessage, businessName, expiresAt,
}: GiftCardEmailProps) => (
  <EmailShell
    preview={`You've received a cleaning gift card from ${buyerName || 'someone special'}`}
    businessName={businessName}
    eyebrow="🎁 A Gift For You"
    title="You've received a gift!"
    footerNote={`Gift purchased through ${businessName || SITE_NAME}. Non-refundable · Valid for one year.`}
  >
    <Text style={s.p}>Hi {recipientName || 'there'},</Text>
    <Text style={s.p}>
      <strong>{buyerName || 'Someone special'}</strong> has gifted you a cleaning service from <strong>{businessName || SITE_NAME}</strong>.
    </Text>

    {personalMessage && (
      <div style={msgBox}>
        <Text style={{ ...s.p, fontStyle: 'italic', margin: 0 }}>"{personalMessage}"</Text>
        <Text style={{ ...s.p, fontSize: '13px', marginTop: '8px', marginBottom: 0, color: BRAND.muted }}>— {buyerName}</Text>
      </div>
    )}

    <div style={s.card}>
      <DetailRow label="Package" value={packageName || 'Cleaning Service'} />
      {packageDescription && <Text style={{ ...s.p, fontSize: '13px', color: BRAND.muted, margin: '4px 0 0' }}>{packageDescription}</Text>}
      <Hr style={s.divider} />
      <DetailRow label="Value" value={`$${amount || '0'}`} />
      <Hr style={s.divider} />
      <Text style={s.label}>Your gift card code</Text>
      <Text style={codeStyle}>{giftCardCode || '--------'}</Text>
      {expiresAt && (<><Hr style={s.divider} /><DetailRow label="Valid until" value={expiresAt} /></>)}
    </div>

    <Text style={s.p}>To redeem, contact us or mention your code when booking.</Text>
  </EmailShell>
)

export const template = {
  component: GiftCardEmail,
  subject: (data: Record<string, any>) => `🎁 You've received a cleaning gift card from ${data.buyerName || 'someone special'}!`,
  displayName: 'Gift Card Delivered',
}
