'use client'

import Script from 'next/script'
import { useState, useEffect } from 'react'
import { isAnalyticsAllowed } from '@/lib/utils/consentStatus'
import { isAutomatedAuditUserAgent } from '@/lib/utils/auditUserAgent'

// Subscribes to Google's Funding Choices consent-mode callback queue (the CMP
// configured in AdSense "Privacy & messaging"). GA4 and Clarity scripts are
// inserted into the DOM ONLY after the CMP reports that analytics may run: either the
// visitor granted consent, or no consent requirement applies to them (see
// isAnalyticsAllowed). This satisfies GDPR/Consent Mode v2 requirements for EEA/UK traffic.
// https://developers.google.com/funding-choices/fc-api-docs
//
// Scripts use lazyOnload (after window load + idle) so they don't compete with the
// tool UI — loading them afterInteractive dropped tool pages' Lighthouse performance
// from 100 to 60 (2026-11-02). Lighthouse audit visits skip analytics entirely so the
// weekly audit doesn't show up as GA4/Clarity sessions.
export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
  const [analyticsConsented, setAnalyticsConsented] = useState(false)

  useEffect(() => {
    if (isAutomatedAuditUserAgent(window.navigator.userAgent)) return

    const fc = window.googlefc ?? { callbackQueue: [] }
    fc.callbackQueue = fc.callbackQueue ?? []
    window.googlefc = fc

    fc.callbackQueue.push({
      CONSENT_MODE_DATA_READY: () => {
        const consentStatus = window.googlefc?.getGoogleConsentModeValues?.()
        if (
          isAnalyticsAllowed(
            consentStatus?.analyticsStoragePurposeConsentStatus,
            window.googlefc?.ConsentModePurposeStatusEnum
          )
        ) {
          setAnalyticsConsented(true)
          // Update Consent Mode v2 — GA4 will begin sending data from this point
          if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
              analytics_storage: 'granted',
            })
          }
        }
      },
    })
  }, [])

  if (!analyticsConsented) return null

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}</Script>
        </>
      )}
      {clarityId && (
        <Script id="clarity-init" strategy="lazyOnload">{`
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
