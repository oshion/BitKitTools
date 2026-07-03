import { redirect } from 'next/navigation'

// Static export makes / the default locale (EN) via postbuild.mjs copying out/en/ → out/,
// but next dev has no such post-processing step — without this, `/` 404s before ever
// reaching app/[locale]/, and Next falls back to the html-less root layout.
export default function RootPage() {
  redirect('/en')
}
