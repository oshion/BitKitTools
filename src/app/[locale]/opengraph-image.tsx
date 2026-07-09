import { ImageResponse } from 'next/og'
import { routing } from '@/i18n/routing'

export const alt = 'BitKitTools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Image({ params }: Props) {
  const { locale } = await params
  const isKo = locale === 'ko'

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
          background: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#fbbf24',
            display: 'flex',
          }}
        >
          BitKitTools
        </div>
        <div
          style={{
            fontSize: 32,
            marginTop: 24,
            color: '#d4d4d4',
            display: 'flex',
          }}
        >
          {isKo
            ? '개발자 · 여행 · 맥주 · 육아를 위한 계산기 모음'
            : 'Micro calculators for developers, travelers, beer lovers & parents'}
        </div>
      </div>
    ),
    { ...size }
  )
}
