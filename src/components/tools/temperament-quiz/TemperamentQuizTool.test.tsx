import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import TemperamentQuizTool from './TemperamentQuizTool'

// window.matchMedia is not available in JSDOM — mock it for this component
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
})

function setupGtag() {
  const mockGtag = jest.fn()
  Object.defineProperty(window, 'gtag', {
    value: mockGtag,
    writable: true,
    configurable: true,
  })
  return mockGtag
}

afterEach(() => {
  Object.defineProperty(window, 'gtag', {
    value: undefined,
    writable: true,
    configurable: true,
  })
})

describe('TemperamentQuizTool — input_enter event', () => {
  it('fires input_enter exactly once on first quiz answer', () => {
    const mockGtag = setupGtag()
    const { getByText, getAllByRole } = render(<TemperamentQuizTool />)

    // Start quiz by selecting an age band (4–12 months)
    fireEvent.click(getByText('4–12 months'))

    // Now in quiz phase — click the first answer option
    const answerButtons = getAllByRole('button').filter(
      (btn) => btn.textContent !== 'Start over'
    )
    fireEvent.click(answerButtons[0])

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
    expect(inputEnterCalls[0]).toEqual(['event', 'input_enter', {}])
  })

  it('does not fire input_enter again on subsequent quiz answers', () => {
    const mockGtag = setupGtag()
    const { getByText, getAllByRole } = render(<TemperamentQuizTool />)

    // Start quiz
    fireEvent.click(getByText('4–12 months'))

    // Answer first question
    let answerButtons = getAllByRole('button').filter(
      (btn) => btn.textContent !== 'Start over'
    )
    fireEvent.click(answerButtons[0])

    // Answer second question (component advances to next question)
    answerButtons = getAllByRole('button').filter(
      (btn) => btn.textContent !== 'Start over'
    )
    if (answerButtons.length > 0) {
      fireEvent.click(answerButtons[0])
    }

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(1)
  })

  it('does not fire input_enter when selecting an age band (before quiz answers)', () => {
    const mockGtag = setupGtag()
    const { getByText } = render(<TemperamentQuizTool />)

    // Only select age band — do not answer any questions
    fireEvent.click(getByText('4–12 months'))

    const inputEnterCalls = mockGtag.mock.calls.filter(
      (c: unknown[]) => c[1] === 'input_enter'
    )
    expect(inputEnterCalls).toHaveLength(0)
  })
})
