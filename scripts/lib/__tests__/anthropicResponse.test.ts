import { extractAnthropicText, isTruncated } from '../anthropicResponse'

describe('extractAnthropicText', () => {
  it('returns the text of the first text block', () => {
    const json = { content: [{ type: 'text', text: 'hello' }] }
    expect(extractAnthropicText(json)).toBe('hello')
  })

  it('returns empty string when there is no text block', () => {
    expect(extractAnthropicText({})).toBe('')
    expect(extractAnthropicText({ content: [{ type: 'image' }] })).toBe('')
  })
})

describe('isTruncated', () => {
  it('returns true when stop_reason is max_tokens', () => {
    expect(isTruncated({ stop_reason: 'max_tokens' })).toBe(true)
  })

  it('returns false when stop_reason is end_turn', () => {
    expect(isTruncated({ stop_reason: 'end_turn' })).toBe(false)
  })

  it('returns false when stop_reason is absent', () => {
    expect(isTruncated({})).toBe(false)
  })
})
