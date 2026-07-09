/**
 * Baby Temperament Type Quiz — Question Data
 *
 * Based on Thomas & Chess (1977), New York Longitudinal Study (NYLS).
 * The original 9 temperament dimensions are re-mapped to 4 axes for
 * an accessible, entertaining quiz format:
 *
 *   activity     — Activity level + Distractibility
 *   social       — Approach–Withdrawal
 *   adaptability — Adaptability
 *   reactivity   — Intensity of reaction + Threshold of responsiveness
 *
 * Reference:
 *   Thomas A, Chess S. Temperament and Development. New York: Brunner/Mazel; 1977.
 *
 * IMPORTANT: This quiz is intended for entertainment/reference only.
 * It is NOT a clinical developmental screening tool (e.g. ASQ, K-DST).
 * All questions are framed neutrally — neither option reflects a problem
 * or developmental concern.
 */

export type AgeBand = 'infant' | 'toddler' | 'preschooler'
// 4–12 months | 13–36 months | 37–84 months

export type Axis = 'activity' | 'social' | 'adaptability' | 'reactivity'

export type ActivityPole = 'active' | 'calm'
export type SocialPole = 'social' | 'shy'
export type AdaptabilityPole = 'flexible' | 'cautious'
export type ReactivityPole = 'expressive' | 'mellow'
export type Pole = ActivityPole | SocialPole | AdaptabilityPole | ReactivityPole

export type QuestionOption = {
  pole: Pole
  label: { en: string; ko: string }
}

export type TemperamentQuestion = {
  id: string
  axis: Axis
  ageBand: AgeBand
  prompt: { en: string; ko: string }
  options: [QuestionOption, QuestionOption]
}

// ---------------------------------------------------------------------------
// Infant (4–12 months)
// ---------------------------------------------------------------------------

const INFANT_ACTIVITY: TemperamentQuestion[] = [
  {
    id: 'infant-activity-1',
    axis: 'activity',
    ageBand: 'infant',
    prompt: {
      en: 'When placed on the floor to play, your baby…',
      ko: '바닥에 내려놓으면 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Kicks, rolls, and moves around actively', ko: '발을 구르고 뒤집기를 하며 활발하게 움직여요' } },
      { pole: 'calm', label: { en: 'Stays in place and quietly observes the surroundings', ko: '한 자리에 머물며 주변을 조용히 살펴요' } },
    ],
  },
  {
    id: 'infant-activity-2',
    axis: 'activity',
    ageBand: 'infant',
    prompt: {
      en: 'During bath time, your baby…',
      ko: '목욕 시간에 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Splashes and moves with lots of energy', ko: '물을 첨벙첨벙 튀기며 온 몸을 움직여요' } },
      { pole: 'calm', label: { en: 'Relaxes and enjoys the warm water quietly', ko: '따뜻한 물 속에서 얌전하게 여유를 즐겨요' } },
    ],
  },
  {
    id: 'infant-activity-3',
    axis: 'activity',
    ageBand: 'infant',
    prompt: {
      en: 'When awake in the crib, your baby…',
      ko: '침대에서 깨어 있을 때 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Wiggles and squirms constantly, eager to move', ko: '끊임없이 몸을 뒤틀고 꼼지락대요' } },
      { pole: 'calm', label: { en: 'Lies still and studies the ceiling or mobile contentedly', ko: '조용히 천장이나 모빌을 바라보며 만족스러워해요' } },
    ],
  },
  {
    id: 'infant-activity-4',
    axis: 'activity',
    ageBand: 'infant',
    prompt: {
      en: 'During feeding, your baby…',
      ko: '수유 중에 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Feeds energetically and often pulls away to look around', ko: '왕성하게 먹다가 주변을 보려고 자꾸 고개를 돌려요' } },
      { pole: 'calm', label: { en: 'Feeds slowly and steadily at a relaxed pace', ko: '차분하게 일정한 속도로 먹어요' } },
    ],
  },
  {
    id: 'infant-activity-5',
    axis: 'activity',
    ageBand: 'infant',
    prompt: {
      en: 'When you carry your baby, they…',
      ko: '안아줄 때 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Squirms and reaches out to touch and explore everything', ko: '몸을 비틀며 손을 뻗어 주변 것들을 만지려 해요' } },
      { pole: 'calm', label: { en: 'Relaxes comfortably against your body', ko: '보호자 품에 편안하게 기대요' } },
    ],
  },
]

