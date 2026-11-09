/**
 * Chiikawa Personality Test — Question Data
 *
 * KO 문구는 기획서 원문(phases/18-fun-chiikawa-personality-test/source-content.md)을 그대로 쓴다.
 * Q23만 스펙에 따라 "친구들이 나를 한마디로 표현한다면?"으로 바꿨다(Q8과 중복).
 *
 * Q1~Q16의 scoring은 docs/screens/fun-chiikawa-personality-test.md의 **수정 채점표**다.
 * 모든 문항이 축 양쪽 2:2로 나뉘도록 원안의 Q10 B(E→I), Q7 C(S→N), Q3 D(F→T)를 바꿨다.
 * Q17~Q24는 성격 유형이 아니라 캐릭터 매칭에만 쓰므로 scoring이 없다.
 *
 * Unofficial fan-made quiz. Not affiliated with the original creator or licensors,
 * and not related to any licensed psychological assessment.
 */

import type { LocalizedText } from '@/types/tool'
import type { ChiikawaQuestion } from '@/types/chiikawa-quiz'

export const CHIIKAWA_INTRO: { title: LocalizedText; body: LocalizedText } = {
  title: {
    en: 'Which Chiikawa friend are you most like?',
    ko: '나는 치이카와 친구들 중 누구와 가장 닮았을까?',
  },
  body: {
    en: 'Chiikawa, whose heart wobbles at the smallest things?\nHachiware, always upbeat and kind?\nUsagi, free-spirited and impossible to predict?\n\nAnswer 24 questions and find the Chiikawa friend who is most like you!',
    ko: '작은 일에도 마음이 흔들리는 치이카와?\n언제나 긍정적이고 다정한 하치와레?\n자유분방하고 예측할 수 없는 우사기?\n\n24개의 질문에 답하고 나와 가장 닮은 치이카와 친구를 찾아보세요!',
  },
}

