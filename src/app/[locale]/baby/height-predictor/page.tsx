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
import HeightPredictorTool from '@/components/tools/height-predictor/HeightPredictorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'height-predictor'
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

export default async function HeightPredictorPage({ params }: Props) {
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
      <HeightPredictorTool />

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
            이 계산기는 소아내분비학에서 표준으로 인용되는 중간부모키(Mid-Parental Height) 방법을
            사용합니다. 근거 논문: Tanner JM, Goldstein H, Whitehouse RH. &quot;Standards for
            children&apos;s height at ages 2–9 years allowing for heights of parents.&quot;{' '}
            <em>Archives of Disease in Childhood</em>, 1970.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            This calculator uses the Mid-Parental Height method, the standard approach cited in
            paediatric endocrinology. Reference: Tanner JM, Goldstein H, Whitehouse RH.
            &quot;Standards for children&apos;s height at ages 2–9 years allowing for heights of
            parents.&quot; <em>Archives of Disease in Childhood</em>, 1970.
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
                <strong className="text-neutral-200">자녀의 성별을 선택합니다</strong> —
                공식이 성별에 따라 달라집니다(남아는 +13cm, 여아는 −13cm 보정).
              </li>
              <li>
                <strong className="text-neutral-200">단위를 선택합니다</strong> —
                cm 또는 ft/in 중 편한 단위를 선택합니다. 두 입력 필드에 공통 적용됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">어머니의 키를 입력합니다</strong> —
                실측값을 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">아버지의 키를 입력합니다</strong> —
                실측값을 입력합니다.
              </li>
              <li>
                <strong className="text-neutral-200">예상 키 계산 버튼을 누릅니다</strong> —
                예상 성인 키와 통계적 범위(3~97 백분위)가 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select the child&apos;s sex</strong> —
                the formula differs by sex (+13cm for boys, −13cm for girls).
              </li>
              <li>
                <strong className="text-neutral-200">Choose your preferred unit</strong> —
                cm or ft/in; the toggle applies to both parent height fields.
              </li>
              <li>
                <strong className="text-neutral-200">Enter the mother&apos;s height</strong> —
                use a measured value.
              </li>
              <li>
                <strong className="text-neutral-200">Enter the father&apos;s height</strong> —
                use a measured value.
              </li>
              <li>
                <strong className="text-neutral-200">Click Predict Adult Height</strong> —
                the estimated adult height and statistical range (3rd–97th percentile) are displayed.
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
              ? '예시: 아버지 178cm, 어머니 165cm, 아들(남아)'
              : 'Example: Father 178cm, Mother 165cm, Son (boy)'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1">
            <p>
              {isKo
                ? '공식 (남아): (165 + 178 + 13) / 2 = 356 / 2 = 178cm'
                : 'Formula (boy): (165 + 178 + 13) / 2 = 356 / 2 = 178cm'}
            </p>
            <p>
              {isKo
                ? '오차 범위: ±8.5cm (예상 성인 키의 3~97 백분위 구간)'
                : 'Range: ±8.5cm (3rd–97th percentile of expected adult height)'}
            </p>
            <p className="text-[#f59e0b]">
              {isKo
                ? '→ 예상 성인 키 약 178cm, 범위 169.5~186.5cm'
                : '→ Predicted adult height ~178cm, range 169.5–186.5cm'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '이 값은 통계적 추정이며 확정된 성인 키가 아닙니다. 실제 성장은 영양, 수면, 건강 상태 등 다양한 요인에 따라 달라질 수 있습니다.'
              : 'This is a statistical estimate, not a guaranteed adult height. Actual growth depends on nutrition, sleep, health, and many other factors.'}
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
