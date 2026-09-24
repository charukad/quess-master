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
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const frequencies = { correct: 880, wrong: 180, wheel: 520, reveal: 660 }
    oscillator.frequency.value = frequencies[kind]
    oscillator.type = kind === 'wrong' ? 'sawtooth' : 'sine'
    gain.gain.setValueAtTime(0.12, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.35)
    oscillator.addEventListener('ended', () => context.close())
  }

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playSound }}>
      {children}
    </SoundContext.Provider>
  )
}

export const useSoundSettings = () => useContext(SoundContext)