const INFANT_SOCIAL: TemperamentQuestion[] = [
  {
    id: 'infant-social-1',
    axis: 'social',
    ageBand: 'infant',
    prompt: {
      en: 'When a stranger smiles at your baby…',
      ko: '낯선 사람이 아이에게 미소를 지으면…',
    },
    options: [
      { pole: 'social', label: { en: 'Smiles back and reaches out right away', ko: '바로 환하게 웃으며 손을 뻗어요' } },
      { pole: 'shy', label: { en: 'Studies the stranger\'s face quietly before reacting', ko: '낯선 얼굴을 한동안 살펴보다가 천천히 반응해요' } },
    ],
  },
  {
    id: 'infant-social-2',
    axis: 'social',
    ageBand: 'infant',
    prompt: {
      en: 'When visitors come to your home, your baby…',
      ko: '손님이 집에 오면 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Gets excited and wants to interact with everyone', ko: '신이 나서 모든 사람과 교류하려 해요' } },
      { pole: 'shy', label: { en: 'Stays close to familiar caregivers and watches from a distance', ko: '익숙한 보호자 옆에 붙어서 멀리서 지켜봐요' } },
    ],
  },
  {
    id: 'infant-social-3',
    axis: 'social',
    ageBand: 'infant',
    prompt: {
      en: 'When you make eye contact with your baby from across the room…',
      ko: '멀리서 아이와 눈을 맞추면…',
    },
    options: [
      { pole: 'social', label: { en: 'Immediately breaks into a big smile and babbles', ko: '바로 환하게 웃으며 옹알이를 해요' } },
      { pole: 'shy', label: { en: 'Gives a small smile and watches to see what you\'ll do next', ko: '살짝 미소 짓고 다음 행동을 기다려요' } },
    ],
  },
  {
    id: 'infant-social-4',
    axis: 'social',
    ageBand: 'infant',
    prompt: {
      en: 'Around other babies, your baby…',
      ko: '또래 아이들 옆에 있으면…',
    },
    options: [
      { pole: 'social', label: { en: 'Reaches toward them and tries to make contact', ko: '손을 뻗어 가까이 다가가려 해요' } },
      { pole: 'shy', label: { en: 'Watches the other baby with curiosity from a safe distance', ko: '안전한 거리에서 호기심 어린 눈으로 지켜봐요' } },
    ],
  },
  {
    id: 'infant-social-5',
    axis: 'social',
    ageBand: 'infant',
    prompt: {
      en: 'When someone new holds your baby…',
      ko: '처음 보는 사람이 아이를 안으면…',
    },
    options: [
      { pole: 'social', label: { en: 'Quickly settles in and engages with the new person', ko: '금방 편안해지며 새 사람과 눈 맞추고 반응해요' } },
      { pole: 'shy', label: { en: 'Takes a little time to warm up before relaxing', ko: '긴장한 표정으로 시간을 두고 서서히 편안해져요' } },
    ],
  },
]

const INFANT_ADAPTABILITY: TemperamentQuestion[] = [
  {
    id: 'infant-adaptability-1',
    axis: 'adaptability',
    ageBand: 'infant',
    prompt: {
      en: 'When the daily routine changes (e.g., nap or feeding time shifts), your baby…',
      ko: '수유나 낮잠 시간이 바뀌면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Adjusts smoothly and settles into the new pattern', ko: '새 패턴에 큰 무리 없이 적응해요' } },
      { pole: 'cautious', label: { en: 'Needs extra time and soothing to adapt', ko: '적응하는 데 시간과 달래줌이 더 필요해요' } },
    ],
  },
  {
    id: 'infant-adaptability-2',
    axis: 'adaptability',
    ageBand: 'infant',
    prompt: {
      en: 'When introduced to a new food for the first time, your baby…',
      ko: '새로운 이유식을 처음 줄 때 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Opens up and tries it with curiosity', ko: '호기심 있게 입을 열고 시도해봐요' } },
      { pole: 'cautious', label: { en: 'Keeps their mouth closed and needs a few tries before accepting', ko: '처음엔 입을 다물고 여러 번 시도해야 받아들여요' } },
    ],
  },
  {
    id: 'infant-adaptability-3',
    axis: 'adaptability',
    ageBand: 'infant',
    prompt: {
      en: 'When you try a new sleeping spot (e.g., travel cot), your baby…',
      ko: '평소와 다른 곳(여행용 침대 등)에서 재울 때 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Settles down without much fuss', ko: '큰 불편 없이 잘 자리를 잡아요' } },
      { pole: 'cautious', label: { en: 'Takes noticeably longer to fall asleep than at home', ko: '집에서보다 눈에 띄게 오래 걸려서 잠들어요' } },
    ],
  },
  {
    id: 'infant-adaptability-4',
    axis: 'adaptability',
    ageBand: 'infant',
    prompt: {
      en: 'When you change the usual soothing method (e.g., switch from rocking to patting), your baby…',
      ko: '달래는 방법을 바꾸면(예: 흔들어주기 → 토닥이기) 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Accepts the new approach and calms down fairly quickly', ko: '새 방법도 비교적 빨리 받아들이고 진정해요' } },
      { pole: 'cautious', label: { en: 'Prefers the familiar method and takes longer to settle', ko: '익숙한 방법을 원하고 진정까지 시간이 더 걸려요' } },
    ],
  },
  {
    id: 'infant-adaptability-5',
    axis: 'adaptability',
    ageBand: 'infant',
    prompt: {
      en: 'When visiting a new place (e.g., a relative\'s home), your baby…',
      ko: '낯선 장소(예: 친척 집)에 방문하면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Explores the new environment with interest', ko: '새 환경에 관심을 보이며 살펴봐요' } },
      { pole: 'cautious', label: { en: 'Stays close to you and checks in frequently', ko: '보호자 곁에 딱 붙어 수시로 확인해요' } },
    ],
  },
]

