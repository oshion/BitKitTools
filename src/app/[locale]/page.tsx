import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import {
  TOOL_CATEGORIES,
  getPopularTools,
  getRecentTools,
  getToolsByCategory,
} from '@/lib/config/tools-config'
import ToolCardGrid from '@/components/ui/ToolCardGrid'
import AdSlot from '@/components/ui/AdSlot'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  const isKo = locale === 'ko'
  const canonical = isKo ? `${SITE_URL}/ko` : SITE_URL

  return {
    title: `BitKitTools — ${t('tagline')}`,
    description: t('tagline'),
    alternates: {
      canonical,
      languages: {
        en: SITE_URL,
        ko: `${SITE_URL}/ko`,
        'x-default': SITE_URL,
      },
    },
    openGraph: {
      title: `BitKitTools — ${t('tagline')}`,
      description: t('tagline'),
      url: canonical,
      siteName: t('siteName'),
      type: 'website',
    },
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params

  setRequestLocale(locale)

  const safeLocale: 'en' | 'ko' = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const t = await getTranslations({ locale, namespace: 'home' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const popularTools = getPopularTools()
  const recentTools = getRecentTools(4)

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
      <h1 className="text-4xl font-semibold text-white">
        {tCommon('tagline')}
      </h1>

      {popularTools.length > 0 && (
        <section>
          <h2 className="text-xl font-medium text-white mb-4">
            {t('popularTools')}
          </h2>
          <ToolCardGrid tools={popularTools} locale={safeLocale} />
        </section>
      )}

      {TOOL_CATEGORIES.map((category) => {
        const tools = getToolsByCategory(category)
        return (
          <section key={category}>
            <h2 className="text-xl font-medium text-white mb-4">
              {tNav(category)}
            </h2>
            <ToolCardGrid
              tools={tools}
              locale={safeLocale}
              emptyMessage={t('comingSoon')}
            />
          </section>
        )
      })}

      <AdSlot position="mid-content" minHeightPx={280} />

      {recentTools.length > 0 && (
        <section>
          <h2 className="text-xl font-medium text-white mb-4">
            {t('recentlyAdded')}
          </h2>
          <ToolCardGrid tools={recentTools} locale={safeLocale} />
        </section>
      )}
    </div>
  )
}
