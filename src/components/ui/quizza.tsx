import type { ReactNode } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function PageIntro({ eyebrow, title, description, action }: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const live = ['LIVE', 'PAUSED'].includes(status)
  const ready = status === 'READY'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide ${live ? 'bg-[#fff0f5] text-[#c51650]' : ready ? 'bg-[#fff6df] text-[#9a5c00]' : 'bg-[#f2edf4] text-[#6f5b76]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#e31859]' : ready ? 'bg-[#f99522]' : 'bg-[#a795ad]'}`} />
      {status}
    </span>
  )
}

export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-primary/25 bg-white/60 p-10 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
      <h2 className="font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {href && action && <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">{action}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  )
}

export function MetricCard({ label, value, hint, tone = 'rose' }: { label: string; value: ReactNode; hint?: string; tone?: 'rose' | 'amber' | 'purple' }) {
  const tones = {
    rose: 'from-[#fff0f5] to-white text-[#c51650]',
    amber: 'from-[#fff6df] to-white text-[#9a5c00]',
    purple: 'from-[#f6eff8] to-white text-[#6a2574]',
  }
  return (
    <div className={`rounded-3xl border border-white/80 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_12px_40px_rgba(75,28,87,0.07)]`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  )
}
