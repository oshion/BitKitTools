'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import type { AdSlotConfig } from '@/types/tool'

type AdSlotProps = {
  position: AdSlotConfig['position']
  minHeightPx: number
}

// Renders a skeleton placeholder with fixed min-height (CLS prevention).
// When NEXT_PUBLIC_ADSENSE_CLIENT_ID is set and the slot enters the viewport,
// the AdSense script and ins element are lazily inserted via IntersectionObserver.
// Without the env var, the component remains a placeholder (e.g. dev/staging).
export default function AdSlot({ position, minHeightPx }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  useEffect(() => {
    const el = ref.current
    // Skip observer when no AdSense ID — keeps skeleton-only in dev/staging
    if (!el || !adsenseId) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [adsenseId])

  return (
    <div
      ref={ref}
      data-ad-position={position}
      className="w-full bg-neutral-900 border border-dashed border-neutral-800"
      style={{ minHeight: minHeightPx }}
      aria-hidden="true"
    >
      {adsenseId && isVisible && (
        <>
          <Script
            id={`adsense-script-${position}`}
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={adsenseId}
          />
        </>
      )}
    </div>
  )
}
