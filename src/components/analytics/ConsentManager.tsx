import Script from 'next/script'

// Google Consent Mode v2 — all denied by default, wait up to 500ms for CMP update.
// This script runs before interactive to ensure consent defaults are set before
// any analytics or ad scripts execute.
const CONSENT_MODE_DEFAULTS = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
`

export default function ConsentManager() {
  const siteId = process.env.NEXT_PUBLIC_CMP_SITE_ID

  return (
    <>
      {/* Sets consent defaults early. afterInteractive is safe here because GA4/Clarity
          are only inserted after explicit consent (AnalyticsScripts returns null until then). */}
      <Script id="consent-mode-defaults" strategy="afterInteractive">
        {CONSENT_MODE_DEFAULTS}
      </Script>
      {siteId && (
        <Script
          id="cookieyes-cmp"
          src={`https://cdn-cookieyes.com/client_data/${siteId}/script.js`}
          strategy="afterInteractive"
        />
      )}
    </>
  )
}