const INFANT_REACTIVITY: TemperamentQuestion[] = [
  {
    id: 'infant-reactivity-1',
    axis: 'reactivity',
    ageBand: 'infant',
    prompt: {
      en: 'When your baby is happy, they…',
      ko: '아이가 기분이 좋을 때는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Squeals, laughs loudly, and kicks with excitement', ko: '소리를 지르고 크게 웃으며 발을 퍼덕여요' } },
      { pole: 'mellow', label: { en: 'Smiles softly and shows quiet contentment', ko: '잔잔하게 미소 지으며 평온하게 만족을 드러내요' } },
    ],
  },
  {
    id: 'infant-reactivity-2',
    axis: 'reactivity',
    ageBand: 'infant',
    prompt: {
      en: 'When something upsets your baby, they…',
      ko: '아이가 불편할 때는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Cries loudly and urgently to let you know', ko: '크고 다급하게 울며 확실하게 알려요' } },
      { pole: 'mellow', label: { en: 'Fusses quietly and is usually easy to settle', ko: '작게 칭얼거리고 금방 달래져요' } },
    ],
  },
  {
    id: 'infant-reactivity-3',
    axis: 'reactivity',
    ageBand: 'infant',
    prompt: {
      en: 'When your baby spots a colourful new toy, they…',
      ko: '새로운 알록달록한 장난감을 발견하면 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Reacts with wide eyes, waving arms, and big excitement', ko: '눈을 크게 뜨고 팔을 흔들며 크게 반응해요' } },
      { pole: 'mellow', label: { en: 'Shows calm interest and studies it steadily', ko: '차분하게 관심을 보이며 꼼꼼하게 살펴봐요' } },
    ],
  },
  {
    id: 'infant-reactivity-4',
    axis: 'reactivity',
    ageBand: 'infant',
    prompt: {
      en: 'When a sudden loud noise happens nearby, your baby…',
      ko: '갑자기 큰 소리가 나면 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Startles strongly and needs reassurance to calm down', ko: '깜짝 놀라며 달래줄 때까지 울어요' } },
      { pole: 'mellow', label: { en: 'Glances toward the sound and returns to what they were doing', ko: '소리 쪽을 한번 쳐다보고 하던 것을 계속해요' } },
    ],
  },
  {
    id: 'infant-reactivity-5',
    axis: 'reactivity',
    ageBand: 'infant',
    prompt: {
      en: 'When you pause a game you were playing together, your baby…',
      ko: '같이 놀다가 잠깐 멈추면 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Protests clearly and tries hard to get you to continue', ko: '큰 소리로 항의하며 계속해달라고 요구해요' } },
      { pole: 'mellow', label: { en: 'Waits patiently or finds something else to explore', ko: '조용히 기다리거나 다른 것을 찾아봐요' } },
    ],
  },
]

// ---------------------------------------------------------------------------
// Toddler (13–36 months)
// ---------------------------------------------------------------------------

