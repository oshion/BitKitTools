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
import BacSafetyWarning from '@/components/tools/bac-calculator/BacSafetyWarning'
import BacCalculatorTool from '@/components/tools/bac-calculator/BacCalculatorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'bac-calculator'
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

export default async function BacCalculatorPage({ params }: Props) {
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

      {/*
        Safety warning is placed here — above the tool — so it is the first
        content users see after the title. It is also rendered inside
        BacCalculatorTool, but this server-rendered instance ensures it
        appears immediately on page load before the client component hydrates.
        (ADR-014: safety warning must be rendered unconditionally)
      */}
      <BacSafetyWarning />

      {/* Header ad */}
      <AdSlot position="header" minHeightPx={90} />

      {/* The tool */}
      <BacCalculatorTool />

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
            계산에 사용되는 Widmark 공식은 1932년 스웨덴 의사 Erik MP Widmark가 발표한
            공식입니다. 법의학 및 연구 분야에서 표준적으로 활용되지만 어디까지나 추정치이며,
            실제 혈중 알코올 농도는 음식 섭취 여부·복용 약물·피로도·유전적 요인에 따라
            크게 달라질 수 있습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            The calculation uses the{' '}
            <strong className="text-neutral-200">Widmark formula</strong> (Widmark EMP, 1932), a
            standard method used in forensic and research contexts. It is an approximation — actual
            BAC is affected by food intake, medications, fatigue, genetic factors, and liver
            function, and may differ significantly from the calculated estimate.
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
                <strong className="text-neutral-200">성별과 체중을 입력합니다</strong> —
                Widmark 공식의 분포 계수(r)와 BAC 계산에 사용됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">음주 시작 후 경과 시간을 설정합니다</strong>{' '}
                — 슬라이더로 0~12시간을 선택합니다.
              </li>
              <li>
                <strong className="text-neutral-200">마신 음료를 추가합니다</strong> — 종류
                프리셋을 선택하면 ABV가 자동 채워지며, 직접 수정도 가능합니다.
              </li>
              <li>
                <strong className="text-neutral-200">추정 BAC를 확인합니다</strong> — 결과는
                참고용 수치이며, 운전 가능 여부 판단에 사용할 수 없습니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Enter your biological sex and weight</strong>{' '}
                — these are used for the Widmark distribution factor (r) and total body mass.
              </li>
              <li>
                <strong className="text-neutral-200">
                  Set the hours elapsed since you started drinking
                </strong>{' '}
                — use the slider to select 0–12 hours.
              </li>
              <li>
                <strong className="text-neutral-200">Add each drink you consumed</strong> —
                select a preset to auto-fill the ABV, then adjust volume if needed.
              </li>
              <li>
                <strong className="text-neutral-200">Review the estimated BAC</strong> — the
                result is for informational reference only. Do not use this to judge whether
                driving is safe.
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
              ? '예시: 80 kg 남성, 맥주 2캔(355 mL × 5%), 2시간 경과'
              : 'Example: 80 kg male, 2 regular beers (355 mL × 5%), 2 hours elapsed'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-1">
            <p>
              {isKo ? '• 총 알코올 = ' : '• Total alcohol = '}
              {isKo
                ? '355 mL × 2 × 5% × 0.789 g/mL ≈ 28.1 g'
                : '355 mL × 2 × 5% × 0.789 g/mL ≈ 28.1 g'}
            </p>
            <p>
              {isKo
                ? '• 초기 BAC = (28.1 × 100) / (80,000 × 0.68) ≈ 0.052%'
                : '• Initial BAC = (28.1 × 100) / (80,000 × 0.68) ≈ 0.052%'}
            </p>
            <p>
              {isKo
                ? '• 2시간 경과 후 = 0.052 − (0.015 × 2) ≈ 0.022%'
                : '• After 2 hours = 0.052 − (0.015 × 2) ≈ 0.022%'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '이 수치는 참고용 추정치입니다. 실제 혈중 알코올 농도는 음식 섭취 여부, 음주 속도, 개인의 대사 능력에 따라 크게 다를 수 있습니다. 어떤 수치이든 음주 후에는 운전하지 마세요.'
              : 'This figure is an estimate for reference only. Actual BAC can differ significantly based on food intake, drinking pace, and individual metabolic rate. Regardless of the calculated result, never drive after consuming alcohol.'}
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

      {/* Standard medical disclaimer (in addition to BacSafetyWarning) */}
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