export const CHIIKAWA_QUESTIONS: ChiikawaQuestion[] = [
  // PART 1. 기본 성향
  {
    number: 1,
    text: { en: "You've just arrived somewhere you've never been!", ko: '처음 가보는 낯선 장소에 도착했다!' },
    options: {
      A: { en: 'Look around and settle in slowly.', ko: '주변을 둘러보며 천천히 적응한다.' },
      B: { en: 'Strike up a conversation with someone new.', ko: '새로운 사람에게 먼저 말을 걸어본다.' },
      C: { en: 'Head straight for whatever catches my eye.', ko: '눈에 띄는 곳부터 구경한다.' },
      D: { en: "Stick with whoever I came with.", ko: '함께 온 사람이 있다면 그 사람을 따라간다.' },
    },
    scoring: { axis: 'EI', letters: { A: 'I', B: 'E', C: 'E', D: 'I' } },
  },
  {
    number: 2,
    text: { en: 'A weekend with no plans with friends. You…', ko: '친구들과 약속 없는 주말, 나는?' },
    options: {
      A: { en: 'Enjoy some time to myself.', ko: '혼자만의 시간을 즐긴다.' },
      B: { en: 'Message friends to find someone to hang out with.', ko: '친구들에게 연락해서 만날 사람을 찾는다.' },
      C: { en: 'Go wherever my mood takes me that day.', ko: '그날 기분에 따라 즉흥적으로 움직인다.' },
      D: { en: 'Get to the hobby or to-do I planned ahead.', ko: '미리 계획해 둔 취미나 할 일을 한다.' },
    },
    scoring: { axis: 'EI', letters: { A: 'I', B: 'E', C: 'E', D: 'I' } },
  },
  {
    number: 3,
    text: { en: 'A friend opens up to you about a worry.', ko: '친구가 고민을 털어놓았다.' },
    options: {
      A: { en: 'Show I understand how they feel first.', ko: '먼저 마음에 공감해 준다.' },
      B: { en: 'Start thinking about how to fix it.', ko: '해결할 방법부터 생각한다.' },
      C: { en: 'Share the feelings and talk it through together.', ko: '함께 감정을 나누며 이야기한다.' },
      D: { en: 'Listen fully, then ask what kind of help they need.', ko: '충분히 듣고 어떤 도움이 필요한지 물어본다.' },
    },
    scoring: { axis: 'TF', letters: { A: 'F', B: 'T', C: 'F', D: 'T' } },
  },
  {
    number: 4,
    text: { en: 'The plan suddenly changes!', ko: '갑자기 계획이 변경되었다!' },
    options: {
      A: { en: "I'm flustered, but I adapt to the situation.", ko: '당황스럽지만 상황에 맞춰 적응한다.' },
      B: { en: 'Check why it changed and what the new plan is.', ko: '변경된 이유와 새로운 계획을 확인한다.' },
      C: { en: 'Treat it as a fresh new experience.', ko: '오히려 새로운 경험이라 생각한다.' },
      D: { en: 'Look for a way to stick to the original plan.', ko: '원래 계획대로 할 방법을 찾아본다.' },
    },
    scoring: { axis: 'JP', letters: { A: 'P', B: 'J', C: 'P', D: 'J' } },
  },
  {
    number: 5,
    text: { en: 'What matters most when you make a big decision?', ko: '중요한 결정을 내릴 때 가장 중요한 것은?' },
    options: {
      A: { en: 'Whether my heart feels at ease with it', ko: '내 마음이 편안한 선택인지' },
      B: { en: 'Whether it makes sense objectively', ko: '객관적으로 합리적인 선택인지' },
      C: { en: "Whether it's good for the people around me too", ko: '주변 사람들에게도 좋은 선택인지' },
      D: { en: 'Whether it opens up new possibilities and chances', ko: '새로운 가능성과 기회가 있는지' },
    },
    scoring: { axis: 'TF', letters: { A: 'F', B: 'T', C: 'F', D: 'T' } },
  },
  {
    number: 6,
    text: { en: "At a get-together with lots of people, you're the one who…", ko: '여러 사람이 모인 자리에서 나는?' },
    options: {
      A: { en: 'Mostly listens and takes in the mood.', ko: '주로 듣고 분위기를 관찰한다.' },
      B: { en: 'Chats actively with lots of people.', ko: '여러 사람과 적극적으로 대화한다.' },
      C: { en: 'Has a deep talk with a close friend.', ko: '친한 사람과 깊은 대화를 나눈다.' },
      D: { en: 'Reads the room and blends in naturally.', ko: '전체 분위기를 살피며 자연스럽게 어울린다.' },
    },
    scoring: { axis: 'EI', letters: { A: 'I', B: 'E', C: 'I', D: 'E' } },
  },
  {
    number: 7,
    text: { en: 'When you start something new, you…', ko: '새로운 일을 시작할 때 나는?' },
    options: {
      A: { en: 'Think about the big picture and possibilities first.', ko: '전체적인 그림과 가능성을 먼저 생각한다.' },
      B: { en: 'Check the concrete steps and their order.', ko: '구체적인 방법과 순서를 확인한다.' },
      C: { en: 'Just dive in and figure it out along the way.', ko: '일단 시작하면서 알아간다.' },
      D: { en: 'Gather plenty of information before starting.', ko: '충분히 정보를 모은 뒤 시작한다.' },
    },
    scoring: { axis: 'SN', letters: { A: 'N', B: 'S', C: 'N', D: 'S' } },
  },
  {
    number: 8,
    text: { en: 'Which compliment would you love to hear most?', ko: '가장 듣고 싶은 칭찬은?' },
    options: {
      A: { en: '"You\'re so warm and kind."', ko: '따뜻하고 다정한 사람이야.' },
      B: { en: '"You\'re someone I can always count on."', ko: '믿고 맡길 수 있는 사람이야.' },
      C: { en: '"It\'s so fun being around you."', ko: '함께 있으면 즐거워.' },
      D: { en: '"You think in such unique, deep ways."', ko: '독특하고 깊이 있는 생각을 하는 사람이야.' },
    },
    scoring: { axis: 'SN', letters: { A: 'S', B: 'S', C: 'N', D: 'N' } },
  },
  // PART 2. 행동 패턴
  {
    number: 9,
    text: { en: "A friend texts that they'll be late.", ko: '친구가 약속 시간에 늦는다고 연락했다.' },
    options: {
      A: { en: 'Say "no worries" and wait without fuss.', ko: '괜찮다고 말하고 여유롭게 기다린다.' },
      B: { en: 'Ask how late and adjust the schedule.', ko: '얼마나 늦는지 확인하고 일정을 조정한다.' },
      C: { en: 'Find something else fun to do while I wait.', ko: '기다리는 동안 다른 재미를 찾는다.' },
      D: { en: 'Honestly ask them not to be late next time.', ko: '다음에는 늦지 말라고 솔직하게 말한다.' },
    },
    scoring: { axis: 'JP', letters: { A: 'P', B: 'J', C: 'P', D: 'J' } },
  },
  {
    number: 10,
    text: { en: 'If you were working as a team, you would…', ko: '팀으로 함께 일한다면?' },
    options: {
      A: { en: 'Create a mood where everyone feels comfortable.', ko: '모두가 편안하게 일할 수 있는 분위기를 만든다.' },
      B: { en: 'Split up the roles and keep things efficient.', ko: '역할을 나누고 효율적으로 진행한다.' },
      C: { en: 'Think up a fun way to get started.', ko: '재미있게 시작할 방법을 고민한다.' },
      D: { en: 'Own my part and see it through to the end.', ko: '맡은 일을 책임지고 마무리한다.' },
    },
    scoring: { axis: 'EI', letters: { A: 'E', B: 'I', C: 'E', D: 'I' } },
  },
  {
    number: 11,
    text: { en: 'Someone misunderstands you.', ko: '누군가 나를 오해한다면?' },
    options: {
      A: { en: 'Explain, keeping their side in mind too.', ko: '상대방의 입장도 고려하며 설명한다.' },
      B: { en: 'Set the facts straight, precisely.', ko: '사실관계를 정확하게 바로잡는다.' },
      C: { en: "Shrug it off and move on.", ko: '크게 신경 쓰지 않고 넘어간다.' },
      D: { en: "Don't show it, but keep it in my heart.", ko: '겉으로 표현하지 않아도 마음에 담아둔다.' },
    },
    scoring: { axis: 'TF', letters: { A: 'F', B: 'T', C: 'T', D: 'F' } },
  },
  {
    number: 12,
    text: { en: 'An unexpected problem pops up!', ko: '예상하지 못한 문제가 발생했다!' },
    options: {
      A: { en: 'Take stock and solve it step by step.', ko: '상황을 살피고 차근차근 해결한다.' },
      B: { en: 'Analyze what caused it first.', ko: '문제의 원인부터 분석한다.' },
      C: { en: 'Try a bunch of things on the spot.', ko: '일단 여러 방법을 즉흥적으로 시도한다.' },
      D: { en: 'Talk it over with the people around me.', ko: '주변 사람들과 의논한다.' },
    },
    scoring: { axis: 'SN', letters: { A: 'S', B: 'S', C: 'N', D: 'N' } },
  },
  {
    number: 13,
    text: { en: 'A friend strongly insists on an opinion different from yours.', ko: '친구가 나와 다른 의견을 강하게 주장한다.' },
    options: {
      A: { en: 'First hear out why they think that way.', ko: '왜 그렇게 생각하는지 먼저 들어본다.' },
      B: { en: 'Weigh their argument logically.', ko: '상대방의 주장을 논리적으로 검토한다.' },
      C: { en: 'Let it go — everyone thinks differently.', ko: '사람마다 생각이 다를 수 있다고 넘긴다.' },
      D: { en: 'Make my own view clear, too.', ko: '내 생각도 분명하게 전달한다.' },
    },
    scoring: { axis: 'TF', letters: { A: 'F', B: 'T', C: 'F', D: 'T' } },
  },
  {
    number: 14,
    text: { en: 'Something you worked hard on didn\'t work out.', ko: '노력했던 일이 실패했다.' },
    options: {
      A: { en: 'Look for a way to succeed next time.', ko: '다시 성공할 방법을 찾아본다.' },
      B: { en: 'Figure out what went wrong and fix it.', ko: '무엇이 잘못됐는지 분석하고 수정한다.' },
      C: { en: 'Forget it for a while and do something fun.', ko: '잠시 잊고 즐거운 일을 한다.' },
      D: { en: 'I want comfort from someone close to me.', ko: '가까운 사람에게 위로받고 싶다.' },
    },
    scoring: { axis: 'SN', letters: { A: 'N', B: 'S', C: 'S', D: 'N' } },
  },
  {
    number: 15,
    text: { en: "If you're going on a trip…", ko: '여행을 간다면?' },
    options: {
      A: { en: 'Plan the itinerary and stays down to the detail.', ko: '일정과 숙소를 꼼꼼하게 계획한다.' },
      B: { en: 'Pick only the must-sees and roam freely.', ko: '꼭 가고 싶은 곳만 정하고 자유롭게 다닌다.' },
      C: { en: "Go along with my travel buddy's taste.", ko: '함께 가는 사람의 취향에 맞춘다.' },
      D: { en: 'Find places I like once I get there.', ko: '현장에서 마음에 드는 곳을 찾아간다.' },
    },
    scoring: { axis: 'JP', letters: { A: 'J', B: 'P', C: 'J', D: 'P' } },
  },
  {
    number: 16,
    text: { en: 'Someone asks you for help.', ko: '누군가 나에게 도움을 요청한다.' },
    options: {
      A: { en: 'Try to help as much as I can.', ko: '가능한 한 도와주려고 한다.' },
      B: { en: 'First judge whether it\'s something I can solve.', ko: '해결할 수 있는 문제인지 먼저 판단한다.' },
      C: { en: 'Jump in and help actively.', ko: '적극적으로 나서서 도와준다.' },
      D: { en: 'Show them how to solve it on their own.', ko: '스스로 해결할 수 있도록 방법을 알려준다.' },
    },
    scoring: { axis: 'JP', letters: { A: 'P', B: 'J', C: 'P', D: 'J' } },
  },
  // PART 3. 캐릭터 매칭
  {
    number: 17,
    text: { en: 'What is your everyday energy like?', ko: '평소 나의 에너지는?' },
    options: {
      A: { en: 'Quiet but steady.', ko: '조용하지만 꾸준하다.' },
      B: { en: 'Bright and lively.', ko: '밝고 활발하다.' },
      C: { en: 'Free and unpredictable.', ko: '자유롭고 예측할 수 없다.' },
      D: { en: 'Calm and solid.', ko: '차분하고 단단하다.' },
    },
  },
  {
    number: 18,
    text: { en: 'What do you value most?', ko: '내가 가장 중요하게 생각하는 것은?' },
    options: {
      A: { en: 'My bond with the people I treasure', ko: '소중한 사람들과의 유대감' },
      B: { en: 'Living freely, true to myself', ko: '자유롭게 나답게 살아가는 것' },
      C: { en: 'Having my skills recognized', ko: '나의 실력을 인정받는 것' },
      D: { en: 'My own little joys and peace', ko: '나만의 즐거움과 평온함' },
    },
  },
  {
    number: 19,
    text: { en: 'Which words describe you best?', ko: '나를 가장 잘 표현하는 말은?' },
    options: {
      A: { en: 'Careful, but kind.', ko: '조심스럽지만 다정하다.' },
      B: { en: 'Confident and self-assured.', ko: '자신감 있고 당당하다.' },
      C: { en: 'Curious and quirky.', ko: '호기심 많고 엉뚱하다.' },
      D: { en: 'Calm and down-to-earth.', ko: '차분하고 현실적이다.' },
    },
  },
  {
    number: 20,
    text: { en: 'When things get tough, you…', ko: '힘든 일이 있을 때 나는?' },
    options: {
      A: { en: 'Feel stronger when someone stays by my side.', ko: '누군가 곁에 있어 주면 힘이 난다.' },
      B: { en: 'Tackle it head-on.', ko: '적극적으로 해결하려고 한다.' },
      C: { en: 'Lift my mood in my own way.', ko: '나만의 방식으로 기분을 전환한다.' },
      D: { en: 'Need some time alone to sort my thoughts.', ko: '혼자 생각을 정리하는 시간이 필요하다.' },
    },
  },
  {
    number: 21,
    text: { en: 'When you\'re hanging out with friends, you…', ko: '친구들과 함께 있을 때 나는?' },
    options: {
      A: { en: 'Make sure nobody feels left out.', ko: '소외되는 사람이 없도록 챙긴다.' },
      B: { en: 'Set the mood for the whole group.', ko: '모임의 분위기를 이끈다.' },
      C: { en: 'Get laughs with something silly I say or do.', ko: '엉뚱한 말이나 행동으로 웃음을 준다.' },
      D: { en: 'Quietly step up when someone needs it.', ko: '조용히 필요한 순간에 힘이 되어준다.' },
    },
  },
  {
    number: 22,
    text: { en: 'Your favorite kind of day is…', ko: '내가 좋아하는 하루는?' },
    options: {
      A: { en: 'A familiar, cozy day', ko: '익숙하고 편안한 하루' },
      B: { en: 'A day of new people and new experiences', ko: '새로운 사람과 경험을 만나는 하루' },
      C: { en: 'A day doing whatever I feel like', ko: '하고 싶은 일을 마음껏 하는 하루' },
      D: { en: 'A day of wrapping up my goals one by one', ko: '계획한 목표를 차근차근 마무리하는 하루' },
    },
  },
  {
    number: 23,
    text: { en: 'If your friends described you in a word, they\'d say…', ko: '친구들이 나를 한마디로 표현한다면?' },
    options: {
      A: { en: '"Reliable and warm."', ko: '믿음직하고 따뜻한 사람이야.' },
      B: { en: '"Seriously cool and amazing."', ko: '정말 멋지고 대단해.' },
      C: { en: '"Fun and one of a kind."', ko: '재미있고 특별한 사람이야.' },
      D: { en: '"Someone with clear standards of their own."', ko: '자기 기준이 확실한 사람이야.' },
    },
  },
  {
    number: 24,
    text: { en: 'Which one feels most like you?', ko: '나와 가장 닮았다고 생각하는 모습은?' },
    options: {
      A: { en: 'Someone who gives it their all, even when clumsy', ko: '서툴러도 진심을 다하는 사람' },
      B: { en: 'Someone bright and positive', ko: '밝고 긍정적인 사람' },
      C: { en: 'A free spirit living by their own rules', ko: '자기만의 규칙으로 살아가는 자유인' },
      D: { en: 'Someone quiet but full of charm', ko: '조용하지만 매력이 확실한 사람' },
    },
  },
]
