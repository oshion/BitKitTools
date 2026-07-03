'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { TOOL_CATEGORIES } from '@/lib/config/tools-config'
import { localeHref } from '@/lib/utils/locale-href'
import type { ToolCategory } from '@/types/tool'

export default function Footer() {
  const locale = useLocale() as 'en' | 'ko'
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  const categoryHref = (category: ToolCategory): string => localeHref(locale, `/${category}`)

  const legalHref = (path: string): string => localeHref(locale, `/${path}`)

  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-800 bg-[#0a0a0a] mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {/* Category links */}
        <nav aria-label="footer categories" className="flex flex-wrap gap-4">
          {TOOL_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={categoryHref(category)}
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {tNav(category)}
            </Link>
          ))}
        </nav>

        {/* Legal links */}
        <nav aria-label="footer legal" className="flex flex-wrap gap-4">
          <Link
            href={legalHref('privacy-policy')}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {t('privacyPolicy')}
          </Link>
          <Link
            href={legalHref('terms')}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {t('terms')}
          </Link>
          <Link
            href={legalHref('about')}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {t('about')}
          </Link>
          <Link
            href={legalHref('contact')}
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {t('contact')}
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-sm text-neutral-500">
          {t('copyright', { year })}
        </p>
      </div>
    </footer>
  )
}
