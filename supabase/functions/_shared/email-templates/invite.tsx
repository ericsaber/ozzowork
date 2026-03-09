/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to ozzo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ozzo</Text>
        <Heading style={h1}>You've been invited</Heading>
        <Text style={text}>
          Someone invited you to{' '}
          <Link href={siteUrl} style={link}>
            <strong>ozzo</strong>
          </Link>
          — a calm place to keep track of your contacts and follow-ups.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>Sent by ollo</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '24px', fontFamily: "'Instrument Serif', Georgia, serif", color: '#18181a', margin: '0 0 24px', fontStyle: 'italic' as const }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#18181a', margin: '0 0 8px', fontFamily: "'DM Sans', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#c8622a', textDecoration: 'underline' }
const button = { backgroundColor: '#c8622a', color: '#f8f6f3', fontSize: '14px', borderRadius: '12px', padding: '12px 24px', textDecoration: 'none', fontWeight: '500' as const }
const footer = { fontSize: '12px', color: '#a0a0a0', margin: '28px 0 0' }
const footerBrand = { fontSize: '12px', color: '#a0a0a0', margin: '8px 0 0' }
