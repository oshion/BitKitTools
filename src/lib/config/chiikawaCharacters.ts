/**
 * Chiikawa Personality Test — Character Result Data
 *
 * 순서는 docs/screens/fun-chiikawa-personality-test.md "캐릭터 매칭" 표의 번호 순서다.
 * 이 순서가 매칭 동점 처리의 마지막 기준이므로 바꾸지 않는다.
 *
 * - answerKey: 스펙의 **수정된** Q17~Q24 기준 답안 (원 기획서 원안 아님)
 * - fanType / coreTraits / strengths / cautions / relationships / compatibleIds / learnFromIds:
 *   기획서 원문(source-content.md 3장)을 "~해요" 체로 풀어 쓴 것. fanType은 공식 설정이 아닌 제작자 추정이다.
 * - 캐릭터 이미지·로고는 권리자 라이선스가 없어 쓰지 않는다. 이모지 + 대표색만 쓴다.
 * - cardClassName / nameClassName은 Tailwind가 소스에서 찾을 수 있도록 완성된 문자열로 적는다.
 */

import type { ChiikawaCharacter } from '@/types/chiikawa-quiz'

export const CHIIKAWA_OFFICIAL_SITE = 'https://chiikawa-info.jp/'

export const CHIIKAWA_CHARACTERS: ChiikawaCharacter[] = [
  {
    id: 'chiikawa',
    name: { en: 'Chiikawa', ko: '치이카와' },
    emoji: '🐹',
    color: 'pink',
    cardClassName: 'bg-pink-300/15 border-pink-300/40',
    nameClassName: 'text-pink-200',
    ogColor: '#9d174d',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISFJ',
    tagline: {
      en: 'A gentle soul who treasures even the smallest feelings',
      ko: '작은 마음도 소중하게 여기는 다정한 사람',
    },
    coreTraits: {
      en: 'You have a tender heart and a keen eye for detail, and you always try your very best. Even when you feel unsure, you keep going quietly for the people you care about.',
      ko: '여린 마음과 섬세함을 지녔고, 무슨 일이든 최선을 다하는 사람이에요. 자신이 없을 때도 소중한 사람을 위해 묵묵히 한 걸음씩 나아가요.',
    },
    strengths: {
      en: ['You quickly notice how others are feeling.', 'You give everything you are asked to do your best effort.', 'You look out for the people around you with great care.'],
      ko: ['다른 사람의 감정을 잘 알아차려요.', '맡은 일에 최선을 다해요.', '주변 사람을 세심하게 배려해요.'],
    },
    cautions: {
      en: ['Small things can turn into big worries for you.', 'You sometimes underestimate what you can do.'],
      ko: ['작은 일에도 걱정이 많아질 수 있어요.', '자신의 능력을 과소평가할 때가 있어요.'],
    },
    relationships: {
      en: ['You love relationships that feel safe and trustworthy.', 'You are wholeheartedly sincere with the people close to you.'],
      ko: ['편안하고 신뢰할 수 있는 관계를 좋아해요.', '가까운 사람에게 진심을 다해요.'],
    },
    compatibleIds: ['hachiware', 'shisa'],
    learnFromIds: ['usagi'],
    answerKey: ['A', 'A', 'A', 'D', 'A', 'A', 'A', 'A'],
  },
  {
    id: 'hachiware',
    name: { en: 'Hachiware', ko: '하치와레' },
    emoji: '🐱',
    color: 'sky',
    cardClassName: 'bg-sky-300/15 border-sky-300/40',
    nameClassName: 'text-sky-200',
    ogColor: '#075985',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ENFJ',
    tagline: {
      en: 'A sunny friend whose words lift everyone up',
      ko: '한마디 말로 모두에게 힘을 주는 밝은 친구',
    },
    coreTraits: {
      en: 'You are positive, kind and naturally sociable. Your warm energy makes people around you feel braver and more relaxed.',
      ko: '긍정적이고 다정하며 사교적인 사람이에요. 따뜻한 에너지로 주변 사람들이 한결 편안하고 용기 있게 느끼도록 만들어요.',
    },
    strengths: {
      en: ['You understand and share in how others feel.', 'You make friends easily wherever you go.', 'Your positive energy brightens the whole room.'],
      ko: ['다른 사람의 마음에 깊이 공감해요.', '어디서든 쉽게 친해지는 친화력이 있어요.', '긍정적인 에너지로 분위기를 밝게 만들어요.'],
    },
    cautions: {
      en: ['While caring for others, you may put your own feelings on hold.', 'Try to check in on how you are doing, too.'],
      ko: ['다른 사람을 챙기느라 자신의 감정을 뒤로 미룰 수 있어요.', '가끔은 내 마음도 먼저 돌봐 주세요.'],
    },
    relationships: {
      en: ['You like relationships where you give each other strength and courage.', 'You are often the one who cheers friends on.'],
      ko: ['서로에게 힘과 용기를 주는 관계를 좋아해요.', '친구를 응원하는 역할을 자주 맡아요.'],
    },
    compatibleIds: ['chiikawa', 'ode'],
    learnFromIds: ['kurimanju'],
    answerKey: ['B', 'A', 'A', 'A', 'A', 'B', 'A', 'B'],
  },
  {
    id: 'usagi',
    name: { en: 'Usagi', ko: '우사기' },
    emoji: '🐰',
    color: 'yellow',
    cardClassName: 'bg-yellow-300/15 border-yellow-300/40',
    nameClassName: 'text-yellow-200',
    ogColor: '#854d0e',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ESTP',
    tagline: {
      en: 'A free spirit who acts first and surprises everyone',
      ko: '먼저 움직이고 모두를 놀라게 하는 자유로운 영혼',
    },
    coreTraits: {
      en: 'You are spontaneous, independent and full of get-up-and-go. When something needs doing, you are already on the move.',
      ko: '즉흥적이고 독립적이며 행동력이 강한 사람이에요. 해야 할 일이 생기면 이미 몸이 먼저 움직이고 있어요.',
    },
    strengths: {
      en: ['You think fast and react on the spot.', 'You are bold enough to try what others hesitate over.', 'You stay steady and handle a crisis well.'],
      ko: ['순발력이 좋아 빠르게 대응해요.', '남들이 망설이는 일에도 대담하게 도전해요.', '위기 상황에서도 침착하게 대처해요.'],
    },
    cautions: {
      en: ['Moving fast, you might miss how others are feeling.', 'A quick check-in with people around you can help.'],
      ko: ['빠르게 움직이다 보면 다른 사람의 감정을 놓칠 수 있어요.', '가끔 주변 사람의 마음을 한 번 더 살펴보면 좋아요.'],
    },
    relationships: {
      en: ['You prefer relationships where nobody meddles and everyone is free.', 'You show care through actions rather than words.'],
      ko: ['서로 간섭하지 않고 자유롭게 지내는 관계를 좋아해요.', '말보다 행동으로 마음을 표현해요.'],
    },
    compatibleIds: ['momonga', 'kabutomushi'],
    learnFromIds: ['chiikawa'],
    answerKey: ['C', 'B', 'C', 'C', 'C', 'C', 'C', 'C'],
  },
  {
    id: 'momonga',
    name: { en: 'Momonga', ko: '모몽가' },
    emoji: '🐿️',
    color: 'teal',
    cardClassName: 'bg-teal-300/15 border-teal-300/40',
    nameClassName: 'text-teal-200',
    ogColor: '#115e59',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ESFP',
    tagline: {
      en: 'A born performer who loves the spotlight',
      ko: '무대 한가운데가 잘 어울리는 타고난 주인공',
    },
    coreTraits: {
      en: 'You enjoy expressing yourself and love getting attention. You know how to make any moment more fun.',
      ko: '자기표현을 즐기고 관심받는 것을 좋아하는 사람이에요. 어떤 순간이든 더 즐겁게 만드는 방법을 알고 있어요.',
    },
    strengths: {
      en: ['You express yourself vividly and openly.', 'You carry yourself with confidence.', 'You find something to enjoy in almost anything.'],
      ko: ['생각과 감정을 생생하게 표현해요.', '자신감 있고 당당한 모습이 매력이에요.', '어떤 상황에서도 즐거움을 찾아내요.'],
    },
    cautions: {
      en: ['You can come across as a little self-focused.', 'Other people\'s reactions may affect you more than you expect.'],
      ko: ['때로는 자기중심적으로 보일 수 있어요.', '다른 사람의 반응에 생각보다 민감할 수 있어요.'],
    },
    relationships: {
      en: ['You like relationships where affection and interest are shown openly.', 'A little praise goes a long way with you.'],
      ko: ['관심과 애정을 적극적으로 표현하는 관계를 좋아해요.', '작은 칭찬에도 큰 힘을 얻어요.'],
    },
    compatibleIds: ['usagi', 'pajama-party'],
    learnFromIds: ['labor-armor'],
    answerKey: ['B', 'B', 'B', 'C', 'B', 'C', 'C', 'C'],
  },
  {
    id: 'kurimanju',
    name: { en: 'Kurimanju', ko: '쿠리만쥬' },
    emoji: '🌰',
    color: 'amber',
    cardClassName: 'bg-amber-300/15 border-amber-300/40',
    nameClassName: 'text-amber-200',
    ogColor: '#92400e',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISTP',
    tagline: {
      en: 'A laid-back connoisseur who knows exactly what they like',
      ko: '내 취향을 정확히 아는 여유로운 미식가',
    },
    coreTraits: {
      en: 'You are calm and independent, with tastes that are clearly your own. You enjoy life at your own pace.',
      ko: '차분하고 독립적이며 자신만의 취향이 확실한 사람이에요. 내 속도대로 삶의 즐거움을 누릴 줄 알아요.',
    },
    strengths: {
      en: ['You stay composed in almost any situation.', 'You go for practical solutions that actually work.', 'You solve problems on your own without fuss.'],
      ko: ['어떤 상황에서도 침착함을 잃지 않아요.', '실제로 쓸모 있는 실용적인 방법을 찾아요.', '문제를 혼자서도 차분하게 해결해요.'],
    },
    cautions: {
      en: ['You may seem indifferent to people who don\'t know you well.', 'Saying how you feel out loud now and then helps.'],
      ko: ['잘 모르는 사람에게는 무심해 보일 수 있어요.', '가끔은 마음을 말로 표현해 주면 좋아요.'],
    },
    relationships: {
      en: ['You value comfort and a healthy bit of distance.', 'You like friends you can simply relax with.'],
      ko: ['적당한 거리와 편안함을 중요하게 생각해요.', '함께 있으면 그냥 편한 친구를 좋아해요.'],
    },
    compatibleIds: ['labor-armor', 'rakko'],
    learnFromIds: ['hachiware'],
    answerKey: ['D', 'D', 'D', 'C', 'D', 'C', 'D', 'D'],
  },
  {
    id: 'shisa',
    name: { en: 'Shisa', ko: '시사' },
    emoji: '🦁',
    color: 'orange',
    cardClassName: 'bg-orange-300/15 border-orange-300/40',
    nameClassName: 'text-orange-200',
    ogColor: '#9a3412',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISFJ',
    tagline: {
      en: 'An earnest learner who grows a little every day',
      ko: '매일 조금씩 자라는 성실한 배움꾼',
    },
    coreTraits: {
      en: 'You are polite and hardworking, with a big desire to learn. You keep showing up and improving, step by step.',
      ko: '예의 바르고 성실하며 배우려는 마음이 큰 사람이에요. 꾸준히 노력하며 한 걸음씩 성장해 나가요.',
    },
    strengths: {
      en: ['You take your responsibilities seriously.', 'You keep at things steadily over time.', 'You stay humble and open to learning.'],
      ko: ['맡은 일에 책임감이 강해요.', '오랫동안 꾸준하게 노력해요.', '겸손하고 배우려는 자세가 열려 있어요.'],
    },
    cautions: {
      en: ['Trying to meet others\' expectations, you may sell yourself short.', 'Give yourself credit for how far you have come.'],
      ko: ['다른 사람의 기대에 맞추다 자신을 과소평가할 수 있어요.', '지금까지 해낸 것들을 스스로 칭찬해 주세요.'],
    },
    relationships: {
      en: ['You like relationships built on respect and trust.', 'You are grateful to people who teach and support you.'],
      ko: ['존중과 신뢰를 바탕으로 한 관계를 좋아해요.', '나를 가르쳐 주고 응원해 주는 사람에게 고마움을 잊지 않아요.'],
    },
    compatibleIds: ['chiikawa', 'hachiware'],
    learnFromIds: ['usagi'],
    answerKey: ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A'],
  },
  {
    id: 'rakko',
    name: { en: 'Rakko', ko: '랏코' },
    emoji: '🦦',
    color: 'cyan',
    cardClassName: 'bg-cyan-300/15 border-cyan-300/40',
    nameClassName: 'text-cyan-200',
    ogColor: '#155e75',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ESTJ',
    tagline: {
      en: 'A confident pro with clear goals and high standards',
      ko: '분명한 목표와 높은 기준을 가진 자신감 있는 실력자',
    },
    coreTraits: {
      en: 'You are self-assured, with clear goals and standards. You set the bar high and work steadily to reach it.',
      ko: '자신감 있고 목표와 기준이 분명한 사람이에요. 높은 목표를 세우고 그 목표를 향해 꾸준히 나아가요.',
    },
    strengths: {
      en: ['You drive things forward with real momentum.', 'You follow through on what you take on.', 'You manage yourself with discipline.'],
      ko: ['강한 추진력으로 일을 앞으로 이끌어요.', '맡은 일은 끝까지 책임져요.', '철저한 자기관리를 해요.'],
    },
    cautions: {
      en: ['You can be too strict with yourself and others.', 'Leaving a little room for mistakes can make things lighter.'],
      ko: ['자신과 다른 사람에게 지나치게 엄격할 수 있어요.', '실수에 조금 여유를 두면 마음이 한결 가벼워져요.'],
    },
    relationships: {
      en: ['You like relationships where each person\'s role and responsibility are respected.', 'You earn trust by keeping your word.'],
      ko: ['서로의 역할과 책임을 존중하는 관계를 좋아해요.', '약속을 지키는 모습으로 신뢰를 쌓아요.'],
    },
    compatibleIds: ['kurimanju', 'labor-armor'],
    learnFromIds: ['chiikawa'],
    answerKey: ['D', 'C', 'B', 'B', 'B', 'D', 'B', 'D'],
  },
  {
    id: 'kani',
    name: { en: 'Kani (Furuhonya)', ko: '카니(후루혼야)' },
    emoji: '🦀',
    color: 'red',
    cardClassName: 'bg-red-300/15 border-red-300/40',
    nameClassName: 'text-red-200',
    ogColor: '#991b1b',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'INFP',
    tagline: {
      en: 'A quiet dreamer with a rich inner world',
      ko: '풍부한 마음속 세계를 가진 조용한 몽상가',
    },
    coreTraits: {
      en: 'You are sensitive and quiet, with clear feelings and tastes of your own. There is a lot going on beneath your calm surface.',
      ko: '섬세하고 조용하며 감정과 취향이 뚜렷한 사람이에요. 차분한 겉모습 안에 깊고 풍부한 생각을 품고 있어요.',
    },
    strengths: {
      en: ['You have a vivid imagination.', 'You understand others\' feelings deeply.', 'You are genuine in everything you do.'],
      ko: ['상상력이 풍부해요.', '다른 사람의 마음을 깊이 이해해요.', '무엇을 하든 진심을 담아요.'],
    },
    cautions: {
      en: ['Expressing your feelings may not come easily.', 'Conflict can feel especially hard for you.'],
      ko: ['감정을 표현하는 것이 어렵게 느껴질 수 있어요.', '갈등 상황을 특히 힘들어할 수 있어요.'],
    },
    relationships: {
      en: ['You like deep relationships with people who understand your inner self.', 'A few close friends mean more to you than a big crowd.'],
      ko: ['내 마음속을 이해해 주는 깊은 관계를 좋아해요.', '많은 사람보다 소수의 깊은 친구가 더 소중해요.'],
    },
    compatibleIds: ['dekatsuyo', 'chiikawa'],
    learnFromIds: ['rakko'],
    answerKey: ['A', 'D', 'A', 'D', 'D', 'A', 'D', 'D'],
  },
  {
    id: 'anoko',
    name: { en: 'Anoko', ko: '아노코' },
    emoji: '🌸',
    color: 'rose',
    cardClassName: 'bg-rose-300/15 border-rose-300/40',
    nameClassName: 'text-rose-200',
    ogColor: '#9f1239',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISFP',
    tagline: {
      en: 'An easygoing individualist who lives in the moment',
      ko: '지금 이 순간을 즐기는 나만의 스타일리스트',
    },
    coreTraits: {
      en: 'You are independent and in tune with your senses, and you do things your own way. You know how to enjoy the here and now.',
      ko: '독립적이고 감각적이며 자기만의 방식이 있는 사람이에요. 지금 이 순간을 즐길 줄 알아요.',
    },
    strengths: {
      en: ['You go with the flow and adapt easily.', 'Your personality shines through in everything.', 'You make the most of the present moment.'],
      ko: ['상황에 맞춰 유연하게 움직여요.', '무엇을 하든 나만의 개성이 드러나요.', '현재를 즐기는 여유가 있어요.'],
    },
    cautions: {
      en: ['Because you rarely show what you really think, people may misread you.', 'Sharing a little of your inner thoughts can help.'],
      ko: ['속마음을 잘 드러내지 않아 오해를 받을 수 있어요.', '가끔은 속마음을 조금 꺼내 보이면 좋아요.'],
    },
    relationships: {
      en: ['You like relationships that respect your personal space and freedom.', 'You open up slowly, but deeply.'],
      ko: ['나만의 공간과 자유를 존중해 주는 관계를 좋아해요.', '천천히, 하지만 깊이 마음을 열어요.'],
    },
    compatibleIds: ['dekatsuyo', 'kurimanju'],
    learnFromIds: ['hachiware'],
    answerKey: ['C', 'B', 'D', 'D', 'C', 'C', 'D', 'D'],
  },
  {
    id: 'dekatsuyo',
    name: { en: 'Dekatsuyo', ko: '데카츠요' },
    emoji: '💪',
    color: 'green',
    cardClassName: 'bg-green-300/15 border-green-300/40',
    nameClassName: 'text-green-200',
    ogColor: '#166534',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISFP',
    tagline: {
      en: 'A big heart that wears every feeling honestly',
      ko: '모든 감정을 솔직하게 표현하는 커다란 마음',
    },
    coreTraits: {
      en: 'You feel things deeply and have a clear sense of style and self-expression. What you feel, you show.',
      ko: '감정이 풍부하고 취향과 표현 방식이 뚜렷한 사람이에요. 느끼는 그대로를 솔직하게 보여 줘요.',
    },
    strengths: {
      en: ['You are deeply sensitive to beauty and emotion.', 'Your individuality is easy to recognize.', 'You express your feelings honestly.'],
      ko: ['감수성이 풍부해요.', '누구와도 다른 뚜렷한 개성이 있어요.', '감정을 솔직하게 표현해요.'],
    },
    cautions: {
      en: ['Your moods can swing quite a bit.', 'A calm moment before reacting can help.'],
      ko: ['감정 기복이 클 수 있어요.', '반응하기 전에 잠깐 숨을 고르면 도움이 돼요.'],
    },
    relationships: {
      en: ['You like relationships where you are accepted just as you are.', 'You stay loyal to people who understand you.'],
      ko: ['나를 있는 그대로 받아 주는 관계를 좋아해요.', '나를 이해해 주는 사람에게 한결같아요.'],
    },
    compatibleIds: ['kani', 'anoko'],
    learnFromIds: ['labor-armor'],
    answerKey: ['A', 'B', 'A', 'D', 'C', 'C', 'C', 'A'],
  },
  {
    id: 'ode',
    name: { en: 'Ode', ko: '오데' },
    emoji: '🤝',
    color: 'lime',
    cardClassName: 'bg-lime-300/15 border-lime-300/40',
    nameClassName: 'text-lime-200',
    ogColor: '#3f6212',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ESFJ',
    tagline: {
      en: 'A friendly host who makes everyone feel included',
      ko: '모두가 함께 어울리도록 챙기는 다정한 분위기 메이커',
    },
    coreTraits: {
      en: 'You are kind and sociable, and you look out for everyone around you. Groups feel warmer when you are there.',
      ko: '친절하고 사교적이며 주변을 잘 챙기는 사람이에요. 당신이 있으면 모임이 한층 따뜻해져요.',
    },
    strengths: {
      en: ['You are thoughtful toward everyone.', 'You get along with people easily.', 'You have a strong sense of community.'],
      ko: ['누구에게나 배려심이 깊어요.', '사람들과 쉽게 어울려요.', '함께하는 공동체를 소중히 여겨요.'],
    },
    cautions: {
      en: ['You can be sensitive to how others judge you.', 'Your own opinion of yourself matters too.'],
      ko: ['다른 사람의 평가에 민감할 수 있어요.', '나에 대한 나의 생각도 똑같이 소중해요.'],
    },
    relationships: {
      en: ['You like relationships where everyone hangs out and looks after each other.', 'You remember the little things about your friends.'],
      ko: ['함께 어울리고 서로 챙기는 관계를 좋아해요.', '친구의 작은 것까지 기억해 줘요.'],
    },
    compatibleIds: ['hachiware', 'pajama-party'],
    learnFromIds: ['usagi'],
    answerKey: ['B', 'A', 'A', 'D', 'B', 'B', 'A', 'A'],
  },
  {
    id: 'pochette-armor',
    name: { en: 'Pochette Armor-san', ko: '포셰트 갑옷씨' },
    emoji: '👜',
    color: 'emerald',
    cardClassName: 'bg-emerald-300/15 border-emerald-300/40',
    nameClassName: 'text-emerald-200',
    ogColor: '#065f46',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISFP',
    tagline: {
      en: 'A soft-hearted maker with a great sense of style',
      ko: '감각적인 취향을 가진 부드러운 손재주꾼',
    },
    coreTraits: {
      en: 'You have refined, sensory tastes and a gentle nature. You find quiet joy in making and choosing beautiful things.',
      ko: '감각적인 취향과 부드러운 성격을 지닌 사람이에요. 예쁜 것을 만들고 고르는 데서 조용한 즐거움을 느껴요.',
    },
    strengths: {
      en: ['You are creative and full of ideas.', 'You pay attention to fine details.', 'You adapt gently to different situations.'],
      ko: ['창의적인 아이디어가 많아요.', '작은 부분까지 섬세하게 살펴요.', '어떤 상황에도 부드럽게 맞춰 가요.'],
    },
    cautions: {
      en: ['You may hold back from stating your opinion.', 'Your ideas are worth sharing out loud.'],
      ko: ['자신의 주장을 적극적으로 표현하지 못할 수 있어요.', '당신의 생각은 충분히 말할 가치가 있어요.'],
    },
    relationships: {
      en: ['You like relationships where you share tastes and sensibilities.', 'You show care with small, thoughtful touches.'],
      ko: ['취향과 감성을 함께 나누는 관계를 좋아해요.', '작고 세심한 정성으로 마음을 전해요.'],
    },
    compatibleIds: ['kani', 'dekatsuyo'],
    learnFromIds: ['rakko'],
    answerKey: ['A', 'D', 'D', 'D', 'D', 'C', 'D', 'A'],
  },
  {
    id: 'labor-armor',
    name: { en: 'Labor Armor-san', ko: '노동 갑옷씨' },
    emoji: '🛡️',
    color: 'stone',
    cardClassName: 'bg-stone-300/15 border-stone-300/40',
    nameClassName: 'text-stone-200',
    ogColor: '#44403c',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ISTJ',
    tagline: {
      en: 'A dependable worker everyone can count on',
      ko: '누구나 믿고 기댈 수 있는 든든한 일꾼',
    },
    coreTraits: {
      en: 'You are responsible and value principles and order. You do things properly, one step at a time.',
      ko: '책임감 있고 원칙과 질서를 중요하게 생각하는 사람이에요. 무슨 일이든 차근차근 제대로 해내요.',
    },
    strengths: {
      en: ['You are diligent and hardworking.', 'You handle work in an organized, systematic way.', 'People feel they can rely on you.'],
      ko: ['성실하고 부지런해요.', '일을 체계적으로 처리해요.', '주변 사람에게 믿음을 줘요.'],
    },
    cautions: {
      en: ['Sudden changes may be hard to roll with.', 'Trying something new once in a while can be refreshing.'],
      ko: ['갑작스러운 변화에 유연하게 대응하기 어려울 수 있어요.', '가끔 새로운 방식을 시도해 보면 기분 전환이 돼요.'],
    },
    relationships: {
      en: ['You like relationships where promises and responsibilities are kept.', 'You show care by being consistently there.'],
      ko: ['약속과 책임을 지키는 관계를 좋아해요.', '한결같은 모습으로 마음을 표현해요.'],
    },
    compatibleIds: ['kurimanju', 'rakko'],
    learnFromIds: ['momonga'],
    answerKey: ['D', 'C', 'D', 'D', 'D', 'D', 'B', 'A'],
  },
  {
    id: 'ramen-armor',
    name: { en: 'Ramen Armor-san', ko: '라멘 갑옷씨' },
    emoji: '🍜',
    color: 'slate',
    cardClassName: 'bg-slate-300/15 border-slate-300/40',
    nameClassName: 'text-slate-200',
    ogColor: '#334155',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ESTJ',
    tagline: {
      en: 'A craftsperson who takes pride in a job well done',
      ko: '완성도에 자부심을 가진 진정한 장인',
    },
    coreTraits: {
      en: 'You are practical and take the lead, and you care about getting things just right. Your routines are how you keep quality high.',
      ko: '현실적이고 주도적이며 완성도를 중요하게 생각하는 사람이에요. 꾸준한 루틴으로 높은 완성도를 지켜 나가요.',
    },
    strengths: {
      en: ['You turn plans into action.', 'You are good at managing people and tasks.', 'You take full responsibility for your work.'],
      ko: ['계획을 실제 행동으로 옮기는 실행력이 있어요.', '사람과 일을 관리하는 능력이 뛰어나요.', '자신의 일에 끝까지 책임을 져요.'],
    },
    cautions: {
      en: ['You may expect others to meet your own standards.', 'People can reach good results in their own way, too.'],
      ko: ['자신의 기준을 다른 사람에게도 요구할 수 있어요.', '다른 사람도 자기 방식으로 좋은 결과를 낼 수 있어요.'],
    },
    relationships: {
      en: ['You like relationships with clear roles and shared goals.', 'You respect people who take their craft seriously.'],
      ko: ['명확한 역할과 목표가 있는 관계를 좋아해요.', '자기 일에 진지한 사람을 존중해요.'],
    },
    compatibleIds: ['rakko', 'labor-armor'],
    learnFromIds: ['kani'],
    answerKey: ['D', 'C', 'D', 'B', 'D', 'A', 'D', 'D'],
  },
  {
    id: 'pajama-party',
    name: { en: 'Pajama Party', ko: '파자마 파티즈' },
    emoji: '🌙',
    color: 'blue',
    cardClassName: 'bg-blue-300/15 border-blue-300/40',
    nameClassName: 'text-blue-200',
    ogColor: '#1e40af',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ENFP',
    tagline: {
      en: 'A cheerful crew always up for the next adventure',
      ko: '다음 모험이 늘 기다려지는 유쾌한 친구들',
    },
    coreTraits: {
      en: 'You are lively and curious, and you love new experiences. Wherever you go, fun tends to follow.',
      ko: '활발하고 호기심이 많으며 새로운 경험을 즐기는 사람이에요. 어디를 가든 즐거움이 함께 따라와요.',
    },
    strengths: {
      en: ['You come up with creative ideas.', 'You make friends quickly.', 'Your positive energy is contagious.'],
      ko: ['창의적인 아이디어가 넘쳐요.', '누구와도 금방 친해져요.', '긍정적인 에너지가 주변에 전해져요.'],
    },
    cautions: {
      en: ['Your interests can change quickly.', 'Finishing one thing before starting the next can feel rewarding.'],
      ko: ['흥미가 빨리 바뀔 수 있어요.', '하나를 마무리하고 다음으로 넘어가면 뿌듯함이 커져요.'],
    },
    relationships: {
      en: ['You like relationships where you try new things and share the fun together.', 'You turn ordinary days into memories.'],
      ko: ['함께 새로운 경험을 하고 즐거움을 나누는 관계를 좋아해요.', '평범한 하루도 추억으로 만들어요.'],
    },
    compatibleIds: ['ode', 'momonga'],
    learnFromIds: ['labor-armor'],
    answerKey: ['B', 'B', 'C', 'A', 'B', 'C', 'C', 'B'],
  },
  {
    id: 'kabutomushi',
    name: { en: 'Kabutomushi', ko: '장수풍뎅이' },
    emoji: '🪲',
    color: 'neutral',
    cardClassName: 'bg-neutral-300/15 border-neutral-300/40',
    nameClassName: 'text-neutral-200',
    ogColor: '#404040',
    officialUrl: CHIIKAWA_OFFICIAL_SITE,
    fanType: 'ENFP',
    tagline: {
      en: 'A curious newcomer who feels at home anywhere',
      ko: '어디서든 금방 적응하는 호기심 많은 새 친구',
    },
    coreTraits: {
      en: 'You are curious and friendly, and open to new surroundings. You meet the unfamiliar with a smile.',
      ko: '호기심 많고 친근하며 새로운 환경에 열려 있는 사람이에요. 낯선 것도 웃으며 맞이해요.',
    },
    strengths: {
      en: ['You adapt quickly to new places.', 'You see the bright side of things.', 'You get along easily with all kinds of people.'],
      ko: ['새로운 곳에 빠르게 적응해요.', '언제나 밝은 면을 바라봐요.', '어떤 사람과도 쉽게 어울려요.'],
    },
    cautions: {
      en: ['You may act before looking closely.', 'A quick pause to check the situation can help.'],
      ko: ['충분히 살피기 전에 행동할 수 있어요.', '잠깐 멈춰 상황을 살피면 도움이 돼요.'],
    },
    relationships: {
      en: ['You like relationships full of new people and new experiences.', 'You welcome newcomers warmly.'],
      ko: ['새로운 사람과 경험을 즐기는 관계를 좋아해요.', '처음 온 사람도 반갑게 맞아 줘요.'],
    },
    compatibleIds: ['usagi', 'pajama-party'],
    learnFromIds: ['kurimanju'],
    answerKey: ['B', 'B', 'C', 'A', 'C', 'B', 'C', 'C'],
  },
]

export function getChiikawaCharacter(id: string): ChiikawaCharacter | undefined {
  return CHIIKAWA_CHARACTERS.find((c) => c.id === id)
}
