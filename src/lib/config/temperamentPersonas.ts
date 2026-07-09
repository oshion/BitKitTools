/**
 * Baby Temperament Type Quiz — Persona Data
 *
 * 16 persona types derived from 4 binary axes (2⁴ = 16 combinations):
 *   activity     : 'active' | 'calm'
 *   social       : 'social' | 'shy'
 *   adaptability : 'flexible' | 'cautious'
 *   reactivity   : 'expressive' | 'mellow'
 *
 * Code format: `${activity}-${social}-${adaptability}-${reactivity}`
 * Example: 'active-social-flexible-expressive'
 *
 * Parenting tips are based on the "goodness of fit" concept from:
 *   Thomas A, Chess S. Temperament and Development. New York: Brunner/Mazel; 1977.
 *
 * All 16 types are described equally positively. No type implies a problem
 * or developmental concern. Tips use a "here's what tends to work well"
 * tone — never a deficit-correction framing.
 */

export type PersonaCode = string

export type TemperamentPersona = {
  /** Canonical code: activity-social-adaptability-reactivity */
  code: PersonaCode
  emoji: string
  name: { en: string; ko: string }
  /** 2–3 sentence description of the child's general style */
  description: { en: string; ko: string }
  /** 2–3 goodness-of-fit parenting tips */
  tips: { en: string[]; ko: string[] }
  /**
   * Hue value (0–359) for the type card background colour.
   * Assigned at index × 22.5 so all 16 types are visually distinct.
   */
  colorHue: number
}

