'use client'

import Script from 'next/script'
import { useState, useEffect } from 'react'

type CookieYesConsentDetail = {
  accepted?: string[]
  rejected?: string[]
}

// Subscribes to the CookieYes consent-update event.
// GA4 and Clarity scripts are inserted into the DOM ONLY after analytics consent is granted —
// never before. This satisfies GDPR/Consent Mode v2 requirements for EEA/UK traffic.
export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
  const [analyticsConsented, setAnalyticsConsented] = useState(false)

  useEffect(() => {
    function handleConsentUpdate(event: Event) {
      const detail = (event as CustomEvent<CookieYesConsentDetail>).detail
      if (detail?.accepted?.includes('analytics')) {
        setAnalyticsConsented(true)
        // Update Consent Mode v2 — GA4 will begin sending data from this point
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            analytics_storage: 'granted',
          })
        }
      }
    }

    window.addEventListener('cookieyes-consent-update', handleConsentUpdate)
    return () => {
      window.removeEventListener('cookieyes-consent-update', handleConsentUpdate)
    }
  }, [])

  if (!analyticsConsented) return null

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}</Script>
        </>
      )}
      {clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `}</Script>
      )}
    </>
  )
}