const TODDLER_ACTIVITY: TemperamentQuestion[] = [
  {
    id: 'toddler-activity-1',
    axis: 'activity',
    ageBand: 'toddler',
    prompt: {
      en: 'On a free afternoon at home, your toddler…',
      ko: '한가한 오후 집에서 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Runs from room to room, always looking for something to do', ko: '방마다 뛰어다니며 뭔가를 찾아요' } },
      { pole: 'calm', label: { en: 'Settles in one spot and plays quietly with a toy or book', ko: '한 자리에 앉아 장난감이나 책으로 조용히 놀아요' } },
    ],
  },
  {
    id: 'toddler-activity-2',
    axis: 'activity',
    ageBand: 'toddler',
    prompt: {
      en: 'At a playground, your toddler…',
      ko: '놀이터에 가면 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Dashes to every piece of equipment and rarely stops', ko: '모든 놀이기구를 쉬지 않고 돌아다녀요' } },
      { pole: 'calm', label: { en: 'Picks one area and explores it thoroughly', ko: '한 곳을 정하고 그곳을 충분히 탐색해요' } },
    ],
  },
  {
    id: 'toddler-activity-3',
    axis: 'activity',
    ageBand: 'toddler',
    prompt: {
      en: 'During a long car ride, your toddler…',
      ko: '장거리 차 이동 중에 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Squirms, climbs, and frequently asks to get out', ko: '꼼지락거리고, 기어오르고, 자주 내려달라 해요' } },
      { pole: 'calm', label: { en: 'Looks out the window or plays with a toy fairly contentedly', ko: '창밖을 보거나 장난감으로 꽤 만족스럽게 놀아요' } },
    ],
  },
  {
    id: 'toddler-activity-4',
    axis: 'activity',
    ageBand: 'toddler',
    prompt: {
      en: 'After waking up from a nap, your toddler…',
      ko: '낮잠에서 깨어나면 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Is up and moving right away, full of energy', ko: '바로 일어나 에너지 넘치게 활동해요' } },
      { pole: 'calm', label: { en: 'Takes a few minutes to gradually wake up before moving', ko: '몇 분 동안 천천히 깨어난 후에 움직여요' } },
    ],
  },
  {
    id: 'toddler-activity-5',
    axis: 'activity',
    ageBand: 'toddler',
    prompt: {
      en: 'When you\'re trying to change a diaper or put clothes on, your toddler…',
      ko: '기저귀를 갈거나 옷을 입힐 때 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Wiggles and tries to escape the whole time', ko: '내내 꼼지락거리며 도망가려 해요' } },
      { pole: 'calm', label: { en: 'Stays fairly still and lets you finish', ko: '비교적 얌전하게 있어줘요' } },
    ],
  },
]

const TODDLER_SOCIAL: TemperamentQuestion[] = [
  {
    id: 'toddler-social-1',
    axis: 'social',
    ageBand: 'toddler',
    prompt: {
      en: 'At a friend\'s birthday party, your toddler…',
      ko: '친구의 생일 파티에서 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Joins in the fun right away and plays with unfamiliar kids', ko: '바로 어울려 처음 보는 아이들과도 잘 놀아요' } },
      { pole: 'shy', label: { en: 'Stays near you at first and watches before slowly joining in', ko: '처음엔 보호자 옆에 있다가 천천히 참여해요' } },
    ],
  },
  {
    id: 'toddler-social-2',
    axis: 'social',
    ageBand: 'toddler',
    prompt: {
      en: 'When a new caregiver arrives, your toddler…',
      ko: '새로운 선생님이나 돌봄 선생님이 오면 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Walks up and starts interacting right away', ko: '바로 다가가서 말을 걸거나 장난감을 보여줘요' } },
      { pole: 'shy', label: { en: 'Hides behind your leg before eventually warming up', ko: '보호자 뒤에 숨었다가 시간이 지나며 마음을 열어요' } },
    ],
  },
  {
    id: 'toddler-social-3',
    axis: 'social',
    ageBand: 'toddler',
    prompt: {
      en: 'At the playground, when another child approaches, your toddler…',
      ko: '놀이터에서 다른 아이가 다가오면…',
    },
    options: [
      { pole: 'social', label: { en: 'Says hi and invites them to play together', ko: '인사하고 같이 놀자고 해요' } },
      { pole: 'shy', label: { en: 'Keeps playing but watches the other child carefully first', ko: '놀이를 계속하면서 상대방을 유심히 지켜봐요' } },
    ],
  },
  {
    id: 'toddler-social-4',
    axis: 'social',
    ageBand: 'toddler',
    prompt: {
      en: 'When you meet a gentle family pet for the first time, your toddler…',
      ko: '온순한 동물을 처음 만나면 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Rushes over to pet it enthusiastically', ko: '신이 나서 달려가 만져봐요' } },
      { pole: 'shy', label: { en: 'Watches from a distance and approaches only when ready', ko: '멀리서 지켜보다가 준비됐을 때 다가가요' } },
    ],
  },
  {
    id: 'toddler-social-5',
    axis: 'social',
    ageBand: 'toddler',
    prompt: {
      en: 'In a group setting (e.g., toddler class or playgroup), your toddler…',
      ko: '어린이집이나 문화센터 등 그룹 활동에서 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Gets involved in activities and interacts with others naturally', ko: '활동에 자연스럽게 참여하고 다른 아이들과 어울려요' } },
      { pole: 'shy', label: { en: 'Prefers to observe for a while before participating', ko: '한동안 지켜보다가 준비되면 참여해요' } },
    ],
  },
]