export const TEMPERAMENT_PERSONAS: TemperamentPersona[] = [
  // ── Index 0 ──────────────────────────────────────────────────────────────
  {
    code: 'active-social-flexible-expressive',
    emoji: '🧭',
    name: { en: 'Cheerful Adventurer', ko: '명랑한 모험가' },
    description: {
      en: 'Your child brings energy and warmth to every situation. They dive into new experiences with enthusiasm, make friends easily, and wear their heart on their sleeve. Life is one big adventure, and they want everyone along for the ride.',
      ko: '아이는 어떤 상황에서도 활기와 따뜻함을 불어넣어요. 새로운 경험에 열정적으로 뛰어들고, 쉽게 친구를 사귀며, 감정을 솔직하게 드러내요. 세상 모든 것이 신나는 탐험이고, 모두를 함께 데려가고 싶어해요.',
    },
    tips: {
      en: [
        'Say yes to adventures whenever possible — their enthusiasm for new experiences is a wonderful strength.',
        'Arrange regular playdates and group activities where their social energy can shine.',
        'Give a brief heads-up before transitions ("five more minutes!") so even this adaptable child moves smoothly.',
      ],
      ko: [
        '가능한 한 새로운 경험에 "그래!"라고 해주세요 — 모험에 대한 열정이 아이의 큰 강점이에요.',
        '친구들과 어울릴 수 있는 기회(플레이데이트, 단체 활동)를 자주 마련해주세요.',
        '활동이 바뀌기 전에 짧게 예고해주면("5분 후에 끝내자!") 전환이 더 부드러워요.',
      ],
    },
    colorHue: 0,
  },

  // ── Index 1 ──────────────────────────────────────────────────────────────
  {
    code: 'active-social-flexible-mellow',
    emoji: '🌟',
    name: { en: 'Easygoing Explorer', ko: '여유로운 탐험가' },
    description: {
      en: 'Your child is always on the move and loves being around people, yet they carry a calm, unhurried quality that puts others at ease. They embrace new situations with an open mind and rarely get rattled. Friends and adults alike find them pleasant company.',
      ko: '항상 움직이고 사람들과 어울리기를 좋아하지만, 여유롭고 서두르지 않는 태도로 주변 사람들을 편안하게 해줘요. 새로운 상황을 열린 마음으로 받아들이고 잘 흔들리지 않아요. 친구들도 어른들도 함께 있으면 즐거운 아이예요.',
    },
    tips: {
      en: [
        'Provide plenty of physical activity — their body needs to move to feel at their best.',
        'Their social ease makes group settings ideal; structured classes with active elements work particularly well.',
        'Since they handle change easily, use transitions as opportunities to introduce new experiences.',
      ],
      ko: [
        '신체 활동을 충분히 제공해주세요 — 몸을 움직여야 가장 컨디션이 좋아요.',
        '사교적인 편안함 덕분에 그룹 활동에 잘 어울려요. 움직임이 있는 구조적인 수업이 잘 맞아요.',
        '변화에 잘 적응하니 전환을 새로운 경험의 기회로 활용해보세요.',
      ],
    },
    colorHue: 23,
  },

  // ── Index 2 ──────────────────────────────────────────────────────────────
  {
    code: 'active-social-cautious-expressive',
    emoji: '🎉',
    name: { en: 'Spirited Connector', ko: '활기찬 연결자' },
    description: {
      en: 'Your child is energetic and people-loving, with a big heart and an even bigger voice. They feel deeply and show it openly. While they like to know what comes next before diving in, once they\'re comfortable they light up any room.',
      ko: '에너지 넘치고 사람을 좋아하며, 마음도 표현도 풍부해요. 뛰어들기 전에 다음 단계를 미리 알고 싶어하지만, 일단 편안해지면 어디서든 분위기를 밝혀줘요.',
    },
    tips: {
      en: [
        'Preview upcoming events or activities in advance — knowing what to expect helps this expressive child channel their energy well.',
        'Celebrate their emotional openness; validate feelings before problem-solving.',
        'Channel their social drive with roles that let them connect, such as being the class greeter or activity leader.',
      ],
      ko: [
        '다가올 활동이나 일정을 미리 이야기해주세요 — 무엇을 기대할 수 있는지 알면 에너지를 더 잘 발휘해요.',
        '감정 표현이 풍부한 것을 응원해주세요. 문제 해결 전에 먼저 감정을 공감해주면 효과적이에요.',
        '친구들을 환영하거나 활동을 이끄는 역할처럼 사교성을 발휘할 기회를 자주 만들어주세요.',
      ],
    },
    colorHue: 45,
  },

  // ── Index 3 ──────────────────────────────────────────────────────────────
  {
    code: 'active-social-cautious-mellow',
    emoji: '🧩',
    name: { en: 'Careful Leader', ko: '신중한 리더' },
    description: {
      en: 'Your child combines a love of action and people with a thoughtful, measured approach to new situations. They like to understand the lay of the land before committing, and once they do, they bring steady, reliable energy to everything they pursue.',
      ko: '활동과 사람을 좋아하면서도 새로운 상황은 신중하게 파악하고 나서 참여해요. 일단 마음을 정하면 안정적이고 믿음직한 에너지로 모든 일에 임해요.',
    },
    tips: {
      en: [
        'Give advance notice about new activities or social events so they can mentally prepare.',
        'Trust their deliberate pace — once they feel ready, they commit fully and lead naturally.',
        'Pair active outlets with predictable routines to help them feel grounded.',
      ],
      ko: [
        '새로운 활동이나 사교 이벤트는 미리 알려주어 마음의 준비를 할 수 있게 해주세요.',
        '신중한 속도를 믿어주세요 — 준비가 되면 완전히 참여하고 자연스럽게 이끌어요.',
        '규칙적인 루틴과 활동적인 기회를 함께 제공하면 안정감을 느껴요.',
      ],
    },
    colorHue: 68,
  },

  // ── Index 4 ──────────────────────────────────────────────────────────────
  {
    code: 'active-shy-flexible-expressive',
    emoji: '🦋',
    name: { en: 'Bold Dreamer', ko: '용감한 몽상가' },
    description: {
      en: 'Your child is full of physical energy and rich inner feelings, yet they prefer to explore their world more independently. They take on new experiences openly but need some quiet time to recharge away from crowds. Their enthusiasm, when it emerges, is sincere and heartfelt.',
      ko: '신체 에너지가 넘치고 내면의 감정도 풍부하지만, 세상을 좀 더 독립적으로 탐험하는 걸 선호해요. 새로운 경험은 열린 마음으로 받아들이면서도 군중에서 벗어나 혼자만의 시간이 필요해요. 드러날 때의 열정은 진심 어려요.',
    },
    tips: {
      en: [
        'Balance active group play with solo or one-on-one time — they recharge with a little quiet space.',
        'Respect their preference for fewer, deeper social connections rather than large groups.',
        'Welcome their expressive moments; they communicate a lot through how they play and move.',
      ],
      ko: [
        '활동적인 그룹 놀이와 혼자 또는 일대일 시간을 균형 있게 마련해주세요 — 조용한 시간이 재충전에 도움돼요.',
        '대규모 그룹보다 깊이 있는 소수의 관계를 선호한다는 것을 존중해주세요.',
        '감정을 표현하는 순간들을 소중히 여겨주세요 — 놀이와 움직임을 통해 많은 것을 전달해요.',
      ],
    },
    colorHue: 90,
  },

  // ── Index 5 ──────────────────────────────────────────────────────────────
  {
    code: 'active-shy-flexible-mellow',
    emoji: '🌈',
    name: { en: 'Free Spirit', ko: '자유로운 영혼' },
    description: {
      en: 'Your child is happiest when moving freely through the world at their own pace. They welcome new experiences with an open mind and rarely get upset, yet they find their energy in independent exploration rather than the spotlight. Calm and quietly adventurous — a lovely combination.',
      ko: '자신만의 속도로 자유롭게 움직일 때 가장 행복해요. 새로운 경험에 열린 마음이고 잘 흔들리지 않아요. 에너지는 주목받는 것보다 혼자 탐험하는 데서 얻어요. 차분하면서도 조용히 모험을 즐기는, 매력적인 아이예요.',
    },
    tips: {
      en: [
        'Offer unstructured time for independent exploration — they thrive when they can set the agenda.',
        'Introduce new things at their pace; their adaptability means they\'ll get there without being rushed.',
        'Appreciate their quiet energy — they often notice things others miss during their calm observations.',
      ],
      ko: [
        '비구조적인 자유 탐험 시간을 충분히 주세요 — 자신이 방향을 정할 때 가장 잘 자라요.',
        '새로운 것은 아이의 속도에 맞춰 소개해주세요. 적응력이 있어서 서두르지 않아도 잘 따라와요.',
        '조용한 에너지를 소중히 여겨주세요 — 차분하게 관찰하면서 다른 사람들이 놓치는 것을 발견하곤 해요.',
      ],
    },
    colorHue: 113,
  },

  // ── Index 6 ──────────────────────────────────────────────────────────────
  {
    code: 'active-shy-cautious-expressive',
    emoji: '🔥',
    name: { en: 'Passionate Pioneer', ko: '열정적인 개척자' },
    description: {
      en: 'Your child has deep reserves of energy and feeling. They approach new situations carefully, wanting to observe and understand before jumping in, but when they do commit, they give everything with intensity and passion. Their inner world is vivid and richly felt.',
      ko: '에너지와 감정 모두 깊이가 있어요. 새로운 상황은 뛰어들기 전에 관찰하고 이해하려 하지만, 일단 참여하기로 하면 온 열정을 다해요. 내면의 세계가 생생하고 풍부해요.',
    },
    tips: {
      en: [
        'Allow time to observe before participating — this is how they build confidence, not hesitation.',
        'Provide a reliable daily rhythm; predictability gives them a secure base to launch their passionate pursuits from.',
        'Acknowledge and name their strong feelings — they benefit greatly from feeling understood.',
      ],
      ko: [
        '참여 전에 관찰할 시간을 주세요 — 이것이 아이가 자신감을 쌓는 방식이에요.',
        '예측 가능한 일과를 마련해주세요. 규칙성이 안전한 기반이 되어 열정을 발휘하게 해줘요.',
        '강한 감정을 인정하고 이름 붙여주세요 — 이해받는다는 느낌이 아이에게 큰 힘이 돼요.',
      ],
    },
    colorHue: 135,
  },

  // ── Index 7 ──────────────────────────────────────────────────────────────
  {
    code: 'active-shy-cautious-mellow',
    emoji: '🌿',
    name: { en: 'Thoughtful Dynamo', ko: '사려깊은 활동가' },
    description: {
      en: 'Your child is a wonderful blend of physical energy and quiet thoughtfulness. They take their time warming up to new people and situations, but they rarely get overwhelmed. Behind their reserved exterior is a steady, capable explorer who observes, reflects, and then acts with intention.',
      ko: '신체 활동과 조용한 사려 깊음이 멋지게 어우러진 아이예요. 새 사람이나 상황에 익숙해지는 데 시간이 걸리지만 잘 흔들리지 않아요. 내성적인 겉모습 뒤에는 관찰하고, 생각하고, 의도적으로 행동하는 든든하고 유능한 탐험가가 있어요.',
    },
    tips: {
      en: [
        'Give warm, low-pressure introductions to new people and places — patience is rewarded with their full trust.',
        'Channel their energy with activities they can master at their own pace, such as swimming, martial arts, or cycling.',
        'Celebrate their thoughtful nature; "slow to warm" is a strength, not a limitation.',
      ],
      ko: [
        '새 사람이나 장소를 소개할 때 따뜻하되 부담 없이 해주세요 — 기다리면 완전한 신뢰로 돌아와요.',
        '수영, 태권도, 자전거처럼 자신의 속도로 숙달할 수 있는 활동으로 에너지를 발산하게 도와주세요.',
        '사려 깊은 성격을 응원해주세요. "워밍업이 느린 것"은 약점이 아니라 강점이에요.',
      ],
    },
    colorHue: 158,
  },

  // ── Index 8 ──────────────────────────────────────────────────────────────
  {
    code: 'calm-social-flexible-expressive',
    emoji: '🌻',
    name: { en: 'Warm Storyteller', ko: '따뜻한 이야기꾼' },
    description: {
      en: 'Your child is sociable, expressive, and welcoming of change — all wrapped in a calm, settled energy that makes them a natural at connecting with others. They love sharing experiences and feelings, and their warmth draws people toward them effortlessly.',
      ko: '사교적이고, 감정 표현이 풍부하며, 변화를 편안하게 받아들이는 — 모든 것이 차분한 에너지로 감싸져 있어요. 경험과 감정을 나누는 것을 좋아하고, 따뜻함이 자연스럽게 사람들을 끌어당겨요.',
    },
    tips: {
      en: [
        'Make space for storytelling and sharing — they love narrating their day and feel close to you through conversation.',
        'Involve them in group activities that blend social interaction with creative expression.',
        'Their calm adaptability means they\'re great travel companions and flexible family members.',
      ],
      ko: [
        '이야기하고 나누는 시간을 만들어주세요 — 하루를 이야기하며 보호자와 더 가까워지는 걸 좋아해요.',
        '사교적 교류와 창의적 표현이 어우러진 그룹 활동에 참여시켜주세요.',
        '차분한 적응력 덕분에 여행이나 새로운 상황에서도 유연한 가족 구성원이 돼요.',
      ],
    },
    colorHue: 180,
  },

  // ── Index 9 ──────────────────────────────────────────────────────────────
  {
    code: 'calm-social-flexible-mellow',
    emoji: '🕊️',
    name: { en: 'Gentle Diplomat', ko: '온화한 외교관' },
    description: {
      en: 'Your child is a natural peacekeeper — calm, sociable, open to change, and easy to please. They move through the social world with ease and grace, rarely getting ruffled and often soothing tension around them without even trying. Their steady presence is a gift to their family and friends.',
      ko: '타고난 평화주의자예요 — 차분하고, 사교적이며, 변화에 열려 있고, 쉽게 만족해요. 사회적 상황을 편안하게 헤쳐나가고, 주변의 긴장을 자신도 모르게 완화시켜요. 안정적인 존재감은 가족과 친구들에게 큰 선물이에요.',
    },
    tips: {
      en: [
        'Give them leadership opportunities in group settings — their calm and sociability make them natural at bringing others together.',
        'Provide new social experiences regularly; they adapt easily and often blossom with variety.',
        'Check in with their inner world — their easygoing nature sometimes means quieter needs go unvoiced.',
      ],
      ko: [
        '그룹에서 이끄는 역할을 경험하게 해주세요 — 차분함과 사교성으로 자연스럽게 사람들을 모으는 재능이 있어요.',
        '새로운 사교적 경험을 정기적으로 제공해주세요. 다양한 경험에서 더욱 빛나요.',
        '내면을 자주 확인해주세요 — 편한 성격 덕분에 조용한 필요가 표현되지 않을 수 있어요.',
      ],
    },
    colorHue: 203,
  },

  // ── Index 10 ─────────────────────────────────────────────────────────────
  {
    code: 'calm-social-cautious-expressive',
    emoji: '🌺',
    name: { en: 'Caring Advisor', ko: '다정한 안내자' },
    description: {
      en: 'Your child is warm, expressive, and enjoys the company of others, but they like to understand a new situation fully before engaging. They notice how others feel and often step up to help or comfort. Once they\'re settled, their emotional depth and care make them a trusted friend.',
      ko: '따뜻하고, 감정 표현이 풍부하며, 사람들과 함께하는 것을 좋아하지만, 참여하기 전에 상황을 충분히 파악하고 싶어해요. 타인의 감정을 잘 알아차리고 돕거나 위로하려 해요. 안정되면 감정의 깊이와 배려심으로 믿음직한 친구가 돼요.',
    },
    tips: {
      en: [
        'Brief them on what to expect before social gatherings so they can arrive ready to connect.',
        'Appreciate and nurture their empathy — it\'s a wonderful social gift.',
        'Allow them to take a supporting rather than leading role at first, and trust that they\'ll step forward when ready.',
      ],
      ko: [
        '사교적 모임 전에 어떤 상황인지 미리 설명해주면 준비된 상태로 어울릴 수 있어요.',
        '공감 능력을 소중히 여기고 키워주세요 — 훌륭한 사회적 재능이에요.',
        '처음엔 앞서기보다 지원하는 역할을 허용해주세요. 준비되면 자연스럽게 나서요.',
      ],
    },
    colorHue: 225,
  },

  // ── Index 11 ─────────────────────────────────────────────────────────────
  {
    code: 'calm-social-cautious-mellow',
    emoji: '🌊',
    name: { en: 'Serene Peacemaker', ko: '고요한 평화주의자' },
    description: {
      en: 'Your child is a calm, sociable, and steady presence who approaches everything with patience and measured thought. They prefer to survey a situation before committing, and they rarely get overwhelmed. Their quiet warmth and reliability make them a cherished companion.',
      ko: '차분하고 사교적이며, 인내심과 신중한 사고로 모든 것에 임해요. 참여 전에 상황을 파악하려 하고 잘 흔들리지 않아요. 조용한 따뜻함과 신뢰감이 소중한 동반자로 만들어줘요.',
    },
    tips: {
      en: [
        'Introduce new social situations gradually and without pressure — they warm up beautifully given time.',
        'Use their calm nature as a strength by involving them in planning and preparing for events.',
        'Make sure they get enough one-on-one connection time, not just group settings.',
      ],
      ko: [
        '새로운 사교 상황은 천천히, 부담 없이 소개해주세요 — 시간이 주어지면 훌륭하게 적응해요.',
        '차분한 성격을 활용해 행사 준비나 계획에 참여시켜주세요.',
        '그룹 활동뿐 아니라 일대일 연결 시간도 충분히 만들어주세요.',
      ],
    },
    colorHue: 248,
  },

  // ── Index 12 ─────────────────────────────────────────────────────────────
  {
    code: 'calm-shy-flexible-expressive',
    emoji: '🎨',
    name: { en: 'Shy Artist', ko: '수줍은 예술가' },
    description: {
      en: 'Your child has a rich inner life and expresses it beautifully — through art, play, stories, or imaginative worlds of their own making. They move through new experiences with an open mind, yet they savour life best in smaller, quieter settings where their creativity can fully unfold.',
      ko: '풍부한 내면 세계를 아름답게 표현해요 — 미술, 놀이, 이야기, 혹은 스스로 만든 상상의 세계를 통해서요. 새로운 경험에는 열린 마음이면서도 창의력이 온전히 피어날 수 있는 작고 조용한 환경에서 가장 빛나요.',
    },
    tips: {
      en: [
        'Provide ample creative materials and uninterrupted time to create — this is where they truly flourish.',
        'Respect their preference for smaller social settings; quality connection matters more than quantity.',
        'Share their creative work with others gradually — it builds confidence without overwhelming them.',
      ],
      ko: [
        '창작 재료와 방해받지 않는 시간을 충분히 주세요 — 이곳에서 진정으로 꽃피어요.',
        '소규모 사교 환경에 대한 선호를 존중해주세요. 관계의 깊이가 폭보다 중요해요.',
        '창작물을 조금씩 다른 사람들과 나누게 해주세요 — 부담 없이 자신감을 키울 수 있어요.',
      ],
    },
    colorHue: 270,
  },

  // ── Index 13 ─────────────────────────────────────────────────────────────
  {
    code: 'calm-shy-flexible-mellow',
    emoji: '🍃',
    name: { en: 'Quiet Creator', ko: '조용한 창작자' },
    description: {
      en: 'Your child is a calm, reflective soul who meets the world with quiet curiosity. They adapt to change without fuss, prefer their own company or a trusted few, and rarely make a scene. In their unhurried, independent way, they discover and create things that often surprise and delight those around them.',
      ko: '조용한 호기심으로 세상을 만나는 차분하고 사색적인 아이예요. 변화에 잘 적응하고, 혼자이거나 신뢰하는 소수와 함께하는 것을 선호하며, 잘 소란스럽지 않아요. 서두르지 않는 독립적인 방식으로 주변 사람들을 놀라게 하고 기쁘게 하는 것을 발견하고 만들어요.',
    },
    tips: {
      en: [
        'Offer open-ended activities — building, drawing, experimenting — without a set endpoint to reach.',
        'Honour their need for solitude; this is how they recharge and create.',
        'Introduce social situations gently and consistently; their adaptability means they build comfort over time.',
      ],
      ko: [
        '목표 없이 자유롭게 만들고, 그리고, 실험하는 활동을 제공해주세요.',
        '혼자만의 시간에 대한 필요를 존중해주세요. 이것이 재충전하고 창작하는 방식이에요.',
        '사교적 상황을 부드럽고 꾸준하게 소개해주세요. 적응력이 있어 시간이 지나면 편안해져요.',
      ],
    },
    colorHue: 293,
  },

  // ── Index 14 ─────────────────────────────────────────────────────────────
  {
    code: 'calm-shy-cautious-expressive',
    emoji: '✨',
    name: { en: 'Sensitive Thinker', ko: '섬세한 사색가' },
    description: {
      en: 'Your child feels the world deeply and thinks before they act. They take time to warm up to new people and situations, and when something moves them — good or challenging — they let you know with heartfelt sincerity. Their emotional attunement and thoughtfulness are genuine gifts.',
      ko: '세상을 깊이 느끼고 행동 전에 생각해요. 새 사람이나 상황에 익숙해지는 데 시간이 걸리지만, 무언가가 마음을 움직이면 — 기쁜 것이든 어려운 것이든 — 진심으로 표현해요. 감정적 감수성과 사려 깊음은 진정한 재능이에요.',
    },
    tips: {
      en: [
        'Prepare them for new situations with a calm preview: "We\'re going somewhere new today — here\'s what it\'ll be like."',
        'Validate their feelings fully before moving to solutions; they need to feel understood first.',
        'Celebrate their depth of feeling as a strength — sensitive, perceptive children often become deeply empathetic adults.',
      ],
      ko: [
        '새로운 상황은 차분하게 미리 알려주세요. "오늘 새로운 곳에 가는데, 이런 곳이야"라고요.',
        '해결책으로 넘어가기 전에 감정을 충분히 공감해주세요. 먼저 이해받아야 해요.',
        '깊은 감수성을 강점으로 응원해주세요 — 예민하고 지각력 있는 아이는 깊이 공감하는 어른으로 자라요.',
      ],
    },
    colorHue: 315,
  },

  // ── Index 15 ─────────────────────────────────────────────────────────────
  {
    code: 'calm-shy-cautious-mellow',
    emoji: '🌙',
    name: { en: 'Laid-back Observer', ko: '느긋한 관찰자' },
    description: {
      en: 'Your child is the picture of calm. They take their time with everything — meeting people, trying new things, moving through their day — and they rarely get upset. Their quiet observation means they often understand situations more deeply than others realise. Steady, self-contained, and wonderfully their own person.',
      ko: '차분함의 대명사예요. 사람 만나기, 새로운 시도, 하루 일과 — 모든 것을 천천히 하고 잘 흔들리지 않아요. 조용한 관찰 덕분에 상황을 다른 사람들이 깨닫는 것보다 더 깊이 이해해요. 안정적이고 독립적인, 온전히 자신만의 사람이에요.',
    },
    tips: {
      en: [
        'Give plenty of warming-up time without pressure — their trust, once earned, is deep and lasting.',
        'Avoid overstimulating environments; they thrive in calm, predictable spaces.',
        'Appreciate the depth of their quiet observations — they often notice and understand things that slip past others.',
      ],
      ko: [
        '서두르지 않고 충분히 적응할 시간을 주세요 — 한번 쌓인 신뢰는 깊고 오래가요.',
        '자극이 과한 환경은 피해주세요. 차분하고 예측 가능한 공간에서 가장 잘 자라요.',
        '조용한 관찰의 깊이를 소중히 여겨주세요 — 다른 사람들이 지나치는 것을 알아차리고 이해해요.',
      ],
    },
    colorHue: 338,
  },
]

/**
 * Returns the persona for a given code, or undefined if not found.
 */
export function getPersonaByCode(code: string): TemperamentPersona | undefined {
  return TEMPERAMENT_PERSONAS.find((p) => p.code === code)
}
