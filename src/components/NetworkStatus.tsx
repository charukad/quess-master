'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function NetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
      You are offline. Changes saved locally.
    </div>
  )
}