const TODDLER_ADAPTABILITY: TemperamentQuestion[] = [
  {
    id: 'toddler-adaptability-1',
    axis: 'adaptability',
    ageBand: 'toddler',
    prompt: {
      en: 'When their favourite toy is unavailable, your toddler…',
      ko: '좋아하는 장난감을 못 가지게 되면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Finds another toy to play with fairly quickly', ko: '비교적 빨리 다른 장난감을 찾아 놀아요' } },
      { pole: 'cautious', label: { en: 'Keeps searching for it and takes time to settle with something else', ko: '계속 찾다가 다른 것으로 마음을 바꾸는 데 시간이 걸려요' } },
    ],
  },
  {
    id: 'toddler-adaptability-2',
    axis: 'adaptability',
    ageBand: 'toddler',
    prompt: {
      en: 'When you try a new type of food or restaurant, your toddler…',
      ko: '새로운 음식이나 음식점을 시도하면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Is willing to taste something new without much fuss', ko: '큰 거부감 없이 새로운 것을 시도해봐요' } },
      { pole: 'cautious', label: { en: 'Prefers familiar foods and needs time to accept new ones', ko: '익숙한 음식을 원하고 새로운 것을 받아들이는 데 시간이 걸려요' } },
    ],
  },
  {
    id: 'toddler-adaptability-3',
    axis: 'adaptability',
    ageBand: 'toddler',
    prompt: {
      en: 'When the bedtime routine changes (e.g., a different person does it), your toddler…',
      ko: '잠자리 루틴이 바뀌거나(예: 다른 사람이 재울 때) 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Accepts the change and settles to sleep without much protest', ko: '변화를 받아들이고 큰 저항 없이 잠들어요' } },
      { pole: 'cautious', label: { en: 'Needs the usual routine and takes longer to wind down', ko: '평소 루틴을 원하며 잠드는 데 더 오래 걸려요' } },
    ],
  },
  {
    id: 'toddler-adaptability-4',
    axis: 'adaptability',
    ageBand: 'toddler',
    prompt: {
      en: 'When a plan changes at the last minute (e.g., a trip is cancelled), your toddler…',
      ko: '예정했던 일이 갑자기 바뀌면(예: 나가기로 했다가 취소) 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Gets redirected to a new activity fairly easily', ko: '비교적 쉽게 다른 활동으로 전환돼요' } },
      { pole: 'cautious', label: { en: 'Needs extra time and reassurance to adjust to the change', ko: '달래주고 설명해주는 시간이 더 필요해요' } },
    ],
  },
  {
    id: 'toddler-adaptability-5',
    axis: 'adaptability',
    ageBand: 'toddler',
    prompt: {
      en: 'When you rearrange the furniture in their room, your toddler…',
      ko: '방 배치를 바꾸면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Explores the new layout with curiosity', ko: '새 배치를 호기심 있게 탐색해요' } },
      { pole: 'cautious', label: { en: 'Looks unsettled and keeps checking familiar spots', ko: '어색해하며 전에 있던 자리들을 자꾸 확인해요' } },
    ],
  },
]

const TODDLER_REACTIVITY: TemperamentQuestion[] = [
  {
    id: 'toddler-reactivity-1',
    axis: 'reactivity',
    ageBand: 'toddler',
    prompt: {
      en: 'When your toddler is excited about something, they…',
      ko: '아이가 무언가에 신이 나면…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Shouts, jumps, and makes sure everyone knows about it', ko: '소리치고 펄쩍 뛰며 모두에게 알려요' } },
      { pole: 'mellow', label: { en: 'Shows happiness with a big grin but stays fairly quiet', ko: '활짝 웃으며 기쁨을 드러내지만 크게 소리내지 않아요' } },
    ],
  },
  {
    id: 'toddler-reactivity-2',
    axis: 'reactivity',
    ageBand: 'toddler',
    prompt: {
      en: 'When your toddler is frustrated, they…',
      ko: '아이가 좌절하거나 뜻대로 안 될 때는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Has a strong reaction — crying loudly or throwing things', ko: '크게 울거나 물건을 던지는 등 강하게 표현해요' } },
      { pole: 'mellow', label: { en: 'Fusses briefly but calms down without too much drama', ko: '잠깐 칭얼거리지만 금방 가라앉아요' } },
    ],
  },
  {
    id: 'toddler-reactivity-3',
    axis: 'reactivity',
    ageBand: 'toddler',
    prompt: {
      en: 'When your toddler gets a small bump or scratch, they…',
      ko: '아이가 살짝 부딪히거나 긁히면…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Cries loudly and needs a lot of comfort', ko: '크게 울며 많은 위로를 원해요' } },
      { pole: 'mellow', label: { en: 'Looks at it briefly, accepts a quick hug, and moves on', ko: '잠깐 확인하고 금방 털고 일어나요' } },
    ],
  },
  {
    id: 'toddler-reactivity-4',
    axis: 'reactivity',
    ageBand: 'toddler',
    prompt: {
      en: 'When something funny happens, your toddler…',
      ko: '재미있는 일이 생기면 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Bursts out laughing and tries to make it happen again', ko: '폭소하며 반복해달라고 해요' } },
      { pole: 'mellow', label: { en: 'Smiles and gives a quiet chuckle', ko: '미소 짓고 작게 웃어요' } },
    ],
  },
  {
    id: 'toddler-reactivity-5',
    axis: 'reactivity',
    ageBand: 'toddler',
    prompt: {
      en: 'When it\'s time to stop an activity they love, your toddler…',
      ko: '좋아하는 놀이를 그만해야 할 때 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Protests strongly and needs time to transition', ko: '강하게 저항하고 전환하는 데 시간이 필요해요' } },
      { pole: 'mellow', label: { en: 'Accepts the end without too much fuss', ko: '크게 떼쓰지 않고 마무리를 받아들여요' } },
    ],
  },
]

