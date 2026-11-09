import React from 'react'
import { render, screen } from '@testing-library/react'
import FanMadeNotice from './FanMadeNotice'
import { CHIIKAWA_OFFICIAL_SITE } from '@/lib/config/chiikawaCharacters'

describe('FanMadeNotice', () => {
  it('renders the four KO notice lines', () => {
    const { container } = render(<FanMadeNotice locale="ko" />)
    const text = container.textContent ?? ''
    expect(text).toContain('본 테스트는 치이카와 캐릭터를 소재로 한 비공식 팬메이드 성격 테스트입니다.')
    expect(text).toContain('캐릭터별 성격 유형과 해석은 공식 설정이 아닌 제작자의 창작적 추정입니다.')
    expect(text).toContain('원작자 및 공식 라이선스 보유사와 무관하며, 공식 테스트가 아닙니다.')
    expect(text).toContain('이 테스트는 MBTI®를 포함한 공인 심리검사와 무관하며, 진단 도구가 아닙니다.')
    expect(container.querySelectorAll('li')).toHaveLength(4)
  })

  it('renders the EN trademark sentence', () => {
    const { container } = render(<FanMadeNotice locale="en" />)
    expect(container.textContent).toContain(
      'This quiz is not affiliated with MBTI® or any other licensed psychological assessment and is not a diagnostic tool.'
    )
  })

  it('links to the official site in a new tab', () => {
    render(<FanMadeNotice locale="en" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', CHIIKAWA_OFFICIAL_SITE)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })
})
