import Link from 'next/link'

// Root layout.tsx intentionally returns bare `children` (no <html>/<body>) —
// only app/[locale]/layout.tsx provides those tags. Any route that fails to
// match into the [locale] segment tree (e.g. a typo'd or deleted URL) falls
// back to this file, so it must supply its own <html>/<body>, or Next throws
// "Missing <html> and <body> tags in the root layout" instead of a 404 page.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#0a0a0a',
          color: '#fff',
        }}
      >
        <h1 style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: '1rem' }}>404</h1>
        <p style={{ color: '#a3a3a3', marginBottom: '2rem' }}>Page not found.</p>
        <Link href="/en" style={{ color: '#d4d4d4', textDecoration: 'underline' }}>
          Go back home
        </Link>
      </body>
    </html>
  )
}
