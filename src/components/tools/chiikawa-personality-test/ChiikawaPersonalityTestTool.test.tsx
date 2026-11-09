import React from 'react'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import ChiikawaPersonalityTestTool from './ChiikawaPersonalityTestTool'
import { CHIIKAWA_CHARACTERS, getChiikawaCharacter } from '@/lib/config/chiikawaCharacters'
import { CHIIKAWA_QUESTIONS } from '@/lib/config/chiikawaQuestions'
import { scorePersonalityType } from '@/lib/utils/chiikawaQuiz'
import type { AnswerLetter } from '@/types/chiikawa-quiz'

const mockSendEvent = jest.fn()
jest.mock('@/hooks/useAnalyticsEvent', () => ({
  useAnalyticsEvent: () => ({ sendEvent: mockSendEvent }),
}))

// Q1~Q16 모두 B → 캐릭터 fanType과 다른 유형이 나오도록 한다
const PERSONALITY_ANSWERS: AnswerLetter[] = Array.from({ length: 16 }, () => 'B')

function answersFor(characterId: string): AnswerLetter[] {
  const character = getChiikawaCharacter(characterId)
  if (!character) throw new Error(characterId)
  return [...PERSONALITY_ANSWERS, ...character.answerKey]
}

function optionButton(letter: AnswerLetter): HTMLElement {
  return screen.getByTestId(`option-${letter}`)
}

function startQuiz(locale: 'en' | 'ko' = 'en') {
  const utils = render(<ChiikawaPersonalityTestTool locale={locale} />)
  fireEvent.click(screen.getByTestId('start-button'))
  return utils
}

function answerAll(answers: AnswerLetter[]) {
  answers.forEach((letter) => fireEvent.click(optionButton(letter)))
}

const originalShare = navigator.share
const originalClipboard = navigator.clipboard

function setNavigator(share: unknown, clipboard: unknown) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true })
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true, writable: true })
}

beforeEach(() => {
  mockSendEvent.mockClear()
})

afterEach(() => {
  setNavigator(originalShare, originalClipboard)
})

describe('ChiikawaPersonalityTestTool — start & progress', () => {
  it('shows the intro, then the first question with 1 / 24 progress', () => {
    render(<ChiikawaPersonalityTestTool locale="ko" />)
    expect(screen.getByText('나는 치이카와 친구들 중 누구와 가장 닮았을까?')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('start-button'))

    expect(screen.getByText(CHIIKAWA_QUESTIONS[0].text.ko)).toBeInTheDocument()
    expect(screen.getByText('1 / 24')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  })

  it('advances on selection and keeps/overwrites answers when going back', () => {
    startQuiz('en')
    fireEvent.click(optionButton('C'))
    expect(screen.getByText('2 / 24')).toBeInTheDocument()
    expect(screen.getByText(CHIIKAWA_QUESTIONS[1].text.en)).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('prev-button'))
    expect(screen.getByText('1 / 24')).toBeInTheDocument()
    expect(optionButton('C')).toHaveAttribute('aria-pressed', 'true')
    expect(optionButton('A')).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(optionButton('A'))
    fireEvent.click(screen.getByTestId('prev-button'))
    expect(optionButton('A')).toHaveAttribute('aria-pressed', 'true')
    expect(optionButton('C')).toHaveAttribute('aria-pressed', 'false')
  })

  it('hides the previous button on the first question', () => {
    startQuiz()
    expect(screen.queryByTestId('prev-button')).not.toBeInTheDocument()
  })
})

