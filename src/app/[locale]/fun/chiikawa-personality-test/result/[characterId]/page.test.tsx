import { render, screen } from '@testing-library/react'
import { CHIIKAWA_CHARACTERS } from '@/lib/config/chiikawaCharacters'
import ChiikawaResultPage, { generateMetadata, generateStaticParams } from './page'

jest.mock('next-intl/server', () => ({ setRequestLocale: jest.fn() }))

describe('Chiikawa result share page', () => {
  it('generateStaticParams returns every locale × character combination (2 × 16)', () => {
    const params = generateStaticParams()
    expect(params).toHaveLength(32)
    for (const locale of ['en', 'ko']) {
      for (const character of CHIIKAWA_CHARACTERS) {
        expect(params).toContainEqual({ locale, characterId: character.id })
      }
    }
  })

  it('generateMetadata points og:image at the fixed .png path and canonical at the result URL', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'ko', characterId: 'usagi' }),
    })
    const images = meta.openGraph?.images as Array<{ url: string }>
    expect(images[0].url).toMatch(/\/og\/chiikawa\/usagi-ko\.png$/)
    expect(meta.alternates?.canonical).toMatch(/\/ko\/fun\/chiikawa-personality-test\/result\/usagi\/$/)
  })

  it('generateMetadata returns {} for an unknown character', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'en', characterId: 'nope' }),
    })
    expect(meta).toEqual({})
  })

  it('renders the profile preview, official link and a CTA back to the quiz (no quiz itself)', async () => {
    const ui = await ChiikawaResultPage({
      params: Promise.resolve({ locale: 'ko', characterId: 'hachiware' }),
    })
    render(ui!)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('하치와레')
    const official = screen.getByRole('link', { name: /공식 사이트에서 하치와레 보기/ })
    expect(official).toHaveAttribute('target', '_blank')
    expect(official).toHaveAttribute('rel', 'noopener')
    // next/link drops the trailing slash under Jest (no next.config trailingSlash here)
    expect(screen.getByRole('link', { name: '나도 테스트하기' }).getAttribute('href')).toMatch(
      /^\/ko\/fun\/chiikawa-personality-test\/?$/
    )
    expect(screen.getByTestId('fan-made-notice')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/MBTI(?!®)/)
  })
})
