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
import JsonFormatterTool from '@/components/tools/json-formatter/JsonFormatterTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'json-formatter'
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

export default async function JsonFormatterPage({ params }: Props) {
  const { locale } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  setRequestLocale(locale)

  const tool = getToolBySlug(CATEGORY, SLUG)
  if (!tool) return null

  const relatedTools = getRelatedTools(tool.id)
  const pageUrl = safeLocale === 'ko'
    ? `${SITE_URL}/ko/${CATEGORY}/${SLUG}`
    : `${SITE_URL}/${CATEGORY}/${SLUG}`

  const breadcrumbItems = [
    { name: 'Home', url: safeLocale === 'ko' ? `${SITE_URL}/ko` : SITE_URL },
    { name: safeLocale === 'ko' ? '개발자' : 'Developer', url: `${SITE_URL}${localeHref(safeLocale, '/developer')}` },
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
      <JsonFormatterTool />

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
            JSON(JavaScript Object Notation)은 API 응답, 설정 파일, 데이터 교환에 가장 널리 쓰이는 형식입니다.
            이 포매터는 JSON.parse를 브라우저에서 직접 실행해 서버로 데이터를 전송하지 않습니다.
            민감한 API 응답이나 토큰이 포함된 JSON도 안전하게 붙여넣을 수 있습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            JSON (JavaScript Object Notation) is the most widely used format for API responses,
            configuration files, and data interchange. This formatter runs JSON.parse directly
            in your browser — your data never leaves your machine, making it safe to paste
            sensitive API responses or tokens.
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
              <li>왼쪽 <strong className="text-neutral-200">Input</strong> 영역에 JSON 원문을 붙여넣습니다.</li>
              <li><strong className="text-neutral-200">Format</strong> 또는 <strong className="text-neutral-200">Minify</strong> 탭을 선택합니다.</li>
              <li>Format 선택 시 들여쓰기 폭(2 또는 4 스페이스)을 고릅니다.</li>
              <li>버튼을 클릭하면 오른쪽 <strong className="text-neutral-200">Output</strong> 영역에 결과가 나타납니다.</li>
              <li>문법 오류가 있으면 오류 메시지와 해당 줄 번호(가능한 경우)가 표시됩니다.</li>
              <li><strong className="text-neutral-200">Copy</strong> 버튼으로 결과를 클립보드에 복사하거나, <strong className="text-neutral-200">Download .json</strong>으로 파일을 저장합니다.</li>
            </>
          ) : (
            <>
              <li>Paste your raw JSON into the <strong className="text-neutral-200">Input</strong> area on the left.</li>
              <li>Select <strong className="text-neutral-200">Format</strong> to pretty-print, or <strong className="text-neutral-200">Minify</strong> to compress.</li>
              <li>When formatting, choose your preferred indentation width — 2 or 4 spaces.</li>
              <li>Click the button and the result appears in the <strong className="text-neutral-200">Output</strong> area on the right.</li>
              <li>If the JSON has a syntax error, you&apos;ll see a clear error message and the line number when detectable.</li>
              <li>Use <strong className="text-neutral-200">Copy</strong> to copy the result to your clipboard, or <strong className="text-neutral-200">Download .json</strong> to save it as a file.</li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '예시' : 'Example'}
        </h2>

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-400">
            {isKo ? '유효한 JSON — Format 전/후:' : 'Valid JSON — before and after Format:'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <pre className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 font-mono overflow-auto">
              {`{"user":{"name":"Alice","age":30},"active":true}`}
            </pre>
            <pre className="rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-neutral-300 font-mono overflow-auto">
              {`{\n  "user": {\n    "name": "Alice",\n    "age": 30\n  },\n  "active": true\n}`}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-400">
            {isKo ? '오류 예시 — trailing comma:' : 'Error example — trailing comma:'}
          </p>
          <pre className="rounded-lg border border-[#ef4444]/30 bg-red-950/10 px-4 py-3 text-sm text-red-300 font-mono">
            {`{"name": "Alice", "age": 30,}  ← trailing comma`}
          </pre>
          <p className="text-sm text-neutral-400">
            {isKo
              ? '마지막 항목 뒤의 쉼표는 JSON 명세에서 허용되지 않습니다. 이 포매터는 해당 위치를 명확히 알려줍니다.'
              : 'A comma after the last item is not allowed by the JSON spec. This formatter will clearly identify the issue.'}
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
