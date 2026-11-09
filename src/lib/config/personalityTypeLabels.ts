/**
 * 16가지 성격 유형(4글자 코드) 한 줄 설명 — 치이카와 성격 테스트 결과 화면용.
 * KO는 "형용사 + ~형", EN은 2~3단어 별칭. 상업 서비스의 공식 유형명을 쓰지 않고 직접 작성했다.
 */

import type { LocalizedText } from '@/types/tool'
import type { PersonalityType } from '@/types/chiikawa-quiz'

export const PERSONALITY_TYPE_LABELS: Record<PersonalityType, LocalizedText> = {
  ISTJ: { en: 'Steady Keeper', ko: '꼼꼼하고 믿음직한 원칙형' },
  ISFJ: { en: 'Caring Protector', ko: '세심하고 따뜻한 배려형' },
  INFJ: { en: 'Quiet Guide', ko: '깊고 따뜻한 통찰형' },
  INTJ: { en: 'Strategic Planner', ko: '멀리 내다보는 전략형' },
  ISTP: { en: 'Cool Fixer', ko: '침착하고 손재주 좋은 해결형' },
  ISFP: { en: 'Gentle Artist', ko: '부드럽고 감각적인 예술형' },
  INFP: { en: 'Dreamy Idealist', ko: '섬세하고 진심 어린 이상형' },
  INTP: { en: 'Curious Thinker', ko: '호기심 많은 탐구형' },
  ESTP: { en: 'Bold Adventurer', ko: '대담하고 재빠른 행동형' },
  ESFP: { en: 'Sparkling Star', ko: '밝고 흥이 넘치는 무대형' },
  ENFP: { en: 'Bright Explorer', ko: '호기심 가득한 열정형' },
  ENTP: { en: 'Witty Inventor', ko: '재치 있고 기발한 발명형' },
  ESTJ: { en: 'Reliable Organizer', ko: '추진력 있는 관리형' },
  ESFJ: { en: 'Warm Host', ko: '다정하고 사교적인 친화형' },
  ENFJ: { en: 'Cheerful Mentor', ko: '사람에게 힘을 주는 응원형' },
  ENTJ: { en: 'Confident Captain', ko: '당당하게 이끄는 리더형' },
}
