import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { getToolBySlug, getRelatedTools } from '@/lib/config/tools-config'
import { CHIIKAWA_CHARACTERS } from '@/lib/config/chiikawaCharacters'
import { localeHref } from '@/lib/utils/locale-href'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import ToolStage from '@/components/ui/ToolStage'
import ToolCardGrid from '@/components/ui/ToolCardGrid'
import SchemaWebApplication from '@/components/seo/SchemaWebApplication'
import SchemaFaqPage from '@/components/seo/SchemaFaqPage'
import SchemaBreadcrumb from '@/components/seo/SchemaBreadcrumb'
import ChiikawaPersonalityTestTool from '@/components/tools/chiikawa-personality-test/ChiikawaPersonalityTestTool'
import FanMadeNotice from '@/components/tools/chiikawa-personality-test/FanMadeNotice'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'chiikawa-personality-test'
const CATEGORY = 'fun'

const AXES = {
  en: [
    { pair: 'E / I', text: 'Where you get your energy — from being with people (E) or from quiet time on your own (I).' },
    { pair: 'S / N', text: 'How you take in information — through concrete facts and experience (S) or through ideas and possibilities (N).' },
    { pair: 'T / F', text: 'How you make decisions — by weighing logic and fairness (T) or by considering feelings and harmony (F).' },
    { pair: 'J / P', text: 'How you handle plans — preferring a set plan and closure (J) or keeping things open and flexible (P).' },
  ],
  ko: [
    { pair: 'E / I', text: '에너지를 어디서 얻는지 — 사람들과 함께할 때(E)인지, 혼자만의 조용한 시간(I)인지를 봅니다.' },
    { pair: 'S / N', text: '정보를 받아들이는 방식 — 구체적인 사실과 경험(S)을 따르는지, 아이디어와 가능성(N)을 따르는지를 봅니다.' },
    { pair: 'T / F', text: '결정을 내리는 방식 — 논리와 공정함(T)을 먼저 따지는지, 감정과 조화(F)를 먼저 생각하는지를 봅니다.' },
    { pair: 'J / P', text: '계획을 다루는 방식 — 정해진 계획과 마무리(J)를 좋아하는지, 열어 두고 유연하게(P) 움직이는지를 봅니다.' },
  ],
} as const

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

