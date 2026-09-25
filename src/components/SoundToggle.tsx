'use client'

import { useSoundSettings } from '@/components/SoundProvider'
import { Volume2, VolumeX } from 'lucide-react'

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useSoundSettings()
  const Icon = soundEnabled ? Volume2 : VolumeX
  return <button type="button" onClick={toggleSound} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-bold text-muted-foreground hover:text-primary"><Icon className="h-4 w-4" /> Sound {soundEnabled ? 'on' : 'off'}</button>
}
