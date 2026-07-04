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
    ],
    relatedToolIds: ['homebrew-recipe-calculator'],
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
    ],
    relatedToolIds: ['bac-calculator'],
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
    relatedToolIds: ['sleep-schedule'],
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
    id: 'flight-delay-compensation',
    slug: 'flight-delay-compensation',
    category: 'travel',
    title: {
      en: 'Flight Delay Compensation Calculator',
      ko: '항공편 지연 보상 계산기',
    },
    description: {
      en: 'Find out if your delayed flight qualifies for compensation under EU Regulation 261/2004 or US DOT rules. Select your regulation, route distance, delay duration, and cause to get an instant estimate — no sign-up required.',
      ko: 'EU 규정 261/2004 또는 미국 DOT 규정에 따라 지연된 항공편에 대한 보상을 받을 수 있는지 확인하세요. 규정, 노선 거리, 지연 시간, 지연 원인을 선택하면 즉시 추정 보상액을 확인할 수 있습니다 — 가입 불필요.',
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
          en: "Unlike the EU, the United States does not have a federal law mandating fixed cash compensation for flight delays. Airlines set their own delay compensation policies under their customer service plans, which are required to be published under US DOT 14 CFR Part 259. The US does have a tarmac delay rule: domestic flights must allow passengers to deplane after 3 hours on the tarmac, and international flights after 4 hours. Always check your airline's customer service plan to understand what compensation, if any, is offered for your delay.",
          ko: "EU와 달리 미국에는 항공편 지연에 대한 법적 고정 보상금을 의무화하는 연방법이 없습니다. 항공사는 미국 DOT 14 CFR Part 259에 따라 공개해야 하는 고객 서비스 플랜에서 지연 보상 정책을 자체적으로 정합니다. 단, 미국은 계류장 지연 규정이 있어 국내선은 3시간, 국제선은 4시간 이후 탑승객의 하기를 허용해야 합니다. 지연에 대해 어떤 보상이 제공되는지는 항공사의 고객 서비스 플랜을 확인하세요.",
        },
      },
    ],
    relatedToolIds: ['visa-requirement-checker'],
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
