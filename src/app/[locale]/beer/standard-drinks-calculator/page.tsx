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
import StandardDrinksCalculatorTool from '@/components/tools/standard-drinks-calculator/StandardDrinksCalculatorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'standard-drinks-calculator'
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

export default async function StandardDrinksCalculatorPage({ params }: Props) {
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
      <StandardDrinksCalculatorTool />

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
            표준잔의 정의는 나라마다 다릅니다. 미국은 순수 알코올 14g(NIAAA), 영국은 8g(NHS
            &ldquo;유닛&rdquo;), 호주·싱가포르는 10g, 캐나다는 13.45g(CCSA)을 기준으로
            합니다. 이 도구는 음료의 용량(mL 또는 fl oz)과 도수(ABV%)를 입력하면 각 나라
            기준으로 몇 표준잔에 해당하는지, 순수 알코올 그램, 알코올 유래 칼로리를 즉시
            환산합니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            Standard drink definitions vary by country. The US defines one standard drink as 14 g of
            pure alcohol (NIAAA), the UK as 8 g (one &ldquo;unit&rdquo;, NHS), Australia and
            Singapore as 10 g, and Canada as 13.45 g (CCSA). This tool converts any drink&apos;s
            volume (mL or fl oz) and ABV% into standard drinks, pure alcohol grams, and approximate
            alcohol-derived calories under each country&apos;s definition.
          </p>
        )}
        <p className="text-sm text-neutral-300 leading-relaxed">
          {isKo
            ? '이 도구는 혈중 알코올 농도(BAC)나 운전 가능 여부와 무관한 순수 알코올 환산 도구입니다. BAC 추정이 필요하다면 BAC 계산기를 이용하세요.'
            : 'This tool is a pure alcohol conversion reference — it does not estimate blood alcohol concentration (BAC) or assess fitness to drive. Use the BAC Calculator if you need an estimated BAC.'}
        </p>
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
                <strong className="text-neutral-200">음료 종류를 선택합니다</strong> — 프리셋을
                선택하면 ABV%와 기본 용량이 자동으로 채워집니다.
              </li>
              <li>
                <strong className="text-neutral-200">용량과 도수를 확인하거나 수정합니다</strong>{' '}
                — mL 또는 fl oz 단위로 입력하고, ABV%는 직접 수정할 수 있습니다.
              </li>
              <li>
                <strong className="text-neutral-200">국가 기준을 선택합니다</strong> — 미국, 영국,
                호주·싱가포르, 캐나다 중 하나를 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">결과를 확인합니다</strong> — 표준잔 수, 순수
                알코올량, 알코올 유래 칼로리가 즉시 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select a drink type</strong> — choosing a
                preset automatically fills in the ABV% and a typical serving volume.
              </li>
              <li>
                <strong className="text-neutral-200">Adjust volume and ABV if needed</strong> —
                switch between mL and fl oz, and edit the ABV% directly for custom drinks.
              </li>
              <li>
                <strong className="text-neutral-200">Choose a country standard</strong> — select US,
                UK, AU/SG, or Canada to apply that country&apos;s definition.
              </li>
              <li>
                <strong className="text-neutral-200">Read the result</strong> — standard drinks,
                pure alcohol grams, and approximate calories are shown instantly.
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
              ? '예시: 레귤러 맥주 355 mL, ABV 5% — 미국·영국 기준 비교'
              : 'Example: Regular beer 355 mL, 5% ABV — comparing US and UK standards'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1">
            <p>
              {isKo ? '• 순수 알코올 = ' : '• Pure alcohol = '}
              355 mL × 5% × 0.789 g/mL ≈ 14.01 g
            </p>
            <p>
              {isKo
                ? '• 미국 기준 (14 g/drink): 14.01 ÷ 14 ≈ 1.00 표준잔'
                : '• US standard (14 g/drink): 14.01 ÷ 14 ≈ 1.00 standard drinks'}
            </p>
            <p>
              {isKo
                ? '• 영국 기준 (8 g/unit): 14.01 ÷ 8 ≈ 1.75 유닛'
                : '• UK standard (8 g/unit): 14.01 ÷ 8 ≈ 1.75 units'}
            </p>
            <p>
              {isKo
                ? '• 알코올 칼로리 ≈ 14.01 × 7 ≈ 98 kcal'
                : '• Alcohol calories ≈ 14.01 × 7 ≈ 98 kcal'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '같은 음료라도 국가 기준에 따라 표준잔 수가 달라집니다. 칼로리는 알코올(에탄올) 성분에서 유래한 열량만이며 당분·탄수화물 등 나머지 음료 성분의 칼로리는 포함되지 않습니다.'
              : 'The same drink counts differently depending on which country standard you use. Calories shown are from alcohol (ethanol) only — calories from sugar, carbohydrates, and other beverage components are not included.'}
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

      {/* Tool-specific disclaimer paragraph (confirmed by user 2026-07-21) */}
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-4 space-y-3">
        {isKo ? (
          <p className="text-sm text-amber-200 leading-relaxed">
            본 계산 결과는 의학적 조언이나 진단이 아니며, 순수 알코올 함량을 환산한 참고용
            근사치입니다. 실제 건강에 미치는 영향은 체질, 건강 상태, 복용 중인 약물 등에 따라 다를
            수 있습니다. 임신 중이거나 간질환 등 건강상 이유로 음주에 주의가 필요한 경우, 또는
            음주 관련 건강 판단이 필요한 경우 반드시 의료 전문가와 상담하시기 바랍니다. 본 도구는
            음주를 권장하거나 특정 음주량을 권고하지 않습니다.
          </p>
        ) : (
          <p className="text-sm text-amber-200 leading-relaxed">
            This calculator provides approximate reference figures based on alcohol unit conversion
            formulas — it is not medical advice or a clinical assessment. The actual health impact of
            alcohol varies by individual constitution, health status, and medications. If you are
            pregnant, have liver disease or other health conditions requiring caution around alcohol,
            or need guidance on alcohol consumption for health reasons, please consult a healthcare
            professional. This tool does not recommend alcohol consumption or endorse any specific
            quantity as safe.
          </p>
        )}
      </div>

      {/* Standard medical disclaimer banner */}
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
