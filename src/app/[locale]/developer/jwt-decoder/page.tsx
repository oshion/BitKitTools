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
import JwtDecoderTool from '@/components/tools/jwt-decoder/JwtDecoderTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'jwt-decoder'
const CATEGORY = 'developer'

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

export default async function JwtDecoderPage({ params }: Props) {
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
      name: safeLocale === 'ko' ? '개발자' : 'Developer',
      url: `${SITE_URL}${localeHref(safeLocale, '/developer')}`,
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
      <JwtDecoderTool locale={safeLocale} />

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
            JWT(JSON Web Token)는 세 부분으로 구성됩니다: <strong className="text-neutral-200">Header</strong>(알고리즘 및 토큰 유형),{' '}
            <strong className="text-neutral-200">Payload</strong>(클레임 — 사용자 정보, 만료 시각 등),{' '}
            <strong className="text-neutral-200">Signature</strong>(무결성 검증용, 이 도구에서는 검증하지 않음).
            이 디코더는 Header와 Payload를 읽어 내용을 보여주지만, 서명의 유효성을 검증하지 않습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            A JWT (JSON Web Token) has three parts:{' '}
            <strong className="text-neutral-200">Header</strong> (algorithm and token type),{' '}
            <strong className="text-neutral-200">Payload</strong> (claims — user info, expiry, etc.), and{' '}
            <strong className="text-neutral-200">Signature</strong> (for integrity, not verified by this tool).
            This decoder reads the Header and Payload and shows you their contents, but does{' '}
            <em>not</em> verify the signature.
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
                <strong className="text-neutral-200">JWT 토큰을 붙여넣습니다</strong> —
                브라우저 개발자 도구, API 클라이언트, 또는 인증 응답에서 복사한 토큰을 입력란에 붙여넣습니다.
              </li>
              <li>
                <strong className="text-neutral-200">디코딩 버튼을 누릅니다</strong> — Header와
                Payload가 즉시 보기 좋게 표시됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">표준 클레임 설명을 확인합니다</strong> —
                exp(만료), iat(발급 시각), sub(주체) 등 표준 클레임이 있으면 자동으로 사람이 읽을 수 있는 설명이 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Paste your JWT token</strong> — copy it
                from your browser devtools, API client, or authentication response.
              </li>
              <li>
                <strong className="text-neutral-200">Click Decode</strong> — the Header and
                Payload are displayed immediately in a readable format.
              </li>
              <li>
                <strong className="text-neutral-200">Review the standard claims</strong> —
                if the Payload contains registered claims (exp, iat, sub, iss, aud, etc.),
                human-readable explanations appear automatically below the JSON blocks.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '예시' : 'Example'}
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-200">
            {isKo ? '아래 토큰을 붙여넣어 직접 디코딩해 보세요:' : 'Try pasting this sample token:'}
          </p>
          <pre className="text-xs text-neutral-400 font-mono break-all leading-relaxed">
            {`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJKYW5lIERvZSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`}
          </pre>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? '이 토큰의 Payload에는 sub, name, iat, exp 클레임이 포함되어 있습니다. exp가 과거 시각이라 "만료 시각이 지났습니다" 표시가 나타납니다 (이는 시간 비교이며 서명 검증이 아닙니다).'
              : 'This token\'s Payload contains sub, name, iat, and exp claims. The exp timestamp is in the past, so the "expiry time has passed" indicator will appear — this is a time comparison, not a signature check.'}
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

      {/* Disclaimer — disclaimerType is 'none', DisclaimerBanner returns null */}
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
