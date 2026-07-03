import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isKo = locale === 'ko'

  return {
    title: isKo
      ? 'BitKitTools 소개'
      : 'About BitKitTools',
    description: isKo
      ? '개발자, 여행자, 맥주 애호가, 육아 부모를 위한 무료 계산기 모음 서비스 BitKitTools를 소개합니다.'
      : 'BitKitTools is a free collection of micro-calculators for developers, travelers, beer lovers, and parents.',
    alternates: {
      canonical: isKo ? '/ko/about' : '/about',
      languages: {
        en: '/about',
        ko: '/ko/about',
        'x-default': '/about',
      },
    },
  }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isKo = locale === 'ko'

  if (isKo) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-4xl font-semibold text-white">BitKitTools 소개</h1>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">무엇을 제공하나요?</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools는 <strong className="text-neutral-200">개발자, 여행자, 맥주 애호가, 육아 부모</strong>를 위해 만들어진 무료 마이크로 계산기 모음입니다. 구글 검색으로 필요한 도구를 바로 찾아 로그인 없이 즉시 사용할 수 있도록 설계했습니다.
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            모든 계산은 귀하의 브라우저에서 즉시 처리됩니다. 별도의 서버나 데이터베이스가 없으며, 민감한 입력값이 외부로 전송되지 않습니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">카테고리 구성</h2>

          <div className="space-y-6">
            <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
              <h3 className="text-base font-medium text-white">개발자 도구</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                JSON 포매터 및 유효성 검사기, 비밀번호 생성기 등 개발자가 일상에서 자주 쓰는 유틸리티를 빠르게 실행할 수 있습니다.
              </p>
            </div>

            <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
              <h3 className="text-base font-medium text-white">여행 도구</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                EU261 등 규정에 따른 항공편 지연 보상 계산기, 국가별 비자 요건 체커를 제공합니다. 여행 준비와 문제 해결에 실질적인 도움을 드립니다.
              </p>
            </div>

            <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
              <h3 className="text-base font-medium text-white">맥주 도구</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Widmark 공식 기반 혈중 알코올 농도(BAC) 계산기와 홈브루 레시피 도수(ABV)/희석 계산기를 제공합니다. BAC 계산기는 음주운전 판단 용도로 사용할 수 없으며, 참고용으로만 제공됩니다.
              </p>
            </div>

            <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
              <h3 className="text-base font-medium text-white">육아 도구</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                WHO/CDC 기준 아기 성장 백분위 계산기와 연령별 낮잠·취침 스케줄 계산기를 제공합니다. 모든 결과는 참고용이며 소아과 전문의 상담을 권장합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">운영 방침</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools는 Google AdSense 광고 수익으로 운영됩니다. 광고는 레이아웃의 지정된 위치에 배치되며, 콘텐츠 품질에 영향을 주지 않도록 관리됩니다.
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            의료·법률·재무 관련 도구는 출처(WHO, CDC, EU261 등)를 명시하고, 결과에 단정적 판단이 포함되지 않도록 신중하게 설계했습니다.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-4xl font-semibold text-white">About BitKitTools</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">What We Offer</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          BitKitTools is a free collection of micro-calculators built for <strong className="text-neutral-200">developers, travelers, beer lovers, and parents</strong>. Every tool is designed so you can find what you need through a quick search and start using it immediately — no login required.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          All calculations run instantly in your browser. We have no server-side processing or database, and sensitive inputs are never transmitted anywhere.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">Tool Categories</h2>

        <div className="space-y-6">
          <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
            <h3 className="text-base font-medium text-white">Developer Tools</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Quickly run everyday utilities like a JSON Formatter & Validator and a secure Password Generator — tools that developers reach for constantly.
            </p>
          </div>

          <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
            <h3 className="text-base font-medium text-white">Travel Tools</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Calculate potential flight delay compensation under EU261 and other regulations, or check visa requirements for country combinations — practical help for trip planning and problem-solving.
            </p>
          </div>

          <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
            <h3 className="text-base font-medium text-white">Beer Tools</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Estimate blood alcohol concentration (BAC) using the Widmark formula, or calculate ABV and dilution ratios for homebrew recipes. The BAC Calculator is for informational reference only and must not be used to determine whether it is safe to drive.
            </p>
          </div>

          <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6 space-y-2">
            <h3 className="text-base font-medium text-white">Baby Tools</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Check your baby&apos;s growth percentile against WHO and CDC standards, or plan daily nap and bedtime schedules by age. All results are for reference only — always consult a pediatrician.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">How We Operate</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          BitKitTools is funded by Google AdSense advertising. Ads are placed in designated layout slots and are managed so they do not interfere with content quality.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Tools covering medical, legal, or financial topics cite their data sources (WHO, CDC, EU261, etc.) and are carefully designed to avoid making definitive judgments in their results.
        </p>
      </section>
    </main>
  )
}
