'use client'

import { useState, useEffect, useRef } from 'react'
import { getQuestionsForAgeBand } from '@/lib/config/temperamentQuestions'
import type { AgeBand } from '@/lib/config/temperamentQuestions'
import { getPersonaByCode } from '@/lib/config/temperamentPersonas'
import { scoreQuiz, getPersonaCode } from '@/lib/utils/temperamentQuiz'
import type { QuizAnswer } from '@/lib/utils/temperamentQuiz'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { localeHref } from '@/lib/utils/locale-href'
import type { Locale } from '@/i18n/routing'

// ── Constants ─────────────────────────────────────────────────────────────────

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bitkittools.com'

const LOADING_DELAY_MS = 650

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'age-select' | 'quiz' | 'loading' | 'result'

type AgeBandOption =
  | { type: 'too-young' }
  | { type: 'band'; band: AgeBand }

type Props = {
  locale?: Locale
}

// ── Age band definitions ───────────────────────────────────────────────────────

const AGE_BAND_OPTIONS: Array<{
  label: { en: string; ko: string }
  value: AgeBandOption
}> = [
  {
    label: { en: '0–3 months', ko: '0–3개월' },
    value: { type: 'too-young' },
  },
  {
    label: { en: '4–12 months', ko: '4–12개월' },
    value: { type: 'band', band: 'infant' },
  },
  {
    label: { en: '13–36 months', ko: '13–36개월' },
    value: { type: 'band', band: 'toddler' },
  },
  {
    label: { en: '37–84 months (3–7 yrs)', ko: '37–84개월 (3–7세)' },
    value: { type: 'band', band: 'preschooler' },
  },
]

// ── Confetti particles ────────────────────────────────────────────────────────

const CONFETTI_EMOJIS = ['🎉', '✨', '🌟', '💫', '🎊', '⭐', '🌈', '🎈']

type ConfettiParticle = {
  id: number
  emoji: string
  left: string
  animDuration: string
  animDelay: string
  fontSize: string
}

