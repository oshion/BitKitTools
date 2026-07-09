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
import SleepScheduleTool from '@/components/tools/sleep-schedule/SleepScheduleTool'

type Props = {
  params: Promise<{ locale: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'
const SLUG = 'sleep-schedule'
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

export default async function SleepSchedulePage({ params }: Props) {
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
      <SleepScheduleTool />

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
            이 계산기는 연령별 권장 웨이크 윈도우(깨어있는 시간)와 낮잠 시간을 기반으로 오늘의
            낮잠 일정과 취침 시각을 제안합니다. 미국 수면의학회(AASM), 국립수면재단(NSF) 등
            전문 기관의 일반 권고사항을 참고해 구성되었으며, 개별 아기의 특성에 따라 실제 필요한
            수면 패턴은 다를 수 있습니다.
          </p>
        ) : (
          <p className="text-sm text-neutral-300 leading-relaxed">
            This calculator suggests a nap schedule and bedtime based on age-appropriate
            wake windows and nap durations, drawing on general recommendations from sources
            such as the American Academy of Sleep Medicine (AASM) and the National Sleep
            Foundation (NSF). Every baby is unique — the schedule is a starting point,
            not a prescription.
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
                <strong className="text-neutral-200">아기의 개월수(0–24개월)를 입력합니다</strong> —
                연령 구간에 따라 권장 낮잠 횟수와 웨이크 윈도우가 자동으로 결정됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">오늘 기상 시각을 입력합니다</strong> —
                첫 번째 낮잠 시간은 기상 시각 + 웨이크 윈도우로 계산됩니다.
              </li>
              <li>
                <strong className="text-neutral-200">(선택) 마지막 낮잠 종료 시각을 입력합니다</strong> —
                이미 낮잠을 자고 난 경우, 남은 낮잠과 취침 시각을 재계산할 수 있습니다.
              </li>
              <li>
                <strong className="text-neutral-200">수면 일정 계산 버튼을 누릅니다</strong> —
                오늘의 낮잠 타임라인, 각 낮잠 시작/종료 시각, 권장 취침 시각이 표시됩니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-neutral-200">Enter your baby&apos;s age in months (0–24)</strong> —
                the recommended number of naps and wake windows are automatically set based on
                the age range.
              </li>
              <li>
                <strong className="text-neutral-200">Enter today&apos;s wake-up time</strong> —
                the first nap is scheduled at wake-up time + the age-appropriate wake window.
              </li>
              <li>
                <strong className="text-neutral-200">Optionally, enter when the last nap ended</strong> —
                if your baby has already napped, the remaining naps and bedtime are recalculated
                from that point forward.
              </li>
              <li>
                <strong className="text-neutral-200">Click Calculate Sleep Schedule</strong> —
                today&apos;s nap timeline, individual nap start/end times, and recommended bedtime
                are displayed.
              </li>
            </>
          )}
        </ol>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">
          {isKo ? '연령별 낮잠 패턴 비교' : 'Example: Nap Patterns by Age'}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-3 pr-4 text-neutral-400 font-medium">
                  {isKo ? '연령' : 'Age'}
                </th>
                <th className="text-left py-3 pr-4 text-neutral-400 font-medium">
                  {isKo ? '낮잠 횟수' : 'Naps/day'}
                </th>
                <th className="text-left py-3 pr-4 text-neutral-400 font-medium">
                  {isKo ? '웨이크 윈도우' : 'Wake window'}
                </th>
                <th className="text-left py-3 text-neutral-400 font-medium">
                  {isKo ? '낮잠 시간' : 'Nap duration'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {[
                { age: isKo ? '0–2개월' : '0–2 months', naps: isKo ? '5회' : '5', wake: isKo ? '약 1시간' : '~1 hr', dur: isKo ? '약 45분' : '~45 min' },
                { age: isKo ? '3–5개월' : '3–5 months', naps: isKo ? '4회' : '4', wake: isKo ? '약 1.5시간' : '~1.5 hr', dur: isKo ? '약 1시간' : '~1 hr' },
                { age: isKo ? '6–8개월' : '6–8 months', naps: isKo ? '3회' : '3', wake: isKo ? '약 2시간' : '~2 hr', dur: isKo ? '약 1.25시간' : '~1.25 hr' },
                { age: isKo ? '9–12개월' : '9–12 months', naps: isKo ? '2회' : '2', wake: isKo ? '약 3시간' : '~3 hr', dur: isKo ? '약 1.5시간' : '~1.5 hr' },
                { age: isKo ? '13–17개월' : '13–17 months', naps: isKo ? '1–2회' : '1–2', wake: isKo ? '약 3.5시간' : '~3.5 hr', dur: isKo ? '약 1.5시간' : '~1.5 hr' },
                { age: isKo ? '18–24개월' : '18–24 months', naps: isKo ? '1회' : '1', wake: isKo ? '약 4시간' : '~4 hr', dur: isKo ? '약 1.5시간' : '~1.5 hr' },
              ].map((row) => (
                <tr key={row.age}>
                  <td className="py-3 pr-4 text-neutral-200">{row.age}</td>
                  <td className="py-3 pr-4 text-[#f59e0b] font-medium tabular-nums">{row.naps}</td>
                  <td className="py-3 pr-4 text-neutral-300">{row.wake}</td>
                  <td className="py-3 text-neutral-300">{row.dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          {isKo
            ? '출처: 미국 수면의학회(AASM), 국립수면재단(NSF) 일반 권고사항 및 소아수면 전문 문헌 기반. 개인차가 있으므로 참고용으로만 사용하세요.'
            : 'Based on general recommendations from the American Academy of Sleep Medicine (AASM), the National Sleep Foundation (NSF), and paediatric sleep literature. Individual variation is significant — use as a reference only.'}
        </p>
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
