import type { Metadata } from 'next'
import './globals.css'

const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'BitKitTools',
  description: 'Free calculators for developers, travelers, beer lovers & parents',
  ...(gscVerification ? { verification: { google: gscVerification } } : {}),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
