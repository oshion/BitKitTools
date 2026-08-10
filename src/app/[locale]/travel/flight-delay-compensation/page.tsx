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
import FlightDelayCompensationTool from '@/components/tools/flight-delay-compensation/FlightDelayCompensationTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'flight-delay-compensation'
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
    ? `${SITE_URL}/ko/${CATEGORY}/${SLUG}/`
    : `${SITE_URL}/${CATEGORY}/${SLUG}/`

  return {
    title: `${tool.title[safeLocale]} — BitKitTools`,
    description: tool.description[safeLocale],
    keywords: tool.keywords[safeLocale].join(', '),
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/${CATEGORY}/${SLUG}/`,
        ko: `${SITE_URL}/ko/${CATEGORY}/${SLUG}/`,
        'x-default': `${SITE_URL}/${CATEGORY}/${SLUG}/`,
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

export default async function FlightDelayCompensationPage({ params }: Props) {
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
      ? `${SITE_URL}/ko/${CATEGORY}/${SLUG}/`
      : `${SITE_URL}/${CATEGORY}/${SLUG}/`

  const breadcrumbItems = [
    { name: 'Home', url: safeLocale === 'ko' ? `${SITE_URL}/ko/` : `${SITE_URL}/` },
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
      <FlightDelayCompensationTool />

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
            이 계산기의 보상 기준 데이터는{' '}
            <a
              href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32004R0261"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              EU 규정(EC) 261/2004
            </a>{' '}
            및{' '}
            <a
              href="https://www.ecfr.gov/current/title-14/chapter-II/subchapter-D/part-259"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              미국 DOT 14 CFR Part 259
            </a>
            에 기반한 정적 참조 테이블입니다. 실시간 정부 데이터가 아니며, 규정은 변경될 수
            있으므로 실제 청구 전에 반드시 관련 기관에서 확인하시기 바랍니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            The compensation data in this calculator is based on a static reference table
            derived from{' '}
            <a
              href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32004R0261"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              EU Regulation (EC) No 261/2004
            </a>{' '}
            and{' '}
            <a
              href="https://www.ecfr.gov/current/title-14/chapter-II/subchapter-D/part-259"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              US DOT 14 CFR Part 259
            </a>
            . This is not a live government data feed — regulations may change, so always
            verify before filing a claim.
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
                <strong className="text-neutral-200">규정 선택</strong> — 항공편이 EU 공항에서
                출발하거나 EU 항공사가 운항하는 경우 EU261을 선택합니다. 미국 국내선 또는
                미국발·착 국제선은 US DOT를 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">비행 거리 구간 선택</strong> — 출발지와
                목적지 사이의 대략적인 직선 거리를 기준으로 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">지연 시간 입력</strong> — 실제 도착
                지연(예정 도착 시각 기준)을 슬라이더로 설정합니다.
              </li>
              <li>
                <strong className="text-neutral-200">지연 원인 선택</strong> — 항공사 귀책(기술
                결함, 승무원 문제, 초과 예약 등)인지, 불가항력(기상 이변, 보안 위협 등)인지
                선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">보상 추정 확인</strong> — 결과 카드의
                보상 범위와 참고 사항을 확인합니다. 실제 청구는 항공사 또는 관련 기관을 통해
                진행하세요.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select a regulation</strong> — Choose
                EU261 if your flight departed from an EU airport or was operated by an EU
                carrier arriving in the EU. Choose US DOT for domestic US flights or
                international flights to/from the United States.
              </li>
              <li>
                <strong className="text-neutral-200">Select the flight distance</strong> —
                Pick the category that matches the approximate great-circle distance between
                your departure and arrival airports.
              </li>
              <li>
                <strong className="text-neutral-200">Enter the delay duration</strong> — Use
                the slider to set your actual arrival delay (measured against the scheduled
                arrival time).
              </li>
              <li>
                <strong className="text-neutral-200">Select the cause of delay</strong> —
                Choose airline fault (technical issues, crew problems, overbooking) or force
                majeure (severe weather, security threats, ATC strikes).
              </li>
              <li>
                <strong className="text-neutral-200">Review the estimate</strong> — Check
                the compensation range and notes in the result card. File your actual claim
                directly with your airline or through a passenger rights service.
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
                ? '사례 1: 파리 → 뉴욕 (약 5,800 km), 항공사 기술 결함으로 5시간 지연'
                : 'Case 1: Paris → New York (~5,800 km), 5-hour delay due to technical fault'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? 'EU 공항(CDG)에서 출발하는 비행이므로 EU261이 적용됩니다. 장거리(3,500 km 초과) + 항공사 귀책 + 도착 지연 4시간 이상 → 예상 보상 €600/인.'
                : 'Departing from an EU airport (CDG), EU261 applies. Long-haul (>3,500 km) + airline fault + arrival delay ≥4 hours → estimated €600 per passenger.'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '사례 2: 런던 → 마드리드 (약 1,260 km), 악천후로 인한 4시간 지연'
                : 'Case 2: London → Madrid (~1,260 km), 4-hour delay due to severe weather'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? 'EU261 적용 가능 노선이지만, 기상 이변은 비상 상황(불가항력)에 해당합니다. 고정 보상금 지급 의무가 없을 수 있습니다. 그러나 항공사는 식사와 다과를 제공해야 합니다. 항공사에 직접 확인하세요.'
                : 'EU261-eligible route, but severe weather qualifies as an extraordinary circumstance (force majeure). Fixed compensation may not be owed. However, the airline must still provide meals and refreshments. Check directly with your airline.'}
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
