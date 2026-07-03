import type { ToolCategory, ToolConfig } from '@/types/tool'

export const toolsConfig: ToolConfig[] = [
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    category: 'developer',
    title: {
      en: 'JSON Formatter & Validator',
      ko: 'JSON 포매터 & 유효성 검사기',
    },
    description: {
      en: 'Instantly format, pretty-print, or minify JSON. Catches syntax errors and highlights the exact line — no login, no uploads, all in your browser.',
      ko: 'JSON을 즉시 정리(pretty-print)하거나 압축(minify)하고 문법 오류와 줄 번호를 바로 확인하세요. 로그인 불필요, 서버 전송 없이 브라우저에서 바로 처리됩니다.',
    },
    keywords: {
      en: [
        'json formatter',
        'json validator',
        'json beautifier',
        'json minifier',
        'json pretty print',
        'json lint',
        'format json online',
        'validate json',
        'json parser',
        'json editor',
      ],
      ko: [
        'JSON 포매터',
        'JSON 검사기',
        'JSON 정리',
        'JSON 압축',
        'JSON 유효성 검사',
        'JSON 뷰어',
        '온라인 JSON 포매터',
        'JSON 파서',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'What does "invalid JSON" mean?',
          ko: '"유효하지 않은 JSON"이란 무슨 뜻인가요?',
        },
        answer: {
          en: 'JSON has strict syntax rules. Every key must be in double quotes, strings can\'t use single quotes, trailing commas after the last item are not allowed, and the structure must be properly closed with matching brackets and braces. When any of these rules are broken, the JSON is considered invalid and cannot be parsed by any standard parser.',
          ko: 'JSON은 엄격한 문법 규칙을 따릅니다. 모든 키는 큰따옴표로 감싸야 하고, 문자열에 작은따옴표를 쓸 수 없으며, 마지막 항목 뒤에 쉼표(trailing comma)가 있으면 안 되고, 열린 괄호/중괄호는 반드시 닫아야 합니다. 이 규칙 중 하나라도 어기면 유효하지 않은 JSON이 되어 어떤 파서도 읽을 수 없습니다.',
        },
      },
      {
        question: {
          en: 'What is the difference between formatting and minifying (compressing) JSON?',
          ko: 'JSON 포맷팅과 압축(minify)의 차이는 무엇인가요?',
        },
        answer: {
          en: 'Formatting (pretty-printing) adds indentation and line breaks to make JSON human-readable — ideal for debugging or reviewing API responses. Minifying removes all unnecessary whitespace to reduce file size — ideal for sending JSON over a network or embedding it in code where readability doesn\'t matter. Both produce semantically identical data.',
          ko: '포맷팅(pretty-print)은 들여쓰기와 줄 바꿈을 추가해 사람이 읽기 쉽게 만들어 줍니다 — API 응답 디버깅이나 리뷰에 적합합니다. 압축(minify)은 불필요한 공백을 모두 제거해 파일 크기를 줄입니다 — 네트워크로 전송하거나 코드에 삽입할 때 적합합니다. 두 결과물은 의미적으로 동일한 데이터를 담고 있습니다.',
        },
      },
      {
        question: {
          en: 'Why does a trailing comma cause a JSON error?',
          ko: 'trailing comma(마지막 쉼표)는 왜 JSON 오류를 일으키나요?',
        },
        answer: {
          en: 'Unlike JavaScript, the JSON specification (RFC 8259) does not allow a comma after the last element of an object or array. For example, {"a":1,} and [1,2,3,] are valid JavaScript but invalid JSON. When you copy object or array literals from JS/TS code into a JSON file, trailing commas are a very common source of parse errors. This formatter will clearly report that error so you can fix it quickly.',
          ko: 'JavaScript와 달리 JSON 명세(RFC 8259)는 객체나 배열의 마지막 요소 뒤에 쉼표를 허용하지 않습니다. 예를 들어 {"a":1,}이나 [1,2,3,]은 JavaScript에서는 유효하지만 JSON에서는 오류입니다. JS/TS 코드에서 객체/배열을 복사해 JSON 파일에 붙여넣을 때 trailing comma로 인한 오류가 자주 발생합니다. 이 포매터는 해당 오류를 명확히 알려줘 빠르게 수정할 수 있게 합니다.',
        },
      },
    ],
    relatedToolIds: ['password-generator'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/json-formatter.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-03',
    popular: false,
  },
]

export const TOOL_CATEGORIES: ToolCategory[] = ['developer', 'travel', 'beer', 'baby']

export function getToolBySlug(category: ToolCategory, slug: string): ToolConfig | undefined {
  return toolsConfig.find((t) => t.category === category && t.slug === slug)
}

export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
  return toolsConfig.filter((t) => t.category === category)
}

export function getPopularTools(): ToolConfig[] {
  return toolsConfig.filter((t) => t.popular)
}

export function getRecentTools(limit: number): ToolConfig[] {
  return [...toolsConfig]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit)
}

export function getRelatedTools(toolId: string): ToolConfig[] {
  const tool = toolsConfig.find((t) => t.id === toolId)
  if (!tool) return []

  return tool.relatedToolIds.flatMap((relId) => {
    const found = toolsConfig.find((t) => t.id === relId)
    return found ? [found] : []
  })
}
