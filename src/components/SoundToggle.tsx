'use client'

import { useSoundSettings } from '@/components/SoundProvider'

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useSoundSettings()
  return <button type="button" onClick={toggleSound} className="text-sm font-medium text-muted-foreground hover:text-foreground">Sound: {soundEnabled ? 'On' : 'Off'}</button>
}