// ---------------------------------------------------------------------------
// Preschooler (37–84 months)
// ---------------------------------------------------------------------------

const PRESCHOOLER_ACTIVITY: TemperamentQuestion[] = [
  {
    id: 'preschooler-activity-1',
    axis: 'activity',
    ageBand: 'preschooler',
    prompt: {
      en: 'On a free afternoon, your child usually prefers to…',
      ko: '여유로운 오후에 아이는 주로…',
    },
    options: [
      { pole: 'active', label: { en: 'Run, jump, and play active games outside', ko: '밖에서 뛰고 점프하는 놀이를 좋아해요' } },
      { pole: 'calm', label: { en: 'Sit quietly to draw, build blocks, or read', ko: '그림 그리기, 블록 쌓기, 독서처럼 조용한 활동을 즐겨요' } },
    ],
  },
  {
    id: 'preschooler-activity-2',
    axis: 'activity',
    ageBand: 'preschooler',
    prompt: {
      en: 'When waiting somewhere (e.g., at a doctor\'s office), your child…',
      ko: '병원 등 어딘가에서 기다릴 때 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Fidgets, walks around, and finds it hard to stay still', ko: '안절부절못하며 돌아다니고 가만히 있지 못해요' } },
      { pole: 'calm', label: { en: 'Sits and keeps themselves busy with a toy or by looking around', ko: '장난감이나 주변을 구경하며 제법 차분하게 기다려요' } },
    ],
  },
  {
    id: 'preschooler-activity-3',
    axis: 'activity',
    ageBand: 'preschooler',
    prompt: {
      en: 'After sitting through a long story-time or activity, your child…',
      ko: '긴 이야기나 정적인 활동이 끝나면 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Immediately wants to run around and burn off energy', ko: '바로 뛰어다니며 에너지를 발산하고 싶어해요' } },
      { pole: 'calm', label: { en: 'Is happy moving on to another quiet activity', ko: '또 다른 조용한 활동으로 자연스럽게 넘어가요' } },
    ],
  },
  {
    id: 'preschooler-activity-4',
    axis: 'activity',
    ageBand: 'preschooler',
    prompt: {
      en: 'On a family walk, your child…',
      ko: '가족과 산책할 때 아이는…',
    },
    options: [
      { pole: 'active', label: { en: 'Runs ahead, climbs rocks, and explores every corner', ko: '앞서 뛰어가고 바위를 오르며 구석구석 탐험해요' } },
      { pole: 'calm', label: { en: 'Walks alongside and notices small details along the way', ko: '나란히 걸으며 길가의 작은 것들을 발견하며 가요' } },
    ],
  },
  {
    id: 'preschooler-activity-5',
    axis: 'activity',
    ageBand: 'preschooler',
    prompt: {
      en: 'During free play, your child most often chooses…',
      ko: '자유롭게 놀 때 아이가 주로 선택하는 건…',
    },
    options: [
      { pole: 'active', label: { en: 'Running, climbing, and physically active games', ko: '달리기, 기어오르기, 몸을 쓰는 놀이예요' } },
      { pole: 'calm', label: { en: 'Building, drawing, or imaginative play in one spot', ko: '만들기, 그림 그리기, 혼자 상상 놀이예요' } },
    ],
  },
]

