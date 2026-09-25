'use client'

import { useState } from 'react'
import { createTeam, updateTeamOrder } from '@/actions/teams'
import type { TeamDTO } from '@/lib/types'
import { ArrowDown, ArrowUp, Plus, UsersRound } from 'lucide-react'

export default function TeamsList({ initialTeams, gameId }: { initialTeams: TeamDTO[]; gameId: string }) {
  const [teams, setTeams] = useState(initialTeams)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const newTeam = await createTeam(gameId, name)
      setTeams((current) => [...current, newTeam])
      setName('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add team')
    } finally {
      setLoading(false)
    }
  }

  async function moveTeam(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= teams.length) return
    const reordered = [...teams]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setTeams(reordered)
    try {
      await updateTeamOrder(gameId, reordered.map((team) => team.id))
    } catch (caught) {
      setTeams(teams)
      setError(caught instanceof Error ? caught.message : 'Unable to reorder teams')
    }
  }

  return (
    <div className="space-y-4">
      <div className="quizza-panel p-5">
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teams added yet.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team, index) => (
              <li key={team.id} className="flex items-center justify-between rounded-2xl border bg-white p-3.5">
                <span className="flex items-center gap-3 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5edf7] text-[#7b2677]"><UsersRound className="h-4 w-4" /></span>{index + 1}. {team.name}</span>
                <span className="flex gap-1">
                  <button type="button" disabled={index === 0 || loading} onClick={() => moveTeam(index, -1)} aria-label={`Move ${team.name} up`} className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" disabled={index === teams.length - 1 || loading} onClick={() => moveTeam(index, 1)} aria-label={`Move ${team.name} down`} className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleAdd} className="quizza-panel flex gap-2 p-4">
        <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="New team name..." required maxLength={60} className="h-11 flex-1 rounded-xl border border-input bg-white px-4 py-2 text-sm" />
        <button disabled={loading} type="submit" className="quizza-button h-11">
          {!loading && <Plus className="h-4 w-4" />}{loading ? 'Saving…' : 'Add Team'}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
