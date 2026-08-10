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
      ? '문의하기 | BitKitTools'
      : 'Contact | BitKitTools',
    description: isKo
      ? 'BitKitTools에 문의하기. 오류 신고, 기능 제안, 광고 문의 등.'
      : 'Contact BitKitTools. Report issues, suggest features, or inquire about advertising.',
    alternates: {
      canonical: isKo ? '/ko/contact/' : '/contact/',
      languages: {
        en: '/contact/',
        ko: '/ko/contact/',
        'x-default': '/contact/',
      },
    },
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const isKo = locale === 'ko'

  const contactEmail = 'oshion89@gmail.com'

  if (isKo) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <h1 className="text-4xl font-semibold text-white">문의하기</h1>

        <section className="space-y-4">
          <p className="text-sm text-neutral-300 leading-relaxed">
            BitKitTools에 대한 문의, 오류 신고, 기능 제안, 또는 광고 관련 문의는 아래 이메일로 연락해 주시기 바랍니다.
          </p>

          <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6">
            <p className="text-sm text-neutral-400 mb-2">이메일</p>
            <a
              href={`mailto:${contactEmail}`}
              className="text-amber-400 hover:text-amber-300 underline text-base font-medium"
            >
              {contactEmail}
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-white">문의 유형</h2>
          <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
            <li>계산 결과 오류 신고</li>
            <li>새로운 도구 제안</li>
            <li>번역 오류 또는 개선 의견</li>
            <li>광고 문의</li>
            <li>개인정보 관련 요청</li>
          </ul>
        </section>

        <section className="space-y-4">
          <p className="text-sm text-neutral-400 leading-relaxed">
            이메일 문의에 가능한 빠르게 답변드리겠습니다. 통상적인 응답 시간은 2~5 영업일입니다.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-4xl font-semibold text-white">Contact</h1>

      <section className="space-y-4">
        <p className="text-sm text-neutral-300 leading-relaxed">
          For questions, bug reports, feature suggestions, or advertising inquiries, please reach out by email.
        </p>

        <div className="rounded-lg bg-[#141414] border border-neutral-800 p-6">
          <p className="text-sm text-neutral-400 mb-2">Email</p>
          <a
            href={`mailto:${contactEmail}`}
            className="text-amber-400 hover:text-amber-300 underline text-base font-medium"
          >
            {contactEmail}
          </a>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white">Types of Inquiries</h2>
        <ul className="list-disc list-inside text-sm text-neutral-300 leading-relaxed space-y-2">
          <li>Reporting calculation errors</li>
          <li>Suggesting new tools</li>
          <li>Translation corrections or improvement feedback</li>
          <li>Advertising inquiries</li>
          <li>Privacy-related requests</li>
        </ul>
      </section>

      <section className="space-y-4">
        <p className="text-sm text-neutral-400 leading-relaxed">
          We aim to respond to all emails as promptly as possible. Typical response time is 2–5 business days.
        </p>
      </section>
    </main>
  )
}
