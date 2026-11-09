import { CHIIKAWA_OFFICIAL_SITE } from '@/lib/config/chiikawaCharacters'

// 팬메이드·비공식 고지 — 스펙 "안내 문구". 툴 결과 화면, 툴 페이지 본문, 결과 공유 페이지에서 공통으로 쓴다.
// "MBTI®" 표기는 이 고지 문장에서만 허용한다.

type Props = {
  locale: 'en' | 'ko'
}

const COPY = {
  ko: {
    label: '안내',
    lines: [
      '본 테스트는 치이카와 캐릭터를 소재로 한 비공식 팬메이드 성격 테스트입니다.',
      '캐릭터별 성격 유형과 해석은 공식 설정이 아닌 제작자의 창작적 추정입니다.',
      '원작자 및 공식 라이선스 보유사와 무관하며, 공식 테스트가 아닙니다.',
      '이 테스트는 MBTI®를 포함한 공인 심리검사와 무관하며, 진단 도구가 아닙니다.',
    ],
    link: '치이카와 공식 사이트 →',
  },
  en: {
    label: 'Notice',
    lines: [
      'This is an unofficial, fan-made personality quiz inspired by the Chiikawa characters.',
      "Each character's personality type and description is the creator's own imaginative guess, not official canon.",
      'This quiz is not affiliated with the original creator or the official licensors, and it is not an official quiz.',
      'This quiz is not affiliated with MBTI® or any other licensed psychological assessment and is not a diagnostic tool.',
    ],
    link: 'Official Chiikawa site →',
  },
} as const

export default function FanMadeNotice({ locale }: Props) {
  const copy = COPY[locale]
  return (
    <aside
      aria-label={copy.label}
      data-testid="fan-made-notice"
      className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 space-y-2"
    >
      <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-500 leading-relaxed">
        {copy.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <a
        href={CHIIKAWA_OFFICIAL_SITE}
        target="_blank"
        rel="noopener"
        className="inline-block text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-200"
      >
        {copy.link}
      </a>
    </aside>
  )
}
