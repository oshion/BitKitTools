'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { TOOL_CATEGORIES } from '@/lib/config/tools-config'
import type { ToolCategory } from '@/types/tool'

export default function Nav() {
  const locale = useLocale() as 'en' | 'ko'
  const t = useTranslations('nav')
  const pathname = usePathname()

  // Strip the /ko prefix to get the locale-independent base path
  const basePath = locale === 'ko' ? pathname.replace(/^\/ko/, '') || '/' : pathname

  // Href for switching to the alternate locale
  const altLocaleHref = locale === 'en' ? `/ko${basePath}` : basePath

  const categoryHref = (category: ToolCategory): string =>
    locale === 'ko' ? `/ko/${category}` : `/${category}`

  return (
    <nav className="flex items-center gap-4">
      {TOOL_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={categoryHref(category)}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          {t(category)}
        </Link>
      ))}
      <Link
        href={altLocaleHref}
        className="text-sm text-neutral-400 hover:text-white transition-colors"
      >
        {t('languageSwitch')}
      </Link>
    </nav>
  )
}
