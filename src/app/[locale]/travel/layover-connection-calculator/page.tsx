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
import LayoverConnectionCalculatorTool from '@/components/tools/layover-connection-calculator/LayoverConnectionCalculatorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'layover-connection-calculator'
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

export default async function LayoverConnectionCalculatorPage({ params }: Props) {
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
      <LayoverConnectionCalculatorTool />

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
            MCT(최소 환승 시간) 데이터는{' '}
            <a
              href="https://www.iata.org/en/publications/manuals/station-standard-minimum-connecting-time-mct/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              IATA 권고 사항 1670
            </a>{' '}
            및 공항별 공식 데이터를 기반으로 한 정적 참조 테이블입니다. 실시간 데이터가 아니므로,
            실제 예약 전에 항공사 또는 공항 공식 채널에서 최신 MCT를 확인하시기 바랍니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            The MCT data in this tool is a static reference table derived from{' '}
            <a
              href="https://www.iata.org/en/publications/manuals/station-standard-minimum-connecting-time-mct/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              IATA Recommended Practice 1670
            </a>{' '}
            and per-airport official sources. This is not a live data feed — MCT values can
            change without notice, so always verify with your airline or the airport before
            booking a tight connection.
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
                <strong className="text-neutral-200">환승 공항 입력</strong> — IATA 코드(예:
                ICN) 또는 공항 이름으로 검색합니다. 데이터베이스에 없는 공항은 IATA 코드를
                직접 입력하면 IATA 일반 기본값이 적용됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">연결 유형 선택</strong> — 도착편과
                출발편이 각각 국내선인지 국제선인지 선택합니다. 환승 공항 기준으로 판단하세요.
              </li>
              <li>
                <strong className="text-neutral-200">환승 가능 시간 입력</strong> — 도착편
                예정 도착 시각부터 출발편 예정 출발 시각까지의 시간을 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">결과 확인</strong> — &apos;여유 있음&apos;·&apos;빡빡함&apos;·&apos;MCT 미달&apos; 중 하나의
                판정과 함께 해당 공항의 권장 최소 환승 시간이 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Enter your connecting airport</strong> —
                Search by IATA code (e.g., ICN) or airport name. For airports not in the
                database, type the 3-letter IATA code and the tool will apply IATA general
                defaults.
              </li>
              <li>
                <strong className="text-neutral-200">Select the connection type</strong> —
                Choose whether your arriving and departing flights are domestic or
                international. This is judged from the perspective of the connecting airport.
              </li>
              <li>
                <strong className="text-neutral-200">Enter your available layover time</strong>{' '}
                — Input the time between your scheduled arrival and scheduled departure.
              </li>
              <li>
                <strong className="text-neutral-200">Review the verdict</strong> — The tool
                shows one of three results — Comfortable, Tight, or Below Minimum — alongside
                the recommended MCT for that airport and connection type.
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
                ? '사례 1: 인천(ICN) 경유, 국제선 → 국제선, 환승 시간 2시간'
                : 'Case 1: Connecting at Seoul Incheon (ICN), International → International, 2-hour layover'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? 'ICN의 국제선→국제선 MCT는 90분입니다. 2시간(120분)은 90분의 1.5배인 135분에 미치지 못하므로 "빡빡함" 판정입니다. 수하물 지연이나 게이트 이동 시 위험할 수 있으므로, 가능하다면 2시간 15분 이상 확보를 권장합니다.'
                : 'ICN\'s MCT for international-to-international connections is 90 minutes. A 2-hour (120 min) layover meets the minimum but falls short of the 1.5× comfortable threshold (135 min), so the verdict is Tight. Consider aiming for at least 2h 15min to allow for baggage delays or gate changes.'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '사례 2: 암스테르담(AMS) 경유, 국제선 → 국제선, 환승 시간 45분'
                : 'Case 2: Connecting at Amsterdam Schiphol (AMS), International → International, 45-minute layover'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? 'AMS는 단일 터미널 구조로 MCT가 40분입니다. 45분 환승은 MCT를 충족하지만 1.5배(60분)에는 미치지 못해 "빡빡함" 판정입니다. AMS는 쉥겐/비쉥겐 구역 간 이동이 필요한 경우 추가 시간이 소요될 수 있습니다.'
                : 'AMS has a single-terminal layout with an MCT of 40 minutes. A 45-minute layover meets the minimum but is below the comfortable threshold (60 min), yielding a Tight verdict. Note that Schengen/non-Schengen zone changes at AMS may add extra time not reflected in the MCT.'}
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
