import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getToolsByCategory } from '@/lib/config/tools-config'
import ToolCardGrid from '@/components/ui/ToolCardGrid'
import AdSlot from '@/components/ui/AdSlot'
import SchemaBreadcrumb from '@/components/seo/SchemaBreadcrumb'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const CATEGORY = 'travel'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCategory = await getTranslations({ locale, namespace: 'categoryPage' })

  const isKo = safeLocale === 'ko'
  const canonical = isKo ? `${SITE_URL}/ko/${CATEGORY}` : `${SITE_URL}/${CATEGORY}`
  const title = `${tNav(CATEGORY)} — BitKitTools`
  const description = tCategory(`description.${CATEGORY}`)

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/${CATEGORY}`,
        ko: `${SITE_URL}/ko/${CATEGORY}`,
        'x-default': `${SITE_URL}/${CATEGORY}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'BitKitTools',
      type: 'website',
      images: [{ url: `${SITE_URL}/og/default-${safeLocale}.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function TravelCategoryPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCategory = await getTranslations({ locale, namespace: 'categoryPage' })

  const tools = getToolsByCategory(CATEGORY)
  const isKo = safeLocale === 'ko'
  const pageUrl = isKo ? `${SITE_URL}/ko/${CATEGORY}` : `${SITE_URL}/${CATEGORY}`

  const breadcrumbItems = [
    { name: 'Home', url: isKo ? `${SITE_URL}/ko` : SITE_URL },
    { name: tNav(CATEGORY), url: pageUrl },
  ]

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
      <h1 className="text-4xl font-semibold text-white">{tNav(CATEGORY)}</h1>

      <SchemaBreadcrumb items={breadcrumbItems} />

      <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
        {tCategory(`description.${CATEGORY}`)}
      </p>

      <AdSlot position="header" minHeightPx={90} />

      <ToolCardGrid tools={tools} locale={safeLocale} emptyMessage={tCategory('comingSoon')} />

      <AdSlot position="footer" minHeightPx={90} />
    </div>
  )
}
