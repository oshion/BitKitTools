import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { CHIIKAWA_CHARACTERS, getChiikawaCharacter } from '@/lib/config/chiikawaCharacters'
import { PERSONALITY_TYPE_LABELS } from '@/lib/config/personalityTypeLabels'
import { localeHref } from '@/lib/utils/locale-href'
import SchemaBreadcrumb from '@/components/seo/SchemaBreadcrumb'
import FanMadeNotice from '@/components/tools/chiikawa-personality-test/FanMadeNotice'

type Props = {
  params: Promise<{ locale: string; characterId: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const TEST_PATH = '/fun/chiikawa-personality-test'

// 공유 랜딩 전용 — 테스트를 다시 진행하지 않고 캐릭터 프로필 미리보기 + "나도 테스트하기" CTA만 둔다.
// 사이트맵·tools-config에는 넣지 않는다(temperament-quiz 결과 페이지와 같은 정책).
export function generateStaticParams(): Array<{ locale: string; characterId: string }> {
  return routing.locales.flatMap((locale) =>
    CHIIKAWA_CHARACTERS.map((character) => ({ locale, characterId: character.id }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, characterId } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const character = getChiikawaCharacter(characterId)
  if (!character) return {}

  const isKo = safeLocale === 'ko'
  const basePath = `${TEST_PATH}/result/${characterId}/`
  const canonical = isKo ? `${SITE_URL}/ko${basePath}` : `${SITE_URL}${basePath}`

  const name = character.name[safeLocale]
  const title = isKo
    ? `나와 닮은 치이카와 친구는 ${name} — BitKitTools`
    : `${name} — Which Chiikawa Character Are You? | BitKitTools`
  const description = isKo
    ? `${character.tagline.ko}. 24개 질문에 답하고 나와 가장 닮은 치이카와 친구를 찾아보세요.`
    : `${character.tagline.en}. Answer 24 questions to find which Chiikawa friend you are most like.`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}${basePath}`,
        ko: `${SITE_URL}/ko${basePath}`,
        'x-default': `${SITE_URL}${basePath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'BitKitTools',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og/chiikawa/${characterId}-${safeLocale}.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}

export default async function ChiikawaResultPage({ params }: Props) {
  const { locale, characterId } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  setRequestLocale(locale)

  const character = getChiikawaCharacter(characterId)
  if (!character) return null

  const isKo = safeLocale === 'ko'
  const name = character.name[safeLocale]
  const basePath = `${TEST_PATH}/result/${characterId}/`

  const breadcrumbItems = [
    { name: 'Home', url: isKo ? `${SITE_URL}/ko/` : `${SITE_URL}/` },
    { name: isKo ? '재미' : 'Fun', url: `${SITE_URL}${localeHref(safeLocale, '/fun')}` },
    {
      name: isKo ? '치이카와 성격 테스트' : 'Chiikawa Personality Quiz',
      url: `${SITE_URL}${localeHref(safeLocale, TEST_PATH)}`,
    },
    { name, url: isKo ? `${SITE_URL}/ko${basePath}` : `${SITE_URL}${basePath}` },
  ]

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-12">
      <SchemaBreadcrumb items={breadcrumbItems} />

      {/* Character profile card */}
      <div className={`rounded-2xl border p-8 space-y-4 text-center ${character.cardClassName}`}>
        <div className="text-7xl" aria-hidden="true">
          {character.emoji}
        </div>
        <p className="text-base text-neutral-300">
          {isKo ? '친구가 공유한 결과예요' : 'Your friend got…'}
        </p>
        <h1 className={`text-4xl font-bold ${character.nameClassName}`}>{name}</h1>
        <p className="text-base text-neutral-200 leading-relaxed">
          {character.description[safeLocale]}
        </p>
        <p className="text-base text-neutral-300 leading-relaxed">
          {character.tagline[safeLocale]}
        </p>
        <a
          href={character.officialUrl}
          target="_blank"
          rel="noopener"
          className="inline-block text-sm text-neutral-300 underline underline-offset-2 hover:text-white"
        >
          {isKo ? `공식 사이트에서 ${name} 보기 →` : `See ${name} on the official site →`}
        </a>
      </div>

      {/* Fan-made personality type */}
      <section className="rounded-lg border border-neutral-800 bg-[#141414] p-6 space-y-1">
        <h2 className="text-base font-medium text-neutral-400">
          {isKo ? `${name}의 성격 유형(팬 설정)` : `${name}'s personality type (fan-made)`}
        </h2>
        <p className="text-2xl font-semibold text-neutral-200 tracking-wider">{character.fanType}</p>
        <p className="text-base text-neutral-300">
          {PERSONALITY_TYPE_LABELS[character.fanType][safeLocale]}
        </p>
        <p className="text-sm text-neutral-500">
          {isKo ? '공식 설정이 아닌 제작자 추정이에요' : 'A fan-made guess, not official'}
        </p>
      </section>

      {/* Strengths — coreTraits addresses the quiz taker ("you"), so the share landing
          for a friend shows the character description in the card instead. */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          {isKo ? `${name}의 강점` : `${name}'s strengths`}
        </h2>
        <ul className="list-disc pl-5 space-y-1 text-base text-neutral-300 leading-relaxed">
          {character.strengths[safeLocale].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <div className="space-y-4 text-center">
        <p className="text-base text-neutral-300">
          {isKo ? '나는 어떤 치이카와 친구와 닮았을까요?' : 'Which Chiikawa friend are you most like?'}
        </p>
        <Link
          href={localeHref(safeLocale, TEST_PATH)}
          className="inline-block rounded-full bg-pink-200 text-black font-medium px-8 py-3 hover:bg-pink-100 transition-colors"
        >
          {isKo ? '나도 테스트하기' : 'Take the quiz'}
        </Link>
      </div>

      <FanMadeNotice locale={safeLocale} />
    </div>
  )
}
