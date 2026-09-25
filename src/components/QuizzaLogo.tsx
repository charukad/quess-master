import Link from 'next/link'

export function QuizzaMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="QUIZZA">
      <path d="M8 7 32 21 8 35Z" fill="#FCB830" />
      <path d="m8 35 24-14v28Z" fill="#F99522" />
      <path d="m32 21 24 14-24 14Z" fill="#F26421" />
      <path d="m32 49 24-14v28Z" fill="#7B2677" />
      <path d="m32 49 24 14H32Z" fill="#E31859" />
      <path d="M8 63 32 49v14Z" fill="#EE4080" />
    </svg>
  )
}

export function QuizzaLogo({ href, compact = false, inverse = false }: { href?: string; compact?: boolean; inverse?: boolean }) {
  const content = (
    <span className="inline-flex items-center gap-2.5" aria-label="QUIZZA home">
      <QuizzaMark className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
      <span className={`${compact ? 'text-lg' : 'text-xl'} font-black tracking-[0.16em] ${inverse ? 'text-white' : 'text-[#34123f]'}`}>QUIZZA</span>
    </span>
  )

  return href ? <Link href={href} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : content
}
