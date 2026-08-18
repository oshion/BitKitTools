/**
 * Anthropic Messages API responses return a `content` array of typed blocks.
 * The first block is not guaranteed to be the text block (e.g. a non-text
 * block may precede it), so callers must find the block by `type` rather
 * than blindly indexing `content[0]`.
 */

export interface AnthropicContentBlock {
  type: string
  text?: string
}

export interface AnthropicMessageResponse {
  content?: AnthropicContentBlock[]
  stop_reason?: string
}

/** Returns the text of the first `type: 'text'` content block, or '' if none exists. */
export function extractAnthropicText(json: AnthropicMessageResponse): string {
  const textBlock = json.content?.find((block) => block.type === 'text')
  return textBlock?.text ?? ''
}

/**
 * Returns true when the response was cut off by the max_tokens limit rather
 * than finishing naturally. A truncated response has silently-incomplete
 * text (no error is thrown), so callers should log a warning when this is
 * true instead of treating the text as a complete report/spec.
 */
export function isTruncated(json: AnthropicMessageResponse): boolean {
  return json.stop_reason === 'max_tokens'
}
