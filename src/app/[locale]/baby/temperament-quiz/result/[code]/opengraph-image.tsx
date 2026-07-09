import { ImageResponse } from 'next/og'
import { routing } from '@/i18n/routing'
import { TEMPERAMENT_PERSONAS, getPersonaByCode } from '@/lib/config/temperamentPersonas'

export const alt = 'Baby Temperament Type — BitKitTools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams(): Array<{ locale: string; code: string }> {
  return routing.locales.flatMap((locale) =>
    TEMPERAMENT_PERSONAS.map((persona) => ({ locale, code: persona.code }))
  )
}

type Props = {
  params: Promise<{ locale: string; code: string }>
}

export default async function Image({ params }: Props) {
  const { locale, code } = await params
  const safeLocale = (routing.locales as readonly string[]).includes(locale)
    ? (locale as 'en' | 'ko')
    : 'en'

  const persona = getPersonaByCode(code)

  // Fallback if persona not found (shouldn't happen with generateStaticParams)
  if (!persona) {
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

  // Dark hue-based background using colorHue
  const bgColor = `hsl(${persona.colorHue}, 55%, 15%)`
  const accentColor = `hsl(${persona.colorHue}, 70%, 65%)`

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
          background: bgColor,
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Decorative background circles */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `hsl(${persona.colorHue}, 50%, 25%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `hsl(${persona.colorHue}, 50%, 20%)`,
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
          }}
        >
          {/* Emoji */}
          <div style={{ fontSize: 120, lineHeight: 1, display: 'flex' }}>
            {persona.emoji}
          </div>

          {/* Persona name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: accentColor,
              textAlign: 'center',
              display: 'flex',
            }}
          >
            {persona.name[safeLocale]}
          </div>

          {/* Sub-label */}
          <div
            style={{
              fontSize: 28,
              color: '#d4d4d4',
              display: 'flex',
            }}
          >
            {safeLocale === 'ko' ? '아기 기질 유형 · BitKitTools' : 'Baby Temperament Type · BitKitTools'}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
