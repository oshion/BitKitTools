import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BitKitTools',
  description: 'Free calculators for developers, travelers, beer lovers & parents',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
