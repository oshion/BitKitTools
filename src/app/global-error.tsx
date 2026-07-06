'use client'

// Catches errors thrown while rendering the root layout itself. Next.js
// replaces the entire root layout with this component when triggered, so
// (like not-found.tsx) it must supply its own <html>/<body> tags since
// app/layout.tsx deliberately has none — only app/[locale]/layout.tsx does.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
        <h1 style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Something went wrong
        </h1>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: '#fff',
            color: '#000',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
