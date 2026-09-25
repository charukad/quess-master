'use client'

import Link from 'next/link'
import { CircleHelp, LayoutGrid, Play, Settings2, UsersRound } from 'lucide-react'
import { usePathname } from 'next/navigation'

const tabs = [
  { suffix: '', label: 'Overview', icon: LayoutGrid },
  { suffix: '/teams', label: 'Teams', icon: UsersRound },
  { suffix: '/questions', label: 'Questions', icon: CircleHelp },
  { suffix: '/envelopes', label: 'Envelopes', icon: LayoutGrid },
  { suffix: '/settings', label: 'Settings', icon: Settings2 },
]

export function GameEditorNav({ gameId }: { gameId: string }) {
  const pathname = usePathname()
  const base = `/games/${gameId}`

  return (
    <div className="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-center">
      <nav className="flex flex-1 gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1" aria-label="Game editor">
        {tabs.map(({ suffix, label, icon: Icon }) => {
          const href = `${base}${suffix}`
          const active = suffix ? pathname.startsWith(href) : pathname === base
          return <Link key={label} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${active ? 'bg-[#34123f] text-white shadow-sm' : 'text-muted-foreground hover:bg-white hover:text-foreground'}`}><Icon className="h-4 w-4" />{label}</Link>
        })}
      </nav>
      <Link href={`${base}/setup`} className="quizza-button"><Play className="h-4 w-4 fill-current" /> Play game</Link>
    </div>
  )
}
