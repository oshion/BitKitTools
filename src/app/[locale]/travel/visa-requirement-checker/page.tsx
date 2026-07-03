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
import VisaRequirementCheckerTool from '@/components/tools/visa-requirement-checker/VisaRequirementCheckerTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'visa-requirement-checker'
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
    },
  }
}

export default async function VisaRequirementCheckerPage({ params }: Props) {
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
      <VisaRequirementCheckerTool />

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
            비자 요건 데이터는{' '}
            <a
              href="https://www.iata.org/en/services/travel-centre/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              IATA Travel Centre
            </a>
            ,{' '}
            <a
              href="https://www.henleypassportindex.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              Henley Passport Index
            </a>
            , 그리고 각국 대사관·영사관 공식 사이트를 참고한 정적 스냅샷입니다. 실시간 정부
            데이터가 아니므로 출국 전 반드시 해당 국가의 공식 기관에서 확인하세요.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            Visa requirement data is sourced from a static reference snapshot based on{' '}
            <a
              href="https://www.iata.org/en/services/travel-centre/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              IATA Travel Centre
            </a>
            ,{' '}
            <a
              href="https://www.henleypassportindex.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-300 underline underline-offset-2 transition-colors"
            >
              Henley Passport Index
            </a>
            , and individual embassy/consulate official sites. This is not a live government data
            feed — always verify before booking.
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
                <strong className="text-neutral-200">여권 발급국 선택</strong> — 드롭다운에서
                여권을 발급한 국가(출발국)를 검색하거나 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">목적지 선택</strong> — 방문할 국가를
                검색하거나 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">비자 요건 확인</strong> — 두 국가를 선택하는
                즉시 비자 요건 유형과 최대 체류일수, 안내 사항이 표시됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">공식 기관에서 재확인</strong> — 항공권
                예매나 숙박 예약 전에 반드시 목적지 국가의 대사관·영사관 공식 사이트에서
                최신 요건을 확인합니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select your passport country</strong> —
                Search or pick the country that issued your passport (your &ldquo;departure
                country&rdquo; for visa purposes).
              </li>
              <li>
                <strong className="text-neutral-200">Select your destination</strong> — Search
                or pick the country you plan to visit.
              </li>
              <li>
                <strong className="text-neutral-200">Review the result</strong> — As soon as
                both countries are selected, the visa requirement type, maximum stay duration,
                and key notes appear automatically.
              </li>
              <li>
                <strong className="text-neutral-200">Verify with official sources</strong> —
                Before booking flights or accommodation, confirm the latest requirements on the
                official embassy or consulate website of your destination.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example scenarios */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '자주 검색하는 예시' : 'Common Examples'}
        </h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '예시 1: 한국 → 일본 (단기 관광)'
                : 'Example 1: South Korea → Japan (short-term tourism)'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? '한국 여권 소지자는 일본을 90일까지 무비자로 방문할 수 있습니다. 사전 신청이나 비용이 필요 없으며, 여권 유효기간만 확인하면 됩니다.'
                : 'Korean passport holders can visit Japan for up to 90 days without a visa. No pre-application or fee required — just ensure your passport is valid for the duration of your stay.'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '예시 2: 미국 → 독일 (솅겐 여행)'
                : 'Example 2: United States → Germany (Schengen trip)'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? '미국 여권 소지자는 솅겐 지역(독일 포함) 내에서 180일 중 최대 90일간 비자 없이 체류할 수 있습니다. EU의 ETIAS(전자여행허가) 시스템이 도입되면 사전 신청이 필요할 수 있으므로 출발 전 확인하세요.'
                : 'US passport holders can stay in the Schengen Area (including Germany) for up to 90 days in any 180-day period without a visa. Once ETIAS (EU Electronic Travel Authorization) launches, a quick online pre-authorization may be required — verify before travel.'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-2">
            <p className="text-sm font-medium text-neutral-200">
              {isKo
                ? '예시 3: 한국 → 미국 (ESTA 필요)'
                : 'Example 3: South Korea → United States (ESTA needed)'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {isKo
                ? '한국은 미국 비자면제 프로그램(VWP) 대상국입니다. 미국 방문 시 비자는 필요 없지만, 출발 최소 72시간 전에 ESTA(전자여행허가)를 온라인으로 신청해야 합니다. ESTA는 2년간 유효하며 1회 방문 최대 90일까지 체류할 수 있습니다.'
                : "South Korea is a Visa Waiver Program (VWP) country. No US visa is needed, but you must apply for ESTA (Electronic System for Travel Authorization) online at esta.cbp.dhs.gov at least 72 hours before departure. ESTA is valid for 2 years and allows stays of up to 90 days per visit."}
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
