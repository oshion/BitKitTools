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
import JsonToSqlTool from '@/components/tools/json-to-sql/JsonToSqlTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'json-to-sql'
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
      images: [{ url: `${SITE_URL}/og/default-${safeLocale}.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function JsonToSqlPage({ params }: Props) {
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
      <JsonToSqlTool />

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
            MySQL/MariaDB는 백틱(`)으로, PostgreSQL과 Oracle은 큰따옴표(&quot;)로, MSSQL은 대괄호([])로
            식별자를 감싸 방언별 올바른 구문을 생성합니다. Boolean 값은 MySQL/PostgreSQL에서
            TRUE/FALSE, Oracle과 MSSQL에서 1/0으로 처리됩니다. 중첩 객체와 배열은 JSON 전용
            컬럼 타입(JSONB, JSON, CLOB, NVARCHAR(MAX))에 문자열로 저장됩니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            The converter applies dialect-correct identifier quoting — backticks for MySQL/MariaDB,
            double quotes for PostgreSQL and Oracle, and square brackets for MSSQL. Booleans are
            rendered as TRUE/FALSE for MySQL and PostgreSQL, and as 1/0 for Oracle and MSSQL.
            Nested objects and arrays are stored as serialized JSON strings in the appropriate
            JSON column type (JSONB, JSON, CLOB, or NVARCHAR(MAX)).
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
                <strong className="text-neutral-200">JSON을 붙여넣습니다</strong> — 단일 객체나
                객체 배열을 입력 창에 붙여넣으세요.
              </li>
              <li>
                <strong className="text-neutral-200">SQL 방언을 선택합니다</strong> — MySQL,
                PostgreSQL, Oracle, MSSQL 중 사용 중인 데이터베이스에 맞게 선택하세요.
              </li>
              <li>
                <strong className="text-neutral-200">테이블 이름을 입력합니다</strong> — 생성할
                SQL의 테이블명을 적습니다.
              </li>
              <li>
                <strong className="text-neutral-200">출력 모드를 선택합니다</strong> — INSERT만,
                CREATE TABLE + INSERT, 또는 CREATE TABLE만 중 원하는 방식을 고릅니다.
              </li>
              <li>
                <strong className="text-neutral-200">변환을 클릭합니다</strong> — 생성된 SQL을
                복사해 사용하세요.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Paste your JSON</strong> — enter a single
                object or an array of objects into the input field.
              </li>
              <li>
                <strong className="text-neutral-200">Select your SQL dialect</strong> — choose
                MySQL, PostgreSQL, Oracle, or MSSQL to match your database.
              </li>
              <li>
                <strong className="text-neutral-200">Enter a table name</strong> — provide the
                target table name for the generated SQL.
              </li>
              <li>
                <strong className="text-neutral-200">Choose an output mode</strong> — INSERT only,
                CREATE TABLE + INSERT, or CREATE TABLE only.
              </li>
              <li>
                <strong className="text-neutral-200">Click Convert</strong> — copy the generated
                SQL and use it directly in your database client.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '변환 예시' : 'Example'}
        </h2>
        <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              {isKo ? '입력 JSON' : 'Input JSON'}
            </p>
            <pre className="text-sm font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap">
{`[
  { "id": 1, "name": "Alice", "active": true },
  { "id": 2, "name": "Bob",   "active": false }
]`}
            </pre>
          </div>
          <div className="space-y-1 border-t border-neutral-800 pt-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              {isKo ? 'PostgreSQL 출력 (INSERT only)' : 'PostgreSQL output (INSERT only)'}
            </p>
            <pre className="text-sm font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap">
{`INSERT INTO "users" ("id", "name", "active") VALUES (1, 'Alice', TRUE);
INSERT INTO "users" ("id", "name", "active") VALUES (2, 'Bob', FALSE);`}
            </pre>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-800 pt-3">
            {isKo
              ? 'Oracle 방언을 선택하고 배치 옵션을 켜면 INSERT ALL ... SELECT * FROM dual 구문이 생성됩니다.'
              : 'Selecting Oracle dialect with batching enabled generates INSERT ALL … SELECT * FROM dual syntax instead.'}
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

      {/* Disclaimer — disclaimerType is 'none', so nothing renders */}
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
