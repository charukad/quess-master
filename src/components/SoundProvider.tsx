'use client'

import React, { createContext, useContext, useState } from 'react'

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (kind: 'correct' | 'wrong' | 'wheel' | 'reveal') => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {},
  playSound: () => {},
})

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true)

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('quiz_sound_enabled', String(next))
      return next
    })
  }

  const playSound = (kind: 'correct' | 'wrong' | 'wheel' | 'reveal') => {
    if (!soundEnabled) return
    const AudioContextClass = window.AudioContext
    const context = new AudioContextClass()
    const patterns = {
      correct: [523, 659, 784, 1047],
      wrong: [260, 190, 145],
      wheel: [392, 494, 587, 698, 784],
      reveal: [523, 784, 1047],
    }
    const notes = patterns[kind]
    const noteLength = kind === 'correct' ? 0.16 : kind === 'wrong' ? 0.18 : 0.11
    const gap = kind === 'correct' ? 0.12 : kind === 'wrong' ? 0.14 : 0.09
    const master = context.createGain()
    master.gain.setValueAtTime(kind === 'wrong' ? 0.08 : 0.105, context.currentTime)
    master.connect(context.destination)
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = context.currentTime + index * gap
      oscillator.frequency.value = frequency
      oscillator.type = kind === 'wrong' ? 'sawtooth' : kind === 'wheel' ? 'triangle' : 'sine'
      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.9, start + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, start + noteLength)
      oscillator.connect(gain)
      gain.connect(master)
      oscillator.start(start)
      oscillator.stop(start + noteLength)
      if (index === notes.length - 1) oscillator.addEventListener('ended', () => context.close())
    })
  }

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playSound }}>
      {children}
    </SoundContext.Provider>
  )
}

export const useSoundSettings = () => useContext(SoundContext)
