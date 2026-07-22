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
  {
    id: 'jwt-decoder',
    slug: 'jwt-decoder',
    category: 'developer',
    title: {
      en: 'JWT Decoder',
      ko: 'JWT 디코더',
    },
    description: {
      en: 'Instantly decode JWT tokens and inspect Header, Payload, and standard claims — exp, iat, sub, iss, aud and more — with human-readable explanations. Everything runs in your browser; your token never leaves your device.',
      ko: 'JWT 토큰을 즉시 디코딩해 Header, Payload, 표준 클레임(exp, iat, sub, iss, aud 등)을 사람이 읽을 수 있는 설명과 함께 확인하세요. 모든 처리는 브라우저에서 진행되며 토큰은 외부로 전송되지 않습니다.',
    },
    keywords: {
      en: [
        'jwt decoder',
        'jwt token decoder',
        'decode jwt online',
        'jwt claims viewer',
        'jwt parser',
        'json web token decoder',
        'jwt inspector',
        'decode jwt token',
        'jwt payload decoder',
        'jwt header decoder',
      ],
      ko: [
        'JWT 디코더',
        'JWT 토큰 디코더',
        'JWT 클레임 확인',
        'JWT 파서',
        'JSON 웹 토큰 디코더',
        'JWT 검사기',
        'JWT 페이로드 디코딩',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Can I verify whether this token is actually valid (i.e. check the signature)?',
          ko: '이 토큰이 실제로 유효한지(서명이 올바른지) 확인할 수 있나요?',
        },
        answer: {
          en: 'No — this tool only decodes the token (reads the Header and Payload), it does not verify the cryptographic signature. Signature verification requires the secret key or public key used to sign the token, which this tool does not and should not handle. Use your backend or a trusted library (e.g. jsonwebtoken for Node.js) to verify signatures.',
          ko: '아닙니다 — 이 도구는 토큰을 디코딩(Header와 Payload를 읽음)할 뿐이며, 암호학적 서명을 검증하지 않습니다. 서명 검증에는 토큰 서명에 사용된 비밀키 또는 공개키가 필요하며, 이 도구는 이를 처리하지 않습니다. 서명 검증은 백엔드 또는 신뢰할 수 있는 라이브러리(예: Node.js의 jsonwebtoken)를 사용하세요.',
        },
      },
      {
        question: {
          en: 'Is my token sent to any server?',
          ko: '제 토큰이 서버로 전송되나요?',
        },
        answer: {
          en: 'No. The entire decoding process runs in your browser using JavaScript. Your token is never sent to any server, logged, or stored anywhere — not even in browser storage. This is especially important because JWT tokens often contain sensitive authentication data.',
          ko: '아닙니다. 모든 디코딩 처리는 브라우저에서 JavaScript로 실행됩니다. 토큰은 어떤 서버에도 전송되지 않고, 로그나 브라우저 저장소 어디에도 기록되지 않습니다. JWT 토큰은 민감한 인증 정보를 포함하는 경우가 많으므로 이 점이 특히 중요합니다.',
        },
      },
      {
        question: {
          en: 'The "exp" claim shows it has passed — does that mean the token is invalid?',
          ko: '"exp" 클레임이 지난 시각으로 나오는데, 토큰이 무효라는 뜻인가요?',
        },
        answer: {
          en: 'It means the declared expiry timestamp in the Payload is in the past. However, this is just a time comparison — it is not the same as verifying the signature. A token can have a past exp and still technically have a valid signature, and vice versa. Whether the token is truly accepted or rejected is always determined by the server that validates it.',
          ko: 'Payload에 선언된 만료 시각이 현재 시각보다 과거라는 의미입니다. 그러나 이것은 단순한 시간 비교이며, 서명 검증과 다릅니다. exp가 지난 토큰이라도 서명 자체는 유효할 수 있고, 반대의 경우도 마찬가지입니다. 토큰이 실제로 허용되거나 거부되는지는 항상 이를 검증하는 서버가 결정합니다.',
        },
      },
    ],
    relatedToolIds: [],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/default-en.png',
    status: 'testing',
    disclaimerType: 'none',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-23',
    popular: false,
  },
  {
    id: 'visa-requirement-checker',
    slug: 'visa-requirement-checker',
    category: 'travel',
    title: {
      en: 'Visa Requirement Checker',
      ko: '비자 요건 확인기',
    },
    description: {
      en: 'Check visa requirements for your passport and destination country instantly. Find out whether you need a visa, an e-Visa/ETA, or can enter visa-free — plus general travel insurance guidance. Based on a static reference snapshot; always verify with the official consulate before travel.',
      ko: '여권 국가와 목적지를 선택하면 비자 요건(무비자/e-Visa·ETA/사전 비자)을 즉시 확인할 수 있습니다. 일반 여행자보험 안내도 함께 제공합니다. 정적 참조 데이터 기반이므로 출국 전 반드시 공식 영사관에서 재확인하세요.',
    },
    keywords: {
      en: [
        'visa requirement checker',
        'do I need a visa',
        'visa free countries',
        'e-visa requirements',
        'travel visa calculator',
        'passport visa check',
        'entry requirements by country',
        'visa on arrival',
        'ESTA requirements',
        'ETA requirements',
      ],
      ko: [
        '비자 요건 확인',
        '무비자 국가',
        'e-비자 확인',
        '여행 비자 계산기',
        '여권별 비자',
        '입국 요건',
        '비자 온 어라이벌',
        'ESTA 요건',
        '전자여행허가',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'What is the difference between visa-free entry and an e-Visa or ETA?',
          ko: '무비자 입국과 e-Visa, ETA의 차이는 무엇인가요?',
        },
        answer: {
          en: 'Visa-free entry means you can board a plane and enter a country without any pre-approval — just a valid passport. An e-Visa (electronic visa) or ETA (Electronic Travel Authorization, also called ESTA in the US context) requires you to apply online and receive approval before you travel, though the process is usually quick and inexpensive. Visa-required means you must submit a full visa application at the destination country\'s embassy or consulate, typically requiring an appointment, supporting documents, and processing time of several days or weeks.',
          ko: '무비자 입국은 사전 승인 없이 유효한 여권만으로 탑승하고 입국할 수 있다는 뜻입니다. e-Visa(전자 비자) 또는 ETA(전자여행허가, 미국의 ESTA 포함)는 출발 전 온라인으로 신청하고 승인을 받아야 하지만, 절차가 간단하고 빠릅니다. 비자 필요(visa-required)는 목적지 국가의 대사관이나 영사관에 정식 비자 신청서를 제출해야 하며 예약, 서류 준비, 수일~수주의 처리 기간이 필요합니다.',
        },
      },
      {
        question: {
          en: 'How often do visa requirements change?',
          ko: '비자 요건은 얼마나 자주 바뀌나요?',
        },
        answer: {
          en: 'Visa policies can change at any time — sometimes with very little notice. Changes are often triggered by diplomatic agreements, reciprocity decisions, security concerns, or new electronic authorization systems (such as ETIAS for the EU, the UK ETA, or the US ESTA). This tool uses a static reference snapshot and may not reflect the most recent changes. Always verify the current requirements on the official website of the destination country\'s embassy or consulate before booking flights or making accommodation arrangements.',
          ko: '비자 정책은 언제든지 바뀔 수 있으며, 예고가 짧은 경우도 많습니다. 외교 협정 변경, 상호주의 원칙 적용, 보안상의 이유, 또는 EU의 ETIAS·영국 ETA·미국 ESTA 같은 새로운 전자 입국 허가 시스템 도입 등이 주요 원인입니다. 이 툴은 정적 스냅샷 데이터를 사용하므로 최신 변경 사항이 반영되지 않을 수 있습니다. 항공권 예매나 숙박 예약 전에 반드시 목적지 국가의 대사관·영사관 공식 사이트에서 현재 요건을 확인하세요.',
        },
      },
      {
        question: {
          en: 'Is travel insurance required to enter a country?',
          ko: '여행자보험은 필수인가요?',
        },
        answer: {
          en: 'It depends on your destination. EU and Schengen visa applicants are typically required to provide proof of travel medical insurance covering at least €30,000 as part of the visa application. Some other countries (Cuba, Ecuador, and a few others) also mandate travel insurance for entry. Even where it is not legally required, comprehensive travel insurance is strongly recommended to cover medical emergencies, trip cancellation, baggage loss, and travel delays — unexpected costs that can be significant when travelling internationally.',
          ko: '목적지에 따라 다릅니다. EU 및 솅겐 비자 신청 시에는 최소 €30,000을 보장하는 여행 의료보험 증명서를 제출해야 하는 경우가 일반적입니다. 쿠바, 에콰도르 등 일부 국가도 입국 시 여행자보험을 의무화하고 있습니다. 법적 의무가 없더라도 의료 응급 상황, 여행 취소, 수하물 분실, 항공 지연 등 예상치 못한 비용에 대비해 종합 여행자보험 가입을 강력히 권장합니다.',
        },
      },
    ],
    relatedToolIds: ['flight-delay-compensation'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/visa-requirement-checker.png',
    status: 'testing',
    disclaimerType: 'legal',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-03',
    popular: false,
  },
  {
    id: 'bac-calculator',
    slug: 'bac-calculator',
    category: 'beer',
    title: {
      en: 'BAC Calculator (Blood Alcohol Concentration)',
      ko: '혈중 알코올 농도(BAC) 계산기',
    },
    description: {
      en: 'Estimate your Blood Alcohol Concentration (BAC) using the Widmark formula. Enter your sex, weight, drinks consumed, and time elapsed to get an instant estimate — for informational reference only. Never use this to judge fitness to drive.',
      ko: 'Widmark 공식을 사용해 혈중 알코올 농도(BAC)를 추정합니다. 성별, 체중, 음주량, 경과 시간을 입력하면 즉시 추정치를 확인할 수 있습니다 — 참고용 정보이며 운전 가능 여부 판단에 절대 사용하지 마세요.',
    },
    keywords: {
      en: [
        'BAC calculator',
        'blood alcohol concentration calculator',
        'Widmark formula calculator',
        'how drunk am I calculator',
        'alcohol calculator',
        'drink calculator BAC',
        'blood alcohol level',
        'alcohol level by weight',
        'how long to sober up',
        'alcohol metabolism calculator',
      ],
      ko: [
        '혈중 알코올 농도 계산기',
        'BAC 계산기',
        '음주 측정 계산기',
        '알코올 농도 계산',
        '음주 후 BAC',
        '체중별 알코올 농도',
        'Widmark 공식',
        '음주 후 시간 계산',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Can this BAC calculator tell me whether I am safe to drive?',
          ko: 'BAC 계산기로 운전해도 되는지 알 수 있나요?',
        },
        answer: {
          en: 'No, it cannot. This calculator provides a mathematical estimate based on the Widmark formula, but individual alcohol metabolism varies widely depending on food intake, medication, fatigue, genetics, liver health, and other factors. The only way to know your actual BAC is a certified breathalyzer or blood test. More importantly, even a BAC within a legal limit does not guarantee safe driving ability. After drinking any amount of alcohol, the safest decision is always not to drive.',
          ko: '아닙니다, 알 수 없습니다. 이 계산기는 Widmark 공식에 기반한 수학적 추정치를 제공하지만, 실제 알코올 대사 속도는 음식 섭취 여부, 약물 복용, 피로, 유전적 요인, 간 건강 등에 따라 개인차가 매우 큽니다. 실제 혈중 알코올 농도는 공인 음주 측정기나 혈액 검사로만 확인할 수 있습니다. 더 중요한 것은, BAC가 법적 기준 이내라도 안전한 운전 능력을 보장하지 않습니다. 음주 후에는 얼마를 마셨든 운전하지 않는 것이 유일하게 안전한 선택입니다.',
        },
      },
      {
        question: {
          en: 'What is the Widmark formula and how accurate is it?',
          ko: 'Widmark 공식이란 무엇이며 얼마나 정확한가요?',
        },
        answer: {
          en: 'The Widmark formula, developed by Swedish physician Erik MP Widmark in 1932, calculates an estimated BAC using three variables: total alcohol consumed (in grams), body weight, and a gender-specific distribution factor (r = 0.68 for males, 0.55 for females). It also subtracts a standard elimination rate of approximately 0.015 g/dL per hour. The formula is widely used in forensic and research contexts, but it is an approximation. Real-world BAC can differ by 20–30% or more due to individual variation in metabolism, stomach contents, drinking pace, and other physiological factors.',
          ko: 'Widmark 공식은 1932년 스웨덴 의사 Erik MP Widmark가 개발한 공식으로, 세 가지 변수를 사용합니다: 총 알코올 섭취량(그램), 체중, 그리고 성별에 따른 분포 계수(남성 r=0.68, 여성 r=0.55). 또한 시간당 약 0.015 g/dL의 표준 알코올 분해율을 적용합니다. 이 공식은 법의학 및 연구 분야에서 널리 사용되지만 어디까지나 추정치입니다. 실제 BAC는 개인의 대사 속도, 위장 내 음식물, 음주 속도, 기타 생리적 요인에 따라 20~30% 이상 차이가 날 수 있습니다.',
        },
      },
      {
        question: {
          en: 'Why does biological sex affect BAC?',
          ko: '생물학적 성별이 BAC에 영향을 미치는 이유는 무엇인가요?',
        },
        answer: {
          en: 'Biological sex affects BAC through two main mechanisms. First, females typically have a lower total body water percentage than males of the same weight, which means alcohol is distributed in a smaller volume, resulting in a higher BAC. The Widmark formula accounts for this with different distribution factors (r): 0.68 for males and 0.55 for females. Second, females on average have lower levels of alcohol dehydrogenase (ADH), the enzyme responsible for breaking down alcohol in the stomach, which means more alcohol enters the bloodstream. These are average physiological differences — individual variation exists.',
          ko: '생물학적 성별은 두 가지 주요 메커니즘을 통해 BAC에 영향을 미칩니다. 첫째, 같은 체중에서 여성은 남성보다 총 체수분 비율이 낮아 알코올이 더 작은 체적에 분포되므로 BAC가 더 높아집니다. Widmark 공식은 이를 분포 계수 r로 반영합니다(남성 0.68, 여성 0.55). 둘째, 여성은 평균적으로 위장에서 알코올을 분해하는 효소인 알코올 탈수소효소(ADH) 수치가 낮아 더 많은 알코올이 혈류로 흡수됩니다. 이는 평균적인 생리학적 차이이며 개인 간 편차가 존재합니다.',
        },
      },
      {
        question: {
          en: 'Once the estimated time until 0% has passed, is it safe to drive?',
          ko: '예상 0% 도달 시간이 지나면 운전해도 되나요?',
        },
        answer: {
          en: 'No. The "estimated hours until 0%" is a rough metabolic calculation based on a fixed elimination rate (0.015 g/dL per hour). Individual alcohol metabolism varies widely depending on food intake, hydration, fatigue, medications, liver health, and genetics — actual clearance time can differ significantly. More importantly, the recovery of cognitive function and reaction time does not always align with reaching 0% BAC. This figure should never be used to decide when it is safe to drive. After drinking any amount of alcohol, the only safe decision is not to drive.',
          ko: '아닙니다. "예상 0% 도달까지 남은 시간"은 고정된 대사율(시간당 0.015 g/dL)을 기반으로 한 대략적인 계산입니다. 실제 알코올 대사 속도는 음식 섭취, 수분 상태, 피로도, 약물 복용, 간 건강, 유전적 요인에 따라 개인차가 매우 크며, 실제 완전 대사 시간은 크게 다를 수 있습니다. 더 중요하게는, 인지 기능과 반응 속도의 회복이 BAC 0% 도달과 반드시 일치하지 않습니다. 이 수치는 운전 가능 여부를 판단하는 기준으로 절대 사용해서는 안 됩니다. 음주 후에는 얼마를 마셨든 운전하지 않는 것이 유일하게 안전한 선택입니다.',
        },
      },
    ],
    relatedToolIds: ['homebrew-recipe-calculator', 'standard-drinks-calculator'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/bac-calculator.png',
    status: 'testing',
    disclaimerType: 'medical',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-03',
    popular: false,
  },
  {
    id: 'homebrew-recipe-calculator',
    slug: 'homebrew-recipe-calculator',
    category: 'beer',
    title: {
      en: 'Homebrew Recipe & ABV Calculator',
      ko: '홈브루 레시피 & 도수 계산기',
    },
    description: {
      en: 'Calculate estimated ABV from Original Gravity (OG) and Final Gravity (FG) using the standard homebrewing formula. Includes a dilution calculator to hit your target alcohol percentage. All calculations run in your browser — no login, no uploads.',
      ko: '초기 비중(OG)과 최종 비중(FG)으로 예상 도수(ABV)를 계산합니다. 목표 도수로 희석할 때 필요한 물의 양도 자동으로 계산됩니다. 모든 계산은 브라우저에서 처리되며 로그인이 필요 없습니다.',
    },
    keywords: {
      en: [
        'homebrew ABV calculator',
        'homebrew recipe calculator',
        'original gravity final gravity ABV',
        'OG FG calculator',
        'beer ABV calculator',
        'homebrew dilution calculator',
        'specific gravity alcohol calculator',
        'homebrewing tools',
        'beer gravity calculator',
        'ABV from gravity',
        'hydrometer',
        'specific gravity',
        'og fg calculator',
        'original gravity final gravity',
      ],
      ko: [
        '홈브루 도수 계산기',
        '홈브루 레시피 계산기',
        'OG FG 도수 계산',
        '비중 도수 계산기',
        '맥주 도수 계산기',
        '홈브루 희석 계산기',
        '초기 비중 최종 비중',
        '홈브루잉 계산기',
        '비중계',
        '비중 도수',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'How do I measure Original Gravity (OG) and Final Gravity (FG)?',
          ko: 'OG(초기 비중)와 FG(최종 비중)는 어떻게 측정하나요?',
        },
        answer: {
          en: 'Original Gravity (OG) is measured before pitching yeast, once your wort has cooled to room temperature. Final Gravity (FG) is measured after fermentation is complete — usually when gravity readings are stable over two consecutive days. Both are measured with a hydrometer (dropped into a sample cylinder) or a refractometer (a drop placed on the prism). Hydrometers are generally more accurate for FG since alcohol affects refractometer readings.',
          ko: 'OG(초기 비중)는 효모를 투입하기 전, 워트가 실온으로 식은 후에 측정합니다. FG(최종 비중)는 발효가 완료된 후 측정하며, 보통 이틀 연속으로 비중값이 변하지 않을 때 발효가 끝났다고 판단합니다. 측정 도구는 비중계(샘플 실린더에 담가 측정)나 굴절계(한 방울을 프리즘에 올려 측정)를 사용합니다. 알코올이 굴절계 수치에 영향을 주므로 FG 측정에는 비중계가 더 정확합니다.',
        },
      },
      {
        question: {
          en: 'Why does the calculated ABV differ slightly from the actual ABV on the bottle?',
          ko: '계산된 도수가 실제 병에 표기된 도수와 왜 약간 다를 수 있나요?',
        },
        answer: {
          en: 'The formula ABV ≈ (OG − FG) × 131.25 is a standard homebrewing approximation that works well for most beers in the typical 3–10% ABV range. It can deviate by ±0.1–0.3% from the true value. For very high-gravity beers (OG above 1.100), a more complex Brix-corrected formula is more accurate. Commercial breweries also use lab analysis (gas chromatography or ebulliometry) to certify exact ABV on labels, which is far more precise than any gravity-based formula.',
          ko: 'ABV ≈ (OG − FG) × 131.25 공식은 도수 3~10% 범위의 일반적인 맥주에서 잘 맞는 표준 홈브루잉 근사식입니다. 실제 도수와 ±0.1~0.3% 정도 차이가 날 수 있습니다. OG가 1.100을 넘는 고중력 맥주라면 보정 공식을 쓰는 것이 더 정확합니다. 상업 양조장은 라벨의 도수를 가스 크로마토그래피나 에뷸리오미터 같은 실험실 분석으로 측정하기 때문에 훨씬 정밀합니다.',
        },
      },
      {
        question: {
          en: 'Will diluting my beer affect the flavour, not just the ABV?',
          ko: '맥주를 희석하면 도수뿐 아니라 맛도 변하나요?',
        },
        answer: {
          en: 'Yes, dilution affects much more than ABV. Adding water proportionally reduces hop bitterness (IBUs), malt flavour intensity, body, and colour. For highly hopped or strongly flavoured beers, even a 5–10% dilution can noticeably thin the body and soften bitterness. Brewers who routinely dilute high-gravity beers (a technique called "high-gravity brewing") account for this by over-hopping and over-malting the base batch. For homebrewers, it is worth doing a small test blend before diluting the full batch to check whether the result meets your expectations.',
          ko: '네, 희석은 도수 외에도 많은 것을 변화시킵니다. 물을 추가하면 홉 쓴맛(IBU), 맥아 풍미 강도, 바디감, 색도가 비례적으로 줄어듭니다. 홉이 강하거나 풍미가 진한 맥주는 5~10% 희석만으로도 바디가 얇아지고 쓴맛이 부드러워지는 것을 느낄 수 있습니다. 고중력 맥주를 희석하는 양조 기법(하이 그래비티 브루잉)을 쓰는 양조장은 처음부터 홉과 맥아를 더 넣어 이를 보완합니다. 홈브루어라면 전체 배치를 희석하기 전에 소량으로 블렌딩 테스트를 해보는 것을 권장합니다.',
        },
      },
      {
        question: {
          en: 'When should I use the standard formula vs. the high-gravity formula?',
          ko: '표준 공식과 고비중 공식은 언제 다르게 써야 하나요?',
        },
        answer: {
          en: 'For most homebrews with an Original Gravity (OG) below about 1.070, the two formulas give results within 0.1–0.2% of each other — either one is fine. Above OG 1.070 (barleywine, imperial stout, Belgian tripel, etc.), the standard linear formula (ABV ≈ (OG − FG) × 131.25) tends to underestimate ABV because it does not account for the non-linear relationship between gravity and alcohol at higher concentrations. The high-gravity non-linear formula compensates for this and is generally considered more accurate for strong beers. That said, both are still approximations — the only way to certify exact ABV is laboratory analysis.',
          ko: 'OG(초기 비중)가 약 1.070 미만인 대부분의 홈브루에서는 두 공식의 결과 차이가 0.1~0.2% 수준이라 어느 쪽을 써도 크게 다르지 않습니다. OG 1.070 이상(배리와인, 임페리얼 스타우트, 벨기에 트리펠 등)인 고비중 맥주에서는 표준 선형 공식(ABV ≈ (OG − FG) × 131.25)이 고농도 구간의 비선형 관계를 반영하지 못해 도수를 과소 추정하는 경향이 있습니다. 고비중 비선형 보정 공식은 이 점을 보정하므로 강한 맥주에서 더 정확한 것으로 알려져 있습니다. 그러나 두 공식 모두 근사치이며, 정확한 도수를 확인하려면 실험실 분석이 필요합니다.',
        },
      },
    ],
    relatedToolIds: ['bac-calculator', 'hydrometer-temperature-correction'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/homebrew-recipe-calculator.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-03',
    popular: false,
  },
  {
    id: 'growth-percentile',
    slug: 'growth-percentile',
    category: 'baby',
    title: {
      en: 'Baby Growth Percentile Calculator',
      ko: '아기 성장 백분위 계산기',
    },
    description: {
      en: 'Calculate your baby\'s weight and height/length percentiles (0–60 months) using WHO or CDC growth standards. Enter sex, age, weight, and height to instantly see where your child falls on the growth chart. For informational reference only — always consult a paediatrician for clinical assessment.',
      ko: '아기의 체중과 신장(키) 백분위를 WHO 또는 CDC 성장 기준표에 따라 계산합니다(0~60개월). 성별, 나이, 체중, 키를 입력하면 성장 차트 위치를 즉시 확인할 수 있습니다. 참고용 정보이며 실제 평가는 소아과 전문의와 상담하세요.',
    },
    keywords: {
      en: [
        'baby growth percentile calculator',
        'infant growth chart',
        'WHO growth standards',
        'CDC growth chart',
        'baby weight percentile',
        'baby height percentile',
        'child growth calculator',
        'percentile chart baby',
        'baby development tracker',
        'infant weight chart',
      ],
      ko: [
        '아기 성장 백분위 계산기',
        '영아 성장 차트',
        'WHO 성장 기준',
        'CDC 성장 차트',
        '아기 체중 백분위',
        '아기 키 백분위',
        '소아 성장 계산기',
        '아이 성장 추적',
        '신생아 성장 기준표',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Is a low percentile (e.g., 10th) a sign that something is wrong?',
          ko: '백분위가 낮으면(예: 10백분위) 문제가 있는 건가요?',
        },
        answer: {
          en: 'No, not necessarily. Percentile simply shows how your child compares to a reference population — a child at the 10th percentile for weight is not unhealthy; it means 10% of children of the same age and sex weigh the same or less. A wide range from approximately the 3rd to the 97th percentile is considered typical. What matters most is whether your child\'s growth curve is following a consistent trend over time. If you have concerns about your child\'s growth pattern, please consult a qualified paediatrician.',
          ko: '아니오, 반드시 그렇지는 않습니다. 백분위는 단순히 같은 나이와 성별의 기준 집단과 비교했을 때의 위치를 나타냅니다. 체중 10백분위는 건강하지 않다는 의미가 아니라, 같은 나이·성별 아이 중 10%가 같거나 더 적게 나간다는 뜻입니다. 대략 3백분위에서 97백분위 사이의 범위는 일반적으로 정상 범위로 봅니다. 가장 중요한 것은 시간이 지나면서 성장 곡선이 일관된 추세를 따르는지 여부입니다. 아이의 성장 패턴에 대해 걱정이 된다면 소아과 전문의와 상담하세요.',
        },
      },
      {
        question: {
          en: 'What is the difference between WHO and CDC growth standards?',
          ko: 'WHO 기준과 CDC 기준의 차이는 무엇인가요?',
        },
        answer: {
          en: 'The WHO Child Growth Standards (2006) describe how children should grow under optimal conditions (exclusive breastfeeding, non-smoking environment, good healthcare). The data was collected from six countries across diverse regions. The CDC Growth Charts (2000) are based on a US national reference population that includes both breastfed and formula-fed children. WHO standards are generally recommended for children under 2 years globally, while CDC charts are commonly used in US clinical settings for children 2 years and older.',
          ko: 'WHO 아동 성장 기준(2006)은 이상적인 환경(완전 모유수유, 비흡연 환경, 적절한 의료)에서 아이가 어떻게 자라야 하는지를 기술하며 다양한 지역 6개국에서 수집한 데이터를 바탕으로 합니다. CDC 성장 차트(2000)는 모유수유 아동과 분유수유 아동을 모두 포함한 미국 국가 참조 집단을 기반으로 합니다. 일반적으로 WHO 기준은 전 세계 2세 미만 아동에게, CDC 기준은 미국의 2세 이상 아동 임상 환경에서 주로 사용됩니다.',
        },
      },
      {
        question: {
          en: 'How accurate is this calculator?',
          ko: '이 계산기는 얼마나 정확한가요?',
        },
        answer: {
          en: 'This calculator uses the standard LMS (Lambda-Mu-Sigma) method with published WHO and CDC reference parameters, which is the same statistical method used in clinical growth chart software. Percentile values are interpolated linearly between published data points at monthly or 3-month intervals. The results are sufficiently accurate for reference purposes, but minor differences from other tools may occur due to interpolation. This tool is not a substitute for clinical assessment by a healthcare professional.',
          ko: '이 계산기는 공인된 WHO 및 CDC 참조 파라미터를 사용하는 표준 LMS(람다-뮤-시그마) 방법을 사용하며, 이는 임상 성장 차트 소프트웨어에서 사용하는 것과 동일한 통계적 방법입니다. 백분위 값은 월 또는 3개월 간격의 공개 데이터 포인트 사이를 선형 보간하여 계산됩니다. 결과는 참고용으로 충분히 정확하지만 보간 방식으로 인해 다른 도구와 약간 차이가 날 수 있습니다. 이 도구는 의료 전문가의 임상 평가를 대체하지 않습니다.',
        },
      },
    ],
    relatedToolIds: ['sleep-schedule', 'height-predictor'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/growth-percentile.png',
    status: 'testing',
    disclaimerType: 'medical',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-04',
    popular: false,
  },
  {
    id: 'sleep-schedule',
    slug: 'sleep-schedule',
    category: 'baby',
    title: {
      en: 'Baby Sleep Schedule Calculator',
      ko: '아기 수면 일정 계산기',
    },
    description: {
      en: 'Enter your baby\'s age and today\'s wake-up time to get a recommended nap schedule and bedtime — based on age-appropriate wake windows and nap durations. For general reference only; always consult a paediatrician for individual sleep concerns.',
      ko: '아기의 개월수와 오늘 기상 시각을 입력하면 연령에 맞는 낮잠 일정과 권장 취침 시각을 계산합니다. 일반적인 가이드라인이며 개별 수면 문제는 소아과 전문의와 상담하세요.',
    },
    keywords: {
      en: [
        'baby sleep schedule calculator',
        'nap time calculator',
        'baby wake window',
        'infant sleep schedule',
        'baby bedtime calculator',
        'how many naps baby',
        'newborn sleep schedule',
        'baby nap schedule by age',
        'wake window by age',
        'baby sleep guide',
      ],
      ko: [
        '아기 수면 일정 계산기',
        '낮잠 시간 계산기',
        '웨이크 윈도우',
        '아기 수면 스케줄',
        '아기 취침 시간 계산기',
        '개월수별 낮잠 횟수',
        '신생아 수면 일정',
        '아기 낮잠 스케줄',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'What is a wake window?',
          ko: 'Wake window(깨어있는 시간)란 무엇인가요?',
        },
        answer: {
          en: 'A wake window is the amount of time a baby can comfortably stay awake between sleep periods before becoming overtired. Wake windows increase as babies grow — newborns can only manage around 60 minutes, while a 12-month-old may handle 3 hours. Keeping within age-appropriate wake windows helps babies fall asleep more easily and sleep more soundly, because overtired babies often become harder to settle and sleep more briefly.',
          ko: '웨이크 윈도우(wake window)는 아기가 피로해지기 전까지 수면 사이에 깨어 있을 수 있는 시간을 말합니다. 성장하면서 점점 길어지는데, 신생아는 약 60분, 12개월 아기는 약 3시간 정도입니다. 연령에 맞는 웨이크 윈도우를 지키면 아기가 더 쉽게 잠들고 깊이 잘 수 있습니다. 지나치게 피로해진 아기는 오히려 잠들기 어렵고 짧게 자는 경우가 많습니다.',
        },
      },
      {
        question: {
          en: 'My baby refuses to nap — what should I do?',
          ko: '아기가 낮잠을 자려고 하지 않아요. 어떻게 해야 하나요?',
        },
        answer: {
          en: 'Occasional nap refusals are normal, especially during developmental leaps, illness, or when the schedule needs adjusting for a growth stage. Try these general tips: put baby down drowsy but awake; keep the sleep environment dark and quiet; use a consistent pre-nap routine (e.g. feed, change, a short song). If nap refusals are persistent or accompanied by signs of discomfort, it is worth discussing with a paediatrician, as ear infections or other health issues can affect sleep.',
          ko: '발달 급성장기, 아픔, 또는 성장 단계에 맞춰 일정을 조정해야 할 때 낮잠 거부는 간헐적으로 나타날 수 있습니다. 일반적인 팁: 졸릴 때 눕히되 완전히 잠들기 전에 내려놓기, 어둡고 조용한 수면 환경 유지, 일관된 낮잠 전 루틴(수유 → 기저귀 교체 → 짧은 자장가 등)을 만들어 보세요. 낮잠 거부가 지속되거나 불편함의 징후가 동반된다면 중이염 등 건강 문제일 수 있으므로 소아과 상담을 권장합니다.',
        },
      },
      {
        question: {
          en: 'When should I adjust the schedule as my baby gets older?',
          ko: '개월수가 바뀌면 언제 스케줄을 조정해야 하나요?',
        },
        answer: {
          en: 'The main nap transition milestones to watch for are: around 3–4 months (5 naps → 4), around 6 months (4 → 3), around 9 months (3 → 2), and around 15–18 months (2 → 1). Signs that a transition is due include consistently fighting naps, taking much longer to fall asleep, or waking very early in the morning. Transitions often take 1–4 weeks to settle. During that time, an "emergency nap" capped at 20–30 minutes can bridge a bad day without disrupting the new schedule.',
          ko: '주요 낮잠 전환 시기는 다음과 같습니다: 생후 3–4개월(5회→4회), 6개월(4회→3회), 9개월(3회→2회), 15–18개월(2회→1회). 전환 신호로는 지속적인 낮잠 거부, 잠드는 데 오래 걸림, 이른 새벽 기상 등이 있습니다. 전환 기간은 보통 1–4주이며, 힘든 날에는 20–30분짜리 "긴급 낮잠"으로 하루를 버티되 새 일정을 유지하는 것이 도움이 됩니다.',
        },
      },
    ],
    relatedToolIds: ['growth-percentile', 'height-predictor', 'temperament-quiz'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/sleep-schedule.png',
    status: 'testing',
    disclaimerType: 'medical',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-04',
    popular: false,
  },
  {
    id: 'height-predictor',
    slug: 'height-predictor',
    category: 'baby',
    title: {
      en: 'Child Height Predictor',
      ko: '자녀 키 예측기',
    },
    description: {
      en: "Estimate your child's predicted adult height using the Mid-Parental Height method (Tanner, Goldstein & Whitehouse, 1970). Enter both parents' heights to get an evidence-based prediction with a statistical range. For reference only — consult a paediatrician for clinical assessment.",
      ko: '중간부모키(Mid-Parental Height) 방법(Tanner, Goldstein & Whitehouse, 1970)을 사용해 자녀의 성인 예상 키를 추정합니다. 부모 두 분의 키를 입력하면 통계적 범위와 함께 근거 기반 예측값을 확인할 수 있습니다. 참고용이며 정확한 평가는 소아과 전문의와 상담하세요.',
    },
    keywords: {
      en: [
        'child height predictor',
        'predicted adult height calculator',
        'mid-parental height',
        'how tall will my child be',
        'baby height prediction',
        'genetics height calculator',
        'parent height child height',
        'future height calculator',
        'height prediction formula',
        'Tanner height method',
      ],
      ko: [
        '자녀 키 예측',
        '성인 키 예측 계산기',
        '중간부모키',
        '아이 키 예측',
        '부모 키로 자녀 키 계산',
        '아이 미래 키',
        '유전 키 계산기',
        '예상 키 계산',
        '키 예측 공식',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'How accurate is this height prediction?',
          ko: '이 키 예측은 얼마나 정확한가요?',
        },
        answer: {
          en: 'The prediction is based on the Mid-Parental Height method (Tanner, Goldstein & Whitehouse, 1970, Archives of Disease in Childhood). The ±8.5cm range represents the 3rd–97th percentile of expected adult height as defined in the original paper — not a 68% confidence interval. Later research has sometimes quoted ±9cm for girls or ±10cm for boys. The method gives a useful statistical estimate but cannot account for individual factors such as nutrition, sleep, chronic illness, or hormonal differences. It is a starting point, not a diagnosis.',
          ko: '예측은 중간부모키(Mid-Parental Height) 방법(Tanner, Goldstein & Whitehouse, 1970, Archives of Disease in Childhood)을 기반으로 합니다. ±8.5cm 범위는 원 논문에서 정의한 예상 성인 키의 3~97 백분위 구간을 의미하며, 68% 신뢰구간이 아닙니다. 이후 연구에서는 여아 ±9cm, 남아 ±10cm로 세분화하기도 했습니다. 이 방법은 유용한 통계적 추정치를 제공하지만, 영양, 수면, 만성질환, 호르몬 차이 같은 개인적 요인은 반영하지 못합니다. 진단이 아닌 참고용 출발점입니다.',
        },
      },
      {
        question: {
          en: 'How is this different from the Baby Growth Percentile Calculator?',
          ko: '이 계산기와 아기 성장 백분위 계산기는 무엇이 다른가요?',
        },
        answer: {
          en: "The Child Height Predictor estimates your child's predicted adult height based on both parents' heights using the Mid-Parental Height formula. The Baby Growth Percentile Calculator, on the other hand, shows how your baby's current measurements (weight and height) compare to age-matched peers using WHO or CDC growth reference charts. In short: this tool predicts future adult stature; the other tool evaluates current growth against a population standard.",
          ko: '자녀 키 예측기는 중간부모키 공식을 사용해 부모 키를 기반으로 자녀의 예상 성인 키를 추정합니다. 반면 아기 성장 백분위 계산기는 WHO 또는 CDC 성장 기준표를 이용해 아기의 현재 체중과 키가 또래와 비교해 어느 위치에 있는지를 보여줍니다. 요약하면, 이 도구는 미래 성인 키를 예측하고, 다른 도구는 현재 성장을 집단 기준과 비교합니다.',
        },
      },
      {
        question: {
          en: 'What factors beyond genetics influence how tall a child grows?',
          ko: '유전 외에 자녀의 키에 영향을 주는 요인은 무엇인가요?',
        },
        answer: {
          en: "Genetics accounts for roughly 60–80% of adult height variation. The remaining 20–40% is influenced by environmental factors including nutrition (adequate protein, calcium, vitamin D, and zinc), sleep quality (growth hormone is released primarily during deep sleep), overall health (unmanaged chronic conditions such as coeliac disease, hypothyroidism, or growth hormone deficiency can impair growth), and psychosocial wellbeing. A paediatrician can evaluate whether a child is growing consistently with their genetic potential.",
          ko: '유전은 성인 키 변동의 약 60~80%를 차지합니다. 나머지 20~40%는 영양(단백질, 칼슘, 비타민D, 아연 충분 섭취), 수면의 질(성장호르몬은 주로 깊은 수면 중 분비됨), 전반적인 건강 상태(셀리악병, 갑상선 기능저하, 성장호르몬 결핍 등 관리되지 않은 만성질환은 성장을 저해할 수 있음), 심리사회적 안녕 등 환경적 요인의 영향을 받습니다. 소아과 전문의는 아이가 유전적 잠재치에 맞게 성장하고 있는지 평가할 수 있습니다.',
        },
      },
      {
        question: {
          en: "Can practising the checklist factors help my child grow taller than the predicted height?",
          ko: '체크리스트 항목을 실천하면 예측 키보다 더 클 수 있나요?',
        },
        answer: {
          en: 'No. The checklist is a general health reference to help children reach their genetic potential — not a method to exceed it. The Mid-Parental Height formula already estimates the genetic ceiling. Adequate sleep, nutrition, physical activity, and regular check-ups help children approach that ceiling, especially if there are manageable limiting factors, but they do not guarantee growth beyond the predicted range.',
          ko: '아닙니다. 체크리스트는 아이가 유전적 잠재치에 가깝게 자라도록 돕는 일반적인 건강 정보이며, 그 한계를 초과하는 방법이 아닙니다. 중간부모키 공식은 이미 유전적 상한선을 추정합니다. 충분한 수면, 영양, 신체활동, 정기 검진은 관리 가능한 제한 요인이 있을 때 특히 아이가 그 상한선에 가깝게 도달하도록 돕지만, 예측 범위를 초과하는 성장을 보장하지는 않습니다.',
        },
      },
    ],
    relatedToolIds: ['growth-percentile', 'sleep-schedule', 'temperament-quiz'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/height-predictor.png',
    status: 'testing',
    disclaimerType: 'medical',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-09',
    popular: false,
  },
  {
    id: 'flight-delay-compensation',
    slug: 'flight-delay-compensation',
    category: 'travel',
    title: {
      en: 'Flight Delay Compensation Calculator',
      ko: '항공편 지연 보상 계산기',
    },
    description: {
      en: 'Find out if your delayed, cancelled, or denied-boarding flight qualifies for compensation under EU Regulation 261/2004 or US DOT rules. Select your regulation, disruption type, route distance, and delay duration to get an instant estimate — no sign-up required.',
      ko: 'EU 규정 261/2004 또는 미국 DOT 규정에 따라 지연, 취소 또는 탑승거부된 항공편에 대한 보상을 받을 수 있는지 확인하세요. 규정, 혼란 유형, 노선 거리, 지연 시간을 선택하면 즉시 추정 보상액을 확인할 수 있습니다 — 가입 불필요.',
    },
    keywords: {
      en: [
        'flight delay compensation',
        'EU261 calculator',
        'flight delay refund',
        'airline compensation calculator',
        'EU regulation 261',
        'flight delay rights',
        'passenger rights EU',
        'flight compensation claim',
        'delayed flight payout',
        'airline delay refund calculator',
        'flight cancellation compensation calculator',
        'delayed flight compensation',
        'eu261 compensation table',
        'denied boarding compensation',
        'involuntary bumping compensation',
        'overbooking compensation calculator',
      ],
      ko: [
        '항공 지연 보상',
        'EU261 보상 계산기',
        '항공편 지연 환불',
        '항공사 보상금',
        'EU 규정 261/2004',
        '승객 권리',
        '항공 지연 청구',
        '항공 지연 환불 계산기',
        '항공편 취소 보상',
        '탑승거부 보상',
        '오버부킹 보상',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'What conditions must be met for EU261 compensation to apply?',
          ko: 'EU261 보상을 받으려면 어떤 조건이 충족되어야 하나요?',
        },
        answer: {
          en: 'EU Regulation 261/2004 applies when your flight departs from an EU airport (regardless of airline) or arrives at an EU airport on an EU-based carrier. You must also have a confirmed reservation, have checked in on time, and your arrival delay must be 3 hours or more. Compensation is not owed for delays caused by extraordinary circumstances such as severe weather or ATC strikes.',
          ko: 'EU 규정 261/2004는 EU 공항에서 출발하는 모든 항공편(항공사 무관)이거나, EU 항공사가 운항하는 EU 도착 항공편에 적용됩니다. 또한 예약이 확인된 상태에서 제시간에 체크인했고, 도착 지연이 3시간 이상이어야 합니다. 기상 이변이나 ATC 파업 같은 비상 상황으로 인한 지연에는 보상 의무가 없습니다.',
        },
      },
      {
        question: {
          en: 'If the delay was caused by bad weather, can I still claim compensation?',
          ko: '악천후로 인한 지연이라면 보상을 청구할 수 있나요?',
        },
        answer: {
          en: 'Generally, no. Under EU261, delays caused by "extraordinary circumstances" — including severe weather, security threats, air traffic control strikes, or political instability — exempt the airline from paying fixed compensation. However, the airline must still provide care such as meals and refreshments regardless of the cause. If the airline claims force majeure but you believe it was preventable, you can challenge the decision through national enforcement bodies or passenger rights services.',
          ko: '일반적으로 그렇지 않습니다. EU261에 따르면 기상 이변, 보안 위협, ATC 파업, 정치적 불안 등 "비상 상황"으로 인한 지연은 항공사의 보상 의무를 면제합니다. 다만 원인과 무관하게 항공사는 식사 및 다과 등 기본 케어를 제공해야 합니다. 항공사가 불가항력을 주장하지만 예방 가능했다고 판단되면, 각국 집행 기관이나 승객 권리 서비스에 이의를 제기할 수 있습니다.',
        },
      },
      {
        question: {
          en: 'What rules apply to flights in the United States?',
          ko: '미국 항공편에는 어떤 규정이 적용되나요?',
        },
        answer: {
          en: "Unlike the EU, the United States does not have a federal law mandating fixed cash compensation for flight delays or cancellations. Airlines set their own delay compensation policies under their customer service plans (14 CFR Part 259). However, the US does mandate compensation for involuntary denied boarding (overbooking) under 14 CFR § 250.5 — use the Denied Boarding option in this calculator to estimate that amount.",
          ko: "EU와 달리 미국에는 항공편 지연이나 취소에 대한 법적 고정 보상금을 의무화하는 연방법이 없습니다. 항공사는 14 CFR Part 259에 따라 고객 서비스 플랜을 자체적으로 정합니다. 단, 미국은 비자발적 탑승거부(오버부킹)에 대해서는 14 CFR § 250.5에 따른 보상을 의무화하고 있습니다 — 이 계산기의 '탑승거부' 옵션을 선택해 예상 보상액을 확인하세요.",
        },
      },
      {
        question: {
          en: 'Can I get compensation for a cancelled flight?',
          ko: '취소된 항공편도 보상받을 수 있나요?',
        },
        answer: {
          en: 'Under EU261, cancelled flights are covered by the same distance-based compensation table as delays (€250 / €400 / €600 depending on route distance), provided the cancellation was due to airline fault rather than extraordinary circumstances. US DOT does not mandate fixed compensation for cancellations — contact your airline for their voluntary policy.',
          ko: 'EU261에 따르면 취소된 항공편은 지연과 동일한 거리 기반 보상표(노선 거리에 따라 €250 / €400 / €600)가 적용됩니다. 단, 취소 원인이 불가항력이 아닌 항공사 귀책이어야 합니다. 미국 DOT는 취소에 대한 법적 고정 보상금을 의무화하지 않으므로 항공사에 자체 정책을 확인하세요.',
        },
      },
      {
        question: {
          en: 'Can I check denied boarding (overbooking) compensation with this calculator?',
          ko: '탑승거부(오버부킹)도 이 계산기로 확인할 수 있나요?',
        },
        answer: {
          en: 'Yes. Select "Denied Boarding" as the disruption type. Under EU261, involuntary bumping uses the same distance-based compensation as delays and cancellations — and importantly, airlines cannot use force majeure as a defence for overbooking. Under US DOT (14 CFR § 250.5), denied boarding compensation is completely different: it is based on your one-way fare (200% or 400%, capped at $1,075 or $2,150), not on flight distance. The calculator handles both regulations separately.',
          ko: '네. 혼란 유형에서 "탑승거부"를 선택하세요. EU261에서는 비자발적 탑승거부가 지연·취소와 동일한 거리 기반 보상을 적용받으며, 항공사는 오버부킹에 불가항력을 항변으로 사용할 수 없습니다. 미국 DOT(14 CFR § 250.5)에서는 탑승거부 보상이 완전히 다릅니다: 비행 거리가 아닌 편도 운임의 200% 또는 400%(각각 $1,075 또는 $2,150 상한)로 계산됩니다. 이 계산기는 두 규정을 별도로 처리합니다.',
        },
      },
    ],
    relatedToolIds: ['visa-requirement-checker', 'layover-connection-calculator', 'jetlag-recovery-calculator'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/flight-delay-compensation.png',
    status: 'testing',
    disclaimerType: 'legal',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-03',
    popular: false,
  },
  {
    id: 'temperament-quiz',
    slug: 'temperament-quiz',
    category: 'baby',
    title: {
      en: 'Baby Temperament Type Quiz',
      ko: '아기 기질 유형 테스트',
    },
    description: {
      en: "Discover your baby's natural temperament type through 20 fun questions. Based on Thomas & Chess's landmark temperament research, this quiz identifies which of 16 personality styles best fits your little one — with tailored parenting tips for each type. For entertainment and general reference only.",
      ko: '20개의 재미있는 질문으로 아기의 타고난 기질 유형을 발견해보세요. Thomas & Chess의 기질 연구를 바탕으로, 16가지 성향 유형 중 우리 아이에게 가장 잘 맞는 유형을 찾고 맞춤형 육아 팁을 확인하세요. 재미 및 일반 참고용입니다.',
    },
    keywords: {
      en: [
        'baby temperament quiz',
        'baby personality type',
        'infant temperament test',
        'toddler temperament quiz',
        'Thomas Chess temperament',
        'baby behavior quiz',
        'child temperament types',
        'parenting style quiz',
        'baby personality quiz',
        'temperament test for babies',
      ],
      ko: [
        '아기 기질 테스트',
        '아기 성격 유형',
        '영아 기질 검사',
        '유아 기질 테스트',
        'Thomas Chess 기질',
        '아기 행동 유형',
        '아이 기질 유형',
        '육아 스타일 테스트',
        '아기 성향 테스트',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Is this quiz a real developmental screening test?',
          ko: '이 테스트는 실제 발달 선별검사인가요?',
        },
        answer: {
          en: "No. This quiz is designed for entertainment and general reflection, not clinical diagnosis. It is not equivalent to standardised developmental screening tools such as the ASQ (Ages and Stages Questionnaire) or similar validated instruments. The results give you a fun framework to think about your child's natural tendencies, but they cannot detect developmental delays or disorders. If you have concerns about your child's development, please consult a paediatrician.",
          ko: '아닙니다. 이 테스트는 재미와 일반적인 관찰을 위해 만들어진 것이며 임상적 진단 도구가 아닙니다. ASQ(Ages and Stages Questionnaire) 같은 표준화된 발달선별검사와 동일하지 않습니다. 결과는 아이의 자연스러운 성향을 생각해볼 수 있는 재미있는 틀을 제공하지만, 발달 지연이나 장애를 감지할 수 없습니다. 아이의 발달에 대해 걱정되는 부분이 있으면 소아과 전문의와 상담하세요.',
        },
      },
      {
        question: {
          en: 'Can the results change over time?',
          ko: '결과가 시간이 지나면 달라질 수 있나요?',
        },
        answer: {
          en: "Yes, and that's completely normal. Temperament has a biological basis, but how it expresses itself can shift as your child grows, reaches new developmental milestones, or as their environment changes. Different caregivers may also answer the questions differently based on their own observations. Retaking the quiz every few months can be a fun way to see how your child's tendencies are evolving.",
          ko: '네, 완전히 정상입니다. 기질에는 생물학적 기반이 있지만, 아이가 성장하고 새로운 발달 단계를 거치거나 환경이 바뀌면서 표현 방식이 달라질 수 있습니다. 양육자마다 각자의 관찰을 바탕으로 다르게 답할 수도 있어요. 몇 달마다 다시 테스트해보면 아이의 성향이 어떻게 발전하는지 확인하는 재미있는 방법이 됩니다.',
        },
      },
      {
        question: {
          en: 'What is the Thomas & Chess temperament theory?',
          ko: 'Thomas & Chess 기질 이론이 무엇인가요?',
        },
        answer: {
          en: "Alexander Thomas and Stella Chess conducted the New York Longitudinal Study (NYLS) starting in 1956, following children from infancy into adulthood. They identified nine dimensions of temperament — including activity level, adaptability, approach/withdrawal, intensity of reaction, and mood quality — and found that these traits were relatively stable over time. Their 1977 book Temperament and Development is a landmark in developmental psychology. This quiz adapts four of those dimensions into a playful format. The original nine-dimension clinical framework has been simplified for entertainment purposes.",
          ko: 'Alexander Thomas와 Stella Chess는 1956년부터 아동을 유아기부터 성인기까지 추적한 뉴욕종단연구(NYLS)를 진행했습니다. 이들은 활동 수준, 적응력, 접근-회피, 반응 강도, 기분의 질 등 9개의 기질 차원을 규명했으며, 이러한 특성이 시간이 지나도 비교적 안정적임을 발견했습니다. 1977년 저서 《Temperament and Development》는 발달심리학의 중요한 이정표입니다. 이 테스트는 그 중 4개 차원을 재미있는 형태로 재구성한 것입니다. 원래의 9차원 임상 프레임워크는 오락 목적으로 단순화되었습니다.',
        },
      },
      {
        question: {
          en: 'From what age can I use this quiz?',
          ko: '몇 살부터 이 테스트를 할 수 있나요?',
        },
        answer: {
          en: "This quiz supports three age bands: 4–12 months (infant), 13–36 months (toddler), and 37–84 months (3–7 years). We do not support the 0–3 month range because temperament differences are not yet clearly observable in the very early newborn period. If your baby is under 4 months old, come back after they have had a few more months to show their personality!",
          ko: '이 테스트는 4–12개월(영아기), 13–36개월(유아기), 37–84개월(3–7세, 유치원기)의 세 가지 연령 구간을 지원합니다. 0–3개월은 아직 기질 차이가 뚜렷하게 나타나기 전이라 지원하지 않습니다. 아기가 생후 4개월이 안 됐다면, 조금 더 기다렸다가 해보세요!',
        },
      },
    ],
    relatedToolIds: ['growth-percentile', 'sleep-schedule'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/temperament-quiz.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-09',
    popular: false,
  },
  {
    id: 'hydrometer-temperature-correction',
    slug: 'hydrometer-temperature-correction',
    category: 'beer',
    title: {
      en: 'Hydrometer Temperature Correction Calculator',
      ko: '비중계 온도 보정 계산기',
    },
    description: {
      en: 'Correct your hydrometer reading for sample temperature. Enter your measured gravity, the actual sample temperature, and your hydrometer\'s calibration temperature to get an accurate specific gravity. Supports 59°F (15°C) and 68°F (20°C) calibration presets. All calculations run in your browser — no login, no uploads.',
      ko: '비중계 측정값을 시료 온도에 맞게 보정합니다. 측정된 비중, 실제 시료 온도, 비중계의 기준온도를 입력하면 보정된 비중을 즉시 계산합니다. 59°F(15°C) 및 68°F(20°C) 기준온도 프리셋을 지원합니다. 모든 계산은 브라우저에서 처리되며 로그인이 필요 없습니다.',
    },
    keywords: {
      en: [
        'hydrometer temperature correction calculator',
        'hydrometer calculator',
        'specific gravity correction',
        'gravity correction calculator',
        'og calculator',
        'hydrometer reading correction',
        'specific gravity temperature adjustment',
        'homebrewing hydrometer',
        'gravity correction formula',
        'temperature compensated hydrometer',
      ],
      ko: [
        '비중계 온도 보정 계산기',
        '비중계 보정',
        '비중 온도 보정',
        '홈브루 비중 보정',
        '비중계 계산기',
        '보정 비중 계산',
        '시료 온도 보정',
        '비중 보정 공식',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Why does temperature affect hydrometer readings?',
          ko: '왜 온도가 비중계 수치에 영향을 미치나요?',
        },
        answer: {
          en: 'A hydrometer measures the density of liquid relative to water. Water\'s density changes with temperature — it becomes less dense as it warms above 39°F (4°C). When you take a reading at a temperature different from the hydrometer\'s calibration temperature, the density of water itself has shifted, so the raw reading no longer reflects the true specific gravity of your wort or beer. The temperature correction formula accounts for this thermal expansion effect.',
          ko: '비중계는 물에 대한 상대 밀도를 측정합니다. 물의 밀도는 온도에 따라 변하는데, 39°F(4°C) 이상에서 온도가 높아질수록 밀도가 낮아집니다. 비중계의 기준온도와 다른 온도에서 측정하면 물 자체의 밀도가 달라지므로 원시 수치가 실제 비중을 정확히 반영하지 않습니다. 온도 보정 공식은 이 열팽창 효과를 보정합니다.',
        },
      },
      {
        question: {
          en: 'How do I know which calibration temperature my hydrometer uses?',
          ko: '내 비중계의 기준온도를 어떻게 알 수 있나요?',
        },
        answer: {
          en: 'Check the label or stem of your hydrometer — the calibration temperature is usually printed directly on it. Most US-manufactured hydrometers are calibrated at 60°F (15.6°C) or 59°F (15°C), while many European hydrometers use 68°F (20°C). If you cannot find it, 59°F (15°C) is the most common and a safe default for US homebrew hydrometers.',
          ko: '비중계의 라벨이나 몸체를 확인하세요 — 기준온도가 보통 직접 표시되어 있습니다. 미국 제조 비중계는 대부분 60°F(15.6°C) 또는 59°F(15°C)를 기준으로 하고, 유럽 비중계는 68°F(20°C)를 많이 사용합니다. 확인할 수 없다면 59°F(15°C)가 미국 홈브루 비중계에서 가장 일반적인 기본값입니다.',
        },
      },
      {
        question: {
          en: 'What is the source of this correction formula?',
          ko: '이 보정 공식의 출처는 무엇인가요?',
        },
        answer: {
          en: 'The polynomial correction formula used here is the brewing industry\'s established standard — widely cited and used by authoritative references like Brewer\'s Friend, MoreBeer, and other professional homebrewing tools. Its derivation traces back to early research on water density vs. temperature. While pinpointing a single original academic publication is difficult (multiple researchers have independently derived similar approximations), the formula\'s accuracy within typical brewing temperature ranges has been verified by the homebrewing community for decades.',
          ko: '여기서 사용하는 다항식 보정 공식은 브루잉 업계에서 확립된 표준입니다. Brewer\'s Friend, MoreBeer 등 권위 있는 홈브루잉 도구에서 널리 인용하고 사용합니다. 이 공식의 유도 과정은 물의 밀도와 온도의 관계에 관한 초기 연구로 거슬러 올라가며, 정확한 단일 원 논문을 특정하기는 어렵지만 전형적인 브루잉 온도 범위에서의 정확도는 홈브루잉 커뮤니티에 의해 수십 년간 검증되었습니다.',
        },
      },
    ],
    relatedToolIds: ['homebrew-recipe-calculator'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/default-en.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-22',
    popular: false,
  },
  {
    id: 'standard-drinks-calculator',
    slug: 'standard-drinks-calculator',
    category: 'beer',
    title: {
      en: 'Standard Drinks / Alcohol Units Calculator',
      ko: '표준잔 / 알코올 유닛 계산기',
    },
    description: {
      en: 'Convert any drink\'s volume and ABV into standard drinks (US, UK, AU/SG, Canada) and pure alcohol grams. See how many units your drink contains according to your country\'s health guidelines — for reference only. All calculations run in your browser.',
      ko: '음료의 용량과 도수(ABV%)를 표준잔(미국·영국·호주·캐나다 기준) 및 순수 알코올 그램으로 환산합니다. 각국 보건 가이드라인 기준의 알코올 유닛 수를 참고용으로 확인하세요. 모든 계산은 브라우저에서 처리됩니다.',
    },
    keywords: {
      en: [
        'standard drinks calculator',
        'alcohol units calculator',
        'how many units in a drink',
        'standard drink converter',
        'alcohol content calculator',
        'units of alcohol',
        'pure alcohol grams calculator',
        'drink units UK',
        'standard drinks Australia',
        'how many standard drinks',
      ],
      ko: [
        '표준잔 계산기',
        '알코올 유닛 계산기',
        '표준잔 변환',
        '알코올 함량 계산기',
        '순수 알코올량 계산',
        '음주 단위 계산',
        '표준잔 수 확인',
        '알코올 유닛',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'What is a "standard drink"?',
          ko: '"표준잔(standard drink)"이란 무엇인가요?',
        },
        answer: {
          en: 'A standard drink is a unit used by health authorities to measure alcohol consumption. It represents a specific amount of pure alcohol — but the exact amount differs by country: the US defines it as 14 g of pure alcohol (NIAAA), the UK as 8 g (one "unit", NHS), Australia and Singapore as 10 g, and Canada as 13.45 g (CCSA). Because these definitions differ, a single glass of wine may count as 1 standard drink in one country and more than 1 in another.',
          ko: '표준잔은 보건당국이 알코올 섭취량을 측정하는 데 사용하는 단위입니다. 순수 알코올의 특정 양을 의미하는데, 국가마다 정의가 다릅니다. 미국은 14g(NIAAA), 영국은 8g(NHS "유닛"), 호주·싱가포르는 10g, 캐나다는 13.45g(CCSA)입니다. 이 정의가 다르기 때문에 와인 한 잔이 어떤 나라에서는 표준잔 1개, 다른 나라에서는 1개 이상이 될 수 있습니다.',
        },
      },
      {
        question: {
          en: 'Can I use this calculator to find out if I am safe to drive?',
          ko: '이 계산기로 운전 가능 여부를 알 수 있나요?',
        },
        answer: {
          en: 'No. This tool converts alcohol volume and ABV into standard drinks and pure alcohol grams — it does not estimate blood alcohol concentration (BAC) or assess fitness to drive. Standard drink counts are a health reference tool; they are not a measure of intoxication. If you need an estimated BAC figure, use the BAC Calculator. Regardless of any calculation, the only safe BAC for driving is 0.000%.',
          ko: '아닙니다. 이 도구는 알코올 용량과 도수를 표준잔과 순수 알코올 그램으로 환산하는 것일 뿐, 혈중 알코올 농도(BAC)를 추정하거나 운전 가능 여부를 판단하는 도구가 아닙니다. 표준잔 수치는 건강 참고 지표이며 음주 취함 수준을 의미하지 않습니다. BAC 추정이 필요하다면 BAC 계산기를 이용하세요. 어떤 계산 결과와 관계없이 운전 시 안전한 BAC는 오직 0.000%입니다.',
        },
      },
      {
        question: {
          en: 'Why do different countries define standard drinks differently?',
          ko: '왜 나라마다 표준잔 기준이 다른가요?',
        },
        answer: {
          en: 'Each country\'s health authority independently set their own definition when developing national alcohol guidelines and public health messaging. There is no international consensus. The amounts range from 8 g (UK) to 14 g (US), reflecting different policy decisions about what constitutes a meaningful and communicable unit of measurement for their populations. When comparing guidelines across countries, always check which definition was used.',
          ko: '각국의 보건당국이 국가별 알코올 가이드라인과 공중보건 메시지를 개발하면서 각자 독립적으로 정의를 정했습니다. 국제적으로 통일된 기준은 없습니다. 영국(8g)부터 미국(14g)까지 다양한데, 이는 각 국가가 자국 인구에 맞는 의미 있는 측정 단위를 정한 결과입니다. 국가 간 가이드라인을 비교할 때는 어떤 정의가 사용되었는지 반드시 확인하세요.',
        },
      },
    ],
    relatedToolIds: ['bac-calculator'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/default-en.png',
    status: 'testing',
    disclaimerType: 'medical',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-22',
    popular: false,
  },
  {
    id: 'layover-connection-calculator',
    slug: 'layover-connection-calculator',
    category: 'travel',
    title: {
      en: 'Layover & Connection Time Calculator',
      ko: '환승 시간 계산기',
    },
    description: {
      en: 'Check whether your layover is long enough based on the official Minimum Connecting Time (MCT) for your airport and connection type. Covers 22 major hubs — plus general industry defaults for all other airports. Reference only; always confirm with your airline.',
      ko: '공항별 공식 최소환승시간(MCT)을 기준으로 보유한 환승 시간이 충분한지 확인하세요. 22개 주요 허브 공항 데이터와 그 외 공항을 위한 업계 일반 기준을 제공합니다. 참고용이며 실제 여부는 항공사에 확인하세요.',
    },
    keywords: {
      en: [
        'layover calculator',
        'connection time calculator',
        'minimum connection time calculator',
        'mct calculator',
        'layover time enough',
        'is my layover long enough',
        'airport minimum connecting time',
        'transit time calculator',
        'connecting flight time calculator',
        'IATA MCT',
      ],
      ko: [
        '환승 시간 계산기',
        '최소 환승 시간',
        'MCT 계산기',
        '환승 시간 충분한가',
        '공항 환승 최소시간',
        '레이오버 계산기',
        '경유 시간 계산',
        '환승 가능 시간',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'What is MCT (Minimum Connecting Time)?',
          ko: 'MCT(최소환승시간)란 무엇인가요?',
        },
        answer: {
          en: 'MCT stands for Minimum Connecting Time — the shortest interval between the scheduled arrival of one flight and the scheduled departure of a connecting flight that allows a passenger (and their checked baggage) to make the connection under normal conditions. MCT values are defined by IATA Recommended Practice 1670 and individually by each airport. They vary by connection type (domestic-to-domestic, international-to-international, etc.) and are built into airline booking systems to prevent the sale of itineraries that are too tight.',
          ko: 'MCT(Minimum Connecting Time)는 환승 시 허용되는 최소 시간을 의미합니다. 즉, 도착 항공편이 착륙한 후 출발 항공편이 뜨기까지, 승객과 위탁수하물이 정상 조건에서 연결편을 탈 수 있는 가장 짧은 시간 간격입니다. MCT는 IATA 권고 규정(RP 1670)과 각 공항이 자체적으로 정하며, 연결 유형(국내-국내, 국제-국제 등)에 따라 다릅니다. 항공사 예약 시스템에 내장되어 지나치게 촉박한 일정 판매를 방지합니다.',
        },
      },
      {
        question: {
          en: 'My airport is not in the database. What happens?',
          ko: '제 공항이 데이터베이스에 없습니다. 어떻게 되나요?',
        },
        answer: {
          en: 'If your airport is not in our database, the calculator applies general industry-recommended minimum times derived from IATA guidance: 45 min (domestic-to-domestic), 60 min (domestic-to-international), 90 min (international-to-domestic), 90 min (international-to-international). These are conservative defaults — actual MCT may be shorter at efficient single-terminal airports or longer at large multi-terminal hubs. Always verify with your airline before booking.',
          ko: '데이터베이스에 없는 공항은 IATA 가이드라인에서 파생된 업계 일반 권장값을 사용합니다: 국내→국내 45분, 국내→국제 60분, 국제→국내 90분, 국제→국제 90분. 이는 보수적인 기본값으로, 효율적인 단일 터미널 공항에서는 더 짧을 수 있고 대형 복합 터미널에서는 더 길 수 있습니다. 항공편 예매 전 반드시 항공사에 확인하세요.',
        },
      },
      {
        question: {
          en: 'Can I always make the connection if my layover exceeds the MCT?',
          ko: '환승 시간이 MCT를 초과하면 항상 연결편을 탈 수 있나요?',
        },
        answer: {
          en: 'Not necessarily. MCT represents the minimum under normal conditions — it does not account for long immigration queues, security screening delays, gate changes, aircraft arriving late, or extreme terminal distances. The MCT is the floor, not a guarantee. A "Comfortable" result (≥ 1.5× MCT) gives you a meaningful buffer, but real-world factors can still cause a miss. For important trips, choosing a layover significantly longer than the MCT is always the safer strategy.',
          ko: '반드시 그렇지는 않습니다. MCT는 정상 조건에서의 최솟값으로, 긴 입국심사 줄, 보안검색 지연, 게이트 변경, 도착 지연, 터미널 간 먼 거리 등을 반영하지 않습니다. MCT는 최솟값이지 보장이 아닙니다. "여유로움(Comfortable)" 결과(MCT의 1.5배 이상)는 의미 있는 여유를 제공하지만, 실제 상황에 따라 놓칠 수도 있습니다. 중요한 여행이라면 MCT보다 훨씬 긴 환승 시간을 선택하는 것이 더 안전합니다.',
        },
      },
    ],
    relatedToolIds: ['flight-delay-compensation', 'visa-requirement-checker'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/default-en.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-22',
    popular: false,
  },
  {
    id: 'jetlag-recovery-calculator',
    slug: 'jetlag-recovery-calculator',
    category: 'travel',
    title: {
      en: 'Jet Lag Recovery Calculator',
      ko: '시차 적응 회복 계산기',
    },
    description: {
      en: 'Estimate how many days it takes to recover from jet lag based on the number of time zones you cross and your direction of travel. Includes a day-by-day general adaptation guide for eastward and westward flights — no sign-up required.',
      ko: '넘어가는 시간대 수와 이동 방향에 따라 시차 적응에 며칠이 걸릴지 추정합니다. 동쪽/서쪽 이동별 일자별 일반 적응 가이드를 제공합니다 — 가입 불필요.',
    },
    keywords: {
      en: [
        'jet lag calculator',
        'jet lag recovery time',
        'how long to recover from jet lag',
        'jet lag days calculator',
        'time zone change calculator',
        'jet lag eastward westward',
        'circadian rhythm recovery',
        'jet lag tips',
        'jet lag cure calculator',
        'international travel jet lag',
      ],
      ko: [
        '시차 계산기',
        '시차 적응 기간',
        '시차 적응 며칠',
        '시차 회복 기간',
        '시차 적응 방법',
        '장거리 비행 시차',
        '일주기 리듬 회복',
        '시차 극복 계산기',
      ],
    },
    schemaType: 'WebApplication',
    faq: [
      {
        question: {
          en: 'Why is eastward travel generally harder than westward for jet lag?',
          ko: '왜 동쪽으로 이동하는 것이 서쪽 이동보다 시차 적응이 더 어려운가요?',
        },
        answer: {
          en: "The human circadian clock has an intrinsic period slightly longer than 24 hours (approximately 24.2 hours on average). This means it is naturally easier for the body clock to run a bit longer each day — which is what westward travel requires (phase delay). Eastward travel demands the opposite: advancing the clock, which goes against its natural tendency. This asymmetry is documented in sleep medicine literature, including Waterhouse et al., The Lancet 2007. The estimated recovery difference is roughly 50% more days for eastward versus westward travel at the same time-zone count.",
          ko: '인간의 일주기 시계는 24시간보다 약간 긴 고유 주기(평균 약 24.2시간)를 가집니다. 이는 체내시계가 매일 조금씩 늦춰지는 것이 자연스럽다는 의미로, 이것이 서쪽 이동(위상 지연)에 적합합니다. 반면 동쪽 이동은 시계를 앞당겨야 하는데, 이는 체내시계의 자연적 경향에 반합니다. 이 비대칭성은 Waterhouse 외, The Lancet 2007 등 수면의학 문헌에 기록되어 있습니다. 같은 시간대 수에서 동쪽 이동은 서쪽 이동보다 약 50% 더 많은 회복일이 필요한 것으로 추정됩니다.',
        },
      },
      {
        question: {
          en: 'Does following this guide guarantee I will recover in the estimated number of days?',
          ko: '이 가이드를 따르면 예상 일수 안에 회복이 보장되나요?',
        },
        answer: {
          en: 'No. The estimated recovery days are a statistical approximation — actual recovery varies considerably by individual factors such as age (older adults typically adapt more slowly), chronotype (night owls may adapt slightly differently to eastward travel), sleep quality during the flight, use of melatonin, and how diligently you follow light-exposure strategies. The day-by-day tips are general principles from circadian science, not a personalised protocol.',
          ko: '아닙니다. 예상 회복일수는 통계적 근사치로, 실제 회복은 연령(고령자는 일반적으로 더 느리게 적응), 일주기 유형(올빼미형은 동쪽 이동에 다소 다르게 반응할 수 있음), 비행 중 수면의 질, 멜라토닌 사용 여부, 빛 노출 전략 실천 정도 등 개인별 요인에 따라 크게 다릅니다. 일자별 가이드는 일주기 과학의 일반 원칙이지 개인 맞춤 처방이 아닙니다.',
        },
      },
      {
        question: {
          en: 'Why does the tool show a "westward" direction for some routes that seem eastward on a map?',
          ko: '지도에서 동쪽으로 가는 것 같은 경로가 "서쪽 이동"으로 표시되는 이유는 무엇인가요?',
        },
        answer: {
          en: 'The tool always calculates the shortest path across time zones, not the actual flight routing. For example, flying from New York (UTC-5) to Tokyo (UTC+9) can go eastward via the Atlantic and Europe (14 time zones) or westward across the Pacific (10 time zones). The shorter 10-zone westward path is what this tool uses, which matches how most airlines route such flights. This is a simplification — real flight paths also depend on jet streams and geography.',
          ko: '이 계산기는 실제 비행 경로가 아닌 최단 시간대 경로를 기준으로 계산합니다. 예를 들어 뉴욕(UTC-5)에서 도쿄(UTC+9)로 가는 경우, 대서양·유럽을 거쳐 동쪽으로 14개 시간대를 건너거나 태평양을 건너 서쪽으로 10개 시간대를 건널 수 있습니다. 이 계산기는 더 짧은 10개 시간대 서쪽 경로를 사용하며, 대부분의 항공사 운항 경로와 일치합니다. 이는 단순화된 접근 방식으로, 실제 비행 경로는 제트기류와 지형에 따라 다릅니다.',
        },
      },
    ],
    relatedToolIds: ['flight-delay-compensation', 'layover-connection-calculator'],
    adSlots: [
      { position: 'header', minHeightPx: 90 },
      { position: 'result', minHeightPx: 250 },
      { position: 'mid-content', minHeightPx: 280 },
      { position: 'above-faq', minHeightPx: 250 },
      { position: 'footer', minHeightPx: 90 },
    ],
    ogImage: '/og/default-en.png',
    status: 'testing',
    disclaimerType: 'general',
    aiOverviewResistance: 'high',
    addedAt: '2026-07-22',
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
