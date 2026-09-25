'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Save, UsersRound } from 'lucide-react'
import { updateTeam, updateTeamOrder } from '@/actions/teams'
import type { TeamDTO } from '@/lib/types'

export default function SetupTeamsEditor({ gameId, initialTeams }: { gameId: string; initialTeams: TeamDTO[] }) {
  const [teams, setTeams] = useState(initialTeams)
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(initialTeams.map((team) => [team.id, team.name])))
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-black"><UsersRound className="h-5 w-5 text-primary" /> Team order</h3>
        <p className="text-xs text-muted-foreground">Rename or reorder before starting</p>
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
