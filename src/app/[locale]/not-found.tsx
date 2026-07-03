import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-4xl font-semibold mb-4">404</h1>
      <p className="text-neutral-400 mb-8">Page not found.</p>
      <Link href="/" className="text-neutral-300 hover:text-white underline underline-offset-4">
        Go back home
      </Link>
    </div>
  )
}
