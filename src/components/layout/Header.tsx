import Link from 'next/link'
import Nav from './Nav'
import { localeHref } from '@/lib/utils/locale-href'

type HeaderProps = {
  locale: 'en' | 'ko'
}

export default function Header({ locale }: HeaderProps) {
  const homeHref = localeHref(locale)

  return (
    <header className="border-b border-neutral-800 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={homeHref} className="text-white font-semibold text-lg">
          BitKitTools
        </Link>
        <Nav />
      </div>
    </header>
  )
}