const PRESCHOOLER_SOCIAL: TemperamentQuestion[] = [
  {
    id: 'preschooler-social-1',
    axis: 'social',
    ageBand: 'preschooler',
    prompt: {
      en: 'On the first day at a new playgroup or class, your child…',
      ko: '새 반이나 놀이 모임 첫날, 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Walks in confidently and makes friends quickly', ko: '자신 있게 들어가서 금방 친구를 사귀어요' } },
      { pole: 'shy', label: { en: 'Stays near you and takes time before joining in', ko: '보호자 곁에 있다가 시간이 지나서야 참여해요' } },
    ],
  },
  {
    id: 'preschooler-social-2',
    axis: 'social',
    ageBand: 'preschooler',
    prompt: {
      en: 'At a birthday party with children they don\'t know, your child…',
      ko: '모르는 아이들이 많은 생일 파티에서 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Mingles and plays with unfamiliar children comfortably', ko: '낯선 아이들과도 편하게 어울려 놀아요' } },
      { pole: 'shy', label: { en: 'Sticks with friends they know or watches before joining', ko: '아는 친구 옆에 있거나, 관찰하다가 나중에 합류해요' } },
    ],
  },
  {
    id: 'preschooler-social-3',
    axis: 'social',
    ageBand: 'preschooler',
    prompt: {
      en: 'When a new family moves in next door, your child…',
      ko: '새 이웃이 생기면 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Wants to go introduce themselves with enthusiasm', ko: '신이 나서 먼저 인사하러 가고 싶어해요' } },
      { pole: 'shy', label: { en: 'Watches from a distance and warms up gradually', ko: '멀리서 지켜보다가 조금씩 가까워져요' } },
    ],
  },
  {
    id: 'preschooler-social-4',
    axis: 'social',
    ageBand: 'preschooler',
    prompt: {
      en: 'In a group game at school or playgroup, your child…',
      ko: '유치원이나 놀이 모임에서 단체 게임을 할 때 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Joins right in and often suggests ideas or leads the game', ko: '바로 참여하고 종종 아이디어를 내거나 주도해요' } },
      { pole: 'shy', label: { en: 'Watches the rules be set, then joins once comfortable', ko: '규칙을 지켜보다가 익숙해지면 합류해요' } },
    ],
  },
  {
    id: 'preschooler-social-5',
    axis: 'social',
    ageBand: 'preschooler',
    prompt: {
      en: 'When meeting a friend\'s parents for the first time, your child…',
      ko: '친구의 부모님을 처음 만나면 아이는…',
    },
    options: [
      { pole: 'social', label: { en: 'Says hello confidently and starts chatting', ko: '자신 있게 인사하고 말을 걸어요' } },
      { pole: 'shy', label: { en: 'Stays quiet at first and warms up over time', ko: '처음엔 조용히 있다가 시간이 지나며 마음을 열어요' } },
    ],
  },
]

const PRESCHOOLER_ADAPTABILITY: TemperamentQuestion[] = [
  {
    id: 'preschooler-adaptability-1',
    axis: 'adaptability',
    ageBand: 'preschooler',
    prompt: {
      en: 'When an outing is cancelled at the last minute, your child…',
      ko: '나가기로 했다가 갑자기 취소되면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Accepts the change and finds something else fun to do', ko: '변화를 받아들이고 다른 즐거운 것을 찾아요' } },
      { pole: 'cautious', label: { en: 'Needs time to process the disappointment before moving on', ko: '실망을 충분히 느끼는 시간이 필요해요' } },
    ],
  },
  {
    id: 'preschooler-adaptability-2',
    axis: 'adaptability',
    ageBand: 'preschooler',
    prompt: {
      en: 'When trying a brand-new activity (e.g., swimming class), your child…',
      ko: '수영 같은 새로운 활동을 시작할 때 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Dives in and gives it a try without much hesitation', ko: '별다른 망설임 없이 바로 해봐요' } },
      { pole: 'cautious', label: { en: 'Watches others first before giving it a go themselves', ko: '다른 아이들이 하는 걸 먼저 보다가 시도해요' } },
    ],
  },
  {
    id: 'preschooler-adaptability-3',
    axis: 'adaptability',
    ageBand: 'preschooler',
    prompt: {
      en: 'When the family schedule changes (e.g., a new after-school activity starts), your child…',
      ko: '일과가 바뀌면(예: 새 방과 후 수업 추가) 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Adjusts to the new routine pretty quickly', ko: '새 일과에 비교적 빨리 적응해요' } },
      { pole: 'cautious', label: { en: 'Takes a few weeks to feel fully comfortable', ko: '완전히 익숙해지는 데 몇 주 걸려요' } },
    ],
  },
  {
    id: 'preschooler-adaptability-4',
    axis: 'adaptability',
    ageBand: 'preschooler',
    prompt: {
      en: 'When a new house rule is introduced, your child…',
      ko: '새로운 집안 규칙이 생기면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Accepts and follows the new rule without much pushback', ko: '큰 저항 없이 새 규칙을 따라요' } },
      { pole: 'cautious', label: { en: 'Questions it and takes some time to get used to it', ko: '왜 그래야 하는지 묻고, 익숙해지는 데 시간이 걸려요' } },
    ],
  },
  {
    id: 'preschooler-adaptability-5',
    axis: 'adaptability',
    ageBand: 'preschooler',
    prompt: {
      en: 'When told to do something a different way from usual, your child…',
      ko: '평소와 다른 방법으로 하라고 하면 아이는…',
    },
    options: [
      { pole: 'flexible', label: { en: 'Is curious and open to trying the new way', ko: '호기심 있게 새 방법을 시도해봐요' } },
      { pole: 'cautious', label: { en: 'Prefers the familiar way and needs encouragement to try differently', ko: '익숙한 방법을 선호하고 다르게 하려면 격려가 필요해요' } },
    ],
  },
]

