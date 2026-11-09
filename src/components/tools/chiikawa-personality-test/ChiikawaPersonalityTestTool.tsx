'use client'

import { useState, useEffect, useRef } from 'react'
import { CHIIKAWA_INTRO, CHIIKAWA_QUESTIONS } from '@/lib/config/chiikawaQuestions'
import { getChiikawaCharacter } from '@/lib/config/chiikawaCharacters'
import { PERSONALITY_TYPE_LABELS } from '@/lib/config/personalityTypeLabels'
import { getChiikawaResult } from '@/lib/utils/chiikawaQuiz'
import type { ChiikawaResult } from '@/lib/utils/chiikawaQuiz'
import { withAndParticle } from '@/lib/utils/koreanParticle'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { localeHref } from '@/lib/utils/locale-href'
import type { Locale } from '@/i18n/routing'
import type { AnswerLetter, ChiikawaCharacterId } from '@/types/chiikawa-quiz'
import FanMadeNotice from './FanMadeNotice'

// ── Constants ─────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'

const TOTAL = CHIIKAWA_QUESTIONS.length
const LETTERS: readonly AnswerLetter[] = ['A', 'B', 'C', 'D']

// ── Copy ──────────────────────────────────────────────────────────────────────

const COPY = {
  en: {
    meta: '24 questions · about 3 minutes',
    start: 'Start the test',
    prev: '← Previous',
    questionLabel: (n: number) => `Question ${n} of ${TOTAL}`,
    matchIntro: 'Your Chiikawa match is…',
    officialLink: (name: string) => `See ${name} on the official site →`,
    myType: 'My personality type',
    fanType: (name: string) => `${name}'s personality type (fan-made)`,
    fanTypeNote: 'A fan-made guess, not official',
    analysis: 'Personality',
    strengths: 'Your strengths',
    cautions: 'Things to keep in mind',
    relationships: 'Relationship style',
    compatible: 'Friends you get along with',
    learnFrom: 'Friends you can learn from',
    top3: 'Your top 3 matches',
    restart: 'Take the test again',
    share: 'Share my result',
    copied: 'Link copied',
    shareTitle: 'Which Chiikawa Character Are You?',
    shareText: (name: string, type: string) =>
      `I'm most like ${name} among the Chiikawa friends! My personality type is ${type}. Which character are you?`,
  },
  ko: {
    meta: '24문항 · 약 3분',
    start: '테스트 시작하기',
    prev: '← 이전 문항',
    questionLabel: (n: number) => `${TOTAL}문항 중 ${n}번째`,
    matchIntro: '당신과 가장 닮은 치이카와 친구는?',
    officialLink: (name: string) => `공식 사이트에서 ${name} 보기 →`,
    myType: '나의 성격 유형',
    fanType: (name: string) => `${name}의 성격 유형(팬 설정)`,
    fanTypeNote: '공식 설정이 아닌 제작자 추정이에요',
    analysis: '성격 분석',
    strengths: '나의 강점',
    cautions: '주의하면 좋을 점',
    relationships: '인간관계 스타일',
    compatible: '나와 잘 맞는 캐릭터',
    learnFrom: '서로 배울 점이 있는 캐릭터',
    top3: '닮은 캐릭터 TOP 3',
    restart: '다시 테스트하기',
    share: '결과 공유하기',
    copied: '링크를 복사했어요',
    shareTitle: '나와 닮은 치이카와 친구는?',
    shareText: (name: string, type: string) =>
      `나는 치이카와 친구 중 ${withAndParticle(name)} 가장 닮았대! 내 성격 유형은 ${type}! 너는 어떤 캐릭터와 닮았을까?`,
  },
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'start' | 'quiz' | 'result'

type Props = {
  locale?: Locale
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, label }: { current: number; label: string }) {
  const pct = Math.round((current / TOTAL) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">
          {current} / {TOTAL}
        </span>
        <span className="text-sm text-neutral-500">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-pink-300 transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-label={label}
        />
      </div>
    </div>
  )
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-base text-neutral-300 leading-relaxed">
          <span className="mt-0.5 shrink-0 text-pink-300" aria-hidden="true">
            ✦
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function CharacterChips({ ids, locale }: { ids: readonly ChiikawaCharacterId[]; locale: Locale }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {ids.map((id) => {
        const character = getChiikawaCharacter(id)
        if (!character) return null
        return (
          <li
            key={id}
            className={`rounded-full border px-3 py-1.5 text-base ${character.cardClassName}`}
          >
            <span aria-hidden="true">{character.emoji}</span>{' '}
            <span className={character.nameClassName}>{character.name[locale]}</span>
          </li>
        )
      })}
    </ul>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChiikawaPersonalityTestTool({ locale = 'en' }: Props) {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)
  const inputEnteredRef = useRef(false)
  const copy = COPY[locale]

  const [phase, setPhase] = useState<Phase>('start')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Array<AnswerLetter | undefined>>([])
  const [result, setResult] = useState<ChiikawaResult | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion = CHIIKAWA_QUESTIONS[currentIndex]

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleStart() {
    setAnswers([])
    setCurrentIndex(0)
    setResult(null)
    setCopied(false)
    setPhase('quiz')
  }

  function handleAnswer(letter: AnswerLetter) {
    if (!inputEnteredRef.current) {
      inputEnteredRef.current = true
      sendEvent('input_enter')
    }

    const next = [...answers]
    next[currentIndex] = letter
    setAnswers(next)

    if (currentIndex + 1 < TOTAL) {
      setCurrentIndex(currentIndex + 1)
      return
    }

    const complete = next.filter((a): a is AnswerLetter => a !== undefined)
    if (complete.length !== TOTAL) return
    const quizResult = getChiikawaResult(complete)
    setResult(quizResult)
    setPhase('result')
    sendEvent('calculate', {
      character: quizResult.top[0]?.id ?? '',
      type: quizResult.personalityType,
    })
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  function handleRestart() {
    setAnswers([])
    setCurrentIndex(0)
    setResult(null)
    setCopied(false)
    setPhase('start')
  }

  async function handleShare() {
    const topId = result?.top[0]?.id
    const character = topId ? getChiikawaCharacter(topId) : undefined
    if (!result || !character) return

    const url = `${SITE_URL}${localeHref(locale, `/fun/chiikawa-personality-test/result/${character.id}`)}`
    const text = copy.shareText(character.name[locale], result.personalityType)
    sendEvent('share')

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: copy.shareTitle, text, url })
      } catch {
        // user cancelled (AbortError) — ignore
      }
      return
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`)
        setCopied(true)
      } catch {
        // clipboard permission denied — ignore
      }
    }
  }

  // ── Render: start ─────────────────────────────────────────────────────────

  if (phase === 'start') {
    return (
      <section className="rounded-2xl border border-pink-300/30 bg-[#141414] p-6 sm:p-8 space-y-5 animate-fade-in motion-reduce:animate-none">
        <h2 className="text-2xl font-semibold text-pink-100 leading-snug">
          {CHIIKAWA_INTRO.title[locale]}
        </h2>
        <p className="whitespace-pre-line text-base text-neutral-300 leading-relaxed">
          {CHIIKAWA_INTRO.body[locale]}
        </p>
        <p className="text-sm text-neutral-400">{copy.meta}</p>
        <button
          type="button"
          data-testid="start-button"
          onClick={handleStart}
          className="w-full sm:w-auto rounded-2xl bg-pink-200 px-6 py-4 text-base font-semibold text-neutral-900 hover:bg-pink-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          {copy.start}
        </button>
      </section>
    )
  }

  // ── Render: result ────────────────────────────────────────────────────────

  const topCharacter = result?.top[0] ? getChiikawaCharacter(result.top[0].id) : undefined

  if (phase === 'result' && result && topCharacter) {
    const name = topCharacter.name[locale]
    return (
      <div className="space-y-6 animate-fade-in motion-reduce:animate-none">
        {/* 1. 캐릭터 카드 */}
        <section
          data-testid="result-card"
          className={`rounded-2xl border p-6 sm:p-8 text-center space-y-3 ${topCharacter.cardClassName}`}
        >
          <div className="text-7xl sm:text-8xl select-none" aria-hidden="true">
            {topCharacter.emoji}
          </div>
          <p className="text-base text-neutral-300">{copy.matchIntro}</p>
          <h2 className={`text-4xl sm:text-5xl font-bold ${topCharacter.nameClassName}`}>{name}</h2>
          <a
            href={topCharacter.officialUrl}
            target="_blank"
            rel="noopener"
            className="inline-block text-sm text-neutral-300 underline underline-offset-2 hover:text-white"
          >
            {copy.officialLink(name)}
          </a>
        </section>

        {/* 2·3. 성격 유형 — 나의 유형과 팬 설정 유형을 시각적으로 분리 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <section
            data-testid="my-type"
            className="rounded-2xl border border-teal-300/40 bg-teal-300/10 p-5 space-y-1"
          >
            <h3 className="text-base font-medium text-teal-200">{copy.myType}</h3>
            <p className="text-3xl font-bold text-white tracking-wider">{result.personalityType}</p>
            <p className="text-base text-neutral-300">
              {PERSONALITY_TYPE_LABELS[result.personalityType][locale]}
            </p>
          </section>
          <section
            data-testid="fan-type"
            className="rounded-2xl border border-dashed border-neutral-700 bg-[#141414] p-5 space-y-1"
          >
            <h3 className="text-base font-medium text-neutral-400">{copy.fanType(name)}</h3>
            <p className="text-2xl font-semibold text-neutral-200 tracking-wider">{topCharacter.fanType}</p>
            <p className="text-sm text-neutral-500">{copy.fanTypeNote}</p>
          </section>
        </div>

        {/* 4. 소개·분석 */}
        <section className="rounded-2xl border border-neutral-800 bg-[#141414] p-5 sm:p-6 space-y-5">
          <p className="text-xl font-semibold text-sky-100 leading-snug">{topCharacter.tagline[locale]}</p>
          <div className="space-y-2">
            <h3 className="text-base font-medium text-neutral-400">{copy.analysis}</h3>
            <p className="text-base text-neutral-300 leading-relaxed">{topCharacter.coreTraits[locale]}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium text-neutral-400">{copy.strengths}</h3>
            <BulletList items={topCharacter.strengths[locale]} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium text-neutral-400">{copy.cautions}</h3>
            <BulletList items={topCharacter.cautions[locale]} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium text-neutral-400">{copy.relationships}</h3>
            <BulletList items={topCharacter.relationships[locale]} />
          </div>
        </section>

        {/* 5. 궁합 */}
        <section className="rounded-2xl border border-neutral-800 bg-[#141414] p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-medium text-neutral-400">{copy.compatible}</h3>
            <CharacterChips ids={topCharacter.compatibleIds} locale={locale} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-medium text-neutral-400">{copy.learnFrom}</h3>
            <CharacterChips ids={topCharacter.learnFromIds} locale={locale} />
          </div>
        </section>

        {/* 6. TOP 3 */}
        <section className="rounded-2xl border border-neutral-800 bg-[#141414] p-5 sm:p-6 space-y-3">
          <h3 className="text-base font-medium text-neutral-400">{copy.top3}</h3>
          <ol data-testid="top3" className="space-y-2">
            {result.top.map((match, i) => {
              const character = getChiikawaCharacter(match.id)
              if (!character) return null
              return (
                <li
                  key={match.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3"
                >
                  <span className="w-6 text-base font-semibold text-neutral-500">{i + 1}</span>
                  <span className="text-2xl" aria-hidden="true">
                    {character.emoji}
                  </span>
                  <span className={`flex-1 text-base font-medium ${character.nameClassName}`}>
                    {character.name[locale]}
                  </span>
                  <span className="text-base font-semibold text-[#f59e0b]">{match.similarity}%</span>
                </li>
              )
            })}
          </ol>
        </section>

        {/* 7. 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            data-testid="share-button"
            onClick={handleShare}
            className="rounded-2xl bg-sky-200 px-5 py-3.5 text-base font-semibold text-neutral-900 hover:bg-sky-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {copy.share}
          </button>
          <button
            type="button"
            data-testid="restart-button"
            onClick={handleRestart}
            className="rounded-2xl border border-neutral-700 bg-neutral-900 px-5 py-3.5 text-base text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
          >
            {copy.restart}
          </button>
        </div>
        {copied && (
          <p role="status" className="text-sm text-teal-200">
            {copy.copied}
          </p>
        )}

        {/* 8. 팬메이드 고지 */}
        <FanMadeNotice locale={locale} />
      </div>
    )
  }

  // ── Render: quiz ──────────────────────────────────────────────────────────

  if (!currentQuestion) return null
  const selected = answers[currentIndex]

  return (
    <div className="space-y-5">
      <ProgressBar current={currentIndex + 1} label={copy.questionLabel(currentIndex + 1)} />

      <section
        key={currentIndex}
        className="rounded-2xl border border-pink-300/30 bg-[#141414] p-5 sm:p-6 space-y-5 animate-fade-in motion-reduce:animate-none"
      >
        <p className="text-sm font-medium text-pink-200">Q{currentQuestion.number}</p>
        <h2 className="text-xl font-semibold text-white leading-snug">{currentQuestion.text[locale]}</h2>
        <div className="flex flex-col gap-3">
          {LETTERS.map((letter) => {
            const isSelected = selected === letter
            return (
              <button
                key={letter}
                type="button"
                data-testid={`option-${letter}`}
                aria-pressed={isSelected}
                onClick={() => handleAnswer(letter)}
                className={`w-full rounded-2xl border px-4 py-4 text-left text-base leading-relaxed transition-colors focus:outline-none focus:ring-2 focus:ring-sky-300 ${
                  isSelected
                    ? 'border-teal-300/70 bg-teal-300/15 text-white'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-sky-300/50 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {currentQuestion.options[letter][locale]}
              </button>
            )
          })}
        </div>
      </section>

      {currentIndex > 0 && (
        <button
          type="button"
          data-testid="prev-button"
          onClick={handlePrev}
          className="text-base text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          {copy.prev}
        </button>
      )}
    </div>
  )
}
