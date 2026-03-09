/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for ozzo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>ozzo</Text>
        <Heading style={h1}>Verify your identity</Heading>
        <Text style={text}>Use the code below to confirm it's you:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore it.
        </Text>
        <Text style={footerBrand}>Sent by ozzo</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brand = { fontSize: '24px', fontFamily: "'Instrument Serif', Georgia, serif", color: '#18181a', margin: '0 0 24px', fontStyle: 'italic' as const }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#18181a', margin: '0 0 8px', fontFamily: "'DM Sans', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b6b6b', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: "'DM Mono', Courier, monospace", fontSize: '28px', fontWeight: '600' as const, color: '#c8622a', margin: '0 0 28px', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#a0a0a0', margin: '28px 0 0' }
const footerBrand = { fontSize: '12px', color: '#a0a0a0', margin: '8px 0 0' }