const PRESCHOOLER_REACTIVITY: TemperamentQuestion[] = [
  {
    id: 'preschooler-reactivity-1',
    axis: 'reactivity',
    ageBand: 'preschooler',
    prompt: {
      en: 'When your child is thrilled about something, they…',
      ko: '아이가 무언가에 무척 기쁘면…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Expresses it loudly and wants everyone to share their excitement', ko: '크게 기뻐하며 모두가 함께 느끼길 바라요' } },
      { pole: 'mellow', label: { en: 'Smiles happily and shares the news in a calm, measured way', ko: '행복하게 미소 지으며 차분하게 소식을 전해요' } },
    ],
  },
  {
    id: 'preschooler-reactivity-2',
    axis: 'reactivity',
    ageBand: 'preschooler',
    prompt: {
      en: 'When your child is disappointed, they…',
      ko: '아이가 실망하면…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Cries or gets visibly upset for a good while', ko: '눈에 띄게 속상해하며 한동안 울어요' } },
      { pole: 'mellow', label: { en: 'Looks sad for a moment but moves on without much fuss', ko: '잠깐 슬퍼하다가 금방 털고 일어나요' } },
    ],
  },
  {
    id: 'preschooler-reactivity-3',
    axis: 'reactivity',
    ageBand: 'preschooler',
    prompt: {
      en: 'When your child achieves something they\'re proud of, they…',
      ko: '자랑스러운 일을 해냈을 때 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Announces it loudly and wants everyone to celebrate', ko: '모두에게 알리고 함께 축하하길 원해요' } },
      { pole: 'mellow', label: { en: 'Shares it quietly with a satisfied smile', ko: '만족스러운 미소와 함께 조용히 알려요' } },
    ],
  },
  {
    id: 'preschooler-reactivity-4',
    axis: 'reactivity',
    ageBand: 'preschooler',
    prompt: {
      en: 'When something a little scary happens (e.g., a loud thunderstorm), your child…',
      ko: '조금 무서운 일이 생기면(예: 천둥번개) 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Gets very frightened and needs a lot of reassurance', ko: '많이 무서워하며 충분한 안심이 필요해요' } },
      { pole: 'mellow', label: { en: 'Acknowledges it\'s a bit scary but settles fairly quickly', ko: '조금 무섭다고 하지만 금방 안정을 찾아요' } },
    ],
  },
  {
    id: 'preschooler-reactivity-5',
    axis: 'reactivity',
    ageBand: 'preschooler',
    prompt: {
      en: 'When told it\'s almost time to leave somewhere fun, your child…',
      ko: '재미있는 곳에서 곧 떠나야 한다고 하면 아이는…',
    },
    options: [
      { pole: 'expressive', label: { en: 'Protests loudly and needs several reminders before coming', ko: '크게 반발하며 여러 번 이야기해야 겨우 움직여요' } },
      { pole: 'mellow', label: { en: 'Accepts it without much drama after one or two warnings', ko: '한두 번 예고하면 크게 떼쓰지 않고 수긍해요' } },
    ],
  },
]

// ---------------------------------------------------------------------------
// Combined export
// ---------------------------------------------------------------------------

export const TEMPERAMENT_QUESTIONS: TemperamentQuestion[] = [
  // Infant
  ...INFANT_ACTIVITY,
  ...INFANT_SOCIAL,
  ...INFANT_ADAPTABILITY,
  ...INFANT_REACTIVITY,
  // Toddler
  ...TODDLER_ACTIVITY,
  ...TODDLER_SOCIAL,
  ...TODDLER_ADAPTABILITY,
  ...TODDLER_REACTIVITY,
  // Preschooler
  ...PRESCHOOLER_ACTIVITY,
  ...PRESCHOOLER_SOCIAL,
  ...PRESCHOOLER_ADAPTABILITY,
  ...PRESCHOOLER_REACTIVITY,
]

/**
 * Returns all questions for a given age band, in the canonical axis order:
 * activity → social → adaptability → reactivity
 */
export function getQuestionsForAgeBand(ageBand: AgeBand): TemperamentQuestion[] {
  return TEMPERAMENT_QUESTIONS.filter((q) => q.ageBand === ageBand)
}

/** Canonical axis order used for display and scoring */
export const AXIS_ORDER: Axis[] = ['activity', 'social', 'adaptability', 'reactivity']
