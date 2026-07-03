'use client'

import { useTranslations } from 'next-intl'
import type { DisclaimerType } from '@/types/tool'

type DisclaimerBannerProps = {
  disclaimerType: DisclaimerType
}

const BASE_CLASS = 'rounded-lg border px-4 py-3 text-sm leading-relaxed'

const TYPE_CLASS: Record<Exclude<DisclaimerType, 'none'>, string> = {
  general: 'border-neutral-800 bg-neutral-900 text-neutral-400',
  medical: 'border-amber-900/50 bg-amber-950/20 text-amber-200',
  legal: 'border-amber-900/50 bg-amber-950/20 text-amber-200',
  financial: 'border-amber-900/50 bg-amber-950/20 text-amber-200',
}

export default function DisclaimerBanner({ disclaimerType }: DisclaimerBannerProps) {
  const t = useTranslations('disclaimer')

  if (disclaimerType === 'none') {
    return null
  }

  return (
    <div className={`${BASE_CLASS} ${TYPE_CLASS[disclaimerType]}`} role="note">
      {t(disclaimerType)}
    </div>
  )
}
