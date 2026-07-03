'use client'

/**
 * BacSafetyWarning — Mandatory, always-visible safety notice for the BAC Calculator.
 *
 * ADR-014: This component is intentionally NOT configurable via tools-config.ts.
 * It must render unconditionally regardless of disclaimerType or any other config value.
 * No close button, no "don't show again" option, no conditional rendering based on BAC value.
 *
 * Do NOT replace this with <DisclaimerBanner> — that component is for standard tool
 * disclaimers and can be turned off via disclaimerType: 'none'. This warning cannot be
 * turned off.
 */
export default function BacSafetyWarning() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border-2 border-red-900/60 bg-red-950/30 text-red-200 px-4 py-3 text-sm font-medium leading-relaxed"
    >
      <p>
        ⚠️{' '}
        <strong>
          This result cannot be used to determine whether it is safe to drive.
        </strong>{' '}
        Never drive after drinking alcohol.
      </p>
      <p className="mt-1 font-normal text-red-300/80">
        이 결과는 운전 가능 여부를 판단하는 근거로 사용할 수 없습니다. 음주 후에는 절대 운전하지
        마세요.
      </p>
    </div>
  )
}
