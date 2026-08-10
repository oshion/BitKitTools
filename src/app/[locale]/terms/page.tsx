import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isKo = locale === 'ko'

  return {
    title: isKo
      ? '이용약관 | BitKitTools'
      : 'Terms of Use | BitKitTools',
    description: isKo
      ? 'BitKitTools 이용약관. 계산 결과의 정확성 미보장 및 면책 범위.'
      : 'BitKitTools Terms of Use. Disclaimer of accuracy for calculation results and scope of liability.',
    alternates: {
      canonical: isKo ? '/ko/terms/' : '/terms/',
      languages: {
        en: '/terms/',
        ko: '/ko/terms/',
        'x-default': '/terms/',
      },
    },
  }
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isKo = locale === 'ko'

  if (isKo) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-4xl font-semibold text-white">이용약관</h1>
        <p className="text-sm text-neutral-400">최종 수정일: 2026년 7월 3일</p>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">1. 서비스 이용 동의</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools(이하 &ldquo;서비스&rdquo;)를 이용함으로써 귀하는 본 이용약관에 동의하는 것으로 간주합니다. 동의하지 않을 경우 서비스를 이용하지 마시기 바랍니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">2. 계산 결과의 정확성 미보장</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools에서 제공하는 모든 계산기와 유틸리티 도구의 결과는 <strong className="text-neutral-200">참고용 추정치</strong>에 불과합니다. 당사는 계산 결과의 정확성, 완전성, 최신성을 보장하지 않습니다.
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            특히 아래 도구는 전문가의 판단을 대체할 수 없습니다:
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
            <li>BAC 계산기 — 음주운전 가능 여부를 판단하는 용도로 사용할 수 없습니다.</li>
            <li>아기 성장 백분위 계산기 — 의학적 진단을 대체하지 않습니다. 소아과 전문의와 상담하시기 바랍니다.</li>
            <li>아기 수면 스케줄 계산기 — 일반적인 가이드라인이며 개별 아기의 상태에 따라 다를 수 있습니다.</li>
            <li>항공편 지연 보상 계산기 — 실제 보상 여부는 항공사 및 관할 규정을 직접 확인해야 합니다.</li>
            <li>비자 요건 체커 — 제공되는 정보는 정적 데이터 기반으로, 최신 규정은 반드시 관할 영사관에서 재확인해야 합니다.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">3. 면책 조항</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            당사는 서비스 이용으로 인해 발생하는 어떠한 손해(직접적·간접적·우발적·결과적 손해 포함)에 대해서도 책임을 지지 않습니다. 서비스는 &ldquo;있는 그대로(as-is)&rdquo; 제공되며, 명시적·묵시적 어떠한 보증도 하지 않습니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">4. 지식재산권</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools의 콘텐츠, 디자인, 소스 코드는 당사에 귀속됩니다. 서비스 내 콘텐츠를 허가 없이 상업적 목적으로 복제·배포·변경하는 행위를 금지합니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">5. 약관 변경</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            당사는 필요에 따라 본 약관을 변경할 수 있습니다. 변경 사항은 본 페이지에 게시되며, 게시 후 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 간주합니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">6. 문의</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            이용약관에 관한 문의는 <Link href="/ko/contact" className="text-amber-400 hover:text-amber-300 underline">문의하기</Link> 페이지를 통해 연락해 주시기 바랍니다.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-4xl font-semibold text-white">Terms of Use</h1>
      <p className="text-sm text-neutral-400">Last updated: July 3, 2026</p>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">1. Acceptance of Terms</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          By using BitKitTools (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">2. No Warranty of Accuracy</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          All results produced by the calculators and utility tools on BitKitTools are <strong className="text-neutral-200">estimates provided for informational purposes only</strong>. We make no representations or warranties regarding the accuracy, completeness, or timeliness of any calculation result.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          In particular, the following tools cannot substitute for professional judgment:
        </p>
        <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
          <li>BAC Calculator — must not be used to determine whether it is safe or legal to drive.</li>
          <li>Baby Growth Percentile Calculator — does not constitute a medical diagnosis. Consult a pediatrician.</li>
          <li>Baby Sleep Schedule Calculator — provides general guidelines only; individual results may vary.</li>
          <li>Flight Delay Compensation Calculator — actual compensation eligibility must be confirmed with the airline and applicable regulations.</li>
          <li>Visa Requirement Checker — information is based on static data; always verify with the relevant embassy or consulate for the latest requirements.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">3. Disclaimer of Liability</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          To the fullest extent permitted by law, BitKitTools shall not be liable for any damages — including direct, indirect, incidental, or consequential damages — arising from your use of or reliance on the Service. The Service is provided &ldquo;as is&rdquo; without any express or implied warranties.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">4. Intellectual Property</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          All content, design, and source code on BitKitTools are owned by us. Reproducing, distributing, or modifying content from the Service for commercial purposes without prior written permission is prohibited.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">5. Changes to Terms</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          We may update these Terms from time to time. Changes will be posted on this page. Your continued use of the Service after changes are posted constitutes your acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">6. Contact</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          For questions about these Terms, please reach out via our <Link href="/contact" className="text-amber-400 hover:text-amber-300 underline">Contact</Link> page.
        </p>
      </section>
    </main>
  )
}
