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
import GrowthPercentileTool from '@/components/tools/growth-percentile/GrowthPercentileTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'growth-percentile'
const CATEGORY = 'baby'

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

export default async function GrowthPercentilePage({ params }: Props) {
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
      name: safeLocale === 'ko' ? '육아' : 'Baby',
      url: `${SITE_URL}${localeHref(safeLocale, '/baby')}`,
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
      <GrowthPercentileTool />

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
            이 계산기는 아이의 성장을 또래 기준 집단과 비교하는 데 사용하는 표준
            LMS(람다-뮤-시그마) 방법을 사용합니다. WHO 기준(2006)은 6개국의 이상적인
            환경에서 자란 아동을 기반으로 하며, CDC 기준(2000)은 미국 국가 참조
            집단을 사용합니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            This calculator uses the standard LMS (Lambda-Mu-Sigma) method to compare
            a child&apos;s measurements against a reference population. WHO standards (2006)
            are based on children raised under optimal conditions in six countries; CDC
            charts (2000) are based on a US national reference population.
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
                <strong className="text-neutral-200">성별(남/여)을 선택합니다</strong> —
                성장 기준표는 성별로 구분되어 있어 정확한 결과를 위해 반드시 선택해야 합니다.
              </li>
              <li>
                <strong className="text-neutral-200">나이(개월)를 입력합니다</strong> —
                0~60개월 범위에서 완전한 개월수를 입력합니다(예: 생후 12개월).
              </li>
              <li>
                <strong className="text-neutral-200">체중(kg)을 입력합니다</strong> —
                최근에 측정한 체중을 킬로그램 단위로 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">키/신장(cm)을 입력합니다</strong> —
                24개월 미만은 누운 상태에서 잰 신장(체장), 24개월 이상은 선 키를 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">성장 기준표(WHO / CDC)를 선택합니다</strong> —
                WHO는 전 세계적으로 권장되며, CDC는 미국 임상에서 주로 사용됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">백분위 계산 버튼을 누릅니다</strong> —
                체중과 키 백분위가 게이지 바와 함께 즉시 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select the child&apos;s sex</strong> —
                growth standards are sex-specific; an accurate sex selection is required.
              </li>
              <li>
                <strong className="text-neutral-200">Enter age in completed months</strong> —
                within 0–60 months (e.g. 12 for a one-year-old).
              </li>
              <li>
                <strong className="text-neutral-200">Enter weight in kilograms</strong> —
                use a recent measurement from a calibrated scale.
              </li>
              <li>
                <strong className="text-neutral-200">Enter height or length in centimetres</strong> —
                use recumbent length (lying) for children under 24 months, standing height for 24 months and older.
              </li>
              <li>
                <strong className="text-neutral-200">Select the growth reference (WHO or CDC)</strong> —
                WHO is recommended for children under 2 worldwide; CDC is common in US clinical settings.
              </li>
              <li>
                <strong className="text-neutral-200">Click Calculate Percentile</strong> —
                weight and height percentiles are shown with gauge bars.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '계산 예시' : 'Example'}
        </h2>

        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            {isKo
              ? '예시: 생후 6개월 남아 — 체중 7.5 kg, 키 68 cm (WHO 기준)'
              : 'Example: 6-month-old boy — 7.5 kg, 68 cm (WHO reference)'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1">
            <p>
              {isKo
                ? 'WHO 6개월 남아 체중 중앙값: 7.93 kg → 7.5 kg은 중앙값보다 약간 낮음'
                : 'WHO 6-month boys weight median: 7.93 kg → 7.5 kg is slightly below median'}
            </p>
            <p className="text-[#f59e0b]">
              {isKo
                ? '→ 체중 약 35~40 백분위 (또래 아이 중 35~40%와 같거나 더 가벼움)'
                : '→ Weight approximately 35–40th percentile (35–40% of peers weigh the same or less)'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '35~40 백분위는 정상 범위(약 3~97 백분위) 내에 있습니다. 이 결과 자체로 건강 여부를 판단하지 마세요 — 성장 추세와 전반적인 건강 상태를 함께 고려해야 하므로 소아과 전문의와 상담을 권장합니다.'
              : 'A percentile of 35–40 falls within the typical range (approximately 3rd–97th percentile). Do not use this result alone to judge your child\'s health — growth trends and overall wellbeing matter more than a single measurement. Consult a paediatrician for clinical evaluation.'}
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

      {/* Medical disclaimer */}
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
