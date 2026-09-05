/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Html, Img, Preview, Section, Text, Hr, Row, Column,
} from 'npm:@react-email/components@0.0.22'

export const BRAND = {
  navy: '#0F2A4A',
  amber: '#F59E0B',
  ink: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  pageBg: '#F1F5F9',
  white: '#FFFFFF',
  radius: '14px',
  fontStack: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  logo: 'https://solutionaryhq.com/favicon.png',
}

export const s = {
  main: { backgroundColor: BRAND.pageBg, fontFamily: BRAND.fontStack, margin: 0, padding: '32px 12px' } as React.CSSProperties,
  container: { backgroundColor: BRAND.white, margin: '0 auto', maxWidth: '580px', borderRadius: BRAND.radius, overflow: 'hidden', border: `1px solid ${BRAND.border}`, boxShadow: '0 1px 2px rgba(15,42,74,0.04)' } as React.CSSProperties,
  header: { backgroundColor: BRAND.navy, padding: '20px 28px' } as React.CSSProperties,
  brandName: { color: BRAND.white, fontSize: '16px', fontWeight: 700, margin: 0, letterSpacing: '0.2px' } as React.CSSProperties,
  brandSub: { color: 'rgba(255,255,255,0.72)', fontSize: '12px', margin: '2px 0 0' } as React.CSSProperties,
  accentBar: { height: '4px', backgroundColor: BRAND.amber } as React.CSSProperties,
  body: { padding: '32px 28px 8px' } as React.CSSProperties,
  eyebrow: { color: BRAND.amber, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, margin: '0 0 8px' } as React.CSSProperties,
  h1: { color: BRAND.ink, fontSize: '24px', lineHeight: '1.25', fontWeight: 700, margin: '0 0 16px' } as React.CSSProperties,
  p: { color: BRAND.text, fontSize: '15px', lineHeight: '1.65', margin: '0 0 14px' } as React.CSSProperties,
  card: { backgroundColor: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: '10px', padding: '18px 20px', margin: '18px 0' } as React.CSSProperties,
  label: { color: BRAND.muted, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 4px' } as React.CSSProperties,
  value: { color: BRAND.ink, fontSize: '15px', fontWeight: 600, margin: '0 0 4px' } as React.CSSProperties,
  divider: { border: 'none', borderTop: `1px solid ${BRAND.border}`, margin: '12px 0' } as React.CSSProperties,
  ctaWrap: { textAlign: 'center' as const, padding: '8px 0 20px' } as React.CSSProperties,
  button: { backgroundColor: BRAND.navy, color: BRAND.white, fontSize: '15px', fontWeight: 600, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' } as React.CSSProperties,
  buttonAmber: { backgroundColor: BRAND.amber, color: BRAND.ink, fontSize: '15px', fontWeight: 700, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' } as React.CSSProperties,
  footer: { padding: '20px 28px 28px', backgroundColor: BRAND.surface, borderTop: `1px solid ${BRAND.border}` } as React.CSSProperties,
  footerText: { color: BRAND.muted, fontSize: '12px', lineHeight: '1.6', margin: 0, textAlign: 'center' as const } as React.CSSProperties,
  footerStrong: { color: BRAND.ink, fontWeight: 600 } as React.CSSProperties,
}

interface ShellProps {
  preview: string
  businessName?: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  footerNote?: string
}

export const EmailShell = ({ preview, businessName, eyebrow, title, children, footerNote }: ShellProps) => {
  const brand = businessName || 'Solutionary HQ'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.header}>
            <Row>
              <Column style={{ width: '48px', verticalAlign: 'middle' }}>
                <Img src={BRAND.logo} width="40" height="40" alt={brand} style={{ borderRadius: 8, display: 'block' }} />
              </Column>
              <Column style={{ verticalAlign: 'middle', paddingLeft: '12px' }}>
                <Text style={s.brandName}>{brand}</Text>
                <Text style={s.brandSub}>Powered by Solutionary HQ</Text>
              </Column>
            </Row>
          </Section>
          <div style={s.accentBar} />
          <Section style={s.body}>
            {eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}
            <Text style={s.h1}>{title}</Text>
            {children}
          </Section>
          <Section style={s.footer}>
            <Text style={s.footerText}>
              {footerNote || <>Sent by <span style={s.footerStrong}>{brand}</span>. Please do not reply to this email.</>}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <>
    <Text style={s.label}>{label}</Text>
    <Text style={s.value}>{value}</Text>
  </>
)
