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
import TemperamentQuizTool from '@/components/tools/temperament-quiz/TemperamentQuizTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'temperament-quiz'
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

export default async function TemperamentQuizPage({ params }: Props) {
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
      <TemperamentQuizTool locale={safeLocale} />

      {/* Result ad */}
      <AdSlot position="result" minHeightPx={250} />

      {/* Description */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '이 테스트에 대하여' : 'About This Quiz'}
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          {tool.description[safeLocale]}
        </p>
        {isKo ? (
          <p className="text-sm text-neutral-300 leading-relaxed">
            이 테스트는 Alexander Thomas와 Stella Chess의 《Temperament and Development》(1977)에서 제안한
            기질 연구를 바탕으로, 9개 원 차원 중 4개 축(활동성, 사회성, 적응력, 감정반응)을 재미있게
            재구성한 콘텐츠입니다. 모든 유형은 동등하게 긍정적이며 어떤 결과도 발달 지연이나 문제를
            시사하지 않습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            This quiz is a playful adaptation of research by Alexander Thomas and Stella Chess
            (Temperament and Development, 1977), reorganising four of their nine temperament dimensions
            into a fun format. All 16 result types are described equally positively — no outcome
            implies a developmental concern of any kind.
          </p>
        )}
        <p className="text-sm text-amber-200 leading-relaxed rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3">
          {isKo
            ? '이 테스트는 재미를 위한 콘텐츠이며 의학적·심리학적 진단이 아닙니다. 아이의 발달이나 행동에 대해 걱정되는 부분이 있다면 소아과 전문의와 상담하세요.'
            : 'This quiz is for entertainment and general reflection only — it is not a medical or psychological diagnostic tool. If you have any concerns about your child\'s development or behaviour, please consult a qualified paediatrician.'}
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
                <strong className="text-neutral-200">아기의 연령 구간을 선택합니다</strong> —
                4개월 미만은 아직 기질 차이가 뚜렷하지 않아 테스트를 진행할 수 없습니다.
              </li>
              <li>
                <strong className="text-neutral-200">20개 문항에 순서대로 답합니다</strong> —
                각 문항에는 두 가지 선택지가 있으며, 정답은 없습니다. 우리 아이에게 더 가까운 행동을 선택하세요.
              </li>
              <li>
                <strong className="text-neutral-200">결과로 나온 성향 유형을 확인합니다</strong> —
                유형 설명과 함께 이 성향의 아이에게 잘 맞는 육아 팁 2~3개가 제공됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">결과를 친구나 가족과 공유합니다</strong> —
                공유 버튼을 눌러 유형 결과 링크를 보낼 수 있습니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Select your baby&apos;s age band</strong> —
                the quiz is not available for babies under 4 months, as temperament differences are not yet clearly observable.
              </li>
              <li>
                <strong className="text-neutral-200">Answer 20 questions in order</strong> —
                each question has two choices and there are no right or wrong answers. Pick whichever option sounds most like your child.
              </li>
              <li>
                <strong className="text-neutral-200">Read your child&apos;s temperament type</strong> —
                you will see a type description along with 2–3 parenting tips tailored to this temperament style.
              </li>
              <li>
                <strong className="text-neutral-200">Share the result with friends or family</strong> —
                tap the share button to send the result link to others.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '결과 예시' : 'Example Result'}
        </h2>

        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            {isKo
              ? '예시: 🧭 명랑한 모험가 (Cheerful Adventurer)'
              : 'Example: 🧭 Cheerful Adventurer (명랑한 모험가)'}
          </p>
          <div className="text-sm text-neutral-400 leading-relaxed space-y-2">
            <p>
              {isKo
                ? '활발하고 사교적이며, 새로운 상황에 유연하게 적응하고, 감정을 솔직하게 드러내는 아이에게 나오는 유형입니다.'
                : 'This type appears when a child is active, socially outgoing, flexible in new situations, and expressive with their emotions.'}
            </p>
            <p className="text-[#f59e0b]">
              {isKo
                ? '→ 예를 들어 새로운 장소에 가면 금방 탐색을 시작하고, 낯선 아이에게도 먼저 다가가며, 기쁘거나 속상할 때 표현이 풍부한 아이가 이 유형입니다.'
                : '→ For example: a child who immediately starts exploring a new place, approaches unfamiliar children first, and openly shows joy or frustration.'}
            </p>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '모든 유형은 동등하게 긍정적입니다. 어떤 결과가 나오더라도 발달상의 문제를 의미하지 않습니다.'
              : 'All 16 types are equally positive. No result implies any developmental concern.'}
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
