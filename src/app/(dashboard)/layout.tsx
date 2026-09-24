import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="font-bold">Quiz Master</div>
        <nav className="flex flex-1 items-center gap-6 text-sm font-medium ml-6">
          <Link href="/dashboard" className="text-foreground transition-colors hover:text-foreground/80">Dashboard</Link>
          <Link href="/games" className="text-foreground/60 transition-colors hover:text-foreground/80">Games</Link>
          <Link href="/media" className="text-foreground/60 transition-colors hover:text-foreground/80">Media</Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 bg-muted/20 p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
