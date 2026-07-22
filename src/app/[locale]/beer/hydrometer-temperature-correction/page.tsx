import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getToolBySlug, getRelatedTools } from '@/lib/config/tools-config'
import { localeHref } from '@/lib/utils/locale-href'
import AdSlot from '@/components/ui/AdSlot'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import ToolCardGrid from '@/components/ui/ToolCardGrid'
import SchemaWebApplication from '@/components/seo/SchemaWebApplication'
import SchemaFaqPage from '@/components/seo/SchemaFaqPage'
import SchemaBreadcrumb from '@/components/seo/SchemaBreadcrumb'
import HydrometerCorrectionTool from '@/components/tools/hydrometer-temperature-correction/HydrometerCorrectionTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'hydrometer-temperature-correction'
const CATEGORY = 'beer'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const tool = getToolBySlug(CATEGORY, SLUG)
  if (!tool) return {}

  const isKo = safeLocale === 'ko'
  const canonical = isKo
    ? `${SITE_URL}/ko/${CATEGORY}/${SLUG}`
    : `${SITE_URL}/${CATEGORY}/${SLUG}`

  return {
    title: `${tool.title[safeLocale]} — BitKitTools`,
    description: tool.description[safeLocale],
    keywords: tool.keywords[safeLocale].join(', '),
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/${CATEGORY}/${SLUG}`,
        ko: `${SITE_URL}/ko/${CATEGORY}/${SLUG}`,
        'x-default': `${SITE_URL}/${CATEGORY}/${SLUG}`,
      },
    },
    openGraph: {
      title: `${tool.title[safeLocale]} — BitKitTools`,
      description: tool.description[safeLocale],
      url: canonical,
      siteName: 'BitKitTools',
      type: 'website',
      images: [{ url: `${SITE_URL}/og/default-${safeLocale}.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function HydrometerTemperatureCorrectionPage({ params }: Props) {
  const { locale } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  setRequestLocale(locale)

  const tool = getToolBySlug(CATEGORY, SLUG)
  if (!tool) return null

  const relatedTools = getRelatedTools(tool.id)
  const pageUrl =
    safeLocale === 'ko'
      ? `${SITE_URL}/ko/${CATEGORY}/${SLUG}`
      : `${SITE_URL}/${CATEGORY}/${SLUG}`

  const breadcrumbItems = [
    { name: 'Home', url: safeLocale === 'ko' ? `${SITE_URL}/ko` : SITE_URL },
    {
      name: safeLocale === 'ko' ? '맥주' : 'Beer',
      url: `${SITE_URL}${localeHref(safeLocale, '/beer')}`,
    },
    { name: tool.title[safeLocale], url: pageUrl },
  ]

  const isKo = safeLocale === 'ko'

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
      <h1 className="text-4xl font-semibold text-white">{tool.title[safeLocale]}</h1>

      {/* Schema.org structured data */}
      <SchemaBreadcrumb items={breadcrumbItems} />
      <SchemaWebApplication tool={tool} locale={safeLocale} url={pageUrl} />
      <SchemaFaqPage faq={tool.faq} locale={safeLocale} />

      {/* Header ad */}
      <AdSlot position="header" minHeightPx={90} />

      {/* The tool */}
      <HydrometerCorrectionTool />

      {/* Result ad */}
      <AdSlot position="result" minHeightPx={250} />

      {/* Description */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '이 도구에 대하여' : 'About This Tool'}
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          {tool.description[safeLocale]}
        </p>
        {isKo ? (
          <p className="text-sm text-neutral-300 leading-relaxed">
            비중계는 특정 기준온도(보통 59°F/15°C 또는 68°F/20°C)에서 정확하도록 제작됩니다.
            시료 온도가 기준온도와 다르면 물의 밀도 변화로 인해 수치가 실제와 달라집니다.
            이 도구는 브루잉 업계에서 수십 년간 사용된 표준 보정 공식을 적용해 보정된 비중을
            계산합니다. 보정된 비중은 양조 진행 상황을 정확히 파악하고 도수(ABV)를 올바르게
            계산하는 데 필수적입니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            A hydrometer is manufactured to be accurate at a specific calibration temperature
            — typically 59°F (15°C) or 68°F (20°C). When your sample temperature differs from
            that reference, the density of water itself has changed, causing the raw reading to
            drift from the true specific gravity. This tool applies the brewing industry&apos;s
            established standard correction polynomial to give you an accurate reading. Corrected
            gravity is essential for accurately tracking fermentation progress and calculating
            alcohol by volume (ABV).
          </p>
        )}
      </section>

      {/* How To Use */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '사용 방법' : 'How To Use'}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
          {isKo ? (
            <>
              <li>
                <strong className="text-neutral-200">비중계 측정값(SG)을 입력합니다</strong> —
                비중계로 읽은 원시 수치(예: 1.052)를 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">시료 온도를 입력합니다</strong> —
                측정 당시 액체의 실제 온도입니다. °F/°C 토글로 단위를 선택할 수 있습니다.
              </li>
              <li>
                <strong className="text-neutral-200">기준온도를 선택합니다</strong> —
                비중계 본체에 표시된 기준온도를 확인하고, 프리셋(59°F/68°F) 또는
                직접 입력으로 설정합니다.
              </li>
              <li>
                <strong className="text-neutral-200">보정된 비중을 확인합니다</strong> —
                측정값과의 차이도 함께 표시되어 온도 보정이 얼마나 영향을 미쳤는지 바로 알 수 있습니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Enter your measured gravity (SG)</strong> —
                the raw number you read from the hydrometer (e.g. 1.052).
              </li>
              <li>
                <strong className="text-neutral-200">Enter the sample temperature</strong> —
                the actual temperature of the liquid at the time of measurement.
                Use the °F/°C toggle to choose your preferred unit.
              </li>
              <li>
                <strong className="text-neutral-200">Set the calibration temperature</strong> —
                check the label on your hydrometer and use the 59°F or 68°F preset button, or
                type the exact value if your hydrometer uses a different reference temperature.
              </li>
              <li>
                <strong className="text-neutral-200">Read the corrected gravity</strong> —
                the result also shows the delta from your original reading so you can see at a
                glance how much the temperature affected your measurement.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '계산 예시' : 'Example Calculation'}
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            {isKo
              ? '예시: 측정값 1.052, 시료온도 75°F(23.9°C), 기준온도 60°F(15.6°C)'
              : 'Example: Measured gravity 1.052, sample temperature 75°F (23.9°C), calibration temperature 60°F (15.6°C)'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1.5">
            <p>
              {isKo
                ? '• 보정 계수 f(75°F) = 1.00130346 − 0.000134722124 × 75 + ... ≈ 1.001695'
                : '• Correction factor f(75°F) = 1.00130346 − 0.000134722124 × 75 + ... ≈ 1.001695'}
            </p>
            <p>
              {isKo
                ? '• 보정 계수 f(60°F) ≈ 1.000063'
                : '• Correction factor f(60°F) ≈ 1.000063'}
            </p>
            <p>
              {isKo
                ? '• 보정된 비중 CG = 1.052 × (1.001695 / 1.000063) ≈ 1.0537'
                : '• Corrected gravity CG = 1.052 × (1.001695 / 1.000063) ≈ 1.0537'}
            </p>
            <p>
              {isKo
                ? '• 측정값 대비 차이: +0.0017 (시료가 더 따뜻했으므로 실제 비중이 약간 더 높음)'
                : '• Delta from measured: +0.0017 (the sample was warmer than calibration, so the true gravity is slightly higher than the raw reading)'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '시료 온도가 기준온도보다 높을수록 보정값이 측정값보다 커지고, 시료 온도가 더 낮으면 보정값이 작아집니다.'
              : 'When the sample is warmer than the calibration temperature, the corrected value will be higher than the measured reading. When the sample is cooler, the corrected value will be lower.'}
          </p>
        </div>
      </section>

      {/* Mid-content ad */}
      <AdSlot position="mid-content" minHeightPx={280} />

      {/* Above-FAQ ad */}
      <AdSlot position="above-faq" minHeightPx={250} />

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '자주 묻는 질문' : 'Frequently Asked Questions'}
        </h2>
        <dl className="space-y-6">
          {tool.faq.map((item, i) => (
            <div key={i} className="space-y-2">
              <dt className="text-sm font-medium text-neutral-200">
                {item.question[safeLocale]}
              </dt>
              <dd className="text-sm text-neutral-400 leading-relaxed">
                {item.answer[safeLocale]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Disclaimer */}
      <DisclaimerBanner disclaimerType={tool.disclaimerType} />

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">
            {isKo ? '관련 도구' : 'Related Tools'}
          </h2>
          <ToolCardGrid tools={relatedTools} locale={safeLocale} />
        </section>
      )}

      {/* Footer ad */}
      <AdSlot position="footer" minHeightPx={90} />
    </div>
  )
}
