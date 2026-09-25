import { SoundProvider } from '@/components/SoundProvider'
import { NetworkStatus } from '@/components/NetworkStatus'

export const dynamic = 'force-dynamic'

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      <div className="min-h-screen bg-background text-foreground">
        {children}
        <NetworkStatus />
      </div>
    </SoundProvider>
  )
}