export default async function ChiikawaPersonalityTestPage({ params }: Props) {
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
      name: safeLocale === 'ko' ? '재미' : 'Fun',
      url: `${SITE_URL}${localeHref(safeLocale, '/fun')}`,
    },
    { name: tool.title[safeLocale], url: pageUrl },
  ]

  const isKo = safeLocale === 'ko'

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-12">
      <ToolStage>
        <h1 className="text-4xl font-semibold text-white">{tool.title[safeLocale]}</h1>
        <p className="text-base text-neutral-400 leading-relaxed">
          {isKo
            ? '24개 질문에 답하면 나의 성격 유형과 16명의 치이카와 친구 중 나와 가장 닮은 캐릭터를 알려드려요.'
            : 'Answer 24 questions to see your personality type and which of 16 Chiikawa friends you are most like.'}
        </p>

        {/* Schema.org structured data */}
        <SchemaBreadcrumb items={breadcrumbItems} />
        <SchemaWebApplication tool={tool} locale={safeLocale} url={pageUrl} />
        <SchemaFaqPage faq={tool.faq} locale={safeLocale} />

        {/* The tool */}
        <ChiikawaPersonalityTestTool locale={safeLocale} />
      </ToolStage>

      {/* Description */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">
          {isKo ? '이 테스트에 대하여' : 'About This Quiz'}
        </h2>
        <p className="text-base text-neutral-300 leading-relaxed">
          {tool.description[safeLocale]}
        </p>
        <p className="text-base text-neutral-300 leading-relaxed">
          {isKo
            ? '질문은 모두 24개이며 두 부분으로 나뉩니다. 1~16번 문항으로 나의 성격 유형 4글자를 계산하고, 17~24번 문항으로 나와 가장 닮은 캐릭터를 찾습니다. 두 결과는 서로 다른 문항으로 따로 계산됩니다.'
            : 'There are 24 questions in two parts. Questions 1–16 work out your 4-letter personality type, and questions 17–24 find the character you are most like. The two results are calculated separately from different questions.'}
        </p>
        <p className="text-base text-neutral-300 leading-relaxed">
          {isKo ? '결과로 나올 수 있는 16명의 친구:' : 'The 16 friends you can match with:'}
        </p>
        <ul className="flex flex-wrap gap-2">
          {CHIIKAWA_CHARACTERS.map((character) => (
            <li
              key={character.id}
              className="rounded-md border border-neutral-800 bg-[#141414] px-3 py-1.5 text-sm text-neutral-300"
            >
              <span aria-hidden="true">{character.emoji}</span> {character.name[safeLocale]}
            </li>
          ))}
        </ul>
      </section>

      {/* How To Use */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">
          {isKo ? '사용 방법' : 'How To Use'}
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-base text-neutral-300 leading-relaxed">
          {isKo ? (
            <>
              <li>
                <strong className="text-neutral-200">시작하기 버튼을 누릅니다</strong> — 로그인이나
                입력할 개인 정보는 없습니다.
              </li>
              <li>
                <strong className="text-neutral-200">24개 문항에 하나씩 답합니다</strong> — 각 문항의
                네 가지 선택지 중 나와 가장 가까운 것을 고르세요. 정답은 없습니다.
              </li>
              <li>
                <strong className="text-neutral-200">이전 문항으로 돌아가 답을 바꿀 수 있습니다</strong>{' '}
                — 이전 버튼을 누르면 기존 응답이 유지되고, 다른 선택지를 고르면 덮어씁니다.
              </li>
              <li>
                <strong className="text-neutral-200">결과를 확인하고 공유합니다</strong> — 닮은 캐릭터,
                나의 성격 유형, 닮은 캐릭터 TOP 3를 보고 링크로 친구에게 보낼 수 있습니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Press the start button</strong> — no sign-up and no
                personal details needed.
              </li>
              <li>
                <strong className="text-neutral-200">Answer the 24 questions one at a time</strong> — pick
                whichever of the four choices sounds most like you. There are no wrong answers.
              </li>
              <li>
                <strong className="text-neutral-200">Go back to change an answer</strong> — the back button
                keeps your previous choice, and picking a different option replaces it.
              </li>
              <li>
                <strong className="text-neutral-200">See and share your result</strong> — view your matched
                character, your personality type and your top-3 matches, then send the link to friends.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* How to read the result */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          {isKo ? '결과 읽는 법' : 'How To Read Your Result'}
        </h2>
        <p className="text-base text-neutral-300 leading-relaxed">
          {isKo
            ? '성격 유형 4글자는 네 가지 축에서 하나씩 고른 글자로 이루어집니다. 축마다 4문항씩 있고, 더 많이 고른 쪽 글자가 선택됩니다.'
            : 'Your 4-letter type is one letter from each of four axes. Each axis has four questions, and the letter you choose more often is the one you get.'}
        </p>
        <dl className="space-y-3">
          {AXES[safeLocale].map((axis) => (
            <div
              key={axis.pair}
              className="rounded-lg border border-neutral-800 bg-[#141414] px-4 py-3 space-y-1"
            >
              <dt className="text-base font-medium text-neutral-200">{axis.pair}</dt>
              <dd className="text-base text-neutral-400 leading-relaxed">{axis.text}</dd>
            </div>
          ))}
        </dl>
        <p className="text-base text-neutral-300 leading-relaxed">
          {isKo
            ? '결과 화면의 "나의 성격 유형"은 내 응답(1~16번)으로 계산한 값이고, "캐릭터의 성격 유형(팬 설정)"은 제작자가 캐릭터에 붙인 추정 값입니다. 둘은 서로 다른 것이므로 일치하지 않아도 이상한 결과가 아닙니다.'
            : 'On the result screen, "Your personality type" is calculated from your own answers (questions 1–16), while "the character\'s type (fan interpretation)" is a guess the quiz creator assigned to that character. They are different things, so it is completely normal for them not to match.'}
        </p>
        <p className="text-base text-neutral-300 leading-relaxed">
          {isKo
            ? '닮은 캐릭터 TOP 3의 유사도는 17~24번 8문항에서 내 답이 캐릭터의 기준 답과 몇 개 일치하는지로 계산합니다(일치 수 ÷ 8 × 100). 예를 들어 6문항이 같으면 75%입니다.'
            : 'The similarity for your top-3 matches is how many of questions 17–24 you answered the same way as each character (matches ÷ 8 × 100). For example, 6 matching answers gives 75%.'}
        </p>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          {isKo ? '자주 묻는 질문' : 'Frequently Asked Questions'}
        </h2>
        <dl className="space-y-6">
          {tool.faq.map((item, i) => (
            <div key={i} className="space-y-2">
              <dt className="text-base font-medium text-neutral-200">
                {item.question[safeLocale]}
              </dt>
              <dd className="text-base text-neutral-400 leading-relaxed">
                {item.answer[safeLocale]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* General disclaimer + fan-made notice */}
      <div className="space-y-4">
        <DisclaimerBanner disclaimerType={tool.disclaimerType} />
        <FanMadeNotice locale={safeLocale} />
      </div>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            {isKo ? '관련 도구' : 'Related Tools'}
          </h2>
          <ToolCardGrid tools={relatedTools} locale={safeLocale} />
        </section>
      )}
    </div>
  )
}