function generateConfetti(): ConfettiParticle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length] ?? '✨',
    left: `${8 + (i * 7.5) % 84}%`,
    animDuration: `${0.8 + (i % 5) * 0.25}s`,
    animDelay: `${(i % 4) * 0.15}s`,
    fontSize: `${1 + (i % 3) * 0.4}rem`,
  }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfettiOverlay({ reduced }: { reduced: boolean }) {
  if (reduced) return null
  const particles = generateConfetti()
  return (
    <>
      <style>{`
        @keyframes confetti-float {
          0% { opacity: 1; transform: translateY(20px) scale(0.5) rotate(0deg); }
          60% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-120px) scale(1.2) rotate(30deg); }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              bottom: '20%',
              left: p.left,
              fontSize: p.fontSize,
              animation: `confetti-float ${p.animDuration} ease-out ${p.animDelay} both`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </>
  )
}

function LoadingAnimation({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-2xl text-neutral-400">분석 중…</span>
      </div>
    )
  }
  return (
    <>
      <style>{`
        @keyframes bounce-loading {
          0%, 100% { transform: translateY(0); }
          45% { transform: translateY(-20px); }
          55% { transform: translateY(-20px); }
        }
        @keyframes squish {
          0%, 100% { transform: scaleX(1) scaleY(1); }
          45%, 55% { transform: scaleX(1) scaleY(1); }
          50% { transform: scaleX(1.15) scaleY(0.85); }
          90% { transform: scaleX(1) scaleY(1); }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div
          style={{ animation: 'bounce-loading 0.9s ease-in-out infinite' }}
          className="text-6xl select-none"
          aria-hidden="true"
        >
          🍼
        </div>
        <p className="text-sm text-neutral-400">
          Analysing your little one&apos;s temperament…
        </p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-neutral-600"
              style={{
                animation: `bounce-loading 0.9s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          {current} / {total}
        </span>
        <span className="text-xs text-neutral-600">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#f59e0b] transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Question ${current} of ${total}`}
        />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TemperamentQuizTool({ locale = 'en' }: Props) {
  const { sendEvent } = useAnalyticsEvent()
  const hasFiredOpenRef = useRef(false)

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('age-select')
  const [tooYoung, setTooYoung] = useState(false)
  const [selectedAgeBand, setSelectedAgeBand] = useState<AgeBand | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [personaCode, setPersonaCode] = useState<string | null>(null)
  /** Controls slide-out/fade animation between questions */
  const [questionVisible, setQuestionVisible] = useState(true)

  // ── Analytics: tool_open ──────────────────────────────────────────────────
  useEffect(() => {
    if (!hasFiredOpenRef.current) {
      hasFiredOpenRef.current = true
      sendEvent('tool_open')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const questions = selectedAgeBand ? getQuestionsForAgeBand(selectedAgeBand) : []
  const currentQuestion = questions[currentIndex]

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAgeBandSelect(option: AgeBandOption) {
    if (option.type === 'too-young') {
      setTooYoung(true)
      setSelectedAgeBand(null)
      return
    }
    setTooYoung(false)
    setSelectedAgeBand(option.band)
    setCurrentIndex(0)
    setAnswers([])
    setPersonaCode(null)
    setQuestionVisible(true)
    setPhase('quiz')
  }

  function handleAnswer(pole: string) {
    if (!currentQuestion) return
    if (!questionVisible) return // prevent double-tap

    const newAnswer: QuizAnswer = { axis: currentQuestion.axis, pole }
    const newAnswers = [...answers, newAnswer]

    if (currentIndex + 1 >= questions.length) {
      // Last answer — score and show result
      const axisResult = scoreQuiz(newAnswers)
      const code = getPersonaCode(axisResult)
      setPersonaCode(code)
      setAnswers(newAnswers)

      if (prefersReducedMotion) {
        setPhase('result')
        sendEvent('calculate', { ageBand: selectedAgeBand ?? '' })
      } else {
        setPhase('loading')
        setTimeout(() => {
          setPhase('result')
          sendEvent('calculate', { ageBand: selectedAgeBand ?? '' })
        }, LOADING_DELAY_MS)
      }
    } else {
      // Advance to next question with a brief fade
      setAnswers(newAnswers)
      if (prefersReducedMotion) {
        setCurrentIndex((i) => i + 1)
      } else {
        setQuestionVisible(false)
        setTimeout(() => {
          setCurrentIndex((i) => i + 1)
          setQuestionVisible(true)
        }, 200)
      }
    }
  }

  function handleShare() {
    if (!personaCode) return
    const url = `${SITE_URL}${localeHref(locale, `/baby/temperament-quiz/result/${personaCode}`)}`
    const persona = getPersonaByCode(personaCode)
    const name = persona ? persona.name[locale] : personaCode

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: locale === 'ko' ? '아기 기질 테스트' : 'Baby Temperament Quiz',
        text:
          locale === 'ko'
            ? `우리 아이는 ${name} 유형이에요!`
            : `My baby is the ${name} type!`,
        url,
      }).catch(() => {/* user cancelled */})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {/* ignore */})
    }
    sendEvent('share')
  }

  function handleRestart() {
    setPhase('age-select')
    setTooYoung(false)
    setSelectedAgeBand(null)
    setCurrentIndex(0)
    setAnswers([])
    setPersonaCode(null)
    setQuestionVisible(true)
  }

  // ── Persona data for result ───────────────────────────────────────────────
  const persona = personaCode ? getPersonaByCode(personaCode) : undefined

  // ── Render ────────────────────────────────────────────────────────────────

  // Phase: age-select
  if (phase === 'age-select') {
    return (
      <div className="space-y-6">
        <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
            {locale === 'ko' ? '아이의 나이를 선택하세요' : "Select your baby's age"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AGE_BAND_OPTIONS.map((opt) => (
              <button
                key={opt.label.en}
                type="button"
                onClick={() => handleAgeBandSelect(opt.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-4 text-left hover:border-neutral-500 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
              >
                <span className="block text-sm font-medium text-white">
                  {opt.label[locale]}
                </span>
              </button>
            ))}
          </div>

          {/* Too-young message */}
          {tooYoung && (
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-4 py-3 text-sm text-amber-300 leading-relaxed animate-fade-in">
              {locale === 'ko'
                ? '이 시기는 아직 기질 차이가 뚜렷하게 나타나기 전이에요. 생후 4개월 이후에 다시 해보세요!'
                : 'Temperament differences aren\'t yet clearly visible at this age. Come back when your baby is 4 months or older!'}
            </div>
          )}
        </section>

        {/* Context note */}
        <p className="text-xs text-neutral-600 leading-relaxed px-1">
          {locale === 'ko'
            ? '이 테스트는 재미와 참고를 위한 콘텐츠이며 임상적 진단이 아닙니다. Thomas & Chess(1977) 기질 연구 개념을 재구성했습니다.'
            : 'This quiz is for fun and reference only — not a clinical diagnostic tool. Based on concepts from Thomas & Chess, Temperament and Development (1977).'}
        </p>
      </div>
    )
  }

  // Phase: loading
  if (phase === 'loading') {
    return (
      <div className="rounded-lg bg-[#141414] border border-neutral-800 p-5">
        <LoadingAnimation reduced={prefersReducedMotion} />
      </div>
    )
  }

  // Phase: result
  if (phase === 'result' && persona) {
    const tips = persona.tips[locale]
    const description = persona.description[locale]
    const name = persona.name[locale]

    // HSL card background derived from persona's colorHue
    const cardBg = `hsl(${persona.colorHue}, 30%, 10%)`
    const cardBorder = `hsl(${persona.colorHue}, 40%, 22%)`

    return (
      <div className="space-y-6">
        {/* Result card */}
        <section
          className="relative rounded-lg border p-6 space-y-5 overflow-hidden animate-fade-in"
          style={{ background: cardBg, borderColor: cardBorder }}
          aria-label="Temperament result"
        >
          {/* Confetti overlay */}
          <ConfettiOverlay reduced={prefersReducedMotion} />

          {/* Emoji + name */}
          <div className="text-center space-y-3 relative z-10">
            <div className="text-7xl select-none" aria-hidden="true">
              {persona.emoji}
            </div>
            <h2 className="text-2xl font-semibold text-white">{name}</h2>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-prose mx-auto">
              {description}
            </p>
          </div>

          {/* Parenting tips */}
          {tips.length > 0 && (
            <div className="relative z-10 space-y-2">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                {locale === 'ko' ? '이 아이에게 잘 맞는 방법' : 'What tends to work well'}
              </h3>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-300 leading-relaxed"
                  >
                    <span className="mt-0.5 text-[#f59e0b] shrink-0" aria-hidden="true">
                      ✦
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory disclaimer */}
          <p className="relative z-10 text-xs text-neutral-500 leading-relaxed border-t border-neutral-700/50 pt-4">
            {locale === 'ko'
              ? '이 유형은 Thomas & Chess의 기질 연구 개념을 재미있게 재구성한 것이며, 임상적 진단이 아닙니다.'
              : 'This type is a fun reinterpretation of Thomas & Chess temperament concepts and is not a clinical diagnosis.'}
          </p>
        </section>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
          >
            {locale === 'ko' ? '결과 공유하기' : 'Share'}
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-lg bg-white text-black px-4 py-2.5 text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            {locale === 'ko' ? '다시 테스트하기' : 'Take the quiz again'}
          </button>
        </div>

        {/* General disclaimer */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs text-neutral-400 leading-relaxed">
          {locale === 'ko'
            ? '이 테스트는 재미를 위한 콘텐츠이며 의학적·심리학적 진단이 아닙니다. 아이의 발달이나 행동에 대해 걱정되는 부분이 있다면 소아과 전문의와 상담하세요.'
            : 'This quiz is for entertainment purposes only and is not a medical or psychological diagnosis. If you have concerns about your child\'s development or behaviour, please consult a qualified paediatrician.'}
        </div>
      </div>
    )
  }

  // Phase: quiz
  if (phase === 'quiz' && currentQuestion) {
    return (
      <div className="space-y-5">
        {/* Progress */}
        <ProgressBar current={currentIndex + 1} total={questions.length} />

        {/* Question card */}
        <section
          className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-5"
          style={{
            transition: prefersReducedMotion ? 'none' : 'opacity 0.2s ease',
            opacity: questionVisible ? 1 : 0,
          }}
        >
          {/* Axis badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-600 uppercase tracking-wide">
              {currentQuestion.axis}
            </span>
          </div>

          {/* Prompt */}
          <p className="text-base font-medium text-white leading-snug">
            {currentQuestion.prompt[locale]}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(option.pole)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-4 text-left text-sm text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 leading-relaxed"
              >
                {option.label[locale]}
              </button>
            ))}
          </div>
        </section>

        {/* Reset link */}
        <button
          type="button"
          onClick={handleRestart}
          className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors underline underline-offset-2"
        >
          {locale === 'ko' ? '처음으로' : 'Start over'}
        </button>
      </div>
    )
  }

  // Fallback (should not reach here)
  return null
}
