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
  {
    id: 'password-generator',
    slug: 'password-generator',
    category: 'developer',
    title: {
      en: 'Password Generator',
      ko: '비밀번호 생성기',
    },
    description: {
      en: 'Generate strong, secure passwords instantly. Customize length and character types — uppercase, lowercase, numbers, symbols. All generated in your browser using cryptographically secure randomness. Nothing is sent to any server.',
      ko: '강력하고 안전한 비밀번호를 즉시 생성합니다. 길이와 문자 조합(대문자, 소문자, 숫자, 특수문자)을 자유롭게 설정하세요. 모든 생성은 브라우저에서 암호학적으로 안전한 난수를 이용하며, 어떤 서버에도 전송되지 않습니다.',
    },
    keywords: {
      en: [
        'password generator',
        'secure password generator',
        'random password generator',
        'strong password generator',
        'password creator',
        'password maker',
        'generate password online',
        'password strength',
        'crypto random password',
        'free password generator',
      ],
      ko: [
        '비밀번호 생성기',
        '안전한 비밀번호 생성',
        '랜덤 비밀번호',
        '강력한 비밀번호',
        '비밀번호 만들기',
        '온라인 비밀번호 생성기',
        '비밀번호 강도',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Is the generated password stored or sent to a server?',
          ko: '생성된 비밀번호가 서버에 저장되거나 전송되나요?',
        },
        answer: {
          en: 'No. Passwords are generated entirely in your browser using the Web Crypto API (crypto.getRandomValues). Nothing is sent to any server, logged, or stored anywhere — not even in your browser\'s local storage. Once you close or refresh the page, the password is gone.',
          ko: '아닙니다. 비밀번호는 Web Crypto API(crypto.getRandomValues)를 사용해 브라우저에서만 생성됩니다. 어떤 서버에도 전송되지 않고, 로그나 브라우저 저장소 어디에도 기록되지 않습니다. 페이지를 닫거나 새로고침하면 비밀번호는 사라집니다.',
        },
      },
      {
        question: {
          en: 'How long should a secure password be?',
          ko: '안전한 비밀번호 길이는 얼마인가요?',
        },
        answer: {
          en: 'Security experts recommend at least 16 characters for most accounts, and 20 or more for high-value accounts like email, banking, or password managers. Longer passwords with mixed character types are exponentially harder to crack. A 16-character password using all character types has over 96 bits of entropy — considered very strong by modern standards.',
          ko: '보안 전문가들은 대부분의 계정에 최소 16자, 이메일·뱅킹·비밀번호 관리자 같은 중요한 계정에는 20자 이상을 권장합니다. 다양한 문자 조합을 포함한 긴 비밀번호는 크래킹이 기하급수적으로 어려워집니다. 모든 문자 유형을 포함한 16자 비밀번호는 96비트 이상의 엔트로피를 가져 현대 기준으로 매우 강력한 수준입니다.',
        },
      },
      {
        question: {
          en: 'When should I use the "Exclude Ambiguous Characters" option?',
          ko: '"유사 문자 제외" 옵션은 언제 사용하나요?',
        },
        answer: {
          en: 'Enable this option when you need to type the password manually or read it aloud — for example, when setting up a device or account without copy-paste access. Ambiguous characters like 0 (zero) vs O (uppercase O), 1 (one) vs l (lowercase L) vs I (uppercase i) look nearly identical in many fonts and can cause frustrating login failures. If you\'ll always paste the password from a password manager, leaving this option off gives you a slightly larger character pool and higher entropy.',
          ko: '비밀번호를 직접 타이핑하거나 읽어야 할 때, 예를 들어 복사-붙여넣기가 불가능한 기기나 계정 설정 시 유용합니다. 0(숫자)과 O(대문자 오), 1(숫자)과 l(소문자 엘)과 I(대문자 아이) 같은 유사 문자는 많은 폰트에서 거의 구분이 안 돼 로그인 실패의 원인이 됩니다. 항상 비밀번호 관리자로 붙여넣는다면 이 옵션을 끄면 더 넓은 문자 풀로 더 높은 엔트로피를 얻을 수 있습니다.',
        },
      },
    ],
    relatedToolIds: ['json-formatter'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/password-generator.png',
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