describe('ChiikawaPersonalityTestTool — result', () => {
  it('shows the matching character, both personality types and TOP 3', () => {
    const character = CHIIKAWA_CHARACTERS[2] // usagi
    const answers = answersFor(character.id)
    const myType = scorePersonalityType(answers)
    expect(myType).not.toBe(character.fanType)

    startQuiz('ko')
    answerAll(answers)

    const card = screen.getByTestId('result-card')
    expect(within(card).getByText(character.name.ko)).toBeInTheDocument()
    expect(within(card).getByText(character.emoji)).toBeInTheDocument()

    expect(within(screen.getByTestId('my-type')).getByText(myType)).toBeInTheDocument()
    expect(within(screen.getByTestId('fan-type')).getByText(character.fanType)).toBeInTheDocument()
    expect(screen.getByTestId('my-type').textContent).not.toContain(character.fanType)

    const top3 = screen.getByTestId('top3')
    const items = within(top3).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toContain(character.name.ko)
    expect(items[0].textContent).toContain('100%')
  })

  it('shows the character description under the name and puts share right after the type cards', () => {
    const character = getChiikawaCharacter('momonga')
    if (!character) throw new Error('momonga')
    startQuiz('ko')
    answerAll(answersFor(character.id))

    const card = screen.getByTestId('result-card')
    expect(within(card).getByText(character.description.ko)).toBeInTheDocument()
    expect(screen.getByText(character.coreTraits.ko)).toBeInTheDocument()

    const follows = (a: HTMLElement, b: HTMLElement) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    const share = screen.getByTestId('share-button')
    const restart = screen.getByTestId('restart-button')
    expect(follows(screen.getByTestId('fan-type'), share)).toBe(true)
    expect(follows(share, screen.getByText(character.tagline.ko))).toBe(true)
    expect(follows(screen.getByTestId('top3'), restart)).toBe(true)
  })

  it('fires the analytics events', () => {
    const character = CHIIKAWA_CHARACTERS[0]
    startQuiz()
    answerAll(answersFor(character.id))

    const names = mockSendEvent.mock.calls.map((c: unknown[]) => c[0])
    expect(names.filter((n) => n === 'tool_open')).toHaveLength(1)
    expect(names.filter((n) => n === 'input_enter')).toHaveLength(1)
    expect(mockSendEvent).toHaveBeenCalledWith('calculate', {
      character: character.id,
      type: scorePersonalityType(answersFor(character.id)),
    })
  })

  it('links the official site in a new tab with noopener', () => {
    const character = CHIIKAWA_CHARACTERS[1]
    startQuiz('en')
    answerAll(answersFor(character.id))
    const link = screen.getByText(`See ${character.name.en} on the official site →`)
    expect(link).toHaveAttribute('href', character.officialUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('has no img elements and no MBTI text outside the fan-made notice', () => {
    for (const locale of ['en', 'ko'] as const) {
      const { container, unmount } = startQuiz(locale)
      answerAll(answersFor('hachiware'))
      expect(container.querySelector('img')).toBeNull()
      const clone = container.cloneNode(true) as HTMLElement
      clone.querySelector('[data-testid="fan-made-notice"]')?.remove()
      expect(clone.textContent).not.toMatch(/MBTI/i)
      expect(container.querySelector('[data-testid="fan-made-notice"]')).not.toBeNull()
      unmount()
    }
  })

  it('restart returns to the start screen and clears answers', () => {
    startQuiz()
    answerAll(answersFor('chiikawa'))
    fireEvent.click(screen.getByTestId('restart-button'))
    expect(screen.getByTestId('start-button')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('start-button'))
    expect(screen.getByText('1 / 24')).toBeInTheDocument()
    for (const letter of ['A', 'B', 'C', 'D'] as const) {
      expect(optionButton(letter)).toHaveAttribute('aria-pressed', 'false')
    }
  })
})

describe('ChiikawaPersonalityTestTool — share', () => {
  it('uses navigator.share with the character result URL', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    setNavigator(share, undefined)
    const character = CHIIKAWA_CHARACTERS[0]

    startQuiz('ko')
    answerAll(answersFor(character.id))
    await act(async () => {
      fireEvent.click(screen.getByTestId('share-button'))
    })

    expect(share).toHaveBeenCalledTimes(1)
    const arg = share.mock.calls[0][0] as { url: string; text: string }
    expect(arg.url).toContain(`/fun/chiikawa-personality-test/result/${character.id}/`)
    expect(arg.url).not.toContain('?')
    expect(arg.text).toContain('치이카와와 가장 닮았대')
    expect(mockSendEvent).toHaveBeenCalledWith('share')
  })

  it('falls back to clipboard and shows a copied notice', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    setNavigator(undefined, { writeText })
    const character = CHIIKAWA_CHARACTERS[3]

    startQuiz('en')
    answerAll(answersFor(character.id))
    await act(async () => {
      fireEvent.click(screen.getByTestId('share-button'))
    })

    expect(writeText).toHaveBeenCalledTimes(1)
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain(`/fun/chiikawa-personality-test/result/${character.id}/`)
    expect(copied).toContain(character.name.en)
    expect(screen.getByRole('status')).toHaveTextContent('Link copied')
  })
})
