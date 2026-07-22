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
import JetlagRecoveryCalculatorTool from '@/components/tools/jetlag-recovery-calculator/JetlagRecoveryCalculatorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'jetlag-recovery-calculator'
const CATEGORY = 'travel'

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

export default async function JetlagRecoveryCalculatorPage({ params }: Props) {
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
      name: safeLocale === 'ko' ? '여행' : 'Travel',
      url: `${SITE_URL}${localeHref(safeLocale, '/travel')}`,
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
      <JetlagRecoveryCalculatorTool />

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
            이 계산기의 회복일수 추정치는 수면의학 연구에서 널리 인용되는 근사치에 기반합니다:{' '}
            동쪽 이동 시 시간대당 약 1일, 서쪽 이동 시 시간대당 약 0.67일(1.5시간대당 1일).
            이 수치는{' '}
            <a
              href="https://doi.org/10.1016/S0140-6736(07)60529-7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              Waterhouse 외, The Lancet 2007
            </a>
            에서 보고된 일주기 적응 속도(서쪽 이동 1.5시간/일, 동쪽 이동 1시간/일)에 근거하며,
            개인의 연령·일주기 유형·빛 노출 전략에 따라 실제 회복 기간은 크게 다를 수 있습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            The recovery-day estimates in this calculator are based on widely-cited approximations
            from sleep medicine research: roughly 1 day per time zone for eastward travel, and
            roughly 1 day per 1.5 time zones for westward travel. These rates are grounded in
            the circadian adaptation rates reported in{' '}
            <a
              href="https://doi.org/10.1016/S0140-6736(07)60529-7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              Waterhouse et al., The Lancet 2007
            </a>{' '}
            (~1.5 h/day westward, ~1 h/day eastward). Actual recovery varies significantly by
            individual age, chronotype, and light-exposure strategy.
          </p>
        )}
      </section>

      {/* How to Use */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '사용 방법' : 'How To Use'}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
          {isKo ? (
            <>
              <li>
                <strong className="text-neutral-200">출발지 시간대 선택</strong> — 떠나는 도시의
                UTC 오프셋을 드롭다운에서 선택합니다(예: 서울은 UTC+9).
              </li>
              <li>
                <strong className="text-neutral-200">목적지 시간대 선택</strong> — 도착하는 도시의
                UTC 오프셋을 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">회복 시간 추정 버튼 클릭</strong> — 예상
                회복일수, 이동 방향(동/서), 일자별 적응 가이드가 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select your departure timezone</strong> —
                Pick the UTC offset for the city you are leaving (e.g. UTC+9 for Seoul,
                UTC-5 for New York).
              </li>
              <li>
                <strong className="text-neutral-200">Select your destination timezone</strong> —
                Pick the UTC offset for the city you are arriving in.
              </li>
              <li>
                <strong className="text-neutral-200">Click &ldquo;Estimate Recovery Time&rdquo;</strong>{' '}
                — The tool shows your estimated recovery in days, travel direction, and a
                day-by-day general adaptation guide.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '실제 사례 예시' : 'Example Scenarios'}
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '사례 1: 뉴욕(UTC-5) → 서울(UTC+9), 동쪽으로 14시간 차이 → 최단 경로 서쪽 10시간대'
                : 'Case 1: New York (UTC-5) → Seoul (UTC+9), 14-hour raw difference → shortest path 10 zones westward'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? '뉴욕에서 서울까지 태평양을 건너는 최단 경로는 서쪽으로 10개 시간대입니다(동쪽 경로 14시간대보다 짧음). 서쪽 이동 10시간대: ceil(10 ÷ 1.5) = 7일 회복 예상.'
                : 'The shortest route from New York to Seoul crosses 10 time zones westward via the Pacific (shorter than the 14-zone eastward path via Europe). Westward 10 zones: ceil(10 ÷ 1.5) = 7 estimated recovery days.'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '사례 2: 런던(UTC+0) → 두바이(UTC+4), 동쪽으로 4시간대'
                : 'Case 2: London (UTC+0) → Dubai (UTC+4), 4 zones eastward'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? '동쪽으로 4개 시간대 이동: ceil(4 × 1.0) = 4일 회복 예상. 동쪽 이동은 체내시계를 앞당겨야 하므로 서쪽 이동(같은 시간대 수: ceil(4 ÷ 1.5) = 3일)보다 일반적으로 더 오래 걸립니다.'
                : 'Moving 4 time zones eastward: ceil(4 × 1.0) = 4 estimated recovery days. Eastward travel requires advancing the body clock, which generally takes longer than westward travel at the same zone count (ceil(4 ÷ 1.5) = 3 days).'}
            </p>
          </div>
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
              <dt className="text-sm font-medium text-neutral-200">{item.question[safeLocale]}</dt>
              <dd className="text-sm text-neutral-400 leading-relaxed">{item.answer[safeLocale]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Safety note specific to this tool (CLAUDE.md: general disclaimerType + extra safety paragraph) */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-neutral-400 leading-relaxed">
        {isKo
          ? '수면장애나 기분장애(계절성 우울증, 양극성 장애 등)가 있다면 빛 노출 습관을 크게 바꾸기 전 전문의와 상담하세요. 특정 정신건강 상태에서는 빛 노출 타이밍이 증상에 영향을 줄 수 있습니다.'
          : 'If you have a sleep disorder or mood disorder (such as seasonal depression or bipolar disorder), consult a doctor before making significant changes to your light-exposure routine. In certain mental-health conditions, the timing of light exposure can affect symptoms.'}
      </div>

      {/* General disclaimer */}
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
