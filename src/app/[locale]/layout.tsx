import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import ConsentManager from '@/components/analytics/ConsentManager'
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  // Required for static export: sets locale for all server components in this segment
  setRequestLocale(locale)

  const messages = await getMessages()
  const safeLocale = locale as 'en' | 'ko'

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        {/* Consent Mode v2 defaults + CMP banner (no-op when NEXT_PUBLIC_CMP_SITE_ID unset) */}
        <ConsentManager />
        {/* Nav (inside Header) and Footer use useTranslations — must be inside provider */}
        <NextIntlClientProvider messages={messages}>
          <Header locale={safeLocale} />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
        {/* GA4 + Clarity — inserted into DOM only after analytics consent is granted */}
        <AnalyticsScripts />
      </body>
    </html>
  )
}
