import type { Metadata } from 'next'
import './globals.css'

const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION

export const metadata: Metadata = {
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
