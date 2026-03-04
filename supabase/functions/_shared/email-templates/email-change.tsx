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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for ollo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ollo</Text>
        <Heading style={h1}>Confirm your new email</Heading>
        <Text style={text}>
          You requested to change your ollo email from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this, please secure your account immediately.
        </Text>
        <Text style={footerBrand}>Sent by ollo</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '24px', fontFamily: "'Instrument Serif', Georgia, serif", color: '#18181a', margin: '0 0 24px', fontStyle: 'italic' as const }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#18181a', margin: '0 0 8px', fontFamily: "'DM Sans', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#c8622a', textDecoration: 'underline' }
const button = { backgroundColor: '#c8622a', color: '#f8f6f3', fontSize: '14px', borderRadius: '12px', padding: '12px 24px', textDecoration: 'none', fontWeight: '500' as const }
const footer = { fontSize: '12px', color: '#a0a0a0', margin: '28px 0 0' }
const footerBrand = { fontSize: '12px', color: '#a0a0a0', margin: '8px 0 0' }
