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
import PasswordGeneratorTool from '@/components/tools/password-generator/PasswordGeneratorTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'password-generator'
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

export default async function PasswordGeneratorPage({ params }: Props) {
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
      <PasswordGeneratorTool />

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
            이 생성기는 Web Crypto API의 <code className="text-neutral-200 font-mono text-xs">crypto.getRandomValues</code>를 사용합니다.
            예측 가능성이 있는 <code className="text-neutral-200 font-mono text-xs">Math.random()</code>과 달리
            암호학적으로 안전한 난수를 생성하므로 보안이 중요한 상황에서 신뢰할 수 있습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            This generator uses the Web Crypto API&apos;s{' '}
            <code className="text-neutral-200 font-mono text-xs">crypto.getRandomValues</code> — unlike
            the predictable <code className="text-neutral-200 font-mono text-xs">Math.random()</code>,
            this produces cryptographically secure random numbers that cannot be predicted even if an
            attacker observes previous outputs.
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
                <strong className="text-neutral-200">Length</strong> 슬라이더로 원하는 비밀번호 길이(8~64자)를 조정합니다.
              </li>
              <li>
                <strong className="text-neutral-200">Character Types</strong>에서 포함할 문자 조합(대/소문자, 숫자, 특수문자)을 선택합니다.
              </li>
              <li>
                직접 입력해야 하는 경우 <strong className="text-neutral-200">Exclude Ambiguous Characters</strong> 옵션을 켜면
                혼동되기 쉬운 문자(0, O, o, 1, l, I, |)를 제외합니다.
              </li>
              <li>
                비밀번호가 마음에 들지 않으면 <strong className="text-neutral-200">Regenerate Password</strong> 버튼을 눌러 새 비밀번호를 생성합니다.
              </li>
              <li>
                <strong className="text-neutral-200">Copy</strong> 버튼으로 비밀번호를 클립보드에 복사한 뒤 비밀번호 관리자에 저장합니다.
              </li>
            </>
          ) : (
            <>
              <li>
                Adjust the <strong className="text-neutral-200">Length</strong> slider to set your desired
                password length (8–64 characters).
              </li>
              <li>
                Select which <strong className="text-neutral-200">Character Types</strong> to include —
                uppercase letters, lowercase letters, numbers, and symbols.
              </li>
              <li>
                If you need to type the password manually, enable{' '}
                <strong className="text-neutral-200">Exclude Ambiguous Characters</strong> to remove
                look-alike characters like 0 / O / o and 1 / l / I.
              </li>
              <li>
                If you want a different password, click{' '}
                <strong className="text-neutral-200">Regenerate Password</strong> to generate a fresh one.
              </li>
              <li>
                Click <strong className="text-neutral-200">Copy</strong> to copy the password to your
                clipboard, then save it in a password manager.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example — length vs strength table */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '길이별 비밀번호 강도 비교' : 'Password Length vs. Strength'}
        </h2>
        <p className="text-sm text-neutral-400 leading-relaxed">
          {isKo
            ? '아래 표는 대/소문자 + 숫자 + 특수문자를 모두 포함했을 때 길이별 엔트로피와 권장 용도를 보여줍니다.'
            : 'The table below shows entropy and recommended use cases at each length when using all character types (uppercase, lowercase, numbers, symbols).'}
        </p>

        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">
                  {isKo ? '길이' : 'Length'}
                </th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">
                  {isKo ? '강도' : 'Strength'}
                </th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">
                  {isKo ? '엔트로피 (비트)' : 'Entropy (bits)'}
                </th>
                <th className="px-4 py-3 text-left text-neutral-400 font-medium">
                  {isKo ? '권장 용도' : 'Recommended For'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              <tr>
                <td className="px-4 py-3 font-mono text-neutral-200">8</td>
                <td className="px-4 py-3 text-[#f59e0b]">{isKo ? '보통' : 'Medium'}</td>
                <td className="px-4 py-3 text-neutral-400">~52</td>
                <td className="px-4 py-3 text-neutral-400">
                  {isKo ? '비중요 계정 (최소 요구사항 충족용)' : 'Low-stakes accounts (bare minimum)'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-neutral-200">12</td>
                <td className="px-4 py-3 text-[#22c55e]">{isKo ? '강력' : 'Strong'}</td>
                <td className="px-4 py-3 text-neutral-400">~79</td>
                <td className="px-4 py-3 text-neutral-400">
                  {isKo ? '소셜 미디어, 일반 온라인 계정' : 'Social media, general online accounts'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-neutral-200">16</td>
                <td className="px-4 py-3 text-[#22c55e]">{isKo ? '매우 강력' : 'Very Strong'}</td>
                <td className="px-4 py-3 text-neutral-400">~105</td>
                <td className="px-4 py-3 text-neutral-400">
                  {isKo ? '이메일, 뱅킹, 비밀번호 관리자' : 'Email, banking, password managers'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-neutral-200">32</td>
                <td className="px-4 py-3 text-[#22c55e]">{isKo ? '매우 강력' : 'Very Strong'}</td>
                <td className="px-4 py-3 text-neutral-400">~210</td>
                <td className="px-4 py-3 text-neutral-400">
                  {isKo ? '최고 보안 요구 계정, API 키, 암호화 키' : 'High-security accounts, API keys, encryption keys'}
                </td>
              </tr>
            </tbody>
          </table>
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
              <dt className="text-sm font-medium text-neutral-200">{item.question[safeLocale]}</dt>
              <dd className="text-sm text-neutral-400 leading-relaxed">{item.answer[safeLocale]}</dd>
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
