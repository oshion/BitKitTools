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

// Required verbatim by Google so the Funding Choices message can host its consent
// iframe. https://developers.google.com/funding-choices/fc-api-docs
const SIGNAL_GOOGLEFC_PRESENT = `
  (function() {
    function signalGooglefcPresent() {
      if (!window.frames['googlefcPresent']) {
        if (document.body) {
          const iframe = document.createElement('iframe');
          iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;';
          iframe.style.display = 'none';
          iframe.name = 'googlefcPresent';
          document.body.appendChild(iframe);
        } else {
          setTimeout(signalGooglefcPresent, 0);
        }
      }
    }
    signalGooglefcPresent();
  })();
`

// Google's own consent message (AdSense "Privacy & messaging"), tied to the
// AdSense publisher ID — replaces a third-party CMP. Loaded here (eagerly, on
// every page) rather than piggybacking on AdSlot's lazy-loaded ad script, so
// the prompt appears immediately instead of only after a user scrolls near an ad.
export default function ConsentManager() {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const publisherId = adsenseId?.replace(/^ca-/, '')

  return (
    <>
      {/* Sets consent defaults early. afterInteractive is safe here because GA4/Clarity
          are only inserted after explicit consent (AnalyticsScripts returns null until then). */}
      <Script id="consent-mode-defaults" strategy="afterInteractive">
        {CONSENT_MODE_DEFAULTS}
      </Script>
      {publisherId && (
        <>
          <Script
            id="google-funding-choices"
            src={`https://fundingchoicesmessages.google.com/i/${publisherId}?ers=1`}
            strategy="afterInteractive"
          />
          <Script id="google-funding-choices-signal" strategy="afterInteractive">
            {SIGNAL_GOOGLEFC_PRESENT}
          </Script>
        </>
      )}
    </>
  )
}
