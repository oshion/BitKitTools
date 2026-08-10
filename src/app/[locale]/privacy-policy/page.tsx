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
      ? '개인정보처리방침 | BitKitTools'
      : 'Privacy Policy | BitKitTools',
    description: isKo
      ? 'BitKitTools의 개인정보처리방침. 쿠키, LocalStorage 사용 및 제3자 서비스에 대한 고지.'
      : 'BitKitTools Privacy Policy. Information about our use of cookies, LocalStorage, and third-party services.',
    alternates: {
      canonical: isKo ? '/ko/privacy-policy/' : '/privacy-policy/',
      languages: {
        en: '/privacy-policy/',
        ko: '/ko/privacy-policy/',
        'x-default': '/privacy-policy/',
      },
    },
  }
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isKo = locale === 'ko'

  if (isKo) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-4xl font-semibold text-white">개인정보처리방침</h1>
        <p className="text-sm text-neutral-400">최종 수정일: 2026년 7월 3일</p>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">1. 수집하는 정보</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools는 서버를 통해 개인정보를 직접 수집하지 않습니다. 다만, 서비스 품질 향상과 광고 운영을 위해 아래와 같은 정보가 브라우저 또는 제3자 서비스를 통해 처리될 수 있습니다.
          </p>
          <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
            <li><strong className="text-neutral-200">쿠키(Cookie):</strong> Google AdSense(광고 게재), Google Analytics 4(방문 통계), Microsoft Clarity(사용자 행동 분석) 등이 쿠키를 사용합니다. 쿠키 동의는 페이지 하단의 동의 배너를 통해 관리할 수 있습니다.</li>
            <li><strong className="text-neutral-200">LocalStorage:</strong> 최근 사용한 도구, 즐겨찾기, 마지막 입력값 등을 브라우저의 LocalStorage에 저장합니다. 이 데이터는 귀하의 기기에만 저장되며 서버로 전송되지 않습니다.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">2. 민감 카테고리 도구의 입력값 처리</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BAC 계산기, 아기 성장 백분위 계산기, 아기 수면 스케줄 계산기 등 민감한 정보를 다루는 도구에 입력하신 값(체중, 건강 정보 등)은 <strong className="text-neutral-200">귀하의 브라우저에서만 처리</strong>됩니다. 해당 데이터는 저희 서버나 제3자 서버로 전송되지 않습니다.
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            BAC 계산기의 입력값(성별, 체중, 음주량)은 개인 식별 가능성을 고려하여 LocalStorage에도 저장하지 않습니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">3. 제3자 서비스 목록</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">BitKitTools는 아래 제3자 서비스를 사용합니다. 각 서비스의 개인정보처리방침도 함께 확인하시기 바랍니다.</p>
          <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
            <li><strong className="text-neutral-200">Google AdSense:</strong> 맞춤형 광고 게재 — Google LLC</li>
            <li><strong className="text-neutral-200">Google Analytics 4 (GA4):</strong> 방문자 통계 분석 — Google LLC</li>
            <li><strong className="text-neutral-200">Google Search Console:</strong> 검색 성능 모니터링 — Google LLC</li>
            <li><strong className="text-neutral-200">Microsoft Clarity:</strong> 사용자 행동 분석(히트맵, 세션 녹화) — Microsoft Corporation</li>
            <li><strong className="text-neutral-200">Google 동의 관리 플랫폼(CMP):</strong> 쿠키 동의 관리 및 Google Consent Mode v2 연동 — Google LLC</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">4. 동의 철회 방법</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            페이지 하단 또는 화면 모서리에 표시되는 쿠키 동의 배너를 통해 언제든지 쿠키 동의를 변경하거나 철회할 수 있습니다. 동의를 철회하면 광고 개인화 및 분석 쿠키 사용이 중단됩니다.
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            브라우저 설정에서 직접 쿠키를 삭제하거나 차단할 수도 있습니다. 단, 쿠키를 차단하면 일부 기능이 정상적으로 동작하지 않을 수 있습니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">5. 문의</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            개인정보 처리에 관한 문의는 <Link href="/ko/contact" className="text-amber-400 hover:text-amber-300 underline">문의하기</Link> 페이지를 통해 연락해 주시기 바랍니다.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-4xl font-semibold text-white">Privacy Policy</h1>
      <p className="text-sm text-neutral-400">Last updated: July 3, 2026</p>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">1. Information We Collect</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          BitKitTools does not directly collect personal information through our servers. However, the following types of information may be processed through your browser or third-party services to improve service quality and serve advertising.
        </p>
        <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
          <li><strong className="text-neutral-200">Cookies:</strong> Services such as Google AdSense (advertising), Google Analytics 4 (visit statistics), and Microsoft Clarity (user behavior analysis) use cookies. You can manage cookie consent through the consent banner displayed on our site.</li>
          <li><strong className="text-neutral-200">LocalStorage:</strong> We store recently used tools, favorites, and last-entered values in your browser&apos;s LocalStorage. This data remains on your device only and is never transmitted to our servers.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">2. Sensitive Tool Input Data</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Data you enter into sensitive tools — such as the BAC Calculator, Baby Growth Percentile Calculator, and Baby Sleep Schedule Calculator — including body weight, health information, and similar inputs, is <strong className="text-neutral-200">processed entirely within your browser</strong>. This data is never transmitted to our servers or any third-party servers.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Input values in the BAC Calculator (sex, weight, alcohol intake) are not saved to LocalStorage due to their personally identifiable nature.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">3. Third-Party Services</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">BitKitTools uses the following third-party services. We encourage you to review each service&apos;s own privacy policy.</p>
        <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
          <li><strong className="text-neutral-200">Google AdSense:</strong> Personalized advertising — Google LLC</li>
          <li><strong className="text-neutral-200">Google Analytics 4 (GA4):</strong> Visitor statistics and analytics — Google LLC</li>
          <li><strong className="text-neutral-200">Google Search Console:</strong> Search performance monitoring — Google LLC</li>
          <li><strong className="text-neutral-200">Microsoft Clarity:</strong> User behavior analysis (heatmaps, session recordings) — Microsoft Corporation</li>
          <li><strong className="text-neutral-200">Google Consent Management Platform (CMP):</strong> Cookie consent management and Google Consent Mode v2 integration — Google LLC</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">4. Withdrawing Consent</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          You may change or withdraw your cookie consent at any time through the cookie consent banner displayed at the bottom of the page or in a corner of your screen. Withdrawing consent will stop the use of personalized advertising and analytics cookies.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          You may also delete or block cookies directly through your browser settings. Note that blocking cookies may prevent some features from working correctly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">5. Contact</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          For questions about how we handle personal information, please reach out via our <Link href="/contact" className="text-amber-400 hover:text-amber-300 underline">Contact</Link> page.
        </p>
      </section>
    </main>
  )
}
