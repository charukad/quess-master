'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Dices, Save, Sparkles, UsersRound } from 'lucide-react'
import { updateTeam, updateTeamOrder } from '@/actions/teams'
import type { TeamDTO } from '@/lib/types'
import { useSoundSettings } from '@/components/SoundProvider'

const wheelColors = ['#e31859', '#f26421', '#fcb830', '#93317b', '#ee4080', '#612070']

function wheelGradient(count: number): string {
  const size = 360 / Math.max(count, 1)
  return `conic-gradient(${Array.from({ length: Math.max(count, 1) }, (_, index) => `${wheelColors[index % wheelColors.length]} ${index * size}deg ${(index + 1) * size}deg`).join(', ')})`
}

function shuffledTeams(teams: TeamDTO[]): TeamDTO[] {
  const shuffled = [...teams]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1)
    crypto.getRandomValues(random)
    const target = random[0] % (index + 1)
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

export default function SetupTeamsEditor({ gameId, initialTeams }: { gameId: string; initialTeams: TeamDTO[] }) {
  const [teams, setTeams] = useState(initialTeams)
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(initialTeams.map((team) => [team.id, team.name])))
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [wheelOpen, setWheelOpen] = useState(false)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wheelMessage, setWheelMessage] = useState('')
  const { playSound } = useSoundSettings()

  async function saveName(team: TeamDTO) {
    setSaving(team.id)
    setError('')
    try {
      const updated = await updateTeam(gameId, team.id, names[team.id] ?? team.name)
      setTeams((current) => current.map((item) => item.id === team.id ? updated : item))
      setNames((current) => ({ ...current, [team.id]: updated.name }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to rename team')
    } finally {
      setSaving(null)
    }
  }

  async function moveTeam(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= teams.length) return
    const previous = teams
    const reordered = [...teams]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setTeams(reordered)
    setSaving('order')
    setError('')
    try {
      await updateTeamOrder(gameId, reordered.map((team) => team.id))
    } catch (caught) {
      setTeams(previous)
      setError(caught instanceof Error ? caught.message : 'Unable to reorder teams')
    } finally {
      setSaving(null)
    }
  }

  async function spinForOrder() {
    if (teams.length < 2 || saving) return
    const previous = teams
    const reordered = shuffledTeams(teams)
    const random = new Uint32Array(1)
    crypto.getRandomValues(random)
    setWheelOpen(true)
    setWheelSpinning(true)
    setWheelMessage('Finding every team’s position…')
    setSaving('wheel')
    setError('')
    playSound('wheel')
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())))
    setWheelRotation((current) => current + 1440 + (random[0] % 360))
    await new Promise((resolve) => window.setTimeout(resolve, 1850))
    setTeams(reordered)
    try {
      await updateTeamOrder(gameId, reordered.map((team) => team.id))
      setWheelMessage('Team order selected!')
      playSound('reveal')
    } catch (caught) {
      setTeams(previous)
      setWheelMessage('')
      setError(caught instanceof Error ? caught.message : 'Unable to save the wheel order')
    } finally {
      setWheelSpinning(false)
      setSaving(null)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-black"><UsersRound className="h-5 w-5 text-primary" /> Team order</h3>
        <p className="text-xs text-muted-foreground">Rename or reorder before starting</p>
      </div>
      <div className="mb-4 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-[#fff6df] via-[#fff0f5] to-[#f5edf7] p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm"><Dices className="h-5 w-5" /></span><div><p className="text-sm font-black">Let the wheel decide</p><p className="text-xs text-muted-foreground">Randomly choose every team’s starting position.</p></div></div>
          <button type="button" onClick={spinForOrder} disabled={teams.length < 2 || saving !== null} className="quizza-button h-9 shrink-0 px-3 text-xs"><Sparkles className="h-4 w-4" /> {wheelSpinning ? 'Spinning…' : 'Spin for team order'}</button>
        </div>
        {wheelOpen && (
          <div className="animate-in slide-in-from-top-2 mt-4 grid items-center gap-5 border-t border-primary/10 pt-4 sm:grid-cols-[150px_1fr]">
            <div className="relative mx-auto h-36 w-36">
              <span className="absolute -right-1 top-1/2 z-10 h-0 w-0 -translate-y-1/2 border-y-[10px] border-r-[18px] border-y-transparent border-r-[#34123f]" />
              <div className="grid h-36 w-36 place-items-center rounded-full border-4 border-white shadow-xl" style={{ background: wheelGradient(teams.length), transform: `rotate(${wheelRotation}deg)`, transition: wheelSpinning ? 'transform 1.8s cubic-bezier(.12,.72,.18,1)' : undefined }}><span className="grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#34123f] text-[10px] font-black tracking-wider text-white">QUIZZA</span></div>
            </div>
            <div><p role="status" className="text-sm font-black text-primary">{wheelMessage}</p><ol className="mt-2 grid gap-1.5 sm:grid-cols-2">{teams.map((team, index) => <li key={team.id} className="rounded-lg bg-white/75 px-3 py-2 text-xs font-bold"><span className="mr-2 text-primary">{index + 1}</span>{team.name}</li>)}</ol></div>
          </div>
        )}
      </div>
      <ul className="space-y-2.5">
        {teams.map((team, index) => {
          const changed = (names[team.id] ?? '') !== team.name
          return (
            <li key={team.id} className="flex flex-col gap-2 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-black text-accent-foreground">{index + 1}</span>
              <input
                aria-label={`Rename ${team.name}`}
                value={names[team.id] ?? ''}
                onChange={(event) => setNames((current) => ({ ...current, [team.id]: event.target.value }))}
                maxLength={60}
                className="h-10 min-w-0 flex-1 rounded-xl border border-transparent bg-[#fbf9fc] px-3 text-sm font-bold hover:border-border"
              />
              <div className="flex items-center gap-1 self-end sm:self-auto">
                {changed && <button type="button" onClick={() => saveName(team)} disabled={saving !== null || !(names[team.id] ?? '').trim()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white disabled:opacity-40"><Save className="h-3.5 w-3.5" /> Save</button>}
                <button type="button" disabled={index === 0 || saving !== null} onClick={() => moveTeam(index, -1)} aria-label={`Move ${team.name} up`} className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" disabled={index === teams.length - 1 || saving !== null} onClick={() => moveTeam(index, 1)} aria-label={`Move ${team.name} down`} className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              </div>
            </li>
          )
        })}
      </ul>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
