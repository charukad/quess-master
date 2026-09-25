'use client'

import Link from 'next/link'
import { Gamepad2, Images, LayoutDashboard, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/LogoutButton'
import { QuizzaLogo } from '@/components/QuizzaLogo'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/games', label: 'Games', icon: Gamepad2 },
  { href: '/media', label: 'Media', icon: Images },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/88 shadow-[0_1px_20px_rgba(69,24,82,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <QuizzaLogo href="/dashboard" compact />
        <nav className="ml-2 hidden items-center gap-1 rounded-full bg-[#f7f2f8] p-1 md:flex" aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${active ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href="/games/new" className="quizza-button hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> New quiz
          </Link>
          <LogoutButton />
        </div>
      </div>
      <nav className="flex items-center justify-around border-t border-border/60 px-2 py-1.5 md:hidden" aria-label="Mobile navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
          return <Link key={href} href={href} className={`flex min-w-20 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}><Icon className="h-4 w-4" />{label}</Link>
        })}
      </nav>
    </header>
  )
}
