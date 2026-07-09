import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { TEMPERAMENT_PERSONAS, getPersonaByCode } from '@/lib/config/temperamentPersonas'
import { localeHref } from '@/lib/utils/locale-href'
import SchemaBreadcrumb from '@/components/seo/SchemaBreadcrumb'

type Props = {
  params: Promise<{ locale: string; code: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'

export function generateStaticParams(): Array<{ locale: string; code: string }> {
  return routing.locales.flatMap((locale) =>
    TEMPERAMENT_PERSONAS.map((persona) => ({ locale, code: persona.code }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const persona = getPersonaByCode(code)
  if (!persona) return {}

  const isKo = safeLocale === 'ko'
  const basePath = `/baby/temperament-quiz/result/${code}`
  const canonical = isKo ? `${SITE_URL}/ko${basePath}` : `${SITE_URL}${basePath}`

  const title = `${persona.name[safeLocale]} — BitKitTools`
  const description = persona.description[safeLocale]

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
          url: `${SITE_URL}/og/temperament/${code}-${safeLocale}.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}

export default async function TemperamentResultPage({ params }: Props) {
  const { locale, code } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  setRequestLocale(locale)

  const persona = getPersonaByCode(code)
  if (!persona) return null

  const isKo = safeLocale === 'ko'
  const quizUrl = `${SITE_URL}${localeHref(safeLocale, '/baby/temperament-quiz')}`

  const breadcrumbItems = [
    { name: 'Home', url: safeLocale === 'ko' ? `${SITE_URL}/ko` : SITE_URL },
    {
      name: isKo ? '육아' : 'Baby',
      url: `${SITE_URL}${localeHref(safeLocale, '/baby')}`,
    },
    {
      name: isKo ? '기질 유형 퀴즈' : 'Baby Temperament Type Quiz',
      url: quizUrl,
    },
    {
      name: persona.name[safeLocale],
      url: isKo
        ? `${SITE_URL}/ko/baby/temperament-quiz/result/${code}`
        : `${SITE_URL}/baby/temperament-quiz/result/${code}`,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
      <SchemaBreadcrumb items={breadcrumbItems} />

      {/* Result preview card */}
      <div
        className="rounded-lg border border-neutral-800 p-8 space-y-6 text-center"
        style={{ backgroundColor: `hsl(${persona.colorHue}, 30%, 10%)` }}
      >
        <div className="text-7xl">{persona.emoji}</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{persona.name[safeLocale]}</h1>
          <p className="text-sm text-neutral-400">
            {isKo ? 'Baby Temperament Type' : '아기 기질 유형'}
          </p>
        </div>
        <p className="text-base text-neutral-300 leading-relaxed max-w-2xl mx-auto">
          {persona.description[safeLocale]}
        </p>
      </div>

      {/* Parenting tips */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '이 성향 아이에게 맞는 육아 팁' : 'Parenting Tips for This Temperament'}
        </h2>
        <ul className="space-y-3">
          {persona.tips[safeLocale].map((tip, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border border-neutral-800 bg-[#141414] p-4 text-sm text-neutral-300 leading-relaxed"
            >
              <span className="text-[#f59e0b] font-medium shrink-0">{i + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <p className="text-sm text-neutral-500 leading-relaxed rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
        {isKo
          ? '이 유형은 Thomas & Chess의 기질 연구 개념을 재미있게 재구성한 것이며, 임상적 진단이 아닙니다.'
          : 'This type is a fun reinterpretation of Thomas & Chess\'s temperament research concepts and is not a clinical diagnosis.'}
      </p>

      {/* CTA */}
      <div className="space-y-4 text-center">
        <p className="text-base text-neutral-300">
          {isKo
            ? '우리 아이는 어떤 유형일까요?'
            : 'What temperament type is your baby?'}
        </p>
        <Link
          href={localeHref(safeLocale, '/baby/temperament-quiz')}
          className="inline-block rounded-lg bg-white text-black font-medium px-8 py-3 hover:bg-neutral-200 transition-colors"
        >
          {isKo ? '테스트 시작하기' : 'Start the Quiz'}
        </Link>
      </div>
    </div>
  )
}
