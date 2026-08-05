/**
 * @jest-environment node
 */

import { formatReportAsSlackBlocks } from '../formatSlackBlocks'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSectionTexts(blocks: ReturnType<typeof formatReportAsSlackBlocks>): string[] {
  return blocks
    .filter((b) => b.type === 'section')
    .map((b) => {
      const text = b.text as { type: string; text: string } | undefined
      return text?.text ?? ''
    })
}

function countDividers(blocks: ReturnType<typeof formatReportAsSlackBlocks>): number {
  return blocks.filter((b) => b.type === 'divider').length
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('formatReportAsSlackBlocks', () => {
  describe('header block', () => {
    it('첫 번째 블록은 header 타입이어야 한다', () => {
      const blocks = formatReportAsSlackBlocks('## 섹션1\n내용', '2026-08-05')
      expect(blocks[0].type).toBe('header')
    })

    it('header text에 날짜가 포함되어야 한다', () => {
      const blocks = formatReportAsSlackBlocks('## 섹션1\n내용', '2026-08-05')
      const header = blocks[0] as { type: string; text: { type: string; text: string } }
      expect(header.text.text).toContain('2026-08-05')
      expect(header.text.text).toContain('📊 주간 리포트')
    })
  })

  describe('## 섹션 분리', () => {
    it('## 제목 단위로 섹션이 분리되어야 한다', () => {
      const markdown = `## 첫 번째 섹션\n내용1\n\n## 두 번째 섹션\n내용2`
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionTexts = getSectionTexts(blocks)
      expect(sectionTexts.length).toBe(2)
      expect(sectionTexts[0]).toContain('첫 번째 섹션')
      expect(sectionTexts[1]).toContain('두 번째 섹션')
    })

    it('섹션 사이에 divider가 들어가야 한다', () => {
      const markdown = `## 섹션1\n내용1\n\n## 섹션2\n내용2\n\n## 섹션3\n내용3`
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      // divider는 각 섹션 앞에 하나씩 → 섹션 3개이므로 divider 3개
      expect(countDividers(blocks)).toBe(3)
    })

    it('섹션이 없는 마크다운은 header 블록만 반환한다', () => {
      const blocks = formatReportAsSlackBlocks('', '2026-08-05')
      expect(blocks.length).toBe(1)
      expect(blocks[0].type).toBe('header')
    })

    it('## 없는 단일 블록 콘텐츠도 섹션으로 처리된다', () => {
      const markdown = '단순한 텍스트 내용'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      // header + divider + section
      expect(blocks.length).toBe(3)
    })
  })

  describe('**bold** → *bold* 치환', () => {
    it('**text** 패턴이 *text*로 변환되어야 한다', () => {
      const markdown = '## 섹션\n**중요한 내용**입니다'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionTexts = getSectionTexts(blocks)
      expect(sectionTexts[0]).toContain('*중요한 내용*')
      expect(sectionTexts[0]).not.toContain('**중요한 내용**')
    })

    it('여러 개의 bold 패턴이 모두 변환되어야 한다', () => {
      const markdown = '## 섹션\n**첫 번째** 그리고 **두 번째**'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionTexts = getSectionTexts(blocks)
      expect(sectionTexts[0]).toContain('*첫 번째*')
      expect(sectionTexts[0]).toContain('*두 번째*')
    })

    it('bold 패턴이 없으면 텍스트가 그대로 유지된다', () => {
      const markdown = '## 섹션\n일반 텍스트'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionTexts = getSectionTexts(blocks)
      expect(sectionTexts[0]).toContain('일반 텍스트')
    })
  })

  describe('3000자 초과 섹션 분할', () => {
    it('3000자를 넘는 섹션은 여러 section 블록으로 쪼개져야 한다', () => {
      // 3000자를 초과하는 긴 텍스트 생성 (줄바꿈 포함)
      const lines: string[] = ['## 긴 섹션']
      for (let i = 0; i < 100; i++) {
        lines.push(`줄 ${i}: ${'가'.repeat(30)}`)
      }
      const markdown = lines.join('\n')
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionBlocks = blocks.filter((b) => b.type === 'section')

      // 섹션이 하나 이상이어야 하고, 각 섹션의 텍스트가 3000자 이하여야 한다
      expect(sectionBlocks.length).toBeGreaterThan(1)
      for (const block of sectionBlocks) {
        const textField = block.text as { type: string; text: string } | undefined
        if (textField?.text && !textField.text.includes('data/reports')) {
          expect(textField.text.length).toBeLessThanOrEqual(3000)
        }
      }
    })

    it('3000자 미만 섹션은 단일 블록으로 처리된다', () => {
      const markdown = '## 섹션\n짧은 내용'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionBlocks = blocks.filter((b) => b.type === 'section')
      expect(sectionBlocks.length).toBe(1)
    })
  })

  describe('블록 수 45개 초과 시 안내 섹션', () => {
    it('섹션이 매우 많아 45개 블록을 넘으면 안내 섹션이 추가된다', () => {
      // 45개를 넘기기 위해 많은 섹션 생성 (header + divider + section = 3개씩)
      const sections: string[] = []
      for (let i = 0; i < 30; i++) {
        sections.push(`## 섹션 ${i}\n내용 ${i}`)
      }
      const markdown = sections.join('\n\n')
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')

      // 총 블록 수가 46개 이하여야 한다 (45 + 1 안내 섹션)
      expect(blocks.length).toBeLessThanOrEqual(46)

      // 마지막 블록이 안내 섹션이어야 한다
      const lastBlock = blocks[blocks.length - 1]
      expect(lastBlock.type).toBe('section')
      const lastText = lastBlock.text as { type: string; text: string }
      expect(lastText.text).toContain('data/reports')
      expect(lastText.text).toContain('2026-08-05')
    })

    it('섹션이 적으면 안내 섹션이 추가되지 않는다', () => {
      const markdown = '## 섹션1\n내용1\n\n## 섹션2\n내용2'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')

      const lastBlock = blocks[blocks.length - 1]
      const lastText = lastBlock.text as { type: string; text: string } | undefined
      // 마지막 블록이 truncation 안내가 아니어야 한다
      expect(lastText?.text ?? '').not.toContain('data/reports')
    })

    it('45블록 초과 시 총 블록 수가 46개를 넘지 않아야 한다', () => {
      const sections: string[] = []
      for (let i = 0; i < 50; i++) {
        sections.push(`## 섹션 ${i}\n내용 ${i}`)
      }
      const markdown = sections.join('\n\n')
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      expect(blocks.length).toBeLessThanOrEqual(46)
    })
  })

  describe('전체 구조 통합', () => {
    it('표준 리포트 형식을 올바르게 변환한다', () => {
      const markdown = `## CTR 0 페이지 분석
**zero-ctr-page** 관련 내용

## 이탈률 높은 페이지
일반 내용`

      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')

      // header + (divider + section) × 2 = 5개 블록
      expect(blocks[0].type).toBe('header')
      expect(blocks[1].type).toBe('divider')
      expect(blocks[2].type).toBe('section')
      expect(blocks[3].type).toBe('divider')
      expect(blocks[4].type).toBe('section')
      expect(blocks.length).toBe(5)
    })

    it('모든 section 블록의 type은 mrkdwn이어야 한다', () => {
      const markdown = '## 섹션\n내용'
      const blocks = formatReportAsSlackBlocks(markdown, '2026-08-05')
      const sectionBlocks = blocks.filter((b) => b.type === 'section')
      for (const block of sectionBlocks) {
        const textField = block.text as { type: string; text: string }
        expect(textField.type).toBe('mrkdwn')
      }
    })
  })
})
