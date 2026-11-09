import { ImageResponse } from 'next/og'
import { routing } from '@/i18n/routing'
import { CHIIKAWA_CHARACTERS, getChiikawaCharacter } from '@/lib/config/chiikawaCharacters'
import { getToolBySlug } from '@/lib/config/tools-config'

export const alt = 'Chiikawa Personality Quiz — BitKitTools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams(): Array<{ locale: string; characterId: string }> {
  return routing.locales.flatMap((locale) =>
    CHIIKAWA_CHARACTERS.map((character) => ({ locale, characterId: character.id }))
  )
}

type Props = {
  params: Promise<{ locale: string; characterId: string }>
}

// 캐릭터 그림은 권리자 라이선스가 없어 넣지 않는다 — 대표색 배경 + 이모지 + 이름 텍스트만.
export default async function Image({ params }: Props) {
  const { locale, characterId } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const character = getChiikawaCharacter(characterId)
  const tool = getToolBySlug('fun', 'chiikawa-personality-test')

  // Fallback if character not found (shouldn't happen with generateStaticParams)
  if (!character) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            fontSize: 48,
          }}
        >
          BitKitTools
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: character.ogColor,
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Decorative circles — lighter tint of the same hue */}
        <div
          style={{
            position: 'absolute',
            top: -90,
            right: -90,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.10)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -70,
            left: -70,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.07)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 150, lineHeight: 1, display: 'flex' }}>{character.emoji}</div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {character.name[safeLocale]}
          </div>

          {tool && (
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255, 255, 255, 0.85)',
                textAlign: 'center',
                display: 'flex',
              }}
            >
              {tool.title[safeLocale]}
            </div>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 36,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
          }}
        >
          bitkittools.com
        </div>
      </div>
    ),
    { ...size }
  )
}
