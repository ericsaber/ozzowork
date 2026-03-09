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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for ozzo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ozzo</Text>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>ozzo</strong>
          </Link>
          — you're one step away from never forgetting a follow-up again.
        </Text>
        <Text style={text}>
          Please confirm your email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Get Started
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={footerBrand}>Sent by ozzo</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '24px', fontFamily: "'Instrument Serif', Georgia, serif", color: '#18181a', margin: '0 0 24px', fontStyle: 'italic' as const }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#18181a', margin: '0 0 8px', fontFamily: "'DM Sans', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#c8622a', textDecoration: 'underline' }
const button = { backgroundColor: '#c8622a', color: '#f8f6f3', fontSize: '14px', borderRadius: '12px', padding: '12px 24px', textDecoration: 'none', fontWeight: '500' as const }
const footer = { fontSize: '12px', color: '#a0a0a0', margin: '28px 0 0' }
const footerBrand = { fontSize: '12px', color: '#a0a0a0', margin: '8px 0 0' }
