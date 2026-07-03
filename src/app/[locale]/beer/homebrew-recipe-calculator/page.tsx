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
import HomebrewRecipeCalculatorTool from '@/components/tools/homebrew-recipe-calculator/HomebrewRecipeCalculatorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'homebrew-recipe-calculator'
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
    },
  }
}

export default async function HomebrewRecipeCalculatorPage({ params }: Props) {
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
      <HomebrewRecipeCalculatorTool />

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
            ABV 계산에 사용되는 표준 공식 <strong className="text-neutral-200">ABV ≈ (OG − FG) × 131.25</strong>는
            홈브루잉 커뮤니티에서 가장 널리 쓰이는 근사식입니다. 도수 3~10% 범위의 일반적인 맥주에서
            충분히 정확하며, 비중계 또는 굴절계로 측정한 비중값을 입력하면 됩니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            ABV is calculated using the standard homebrewing approximation:{' '}
            <strong className="text-neutral-200">ABV ≈ (OG − FG) × 131.25</strong> (Fix &amp; Fix,
            1997; Daniels, 1996). This formula is accurate to within ±0.1–0.3% for
            typical beers in the 3–10% ABV range. Measure specific gravity with a
            hydrometer or refractometer before and after fermentation.
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
                <strong className="text-neutral-200">배치 사이즈를 입력합니다</strong> —
                L(리터) 또는 gal(갤런) 단위를 선택하고 양을 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">초기 비중(OG)을 입력합니다</strong> —
                효모 투입 전 비중계 또는 굴절계로 측정한 값입니다(예: 1.050).
              </li>
              <li>
                <strong className="text-neutral-200">최종 비중(FG)을 입력합니다</strong> —
                발효 완료 후 비중이 안정된 상태에서 측정한 값입니다(예: 1.010).
              </li>
              <li>
                <strong className="text-neutral-200">ABV 계산 버튼을 누릅니다</strong> —
                예상 도수가 즉시 표시됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">(선택) 목표 도수로 희석하기</strong> —
                하단 섹션을 열고 목표 도수를 입력하면 추가해야 할 물의 양을 계산해 줍니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Enter your batch size</strong> —
                select litres (L) or gallons (gal) and type the volume.
              </li>
              <li>
                <strong className="text-neutral-200">Enter the Original Gravity (OG)</strong> —
                the specific gravity reading taken before pitching yeast (e.g. 1.050).
              </li>
              <li>
                <strong className="text-neutral-200">Enter the Final Gravity (FG)</strong> —
                the reading taken after fermentation is complete and stable (e.g. 1.010).
              </li>
              <li>
                <strong className="text-neutral-200">Click Calculate ABV</strong> —
                the estimated alcohol by volume appears instantly.
              </li>
              <li>
                <strong className="text-neutral-200">(Optional) Dilute to target ABV</strong> —
                open the dilution section and enter a target ABV to find out how many litres
                of water to add.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '계산 예시' : 'Example Calculations'}
        </h2>

        {/* Example 1: standard session beer */}
        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            {isKo
              ? '예시 1: 일반 에일 — OG 1.050, FG 1.010'
              : 'Example 1: Standard Pale Ale — OG 1.050, FG 1.010'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1 font-mono">
            <p>ABV = (1.050 − 1.010) × 131.25</p>
            <p>ABV = 0.040 × 131.25</p>
            <p className="text-[#f59e0b] font-semibold">ABV ≈ 5.25%</p>
          </div>
        </div>

        {/* Example 2: dilution */}
        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            {isKo
              ? '예시 2: 희석 — 5.25% ABV × 20 L 배치를 4.5%로 낮추기'
              : 'Example 2: Dilution — lower a 5.25% ABV × 20 L batch to 4.5%'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1 font-mono">
            <p>Final volume = (5.25 / 4.5) × 20 = 23.33 L</p>
            <p className="text-[#f59e0b] font-semibold">
              {isKo ? '추가할 물 = 23.33 − 20 = 3.33 L' : 'Water to add = 23.33 − 20 = 3.33 L'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '희석 후 바디감과 홉 쓴맛이 비례적으로 줄어들 수 있습니다. 전체 배치를 희석하기 전에 소량으로 블렌딩 테스트를 권장합니다.'
              : 'Dilution will proportionally reduce body and hop bitterness. A small test blend before diluting the full batch is recommended.'}
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
